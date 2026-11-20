-- 1. Adiciona a função na viatura dentro da tabela de perfis
ALTER TABLE public.perfis
    ADD COLUMN funcao_vtr TEXT CHECK (funcao_vtr IN ('MEDICO', 'ENFERMEIRO', 'CONDUTOR', 'TECNICO', 'ESTAGIO OP.', 'ALUNO', 'COORDENACAO'));

-- 2. Adiciona o registro dinâmico da tripulação atual na tabela de viaturas
-- (Substitui a mensagem de WhatsApp do plantão e pode ser editado livremente ao longo do dia)
ALTER TABLE public.viaturas
    ADD COLUMN tripulacao_atual JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Adiciona os campos da RAS, despacho expresso, equipe detalhada e tripulantes extras na tabela de ocorrências
ALTER TABLE public.ocorrencias
    ADD COLUMN dn_paciente TEXT,
    ADD COLUMN rg_cpf_paciente TEXT,
    ADD COLUMN localizacao_link TEXT,
    ADD COLUMN equipe_medico_intervencionista TEXT,
    ADD COLUMN medico_regulador_despacho TEXT,
    ADD COLUMN medico_regulador_2 TEXT,
    ADD COLUMN equipe_enfermeiro TEXT,
    ADD COLUMN equipe_condutor TEXT,
    ADD COLUMN equipe_tecnico TEXT,
    ADD COLUMN tripulantes_extras JSONB NOT NULL DEFAULT '[]'::jsonb;