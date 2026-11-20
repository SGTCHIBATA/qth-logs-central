-- 1. Atualiza os status permitidos na tabela de OCORRÊNCIAS (Card Nível 1 na Web)
ALTER TABLE public.ocorrencias
    DROP CONSTRAINT IF EXISTS ocorrencias_status_fluxo_check;

ALTER TABLE public.ocorrencias
    ALTER COLUMN status_fluxo SET DEFAULT 'EM_ESPERA',
    ADD CONSTRAINT ocorrencias_status_fluxo_check
    CHECK (status_fluxo IN ('EM_ESPERA', 'EMPENHADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'));

-- 2. Atualiza os status permitidos na tabela de VIATURAS (Painel de Frota)
ALTER TABLE public.viaturas
    DROP CONSTRAINT IF EXISTS viaturas_status_check;

ALTER TABLE public.viaturas
    ADD CONSTRAINT viaturas_status_check
    CHECK (status IN (
        'DISPONIVEL',
        'ACIONADA',
        'EMPENHADA',
        'QTI',
        'NO_QTH',
        'QTI_UNIDADE_SAUDE',
        'NA_UNIDADE_SAUDE',
        'QTI_BASE_QAP',
        'QTI_BASE_SEM_CONDICOES',
        'SEM_CONDICOES',
        'INTERCORRENCIA',
        'BAIXADA'
    ));

-- 3. Cria a tabela de RECURSOS POR OCORRÊNCIA (1 Ocorrência -> N Viaturas independentes)
CREATE TABLE public.ocorrencia_recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocorrencia_id UUID NOT NULL REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    empenhado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,

    -- Status da VTR nesta ocorrência (Sub-card Nível 2 na Web)
    status_recurso TEXT NOT NULL DEFAULT 'ACIONADA' CHECK (status_recurso IN (
        'ACIONADA',
        'EMPENHADA',
        'QTI',
        'NO_QTH',
        'QTI_UNIDADE_SAUDE',
        'NA_UNIDADE_SAUDE',
        'QTI_BASE_QAP',
        'QTI_BASE_SEM_CONDICOES',
        'QTA',
        'REMANEJADA',
        'INTERCORRENCIA',
        'FINALIZADA'
    )),

    -- Registros de Tempo (Códigos J - todos opcionais para fluxo flexível)
    h_acionamento TEXT,
    h_j9_deslocamento TEXT,
    h_j10_qth TEXT,
    h_j9_transporte TEXT,
    h_j10_saude TEXT,
    h_j11 TEXT,
    h_j12 TEXT,

    -- Condição no J11 / QTA (QAP ou Sem Condições)
    condicao_j11 TEXT CHECK (condicao_j11 IN ('QAP', 'SEM_CONDICOES')),
    is_qta BOOLEAN NOT NULL DEFAULT false,
    qta_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,

    -- Remanejamento automático (preenchido ao aceitar nova OC com KM atual)
    remanejada_em TIMESTAMPTZ,
    remanejada_para_ocorrencia_id UUID REFERENCES public.ocorrencias(id) ON DELETE SET NULL,

    -- Intercorrência (dispara alerta na Web para despacho de recurso substituto)
    tem_intercorrencia BOOLEAN NOT NULL DEFAULT false,
    intercorrencia_descricao TEXT,
    intercorrencia_em TIMESTAMPTZ,

    -- Dados individuais da equipe nesta ocorrência
    km_saida TEXT,
    km_chegada TEXT,
    observacao_equipe TEXT,
    equipe_medico_intervencionista TEXT,
    equipe_enfermeiro TEXT,
    equipe_condutor TEXT,
    equipe_tecnico TEXT,
    tripulantes_extras JSONB NOT NULL DEFAULT '[]'::jsonb,

    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Segurança (RLS) e Tempo Real (WebSockets) para ocorrencia_recursos
ALTER TABLE public.ocorrencia_recursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados acessam recursos de ocorrencias"
    ON public.ocorrencia_recursos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencia_recursos;