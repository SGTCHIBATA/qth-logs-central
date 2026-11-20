-- 1. Função auxiliar com SECURITY DEFINER para ler o cargo sem acionar recursão no RLS
CREATE OR REPLACE FUNCTION public.meu_cargo()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT UPPER(COALESCE(cargo, ''))
    FROM public.perfis
    WHERE id = auth.uid()
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.meu_cargo() TO authenticated;

-- 2. Remove políticas anteriores que causavam recursão
DROP POLICY IF EXISTS "Perfis: gestores gerenciam todos" ON public.perfis;
DROP POLICY IF EXISTS "Perfis: coordenadores gerenciam nao gestores" ON public.perfis;
DROP POLICY IF EXISTS "Perfis: usuario atualiza proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Perfis: usuario le proprio perfil" ON public.perfis;
DROP POLICY IF EXISTS "Perfis: gestores e coordenadores leem todos" ON public.perfis;

-- 3. Recria políticas sem recursão, mantendo a hierarquia (GESTOR > COORDENADOR > Próprio)

-- Todo usuário autenticado pode ler o próprio perfil
CREATE POLICY "Perfis: usuario le proprio perfil"
    ON public.perfis
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Todo usuário autenticado pode atualizar o próprio perfil (e-mail / primeiro_acesso)
CREATE POLICY "Perfis: usuario atualiza proprio perfil"
    ON public.perfis
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- GESTOR e COORDENADOR podem visualizar todos os perfis (para listar no Painel Gestor)
CREATE POLICY "Perfis: gestores e coordenadores leem todos"
    ON public.perfis
    FOR SELECT
    TO authenticated
    USING (public.meu_cargo() IN ('GESTOR', 'COORDENADOR'));

-- GESTOR tem controle total (INSERT, UPDATE, DELETE) sobre qualquer perfil
CREATE POLICY "Perfis: gestores gerenciam todos"
    ON public.perfis
    FOR ALL
    TO authenticated
    USING (public.meu_cargo() = 'GESTOR')
    WITH CHECK (public.meu_cargo() = 'GESTOR');

-- COORDENADOR pode criar, editar e excluir apenas perfis que NÃO sejam GESTOR
CREATE POLICY "Perfis: coordenadores gerenciam nao gestores"
    ON public.perfis
    FOR ALL
    TO authenticated
    USING (
        public.meu_cargo() = 'COORDENADOR'
        AND UPPER(COALESCE(cargo, '')) <> 'GESTOR'
    )
    WITH CHECK (
        public.meu_cargo() = 'COORDENADOR'
        AND UPPER(COALESCE(cargo, '')) <> 'GESTOR'
    );