-- ============================================================================
-- POLÍTICAS RLS PARA PLANTÕES, SESSÕES DE DISPOSITIVOS E REMANEJAMENTOS
-- ============================================================================

ALTER TABLE public.viatura_plantoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viatura_dispositivos_sessao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viatura_remanejamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS viatura_plantoes_acesso_instituicao ON public.viatura_plantoes;
CREATE POLICY viatura_plantoes_acesso_instituicao
ON public.viatura_plantoes
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

DROP POLICY IF EXISTS viatura_dispositivos_acesso_instituicao ON public.viatura_dispositivos_sessao;
CREATE POLICY viatura_dispositivos_acesso_instituicao
ON public.viatura_dispositivos_sessao
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

DROP POLICY IF EXISTS viatura_remanejamentos_acesso_instituicao ON public.viatura_remanejamentos;
CREATE POLICY viatura_remanejamentos_acesso_instituicao
ON public.viatura_remanejamentos
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