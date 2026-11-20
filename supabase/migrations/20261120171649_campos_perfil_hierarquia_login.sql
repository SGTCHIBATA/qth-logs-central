-- 1. Novos campos na tabela perfis
ALTER TABLE public.perfis
    ADD COLUMN IF NOT EXISTS cpf TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS base TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS municipio_lotacao TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN NOT NULL DEFAULT true;

-- Índice único para CPF (quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS perfis_cpf_unique
    ON public.perfis (cpf)
    WHERE cpf IS NOT NULL AND cpf <> '';

-- 2. Preenche email e libera primeiro_acesso para usuários já existentes
UPDATE public.perfis p
SET
    email = COALESCE(p.email, u.email),
    primeiro_acesso = false
FROM auth.users u
WHERE p.id = u.id;

-- 3. Função segura para login por Nome Completo, CPF, Matrícula ou E-mail
CREATE OR REPLACE FUNCTION public.resolver_email_login(identificador TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$ DECLARE v_limpo TEXT := TRIM(identificador); v_digitos TEXT := REGEXP_REPLACE(TRIM(identificador), '\D', '', 'g'); v_email TEXT; BEGIN IF v_limpo = '' THEN RETURN NULL; END IF;      SELECT u.email INTO v_email FROM public.perfis p JOIN auth.users u ON u.id = p.id WHERE COALESCE(p.ativo, true) = true AND ( UPPER(TRIM(p.nome_completo)) = UPPER(v_limpo) OR UPPER(TRIM(COALESCE(p.matricula, ''))) = UPPER(v_limpo) OR LOWER(TRIM(COALESCE(u.email, ''))) = LOWER(v_limpo) OR ( v_digitos <> '' AND REGEXP_REPLACE(COALESCE(p.cpf, ''), '\D', '', 'g') = v_digitos ) ) LIMIT 1;      RETURN v_email; END; $$;

GRANT EXECUTE ON FUNCTION public.resolver_email_login(TEXT) TO anon, authenticated;

-- 4. Políticas de RLS com Hierarquia (GESTOR > COORDENADOR > Próprio Usuário)
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis: gestores gerenciam todos" ON public.perfis;
DROP POLICY IF EXISTS "Perfis: coordenadores gerenciam nao gestores" ON public.perfis;
DROP POLICY IF EXISTS "Perfis: usuario atualiza proprio perfil" ON public.perfis;

-- GESTOR pode criar, editar e excluir qualquer perfil
CREATE POLICY "Perfis: gestores gerenciam todos"
    ON public.perfis
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.perfis me
            WHERE me.id = auth.uid() AND UPPER(me.cargo) = 'GESTOR'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.perfis me
            WHERE me.id = auth.uid() AND UPPER(me.cargo) = 'GESTOR'
        )
    );

-- COORDENADOR pode criar, editar e excluir todos EXCETO GESTOR (e não pode promover para GESTOR)
CREATE POLICY "Perfis: coordenadores gerenciam nao gestores"
    ON public.perfis
    FOR ALL
    TO authenticated
    USING (
        UPPER(COALESCE(cargo, '')) <> 'GESTOR'
        AND EXISTS (
            SELECT 1 FROM public.perfis me
            WHERE me.id = auth.uid() AND UPPER(me.cargo) = 'COORDENADOR'
        )
    )
    WITH CHECK (
        UPPER(COALESCE(cargo, '')) <> 'GESTOR'
        AND EXISTS (
            SELECT 1 FROM public.perfis me
            WHERE me.id = auth.uid() AND UPPER(me.cargo) = 'COORDENADOR'
        )
    );

-- Qualquer usuário autenticado pode atualizar seu próprio registro (para e-mail / primeiro_acesso)
CREATE POLICY "Perfis: usuario atualiza proprio perfil"
    ON public.perfis
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());