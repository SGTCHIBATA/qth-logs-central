-- 1. Tabela de veículos físicos (a Placa é a dona do KM)
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa TEXT NOT NULL UNIQUE,
    km_atual TEXT DEFAULT '',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Vínculo da viatura operacional (USB 01, USA 01...) com o veículo físico (Placa)
ALTER TABLE public.viaturas
    ADD COLUMN IF NOT EXISTS veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE SET NULL;

-- 3. Migra placas e KMs já cadastrados em viaturas para a tabela veiculos sem perder dados
INSERT INTO public.veiculos (placa, km_atual)
SELECT DISTINCT UPPER(TRIM(placa)), COALESCE(km_atual, '')
FROM public.viaturas
WHERE placa IS NOT NULL AND TRIM(placa) <> ''
ON CONFLICT (placa) DO NOTHING;

UPDATE public.viaturas v
SET veiculo_id = vec.id
FROM public.veiculos vec
WHERE UPPER(TRIM(v.placa)) = vec.placa
  AND v.veiculo_id IS NULL;

-- 4. Segurança (RLS) em veiculos: Web (Gestor/Coord/RO) e App do Condutor (Tripulante)
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Veiculos: leitura autenticados" ON public.veiculos;
DROP POLICY IF EXISTS "Veiculos: insercao e edicao operacional" ON public.veiculos;
DROP POLICY IF EXISTS "Veiculos: exclusao gestores" ON public.veiculos;

CREATE POLICY "Veiculos: leitura autenticados"
    ON public.veiculos
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Veiculos: insercao e edicao operacional"
    ON public.veiculos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO_OPERADOR', 'TRIPULANTE')
    );

CREATE POLICY "Veiculos: atualizacao operacional"
    ON public.veiculos
    FOR UPDATE
    TO authenticated
    USING (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO_OPERADOR', 'TRIPULANTE')
    )
    WITH CHECK (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO_OPERADOR', 'TRIPULANTE')
    );

CREATE POLICY "Veiculos: exclusao gestores"
    ON public.veiculos
    FOR DELETE
    TO authenticated
    USING (public.meu_cargo() IN ('GESTOR', 'COORDENADOR'));

-- 5. Garante que TRIPULANTE (app do condutor) também possa trocar a placa/status da viatura
DROP POLICY IF EXISTS "Viaturas: atualizacao operacional" ON public.viaturas;

CREATE POLICY "Viaturas: atualizacao operacional"
    ON public.viaturas
    FOR UPDATE
    TO authenticated
    USING (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO_OPERADOR', 'TRIPULANTE')
    )
    WITH CHECK (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO_OPERADOR', 'TRIPULANTE')
    );

-- 6. Ativa Realtime na tabela veiculos para sincronizar KM entre App e Web
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'veiculos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.veiculos;
    END IF;
END $$;