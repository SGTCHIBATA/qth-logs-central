-- 1. Odômetro centralizado na tabela de viaturas
ALTER TABLE public.viaturas
    ADD COLUMN IF NOT EXISTS km_atual TEXT DEFAULT '';

-- 2. Libera o cargo COORDENADOR na tabela perfis (mesmos privilégios de GESTOR)
ALTER TABLE public.perfis
    DROP CONSTRAINT IF EXISTS perfis_cargo_check;

ALTER TABLE public.perfis
    ADD CONSTRAINT perfis_cargo_check
    CHECK (UPPER(cargo) IN (
        'GESTOR',
        'COORDENADOR',
        'RADIO_OPERADOR',
        'MEDICO_REGULADOR',
        'TARM',
        'TRIPULANTE'
    ));

-- 3. Tabela imutável de auditoria (Quem, Quando, O que, Por onde)
CREATE TABLE public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    usuario_nome TEXT NOT NULL,
    usuario_cargo TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id TEXT,
    acao TEXT NOT NULL CHECK (acao IN ('CRIACAO', 'EDICAO', 'EXCLUSAO')),
    campo_alterado TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    origem TEXT NOT NULL CHECK (origem IN ('APP_INTERVENCAO', 'PAINEL_WEB')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Segurança (RLS): Inserção livre para autenticados, leitura apenas para GESTOR/COORDENADOR, zero edição/exclusão
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados registram auditoria"
    ON public.logs_auditoria
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Gestores e Coordenadores consultam auditoria"
    ON public.logs_auditoria
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis
            WHERE perfis.id = auth.uid()
              AND UPPER(perfis.cargo) IN ('GESTOR', 'COORDENADOR')
        )
    );