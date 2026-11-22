ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_saida_base TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS h_saida_saude TEXT NOT NULL DEFAULT '';

ALTER TABLE public.ocorrencia_viaturas ADD COLUMN IF NOT EXISTS h_saida_base TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencia_viaturas ADD COLUMN IF NOT EXISTS h_saida_saude TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencia_viaturas ADD COLUMN IF NOT EXISTS pacientes_detalhes JSONB NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "ocorrencia_viaturas_write_radio" ON public.ocorrencia_viaturas;
CREATE POLICY "ocorrencia_viaturas_write_radio"
ON public.ocorrencia_viaturas FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN (
              'RADIO OPERADOR',
              'MEDICO REGULADOR',
              'COORDENADOR',
              'GESTOR',
              'MEDICO',
              'ENFERMEIRO',
              'TECNICO',
              'TRIPULANTE'
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfis p
        WHERE p.id = auth.uid()
          AND COALESCE(p.ativo, true) = true
          AND UPPER(COALESCE(p.cargo, '')) IN (
              'RADIO OPERADOR',
              'MEDICO REGULADOR',
              'COORDENADOR',
              'GESTOR',
              'MEDICO',
              'ENFERMEIRO',
              'TECNICO',
              'TRIPULANTE'
          )
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
          AND UPPER(COALESCE(p.cargo, '')) IN (
              'MEDICO REGULADOR',
              'RADIO OPERADOR',
              'COORDENADOR',
              'GESTOR',
              'MEDICO',
              'ENFERMEIRO',
              'TECNICO',
              'TRIPULANTE'
          )
    )
);