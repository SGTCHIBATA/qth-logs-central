ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura instituicoes ativas por sigla e uf" ON public.instituicoes;
CREATE POLICY "Leitura instituicoes ativas por sigla e uf"
  ON public.instituicoes
  FOR SELECT
  TO anon, authenticated
  USING (ativa = true);

NOTIFY pgrst, 'reload schema';