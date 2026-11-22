CREATE TABLE IF NOT EXISTS public.ocorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ocorrencia TEXT NOT NULL DEFAULT '',
    status_ocorrencia TEXT NOT NULL DEFAULT 'PENDENTE',
    prioridade TEXT NOT NULL DEFAULT 'MEDIA',
    solicitante_nome TEXT NOT NULL DEFAULT '',
    solicitante_telefone TEXT NOT NULL DEFAULT '',
    numero_vitimas INTEGER NOT NULL DEFAULT 1,
    tipo_atendimento TEXT NOT NULL DEFAULT 'PRIMÁRIO',
    tipo_local TEXT NOT NULL DEFAULT 'DOMICÍLIO',
    tipo_via TEXT NOT NULL DEFAULT 'Urbana',
    via1 TEXT NOT NULL DEFAULT '',
    via2 TEXT NOT NULL DEFAULT '',
    numero_end TEXT NOT NULL DEFAULT '',
    bairro TEXT NOT NULL DEFAULT '',
    ponto_referencia TEXT NOT NULL DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'PR',
    cidade_urb TEXT NOT NULL DEFAULT '',
    rodovia_jurisdicao TEXT NOT NULL DEFAULT '',
    rodovia_codigo TEXT NOT NULL DEFAULT '',
    rodovia_km TEXT NOT NULL DEFAULT '',
    rodovia_uf TEXT NOT NULL DEFAULT 'PR',
    rodovia_cidade TEXT NOT NULL DEFAULT '',
    origem_instituicao TEXT NOT NULL DEFAULT '',
    origem_rua TEXT NOT NULL DEFAULT '',
    origem_numero TEXT NOT NULL DEFAULT '',
    origem_bairro TEXT NOT NULL DEFAULT '',
    origem_uf TEXT NOT NULL DEFAULT 'PR',
    origem_cidade TEXT NOT NULL DEFAULT '',
    destino_instituicao TEXT NOT NULL DEFAULT '',
    destino_rua TEXT NOT NULL DEFAULT '',
    destino_numero TEXT NOT NULL DEFAULT '',
    destino_bairro TEXT NOT NULL DEFAULT '',
    destino_uf TEXT NOT NULL DEFAULT 'PR',
    destino_cidade TEXT NOT NULL DEFAULT '',
    motivo TEXT NOT NULL DEFAULT '',
    nome_paciente TEXT NOT NULL DEFAULT '',
    idade_paciente TEXT NOT NULL DEFAULT '',
    tipo_idade_paciente TEXT NOT NULL DEFAULT 'Anos',
    sexo_paciente TEXT NOT NULL DEFAULT '',
    classificacao_risco TEXT NOT NULL DEFAULT 'VERDE',
    hipotese_diagnostica TEXT NOT NULL DEFAULT '',
    quadro_clinico TEXT NOT NULL DEFAULT '',
    recurso_indicado TEXT NOT NULL DEFAULT '',
    conduta_regulacao TEXT NOT NULL DEFAULT '',
    codigo_j TEXT NOT NULL DEFAULT '',
    codigo_qta TEXT NOT NULL DEFAULT '',
    observacao_radio TEXT NOT NULL DEFAULT '',
    h_acionamento TEXT NOT NULL DEFAULT '',
    h_saida_base TEXT NOT NULL DEFAULT '',
    h_chegada_qth TEXT NOT NULL DEFAULT '',
    h_saida_qth TEXT NOT NULL DEFAULT '',
    h_chegada_saude TEXT NOT NULL DEFAULT '',
    h_saida_saude TEXT NOT NULL DEFAULT '',
    h_chegada_base TEXT NOT NULL DEFAULT '',
    criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    criado_por_nome TEXT NOT NULL DEFAULT '',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante que todas as colunas existam mesmo se public.ocorrencias já existia de versão anterior
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS numero_ocorrencia TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS status_ocorrencia TEXT NOT NULL DEFAULT 'PENDENTE';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS prioridade TEXT NOT NULL DEFAULT 'MEDIA';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS solicitante_nome TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS solicitante_telefone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS numero_vitimas INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT NOT NULL DEFAULT 'PRIMÁRIO';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS tipo_local TEXT NOT NULL DEFAULT 'DOMICÍLIO';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS tipo_via TEXT NOT NULL DEFAULT 'Urbana';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS via1 TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS via2 TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS numero_end TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS bairro TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS ponto_referencia TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'PR';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS cidade_urb TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS rodovia_jurisdicao TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS rodovia_codigo TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS rodovia_km TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS rodovia_uf TEXT NOT NULL DEFAULT 'PR';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS rodovia_cidade TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS origem_instituicao TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS origem_rua TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS origem_numero TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS origem_bairro TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS origem_uf TEXT NOT NULL DEFAULT 'PR';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS origem_cidade TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS destino_instituicao TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS destino_rua TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS destino_numero TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS destino_bairro TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS destino_uf TEXT NOT NULL DEFAULT 'PR';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS destino_cidade TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS motivo TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS nome_paciente TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS idade_paciente TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS tipo_idade_paciente TEXT NOT NULL DEFAULT 'Anos';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS sexo_paciente TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS classificacao_risco TEXT NOT NULL DEFAULT 'VERDE';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS hipotese_diagnostica TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS quadro_clinico TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS recurso_indicado TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS conduta_regulacao TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS codigo_j TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS codigo_qta TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS observacao_radio TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_acionamento TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_saida_base TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_chegada_qth TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_saida_qth TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_chegada_saude TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_saida_saude TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_chegada_base TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS criado_por_nome TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.ocorrencia_viaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocorrencia_id UUID NOT NULL REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
    viatura_id UUID NOT NULL REFERENCES public.viaturas(id) ON DELETE RESTRICT,
    prefixo TEXT NOT NULL DEFAULT '',
    status_empenho TEXT NOT NULL DEFAULT 'ACIONADA',
    km_saida TEXT NOT NULL DEFAULT '',
    km_chegada TEXT NOT NULL DEFAULT '',
    h_acionamento TEXT NOT NULL DEFAULT '',
    h_chegada_qth TEXT NOT NULL DEFAULT '',
    h_saida_qth TEXT NOT NULL DEFAULT '',
    h_chegada_saude TEXT NOT NULL DEFAULT '',
    h_saida_saude TEXT NOT NULL DEFAULT '',
    h_encerramento TEXT NOT NULL DEFAULT '',
    empenhado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    empenhado_por_nome TEXT NOT NULL DEFAULT '',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ocorrencia_id, viatura_id)
);

CREATE TABLE IF NOT EXISTS public.ocorrencia_evolucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocorrencia_id UUID NOT NULL REFERENCES public.ocorrencias(id) ON DELETE CASCADE,
    origem_aba TEXT NOT NULL DEFAULT 'REGULADOR',
    quadro_clinico TEXT NOT NULL DEFAULT '',
    evolucao_texto TEXT NOT NULL DEFAULT '',
    autor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    autor_nome TEXT NOT NULL DEFAULT '',
    autor_cargo TEXT NOT NULL DEFAULT '',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON public.ocorrencias(status_ocorrencia);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_prioridade ON public.ocorrencias(prioridade);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_criado_em ON public.ocorrencias(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_viaturas_ocorrencia ON public.ocorrencia_viaturas(ocorrencia_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_viaturas_viatura ON public.ocorrencia_viaturas(viatura_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_evolucoes_ocorrencia ON public.ocorrencia_evolucoes(ocorrencia_id, criado_em DESC);

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencia_viaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencia_evolucoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ocorrencias_select_autenticado" ON public.ocorrencias;
CREATE POLICY "ocorrencias_select_autenticado"
ON public.ocorrencias FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ocorrencia_viaturas_select_autenticado" ON public.ocorrencia_viaturas;
CREATE POLICY "ocorrencia_viaturas_select_autenticado"
ON public.ocorrencia_viaturas FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ocorrencia_evolucoes_select_autenticado" ON public.ocorrencia_evolucoes;
CREATE POLICY "ocorrencia_evolucoes_select_autenticado"
ON public.ocorrencia_evolucoes FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "ocorrencias_insert_operacional" ON public.ocorrencias;
CREATE POLICY "ocorrencias_insert_operacional"
ON public.ocorrencias FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN ('TARM', 'MEDICO REGULADOR', 'RADIO OPERADOR', 'COORDENADOR', 'GESTOR')
    )
);

DROP POLICY IF EXISTS "ocorrencias_update_operacional" ON public.ocorrencias;
CREATE POLICY "ocorrencias_update_operacional"
ON public.ocorrencias FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN ('TARM', 'MEDICO REGULADOR', 'RADIO OPERADOR', 'COORDENADOR', 'GESTOR')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN ('TARM', 'MEDICO REGULADOR', 'RADIO OPERADOR', 'COORDENADOR', 'GESTOR')
    )
);

DROP POLICY IF EXISTS "ocorrencia_viaturas_write_radio" ON public.ocorrencia_viaturas;
CREATE POLICY "ocorrencia_viaturas_write_radio"
ON public.ocorrencia_viaturas FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN ('RADIO OPERADOR', 'MEDICO REGULADOR', 'COORDENADOR', 'GESTOR')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN ('RADIO OPERADOR', 'MEDICO REGULADOR', 'COORDENADOR', 'GESTOR')
    )
);

DROP POLICY IF EXISTS "ocorrencia_evolucoes_write_equipe" ON public.ocorrencia_evolucoes;
CREATE POLICY "ocorrencia_evolucoes_write_equipe"
ON public.ocorrencia_evolucoes FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN ('MEDICO REGULADOR', 'RADIO OPERADOR', 'COORDENADOR', 'GESTOR')
    )
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ocorrencias'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencias;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ocorrencia_viaturas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencia_viaturas;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ocorrencia_evolucoes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencia_evolucoes;
    END IF;
END $$;