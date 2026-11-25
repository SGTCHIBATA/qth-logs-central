-- ============================================================================
-- ETAPA 1: SCHEMA, MULTI-INSTITUIÇÃO, ROTEAMENTO INDIVIDUAL, PLANTÕES,
-- MARCOS DE HORÁRIO, REMANEJAMENTO EM DUAS FASES E TRAVAS DE ENCERRAMENTO
-- ============================================================================

-- 1. TABELA DE INSTITUIÇÕES (MULTI-TENANT + ROTEAMENTO CONFIGURÁVEL POR INSTITUIÇÃO)
CREATE TABLE IF NOT EXISTS public.instituicoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    sigla text,
    uf text,
    municipio text,
    ativa boolean NOT NULL DEFAULT true,
    limite_viaturas integer DEFAULT 50,
    limite_usuarios integer DEFAULT 300,
    routing_enabled boolean NOT NULL DEFAULT false,
    routing_mode text NOT NULL DEFAULT 'OSRM_DEFAULT'
        CHECK (routing_mode IN ('INSTITUTION_URL', 'CENTRAL_SERVER', 'OSRM_DEFAULT')),
    routing_url text,
    routing_endpoint_url text,
    routing_api_key_ref text,
    routing_timeout_ms integer NOT NULL DEFAULT 3000,
    observacoes_plataforma text,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instituicoes
    ADD COLUMN IF NOT EXISTS routing_enabled boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS routing_url text,
    ADD COLUMN IF NOT EXISTS routing_timeout_ms integer NOT NULL DEFAULT 3000;

-- 2. COLUNAS DE VÍNCULO MULTI-INSTITUIÇÃO E SUPER ADMIN NAS TABELAS EXISTENTES
ALTER TABLE public.perfis
    ADD COLUMN IF NOT EXISTS instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_platform_owner boolean NOT NULL DEFAULT false;

ALTER TABLE public.viaturas
    ADD COLUMN IF NOT EXISTS instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS login_recurso text,
    ADD COLUMN IF NOT EXISTS pin_recurso_hash text;

ALTER TABLE public.ocorrencias
    ADD COLUMN IF NOT EXISTS instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE;

ALTER TABLE public.ocorrencia_viaturas
    ADD COLUMN IF NOT EXISTS instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS plantao_id uuid,
    ADD COLUMN IF NOT EXISTS h_aceite text,
    ADD COLUMN IF NOT EXISTS direcionamento_solicitacao jsonb,
    ADD COLUMN IF NOT EXISTS aceito_por_dispositivo_id text;

-- 3. TABELA DE CICLOS DE PLANTÃO DA VIATURA
CREATE TABLE IF NOT EXISTS public.viatura_plantoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE,
    viatura_id uuid NOT NULL REFERENCES public.viaturas(id) ON DELETE CASCADE,
    prefixo text NOT NULL,
    status text NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'ENCERRADO')),
    pin_acesso text NOT NULL,
    turno_label text,
    tripulacao jsonb NOT NULL DEFAULT '{}'::jsonb,
    historico_trocas jsonb NOT NULL DEFAULT '[]'::jsonb,
    iniciado_em timestamptz NOT NULL DEFAULT now(),
    encerrado_em timestamptz,
    criado_por_nome text
);

CREATE INDEX IF NOT EXISTS idx_viatura_plantoes_viatura_status
    ON public.viatura_plantoes (viatura_id, status);

-- 4. SESSÕES DE DISPOSITIVOS VINCULADOS AO PLANTÃO (CONTROLE DE SHUTDOWN + PUSH)
CREATE TABLE IF NOT EXISTS public.viatura_dispositivos_sessao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE,
    viatura_id uuid NOT NULL REFERENCES public.viaturas(id) ON DELETE CASCADE,
    plantao_id uuid NOT NULL REFERENCES public.viatura_plantoes(id) ON DELETE CASCADE,
    device_uuid text NOT NULL,
    plataforma text, -- 'ANDROID' | 'IOS' | 'WEB'
    push_token text,
    papel_visual text NOT NULL DEFAULT 'CONDUTOR'
        CHECK (papel_visual IN ('CONDUTOR', 'MEDICO', 'ENFERMEIRO', 'TECNICO')),
    integrante_nome text,
    terminal_principal boolean NOT NULL DEFAULT false,
    ativo boolean NOT NULL DEFAULT true,
    conectado_em timestamptz NOT NULL DEFAULT now(),
    desconectado_em timestamptz,
    UNIQUE (plantao_id, device_uuid)
);

CREATE INDEX IF NOT EXISTS idx_vtr_disp_sessao_plantao_ativo
    ON public.viatura_dispositivos_sessao (plantao_id, ativo);

-- 5. TABELA DE REMANEJAMENTO EM DUAS FASES (OCORRÊNCIA A -> OCORRÊNCIA B)
CREATE TABLE IF NOT EXISTS public.viatura_remanejamentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id uuid REFERENCES public.instituicoes(id) ON DELETE CASCADE,
    viatura_id uuid NOT NULL REFERENCES public.viaturas(id) ON DELETE CASCADE,
    prefixo text NOT NULL,
    empenho_origem_id uuid NOT NULL REFERENCES public.ocorrencia_viaturas(id) ON DELETE CASCADE,
    ocorrencia_origem_id uuid NOT NULL REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
    ocorrencia_destino_id uuid NOT NULL REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
    solicitacao_destino_id text,
    direcionamento_destino jsonb,
    status text NOT NULL DEFAULT 'PENDENTE_ACEITE'
        CHECK (status IN ('PENDENTE_ACEITE', 'ACEITO', 'RECUSADO', 'CANCELADO_CENTRAL')),
    motivo_central text,
    justificativa_recusa text,
    km_transicao text,
    solicitado_por_id uuid,
    solicitado_por_nome text,
    respondido_por_device text,
    solicitado_em timestamptz NOT NULL DEFAULT now(),
    respondido_em timestamptz
);

CREATE INDEX IF NOT EXISTS idx_vtr_remanejamentos_vtr_status
    ON public.viatura_remanejamentos (viatura_id, status);

-- ============================================================================
-- FUNÇÃO AUXILIAR: FORMATAR HORA ATUAL HH:MM (FUSO AMERICA/SAO_PAULO)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_hora_atual_hhmm()
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI');
$$;

-- ============================================================================
-- FUNÇÃO AUXILIAR: CONFIGURAÇÃO EFETIVA DE ROTEAMENTO DA INSTITUIÇÃO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.obter_config_roteamento_instituicao(
    p_instituicao_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_inst record;
    v_url_efetiva text;
BEGIN
    SELECT
        id,
        nome,
        ativa,
        routing_enabled,
        routing_mode,
        coalesce(nullif(trim(routing_url), ''), nullif(trim(routing_endpoint_url), '')) AS url_configurada,
        routing_api_key_ref,
        coalesce(routing_timeout_ms, 3000) AS timeout_ms
    INTO v_inst
    FROM public.instituicoes
    WHERE id = p_instituicao_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'ativo', false,
            'modo', 'OSRM_DEFAULT',
            'url', null,
            'timeout_ms', 3000
        );
    END IF;

    v_url_efetiva := CASE
        WHEN v_inst.ativa AND v_inst.routing_enabled AND v_inst.routing_mode IN ('INSTITUTION_URL', 'CENTRAL_SERVER')
            THEN v_inst.url_configurada
        ELSE null
    END;

    RETURN jsonb_build_object(
        'instituicao_id', v_inst.id,
        'nome', v_inst.nome,
        'ativo', (v_url_efetiva IS NOT NULL),
        'modo', CASE WHEN v_url_efetiva IS NOT NULL THEN v_inst.routing_mode ELSE 'OSRM_DEFAULT' END,
        'url', v_url_efetiva,
        'api_key_ref', v_inst.routing_api_key_ref,
        'timeout_ms', v_inst.timeout_ms
    );
END;
$$;

-- ============================================================================
-- RPC 1: ASSUMIR NOVO PLANTÃO NA VIATURA (ENCERRA ANTERIOR + GERA PIN)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assumir_plantao_viatura(
    p_viatura_id uuid,
    p_tripulacao jsonb,
    p_turno_label text DEFAULT NULL,
    p_device_uuid text DEFAULT NULL,
    p_plataforma text DEFAULT 'ANDROID',
    p_push_token text DEFAULT NULL,
    p_criado_por_nome text DEFAULT NULL
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
BEGIN
    SELECT * INTO v_vtr FROM public.viaturas WHERE id = p_viatura_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viatura não encontrada.';
    END IF;

    -- Bloqueia troca de plantão se houver ocorrência em andamento na viatura
    SELECT COUNT(*) INTO v_empenho_ativo
    FROM public.ocorrencia_viaturas
    WHERE viatura_id = p_viatura_id
      AND upper(coalesce(status_empenho, '')) NOT IN ('FINALIZADA', 'QTA', 'ENCERRADA');

    IF v_empenho_ativo > 0 THEN
        RAISE EXCEPTION 'Não é possível assumir novo plantão com ocorrência em andamento na viatura. Finalize ou dê QTA antes.';
    END IF;

    -- Encerra plantão ativo anterior e derruba dispositivos vinculados a ele
    SELECT id INTO v_plantao_anterior_id
    FROM public.viatura_plantoes
    WHERE viatura_id = p_viatura_id AND status = 'ATIVO'
    ORDER BY iniciado_em DESC
    LIMIT 1;

    IF v_plantao_anterior_id IS NOT NULL THEN
        UPDATE public.viatura_plantoes
        SET status = 'ENCERRADO',
            encerrado_em = now()
        WHERE id = v_plantao_anterior_id;

        UPDATE public.viatura_dispositivos_sessao
        SET ativo = false,
            desconectado_em = now()
        WHERE plantao_id = v_plantao_anterior_id AND ativo = true;
    END IF;

    -- Gera PIN numérico de 6 dígitos
    v_pin := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');

    INSERT INTO public.viatura_plantoes (
        instituicao_id,
        viatura_id,
        prefixo,
        status,
        pin_acesso,
        turno_label,
        tripulacao,
        criado_por_nome
    )
    VALUES (
        v_vtr.instituicao_id,
        p_viatura_id,
        upper(v_vtr.prefixo),
        'ATIVO',
        v_pin,
        coalesce(p_turno_label, ''),
        coalesce(p_tripulacao, '{}'::jsonb),
        upper(coalesce(p_criado_por_nome, ''))
    )
    RETURNING id INTO v_novo_plantao_id;

    -- Vincula o terminal principal da viatura ao novo plantão
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
        'pin_acesso', v_pin
    );
END;
$$;

-- ============================================================================
-- RPC 2: EDITAR TRIPULAÇÃO NO MEIO DO PLANTÃO (COM JUSTIFICATIVA E NOVO PIN OPCIONAL)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.alterar_tripulacao_plantao(
    p_plantao_id uuid,
    p_nova_tripulacao jsonb,
    p_justificativa text,
    p_gerar_novo_pin boolean DEFAULT false,
    p_autor_nome text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pl record;
    v_novo_pin text;
    v_evento jsonb;
BEGIN
    IF trim(coalesce(p_justificativa, '')) = '' THEN
        RAISE EXCEPTION 'Informe uma justificativa para alteração da tripulação no plantão.';
    END IF;

    SELECT * INTO v_pl
    FROM public.viatura_plantoes
    WHERE id = p_plantao_id AND status = 'ATIVO'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plantão ativo não encontrado.';
    END IF;

    v_novo_pin := CASE
        WHEN p_gerar_novo_pin THEN lpad((floor(random() * 900000) + 100000)::int::text, 6, '0')
        ELSE v_pl.pin_acesso
    END;

    v_evento := jsonb_build_object(
        'alterado_em', now(),
        'autor', upper(coalesce(p_autor_nome, '')),
        'justificativa', trim(p_justificativa),
        'tripulacao_anterior', v_pl.tripulacao,
        'tripulacao_nova', p_nova_tripulacao
    );

    UPDATE public.viatura_plantoes
    SET tripulacao = p_nova_tripulacao,
        pin_acesso = v_novo_pin,
        historico_trocas = coalesce(historico_trocas, '[]'::jsonb) || jsonb_build_array(v_evento)
    WHERE id = p_plantao_id;

    -- Se gerou novo PIN, desconecta dispositivos secundários para revalidação
    IF p_gerar_novo_pin THEN
        UPDATE public.viatura_dispositivos_sessao
        SET ativo = false,
            desconectado_em = now()
        WHERE plantao_id = p_plantao_id
          AND terminal_principal = false
          AND ativo = true;
    END IF;

    RETURN jsonb_build_object(
        'plantao_id', p_plantao_id,
        'pin_acesso', v_novo_pin,
        'tripulacao', p_nova_tripulacao
    );
END;
$$;

-- ============================================================================
-- RPC 3: VALIDAR PIN DE PLANTÃO PARA CELULAR SECUNDÁRIO DA EQUIPE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validar_pin_plantao_viatura(
    p_viatura_id uuid,
    p_pin_acesso text,
    p_device_uuid text,
    p_papel_visual text,
    p_integrante_nome text,
    p_plataforma text DEFAULT 'ANDROID',
    p_push_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pl record;
BEGIN
    SELECT * INTO v_pl
    FROM public.viatura_plantoes
    WHERE viatura_id = p_viatura_id
      AND status = 'ATIVO'
      AND pin_acesso = trim(coalesce(p_pin_acesso, ''))
    ORDER BY iniciado_em DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PIN inválido ou plantão já encerrado para esta viatura.';
    END IF;

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
        ativo,
        conectado_em,
        desconectado_em
    )
    VALUES (
        v_pl.instituicao_id,
        p_viatura_id,
        v_pl.id,
        p_device_uuid,
        upper(coalesce(p_plataforma, 'ANDROID')),
        p_push_token,
        upper(coalesce(p_papel_visual, 'MEDICO')),
        upper(coalesce(p_integrante_nome, '')),
        false,
        true,
        now(),
        null
    )
    ON CONFLICT (plantao_id, device_uuid) DO UPDATE
    SET papel_visual = excluded.papel_visual,
        integrante_nome = excluded.integrante_nome,
        plataforma = excluded.plataforma,
        push_token = coalesce(excluded.push_token, public.viatura_dispositivos_sessao.push_token),
        ativo = true,
        conectado_em = now(),
        desconectado_em = null;

    RETURN jsonb_build_object(
        'plantao_id', v_pl.id,
        'viatura_id', p_viatura_id,
        'prefixo', v_pl.prefixo,
        'papel_visual', upper(coalesce(p_papel_visual, 'MEDICO')),
        'tripulacao', v_pl.tripulacao
    );
END;
$$;

-- ============================================================================
-- RPC 4: REGISTRAR / EDITAR MARCO DE HORÁRIO DO EMPENHO (APP INTERVENÇÃO)
-- (IMPEDE EDIÇÃO DE h_acionamento PELO APP E ATUALIZA STATUS AUTOMATICAMENTE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.registrar_marco_empenho(
    p_empenho_id uuid,
    p_campo text,
    p_valor_hhmm text DEFAULT NULL,
    p_origem_app boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emp record;
    v_hora text;
    v_novo_status text;
BEGIN
    SELECT * INTO v_emp FROM public.ocorrencia_viaturas WHERE id = p_empenho_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empenho não encontrado.';
    END IF;

    IF p_origem_app AND p_campo = 'h_acionamento' THEN
        RAISE EXCEPTION 'O horário de acionamento é registrado exclusivamente pela Central e não pode ser editado no aplicativo.';
    END IF;

    v_hora := coalesce(nullif(trim(p_valor_hhmm), ''), public.fn_hora_atual_hhmm());

    CASE p_campo
        WHEN 'h_aceite' THEN
            UPDATE public.ocorrencia_viaturas SET h_aceite = v_hora, status_empenho = 'EMPENHADA', atualizado_em = now() WHERE id = p_empenho_id;
        WHEN 'h_saida_base' THEN
            UPDATE public.ocorrencia_viaturas SET h_saida_base = v_hora, status_empenho = 'QTI', atualizado_em = now() WHERE id = p_empenho_id;
        WHEN 'h_chegada_qth' THEN
            UPDATE public.ocorrencia_viaturas SET h_chegada_qth = v_hora, status_empenho = 'NO QTH', atualizado_em = now() WHERE id = p_empenho_id;
        WHEN 'h_saida_qth' THEN
            UPDATE public.ocorrencia_viaturas SET h_saida_qth = v_hora, status_empenho = 'QTI UNIDADE SAUDE', atualizado_em = now() WHERE id = p_empenho_id;
        WHEN 'h_chegada_saude' THEN
            UPDATE public.ocorrencia_viaturas SET h_chegada_saude = v_hora, status_empenho = 'NA UNIDADE SAUDE', atualizado_em = now() WHERE id = p_empenho_id;
        WHEN 'h_saida_saude' THEN
            UPDATE public.ocorrencia_viaturas SET h_saida_saude = v_hora, status_empenho = 'QTI BASE QAP', atualizado_em = now() WHERE id = p_empenho_id;
        ELSE
            RAISE EXCEPTION 'Campo de marco inválido: %', p_campo;
    END CASE;

    SELECT status_empenho INTO v_novo_status FROM public.ocorrencia_viaturas WHERE id = p_empenho_id;

    UPDATE public.viaturas
    SET status = v_novo_status,
        atualizado_em = now()
    WHERE id = v_emp.viatura_id;

    RETURN jsonb_build_object(
        'empenho_id', p_empenho_id,
        'campo', p_campo,
        'hora', v_hora,
        'status_empenho', v_novo_status
    );
END;
$$;

-- ============================================================================
-- RPC 5: EXCLUIR MARCO DE HORÁRIO (LIXEIRA) E VOLTAR AO STATUS ANTERIOR
-- ============================================================================
CREATE OR REPLACE FUNCTION public.excluir_marco_empenho(
    p_empenho_id uuid,
    p_campo text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emp record;
    v_status_recalculado text;
BEGIN
    SELECT * INTO v_emp FROM public.ocorrencia_viaturas WHERE id = p_empenho_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empenho não encontrado.';
    END IF;

    IF p_campo IN ('h_acionamento', 'h_aceite') THEN
        RAISE EXCEPTION 'Este marco não pode ser excluído pela lixeira.';
    END IF;

    CASE p_campo
        WHEN 'h_saida_base' THEN
            UPDATE public.ocorrencia_viaturas SET h_saida_base = NULL WHERE id = p_empenho_id;
        WHEN 'h_chegada_qth' THEN
            UPDATE public.ocorrencia_viaturas SET h_chegada_qth = NULL WHERE id = p_empenho_id;
        WHEN 'h_saida_qth' THEN
            UPDATE public.ocorrencia_viaturas SET h_saida_qth = NULL WHERE id = p_empenho_id;
        WHEN 'h_chegada_saude' THEN
            UPDATE public.ocorrencia_viaturas SET h_chegada_saude = NULL WHERE id = p_empenho_id;
        WHEN 'h_saida_saude' THEN
            UPDATE public.ocorrencia_viaturas SET h_saida_saude = NULL WHERE id = p_empenho_id;
        ELSE
            RAISE EXCEPTION 'Campo inválido para exclusão: %', p_campo;
    END CASE;

    SELECT * INTO v_emp FROM public.ocorrencia_viaturas WHERE id = p_empenho_id;

    -- Recalcula o status baseado no último horário imediatamente anterior ainda preenchido
    IF coalesce(v_emp.h_saida_saude, '') <> '' THEN
        v_status_recalculado := 'QTI BASE QAP';
    ELSIF coalesce(v_emp.h_chegada_saude, '') <> '' THEN
        v_status_recalculado := 'NA UNIDADE SAUDE';
    ELSIF coalesce(v_emp.h_saida_qth, '') <> '' THEN
        v_status_recalculado := 'QTI UNIDADE SAUDE';
    ELSIF coalesce(v_emp.h_chegada_qth, '') <> '' THEN
        v_status_recalculado := 'NO QTH';
    ELSIF coalesce(v_emp.h_saida_base, '') <> '' THEN
        v_status_recalculado := 'QTI';
    ELSIF coalesce(v_emp.h_aceite, '') <> '' THEN
        v_status_recalculado := 'EMPENHADA';
    ELSE
        v_status_recalculado := 'ACIONADA';
    END IF;

    UPDATE public.ocorrencia_viaturas
    SET status_empenho = v_status_recalculado,
        atualizado_em = now()
    WHERE id = p_empenho_id;

    UPDATE public.viaturas
    SET status = v_status_recalculado,
        atualizado_em = now()
    WHERE id = v_emp.viatura_id;

    RETURN jsonb_build_object(
        'empenho_id', p_empenho_id,
        'campo_removido', p_campo,
        'status_empenho', v_status_recalculado
    );
END;
$$;

-- ============================================================================
-- RPC 6: FINALIZAR EMPENHO DA VIATURA NO APP (SOMENTE COM CONFIRMAÇÃO)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.finalizar_empenho_viatura_app(
    p_empenho_id uuid,
    p_confirmado boolean,
    p_km_chegada text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emp record;
    v_hora text;
    v_km_limpo text;
BEGIN
    IF NOT coalesce(p_confirmado, false) THEN
        RAISE EXCEPTION 'Confirmação explícita obrigatória para finalizar a ocorrência na viatura.';
    END IF;

    SELECT * INTO v_emp FROM public.ocorrencia_viaturas WHERE id = p_empenho_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empenho não encontrado.';
    END IF;

    v_hora := public.fn_hora_atual_hhmm();
    v_km_limpo := regexp_replace(coalesce(p_km_chegada, ''), '\D', '', 'g');

    UPDATE public.ocorrencia_viaturas
    SET status_empenho = 'FINALIZADA',
        h_encerramento = coalesce(nullif(h_encerramento, ''), v_hora),
        km_chegada = CASE WHEN v_km_limpo <> '' THEN v_km_limpo ELSE km_chegada END,
        atualizado_em = now()
    WHERE id = p_empenho_id;

    UPDATE public.viaturas
    SET status = 'DISPONIVEL',
        km_atual = CASE WHEN v_km_limpo <> '' THEN v_km_limpo ELSE km_atual END,
        atualizado_em = now()
    WHERE id = v_emp.viatura_id;

    RETURN jsonb_build_object(
        'empenho_id', p_empenho_id,
        'status_empenho', 'FINALIZADA',
        'h_encerramento', v_hora
    );
END;
$$;

-- ============================================================================
-- RPC 7: SOLICITAR REMANEJAMENTO (CENTRAL WEB -> APP CONDUTOR)
-- (BLOQUEIA SE ESTIVER NO QTH EM TRANSPORTE ATÉ UNIDADE DE SAÚDE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.solicitar_remanejamento_viatura(
    p_empenho_origem_id uuid,
    p_ocorrencia_destino_id uuid,
    p_solicitacao_destino_id text DEFAULT NULL,
    p_direcionamento_destino jsonb DEFAULT NULL,
    p_motivo_central text DEFAULT NULL,
    p_solicitado_por_id uuid DEFAULT NULL,
    p_solicitado_por_nome text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emp record;
    v_status_upper text;
    v_remanejamento_id uuid;
BEGIN
    SELECT * INTO v_emp FROM public.ocorrencia_viaturas WHERE id = p_empenho_origem_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empenho de origem não encontrado.';
    END IF;

    v_status_upper := upper(coalesce(v_emp.status_empenho, ''));

    -- Janela permitida: antes de chegar no QTH OU após sair da unidade de saúde
    IF v_status_upper NOT IN ('ACIONADA', 'EMPENHADA', 'QTI', 'QTI BASE QAP', 'DISPONIVEL') THEN
        RAISE EXCEPTION 'Remanejamento bloqueado: a viatura está em status (%) que indica atendimento/transporte em curso.', v_status_upper;
    END IF;

    -- Verifica se já não há remanejamento pendente para esta viatura
    IF EXISTS (
        SELECT 1 FROM public.viatura_remanejamentos
        WHERE viatura_id = v_emp.viatura_id AND status = 'PENDENTE_ACEITE'
    ) THEN
        RAISE EXCEPTION 'Esta viatura já possui uma solicitação de remanejamento aguardando resposta do condutor.';
    END IF;

    INSERT INTO public.viatura_remanejamentos (
        instituicao_id,
        viatura_id,
        prefixo,
        empenho_origem_id,
        ocorrencia_origem_id,
        ocorrencia_destino_id,
        solicitacao_destino_id,
        direcionamento_destino,
        status,
        motivo_central,
        solicitado_por_id,
        solicitado_por_nome
    )
    VALUES (
        v_emp.instituicao_id,
        v_emp.viatura_id,
        v_emp.prefixo,
        v_emp.id,
        v_emp.ocorrencia_id,
        p_ocorrencia_destino_id,
        p_solicitacao_destino_id,
        p_direcionamento_destino,
        'PENDENTE_ACEITE',
        upper(coalesce(p_motivo_central, '')),
        p_solicitado_por_id,
        upper(coalesce(p_solicitado_por_nome, ''))
    )
    RETURNING id INTO v_remanejamento_id;

    RETURN jsonb_build_object(
        'remanejamento_id', v_remanejamento_id,
        'status', 'PENDENTE_ACEITE'
    );
END;
$$;

-- ============================================================================
-- RPC 8: ACEITAR REMANEJAMENTO (EXCLUSIVO CONDUTOR + POPUP KM)
-- (FECHA OCORRÊNCIA A COM QTA E KM, DEVOLVE SOLICITAÇÃO DE A, ABRE B COM KM)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.aceitar_remanejamento_viatura(
    p_remanejamento_id uuid,
    p_km_atual text,
    p_device_uuid text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rem record;
    v_emp_origem record;
    v_oc_origem record;
    v_oc_destino record;
    v_km_limpo text;
    v_hora text;
    v_novo_empenho_id uuid;
    v_reqs_origem jsonb;
    v_reqs_destino jsonb;
BEGIN
    v_km_limpo := regexp_replace(coalesce(p_km_atual, ''), '\D', '', 'g');
    IF v_km_limpo = '' THEN
        RAISE EXCEPTION 'Informe o KM atual da viatura para confirmar o remanejamento.';
    END IF;

    SELECT * INTO v_rem
    FROM public.viatura_remanejamentos
    WHERE id = p_remanejamento_id AND status = 'PENDENTE_ACEITE'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação de remanejamento não encontrada ou já respondida/cancelada.';
    END IF;

    -- Valida que o dispositivo é o Condutor do plantão ativo
    IF NOT EXISTS (
        SELECT 1 FROM public.viatura_dispositivos_sessao s
        JOIN public.viatura_plantoes p ON p.id = s.plantao_id
        WHERE s.viatura_id = v_rem.viatura_id
          AND s.device_uuid = p_device_uuid
          AND s.ativo = true
          AND s.papel_visual = 'CONDUTOR'
          AND p.status = 'ATIVO'
    ) THEN
        RAISE EXCEPTION 'Apenas o dispositivo logado como CONDUTOR pode aceitar o remanejamento.';
    END IF;

    SELECT * INTO v_emp_origem FROM public.ocorrencia_viaturas WHERE id = v_rem.empenho_origem_id FOR UPDATE;
    SELECT * INTO v_oc_origem FROM public.ocorrencias WHERE id = v_rem.ocorrencia_origem_id FOR UPDATE;
    SELECT * INTO v_oc_destino FROM public.ocorrencias WHERE id = v_rem.ocorrencia_destino_id FOR UPDATE;

    v_hora := public.fn_hora_atual_hhmm();

    -- 1. Encerra Ocorrência A em QTA com KM de fechamento
    UPDATE public.ocorrencia_viaturas
    SET status_empenho = 'QTA',
        h_encerramento = v_hora,
        km_chegada = v_km_limpo,
        atualizado_em = now()
    WHERE id = v_emp_origem.id;

    -- 2. Devolve incondicionalmente a solicitação vinculada na Ocorrência A para a fila pendente
    SELECT coalesce(
        jsonb_agg(
            CASE
                WHEN (
                    elem->'viaturas_vinculadas' ? v_rem.prefixo
                    OR EXISTS (
                        SELECT 1 FROM jsonb_array_elements(coalesce(elem->'recursos_empenhados_vinculados', '[]'::jsonb)) v
                        WHERE v->>'empenho_id' = v_emp_origem.id::text
                    )
                )
                THEN jsonb_set(
                    jsonb_set(
                        elem,
                        '{atendido}',
                        'false'::jsonb
                    ),
                    '{viaturas_vinculadas}',
                    coalesce(
                        (
                            SELECT jsonb_agg(x)
                            FROM jsonb_array_elements_text(coalesce(elem->'viaturas_vinculadas', '[]'::jsonb)) x
                            WHERE upper(x) <> upper(v_rem.prefixo)
                        ),
                        '[]'::jsonb
                    )
                )
                ELSE elem
            END
        ),
        '[]'::jsonb
    )
    INTO v_reqs_origem
    FROM jsonb_array_elements(coalesce(v_oc_origem.recursos_solicitados, '[]'::jsonb)) elem;

    UPDATE public.ocorrencias
    SET recursos_solicitados = v_reqs_origem,
        atualizado_em = now()
    WHERE id = v_oc_origem.id;

    -- 3. Cria novo empenho ativo na Ocorrência B com KM de saída = KM de fechamento da A
    INSERT INTO public.ocorrencia_viaturas (
        instituicao_id,
        ocorrencia_id,
        viatura_id,
        prefixo,
        status_empenho,
        h_acionamento,
        h_aceite,
        km_saida,
        direcionamento_solicitacao,
        aceito_por_dispositivo_id
    )
    VALUES (
        v_rem.instituicao_id,
        v_rem.ocorrencia_destino_id,
        v_rem.viatura_id,
        v_rem.prefixo,
        'EMPENHADA',
        to_char(v_rem.solicitado_em AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
        v_hora,
        v_km_limpo,
        v_rem.direcionamento_destino,
        p_device_uuid
    )
    RETURNING id INTO v_novo_empenho_id;

    -- Atualiza solicitação da Ocorrência B (se vinculada)
    IF coalesce(v_rem.solicitacao_destino_id, '') <> '' THEN
        SELECT coalesce(
            jsonb_agg(
                CASE
                    WHEN elem->>'id' = v_rem.solicitacao_destino_id
                    THEN jsonb_set(
                        jsonb_set(elem, '{atendido}', 'true'::jsonb),
                        '{viaturas_vinculadas}',
                        coalesce(elem->'viaturas_vinculadas', '[]'::jsonb) || to_jsonb(v_rem.prefixo)
                    )
                    ELSE elem
                END
            ),
            '[]'::jsonb
        )
        INTO v_reqs_destino
        FROM jsonb_array_elements(coalesce(v_oc_destino.recursos_solicitados, '[]'::jsonb)) elem;

        UPDATE public.ocorrencias
        SET recursos_solicitados = v_reqs_destino,
            status_ocorrencia = CASE WHEN status_ocorrencia = 'PENDENTE' THEN 'DESPACHADA' ELSE status_ocorrencia END,
            atualizado_em = now()
        WHERE id = v_oc_destino.id;
    END IF;

    -- 4. Atualiza KM e status da viatura
    UPDATE public.viaturas
    SET status = 'EMPENHADA',
        km_atual = v_km_limpo,
        atualizado_em = now()
    WHERE id = v_rem.viatura_id;

    -- 5. Marca remanejamento como ACEITO
    UPDATE public.viatura_remanejamentos
    SET status = 'ACEITO',
        km_transicao = v_km_limpo,
        respondido_por_device = p_device_uuid,
        respondido_em = now()
    WHERE id = p_remanejamento_id;

    RETURN jsonb_build_object(
        'remanejamento_id', p_remanejamento_id,
        'novo_empenho_id', v_novo_empenho_id,
        'km_transicao', v_km_limpo,
        'status', 'ACEITO'
    );
END;
$$;

-- ============================================================================
-- RPC 9: RECUSAR REMANEJAMENTO (CONDUTOR) OU CANCELAR PELA CENTRAL
-- (REVERTE IMEDIATAMENTE SEM ALTERAR OCORRÊNCIA A)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.recusar_remanejamento_viatura(
    p_remanejamento_id uuid,
    p_justificativa text,
    p_device_uuid text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rem record;
BEGIN
    SELECT * INTO v_rem
    FROM public.viatura_remanejamentos
    WHERE id = p_remanejamento_id AND status = 'PENDENTE_ACEITE'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação de remanejamento não está mais pendente.';
    END IF;

    UPDATE public.viatura_remanejamentos
    SET status = 'RECUSADO',
        justificativa_recusa = upper(coalesce(p_justificativa, '')),
        respondido_por_device = p_device_uuid,
        respondido_em = now()
    WHERE id = p_remanejamento_id;

    RETURN jsonb_build_object(
        'remanejamento_id', p_remanejamento_id,
        'status', 'RECUSADO'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancelar_remanejamento_viatura(
    p_remanejamento_id uuid,
    p_cancelado_por_nome text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rem record;
BEGIN
    SELECT * INTO v_rem
    FROM public.viatura_remanejamentos
    WHERE id = p_remanejamento_id AND status = 'PENDENTE_ACEITE'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Não é possível cancelar: o remanejamento já foi aceito ou encerrado.';
    END IF;

    UPDATE public.viatura_remanejamentos
    SET status = 'CANCELADO_CENTRAL',
        motivo_central = trim(coalesce(motivo_central, '') || ' | CANCELADO POR ' || upper(coalesce(p_cancelado_por_nome, 'CENTRAL'))),
        respondido_em = now()
    WHERE id = p_remanejamento_id;

    RETURN jsonb_build_object(
        'remanejamento_id', p_remanejamento_id,
        'status', 'CANCELADO_CENTRAL'
    );
END;
$$;

-- ============================================================================
-- RPC 10: FINALIZAR OCORRÊNCIA NA CENTRAL WEB (COM TRAVA DE RECURSOS ATIVOS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.finalizar_ocorrencia_central(
    p_ocorrencia_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ativos integer;
BEGIN
    SELECT COUNT(*) INTO v_ativos
    FROM public.ocorrencia_viaturas
    WHERE ocorrencia_id = p_ocorrencia_id
      AND upper(coalesce(status_empenho, '')) NOT IN ('FINALIZADA', 'QTA', 'ENCERRADA');

    IF v_ativos > 0 THEN
        RAISE EXCEPTION 'Bloqueado: ainda existe(m) % recurso(s) empenhado(s) ativo(s) nesta ocorrência. Aguarde a finalização ou lance QTA antes de encerrar.', v_ativos;
    END IF;

    UPDATE public.ocorrencias
    SET status_ocorrencia = 'FINALIZADA',
        atualizado_em = now()
    WHERE id = p_ocorrencia_id;

    RETURN jsonb_build_object(
        'ocorrencia_id', p_ocorrencia_id,
        'status_ocorrencia', 'FINALIZADA'
    );
END;
$$;

-- Habilita Realtime para as novas tabelas de operação em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.viatura_plantoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.viatura_dispositivos_sessao;
ALTER PUBLICATION supabase_realtime ADD TABLE public.viatura_remanejamentos;