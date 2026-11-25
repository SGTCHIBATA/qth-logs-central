-- ============================================================================
-- COMPLEMENTO DE PLANTÕES: ORIGEM (APP / CENTRAL), KM INICIAL E TROCA DE TURNO
-- ============================================================================

ALTER TABLE public.viatura_plantoes
    ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'APP_CONDUTOR'
        CHECK (origem IN ('APP_CONDUTOR', 'RADIO_OPERADOR')),
    ADD COLUMN IF NOT EXISTS km_inicial text,
    ADD COLUMN IF NOT EXISTS encerrado_por_nome text;

CREATE OR REPLACE FUNCTION public.assumir_plantao_viatura(
    p_viatura_id uuid,
    p_tripulacao jsonb,
    p_turno_label text DEFAULT NULL,
    p_device_uuid text DEFAULT NULL,
    p_plataforma text DEFAULT 'ANDROID',
    p_push_token text DEFAULT NULL,
    p_criado_por_nome text DEFAULT NULL,
    p_origem text DEFAULT 'APP_CONDUTOR',
    p_km_inicial text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_vtr record;
    v_empenho_ativo integer;
    v_plantao_anterior_id uuid;
    v_novo_plantao_id uuid;
    v_pin text;
    v_origem_norm text;
    v_km_limpo text;
BEGIN
    SELECT * INTO v_vtr FROM public.viaturas WHERE id = p_viatura_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viatura não encontrada.';
    END IF;

    SELECT COUNT(*) INTO v_empenho_ativo
    FROM public.ocorrencia_viaturas
    WHERE viatura_id = p_viatura_id
      AND upper(coalesce(status_empenho, '')) NOT IN ('FINALIZADA', 'QTA', 'ENCERRADA');

    IF v_empenho_ativo > 0 THEN
        RAISE EXCEPTION 'Não é possível assumir novo plantão com ocorrência em andamento na viatura. Finalize ou dê QTA antes.';
    END IF;

    v_origem_norm := CASE
        WHEN upper(coalesce(p_origem, '')) = 'RADIO_OPERADOR' THEN 'RADIO_OPERADOR'
        ELSE 'APP_CONDUTOR'
    END;

    v_km_limpo := regexp_replace(coalesce(p_km_inicial, v_vtr.km_atual, ''), '\D', '', 'g');

    SELECT id INTO v_plantao_anterior_id
    FROM public.viatura_plantoes
    WHERE viatura_id = p_viatura_id AND status = 'ATIVO'
    ORDER BY iniciado_em DESC
    LIMIT 1;

    IF v_plantao_anterior_id IS NOT NULL THEN
        UPDATE public.viatura_plantoes
        SET status = 'ENCERRADO',
            encerrado_em = now(),
            encerrado_por_nome = upper(coalesce(p_criado_por_nome, v_origem_norm))
        WHERE id = v_plantao_anterior_id;

        UPDATE public.viatura_dispositivos_sessao
        SET ativo = false,
            desconectado_em = now()
        WHERE plantao_id = v_plantao_anterior_id AND ativo = true;
    END IF;

    v_pin := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');

    INSERT INTO public.viatura_plantoes (
        instituicao_id,
        viatura_id,
        prefixo,
        status,
        pin_acesso,
        turno_label,
        tripulacao,
        criado_por_nome,
        origem,
        km_inicial
    )
    VALUES (
        v_vtr.instituicao_id,
        p_viatura_id,
        upper(v_vtr.prefixo),
        'ATIVO',
        v_pin,
        coalesce(p_turno_label, ''),
        coalesce(p_tripulacao, '{}'::jsonb),
        upper(coalesce(p_criado_por_nome, '')),
        v_origem_norm,
        nullif(v_km_limpo, '')
    )
    RETURNING id INTO v_novo_plantao_id;

    IF coalesce(p_device_uuid, '') <> '' THEN
        INSERT INTO public.viatura_dispositivos_sessao (
            instituicao_id,
            viatura_id,
            plantao_id,
            device_uuid,
            plataforma,
            push_token,
            papel_visual,
            integrante_nome,
            terminal_principal,
            ativo
        )
        VALUES (
            v_vtr.instituicao_id,
            p_viatura_id,
            v_novo_plantao_id,
            p_device_uuid,
            upper(coalesce(p_plataforma, 'ANDROID')),
            p_push_token,
            'CONDUTOR',
            upper(coalesce(p_tripulacao->>'condutor', p_criado_por_nome, '')),
            true,
            true
        )
        ON CONFLICT (plantao_id, device_uuid) DO UPDATE
        SET ativo = true,
            push_token = coalesce(excluded.push_token, public.viatura_dispositivos_sessao.push_token),
            desconectado_em = null;
    END IF;

    RETURN jsonb_build_object(
        'plantao_id', v_novo_plantao_id,
        'viatura_id', p_viatura_id,
        'prefixo', upper(v_vtr.prefixo),
        'pin_acesso', v_pin,
        'origem', v_origem_norm
    );
END;
$$;