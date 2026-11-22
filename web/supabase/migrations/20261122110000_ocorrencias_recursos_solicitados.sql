ALTER TABLE public.ocorrencias
  ADD COLUMN IF NOT EXISTS recursos_solicitados JSONB NOT NULL DEFAULT '[]'::jsonb;
