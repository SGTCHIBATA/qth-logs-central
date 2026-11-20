-- 1. TABELA DE PERFIS (Usuários e Controle de Acesso - RBAC)
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    matricula TEXT UNIQUE,
    cargo TEXT NOT NULL DEFAULT 'TRIPULANTE' CHECK (cargo IN ('GESTOR', 'MEDICO', 'RADIO_OPERADOR', 'TARM', 'TRIPULANTE')),
    viatura_atual_id UUID,
    ativo BOOLEAN NOT NULL DEFAULT true,
    fcm_token TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA DE VIATURAS (Frota e Status em Tempo Real)
CREATE TABLE public.viaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefixo TEXT NOT NULL UNIQUE, -- Ex: USA 01, USB 02
    placa TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('USA', 'USB', 'VIR', 'MOTOLANCIA', 'AEROMEDICO')),
    base_cidade TEXT NOT NULL,
    base_uf TEXT NOT NULL DEFAULT 'PR',
    status TEXT NOT NULL DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL', 'EMPENHADA', 'DESLOCAMENTO', 'NO_QTH', 'TRANSPORTE', 'BAIXADA')),
    ativa BOOLEAN NOT NULL DEFAULT true,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vincula a viatura atual no perfil do tripulante
ALTER TABLE public.perfis
    ADD CONSTRAINT fk_perfis_viatura
    FOREIGN KEY (viatura_atual_id) REFERENCES public.viaturas(id) ON DELETE SET NULL;

-- 3. TABELA DE OCORRÊNCIAS (Espelho completo do App + Fluxo da Central)
CREATE TABLE public.ocorrencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ocorrencia TEXT,
    status_fluxo TEXT NOT NULL DEFAULT 'ABERTA' CHECK (status_fluxo IN ('ABERTA', 'EMPENHADA', 'ACEITA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA')),
    viatura_id UUID REFERENCES public.viaturas(id) ON DELETE SET NULL,
    
    -- Classificação
    tipo_atendimento TEXT NOT NULL DEFAULT 'PRIMÁRIO', -- PRIMÁRIO ou TRANSFERÊNCIA
    tipo_local TEXT, -- DOMICÍLIO, VIA PÚBLICA, ESTABELECIMENTO
    tipo_via TEXT DEFAULT 'Urbana', -- Urbana ou Rodovia/Rural
    
    -- Endereço Urbano
    via1 TEXT,
    via2 TEXT,
    numero_end TEXT,
    bairro TEXT,
    ponto_referencia TEXT,
    estado TEXT DEFAULT 'PR',
    cidade_urb TEXT,
    
    -- Endereço Rodovia / Rural
    rodovia_jurisdicao TEXT,
    rodovia_codigo TEXT,
    rodovia_km TEXT,
    rodovia_uf TEXT DEFAULT 'PR',
    rodovia_cidade TEXT,
    
    -- Transferência: Origem
    origem_instituicao TEXT,
    origem_rua TEXT,
    origem_numero TEXT,
    origem_bairro TEXT,
    origem_uf TEXT DEFAULT 'PR',
    origem_cidade TEXT,
    
    -- Transferência: Destino
    destino_instituicao TEXT,
    destino_rua TEXT,
    destino_numero TEXT,
    destino_bairro TEXT,
    destino_uf TEXT DEFAULT 'PR',
    destino_cidade TEXT,
    
    -- Motivo e Paciente
    motivo TEXT,
    nome_paciente TEXT,
    idade_paciente TEXT,
    tipo_idade_paciente TEXT DEFAULT 'Anos',
    sexo_paciente TEXT,
    
    -- Quilometragem e Tempos
    km_saida TEXT,
    km_chegada TEXT,
    h_acionamento TEXT,
    h_saida_base TEXT,
    h_chegada_qth TEXT,
    h_saida_qth TEXT,
    h_chegada_saude TEXT,
    h_saida_saude TEXT,
    h_chegada_base TEXT,
    observacao TEXT,
    
    -- Controle da Central
    criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    empenhado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE AUDITORIA (Trilha jurídica e LGPD)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id UUID,
    detalhes JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SEGURANÇA (RLS - Row Level Security ativado em todas as tabelas)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas iniciais para usuários autenticados (refinaremos por cargo na próxima etapa)
CREATE POLICY "Autenticados podem ler perfis" ON public.perfis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuario edita proprio perfil" ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Autenticados acessam viaturas" ON public.viaturas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados acessam ocorrencias" ON public.ocorrencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Autenticados inserem logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Autenticados leem logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- TEMPO REAL (WebSockets ativados para Viaturas e Ocorrências)
ALTER PUBLICATION supabase_realtime ADD TABLE public.viaturas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencias;