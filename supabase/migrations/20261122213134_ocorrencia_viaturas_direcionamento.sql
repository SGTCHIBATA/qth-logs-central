ALTER TABLE public.ocorrencia_viaturas
  ADD COLUMN IF NOT EXISTS direcionamento_solicitacao JSONB;

NOTIFY pgrst, 'reload schema';