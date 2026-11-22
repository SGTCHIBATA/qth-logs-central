ALTER TABLE public.ocorrencias
  ADD COLUMN IF NOT EXISTS pacientes_cena JSONB NOT NULL DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';