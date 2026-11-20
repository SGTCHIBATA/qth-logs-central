-- 1. Atualiza registros existentes que ainda tenham underscore
UPDATE public.perfis
SET cargo = REPLACE(UPPER(cargo), '_', ' ')
WHERE UPPER(cargo) IN ('RADIO_OPERADOR', 'MEDICO_REGULADOR');

-- 2. Recria a constraint perfis_cargo_check sem underscores
ALTER TABLE public.perfis
    DROP CONSTRAINT IF EXISTS perfis_cargo_check;

ALTER TABLE public.perfis
    ADD CONSTRAINT perfis_cargo_check
    CHECK (UPPER(cargo) IN (
        'GESTOR',
        'COORDENADOR',
        'RADIO OPERADOR',
        'MEDICO REGULADOR',
        'TARM',
        'TRIPULANTE'
    ));

-- 3. Atualiza as políticas de RLS de veiculos e viaturas para reconhecer 'RADIO OPERADOR'
DROP POLICY IF EXISTS "Veiculos: insercao e edicao operacional" ON public.veiculos;
CREATE POLICY "Veiculos: insercao e edicao operacional"
    ON public.veiculos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO OPERADOR', 'TRIPULANTE')
    );

DROP POLICY IF EXISTS "Veiculos: atualizacao operacional" ON public.veiculos;
CREATE POLICY "Veiculos: atualizacao operacional"
    ON public.veiculos
    FOR UPDATE
    TO authenticated
    USING (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO OPERADOR', 'TRIPULANTE')
    )
    WITH CHECK (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO OPERADOR', 'TRIPULANTE')
    );

DROP POLICY IF EXISTS "Viaturas: atualizacao operacional" ON public.viaturas;
CREATE POLICY "Viaturas: atualizacao operacional"
    ON public.viaturas
    FOR UPDATE
    TO authenticated
    USING (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO OPERADOR', 'TRIPULANTE')
    )
    WITH CHECK (
        public.meu_cargo() IN ('GESTOR', 'COORDENADOR', 'RADIO OPERADOR', 'TRIPULANTE')
    );