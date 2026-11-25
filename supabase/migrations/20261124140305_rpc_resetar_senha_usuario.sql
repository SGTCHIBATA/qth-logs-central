CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.resetar_senha_usuario(
    p_usuario_id UUID,
    p_nova_senha TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_solicitante_id UUID := auth.uid();
    v_cargo_solicitante TEXT;
    v_cargo_alvo TEXT;
BEGIN
    IF v_solicitante_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    SELECT UPPER(TRIM(COALESCE(cargo, ''))) INTO v_cargo_solicitante
    FROM public.perfis
    WHERE id = v_solicitante_id AND COALESCE(ativo, true) = true;

    IF v_cargo_solicitante NOT IN ('GESTOR', 'COORDENADOR') THEN
        RAISE EXCEPTION 'Acesso negado: apenas GESTOR ou COORDENADOR pode resetar senhas.';
    END IF;

    IF p_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuário alvo inválido.';
    END IF;

    SELECT UPPER(TRIM(COALESCE(cargo, ''))) INTO v_cargo_alvo
    FROM public.perfis
    WHERE id = p_usuario_id;

    IF v_cargo_alvo IS NULL THEN
        RAISE EXCEPTION 'Usuário alvo não encontrado.';
    END IF;

    IF v_cargo_solicitante = 'COORDENADOR' AND v_cargo_alvo IN ('GESTOR', 'COORDENADOR') THEN
        RAISE EXCEPTION 'Acesso negado: COORDENADOR não pode resetar senha de GESTOR ou de outro COORDENADOR.';
    END IF;

    IF LENGTH(COALESCE(p_nova_senha, '')) < 6 THEN
        RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
    END IF;

    UPDATE auth.users
    SET
        encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
        updated_at = now()
    WHERE id = p_usuario_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conta de autenticação não encontrada para este usuário.';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resetar_senha_usuario(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';