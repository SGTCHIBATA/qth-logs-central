ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS protocolo_imv BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS imv_ativado_por TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS imv_ativado_em TIMESTAMPTZ NULL;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS vitimas_meios_proprios INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS vitimas_terceiros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS vitimas_obito_local INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS vitimas_lista JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.ocorrencia_viaturas
  ADD COLUMN IF NOT EXISTS vitimas_cores JSONB NOT NULL DEFAULT '{"VERMELHO":0,"AMARELO":0,"VERDE":0,"PRETO":0}'::jsonb;