-- ============================================================================
-- ISOLAMENTO DE USUÁRIOS, RECURSOS E DADOS POR INSTITUIÇÃO (RLS + HELPERS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_eh_platform_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$SELECT coalesce( (SELECT is_platform_owner FROM public.perfis WHERE id = auth.uid()), false );$$;

CREATE OR REPLACE FUNCTION public.fn_minha_instituicao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$SELECT instituicao_id FROM public.perfis WHERE id = auth.uid();$$;

ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS instituicoes_acesso_master_ou_propria ON public.instituicoes;
CREATE POLICY instituicoes_acesso_master_ou_propria
ON public.instituicoes
FOR ALL
USING (
    public.fn_eh_platform_owner()
    OR id = public.fn_minha_instituicao_id()
)
WITH CHECK (
    public.fn_eh_platform_owner()
);

DROP POLICY IF EXISTS perfis_isolamento_instituicao ON public.perfis;
CREATE POLICY perfis_isolamento_instituicao
ON public.perfis
FOR ALL
USING (
    public.fn_eh_platform_owner()
    OR id = auth.uid()
    OR (
        public.fn_minha_instituicao_id() IS NOT NULL
        AND instituicao_id = public.fn_minha_instituicao_id()
    )
)
WITH CHECK (
    public.fn_eh_platform_owner()
    OR (
        public.fn_minha_instituicao_id() IS NOT NULL
        AND instituicao_id = public.fn_minha_instituicao_id()
        AND coalesce(is_platform_owner, false) = false
    )
);

DROP POLICY IF EXISTS viaturas_isolamento_instituicao ON public.viaturas;
CREATE POLICY viaturas_isolamento_instituicao
ON public.viaturas
FOR ALL
USING (
    public.fn_eh_platform_owner()
    OR (
        public.fn_minha_instituicao_id() IS NOT NULL
        AND instituicao_id = public.fn_minha_instituicao_id()
    )
)
WITH CHECK (
    public.fn_eh_platform_owner()
    OR (
        public.fn_minha_instituicao_id() IS NOT NULL
        AND instituicao_id = public.fn_minha_instituicao_id()
    )
);