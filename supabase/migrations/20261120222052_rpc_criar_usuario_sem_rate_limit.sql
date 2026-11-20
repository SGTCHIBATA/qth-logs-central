-- Garante extensão pgcrypto para gerar hash bcrypt compatível com Supabase Auth
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Função segura para criação ilimitada de usuários pela equipe (sem limite de envio de e-mail)
CREATE OR REPLACE FUNCTION public.criar_usuario_equipe(
    p_nome_completo TEXT,
    p_cargo TEXT,
    p_base TEXT,
    p_municipio_lotacao TEXT,
    p_matricula TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_cargo_solicitante TEXT;
    v_nome TEXT := UPPER(TRIM(COALESCE(p_nome_completo, '')));
    v_cargo TEXT := UPPER(TRIM(COALESCE(p_cargo, '')));
    v_base TEXT := UPPER(TRIM(COALESCE(p_base, '')));
    v_municipio TEXT := UPPER(TRIM(COALESCE(p_municipio_lotacao, '')));
    v_matricula TEXT := UPPER(TRIM(COALESCE(p_matricula, '')));
    v_email TEXT;
    v_senha_inicial TEXT;
    v_novo_id UUID := gen_random_uuid();
    v_instance_id UUID;
BEGIN
    -- 1. Valida hierarquia de quem está criando
    SELECT UPPER(COALESCE(cargo, '')) INTO v_cargo_solicitante
    FROM public.perfis
    WHERE id = auth.uid() AND COALESCE(ativo, true) = true;

    IF v_cargo_solicitante NOT IN ('GESTOR', 'COORDENADOR') THEN
        RAISE EXCEPTION 'Acesso negado: apenas GESTOR ou COORDENADOR pode criar usuários.';
    END IF;

    IF v_cargo_solicitante = 'COORDENADOR' AND v_cargo = 'GESTOR' THEN
        RAISE EXCEPTION 'Acesso negado: COORDENADOR não pode criar usuário com cargo GESTOR.';
    END IF;

    -- 2. Valida campos obrigatórios e duplicidade de matrícula
    IF v_nome = '' OR v_cargo = '' OR v_base = '' OR v_municipio = '' OR v_matricula = '' THEN
        RAISE EXCEPTION 'Todos os campos obrigatórios devem ser preenchidos.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.perfis
        WHERE UPPER(TRIM(COALESCE(matricula, ''))) = v_matricula
    ) THEN
        RAISE EXCEPTION 'Já existe um integrante cadastrado com a matrícula %.', v_matricula;
    END IF;

    -- 3. Monta e-mail provisório e senha inicial (@ + matrícula, mínimo 6 chars)
    v_email := LOWER(REGEXP_REPLACE(v_matricula, '[^a-zA-Z0-9]', '', 'g')) || '@qthlogs.com.br';
    IF v_email = '@qthlogs.com.br' THEN
        v_email := REPLACE(v_novo_id::TEXT, '-', '') || '@qthlogs.com.br';
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_email) THEN
        v_email := LOWER(REGEXP_REPLACE(v_matricula, '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTR(REPLACE(v_novo_id::TEXT, '-', ''), 1, 4) || '@qthlogs.com.br';
    END IF;

    v_senha_inicial := '@' || v_matricula;

    SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
    v_instance_id := COALESCE(v_instance_id, '00000000-0000-0000-0000-000000000000'::UUID);

    -- 4. Insere diretamente no auth.users sem disparar e-mail externo
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        v_instance_id,
        v_novo_id,
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_senha_inicial, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('nome_completo', v_nome),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- 5. Insere identidade vinculada para login por e-mail/senha no GoTrue
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_novo_id,
        v_novo_id::TEXT,
        jsonb_build_object('sub', v_novo_id::TEXT, 'email', v_email, 'email_verified', true),
        'email',
        now(),
        now(),
        now()
    );

    -- 6. Cria/atualiza o perfil operacional
    INSERT INTO public.perfis (
        id,
        nome_completo,
        matricula,
        cargo,
        base,
        municipio_lotacao,
        email,
        ativo,
        primeiro_acesso
    ) VALUES (
        v_novo_id,
        v_nome,
        v_matricula,
        v_cargo,
        v_base,
        v_municipio,
        v_email,
        true,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_completo = EXCLUDED.nome_completo,
        matricula = EXCLUDED.matricula,
        cargo = EXCLUDED.cargo,
        base = EXCLUDED.base,
        municipio_lotacao = EXCLUDED.municipio_lotacao,
        email = EXCLUDED.email,
        ativo = true,
        primeiro_acesso = true;

    RETURN v_novo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_usuario_equipe(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;