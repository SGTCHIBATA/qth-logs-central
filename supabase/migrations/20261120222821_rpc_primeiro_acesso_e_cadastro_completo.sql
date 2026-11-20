CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DROP FUNCTION IF EXISTS public.criar_usuario_equipe(TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.criar_usuario_equipe(
    p_nome_completo TEXT,
    p_cargo TEXT,
    p_base TEXT,
    p_municipio_lotacao TEXT,
    p_matricula TEXT,
    p_cpf TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_funcao_vtr TEXT DEFAULT NULL,
    p_viatura_atual_id UUID DEFAULT NULL,
    p_ativo BOOLEAN DEFAULT true
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
    v_cpf TEXT := NULLIF(REGEXP_REPLACE(COALESCE(p_cpf, ''), '\D', '', 'g'), '');
    v_email_informado TEXT := NULLIF(LOWER(TRIM(COALESCE(p_email, ''))), '');
    v_funcao_vtr TEXT := NULLIF(UPPER(TRIM(COALESCE(p_funcao_vtr, ''))), '');
    v_email TEXT;
    v_senha_inicial TEXT;
    v_novo_id UUID := gen_random_uuid();
    v_instance_id UUID;
BEGIN
    SELECT UPPER(COALESCE(cargo, '')) INTO v_cargo_solicitante
    FROM public.perfis
    WHERE id = auth.uid() AND COALESCE(ativo, true) = true;

    IF v_cargo_solicitante NOT IN ('GESTOR', 'COORDENADOR') THEN
        RAISE EXCEPTION 'Acesso negado: apenas GESTOR ou COORDENADOR pode criar usuários.';
    END IF;

    IF v_cargo_solicitante = 'COORDENADOR' AND v_cargo = 'GESTOR' THEN
        RAISE EXCEPTION 'Acesso negado: COORDENADOR não pode criar usuário com cargo GESTOR.';
    END IF;

    IF v_nome = '' OR v_cargo = '' OR v_base = '' OR v_municipio = '' OR v_matricula = '' THEN
        RAISE EXCEPTION 'Preencha todos os campos obrigatórios (*).';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.perfis
        WHERE UPPER(TRIM(COALESCE(matricula, ''))) = v_matricula
    ) THEN
        RAISE EXCEPTION 'Já existe um integrante cadastrado com a matrícula %.', v_matricula;
    END IF;

    IF v_cpf IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.perfis
        WHERE REGEXP_REPLACE(COALESCE(cpf, ''), '\D', '', 'g') = v_cpf
    ) THEN
        RAISE EXCEPTION 'Já existe um integrante cadastrado com este CPF.';
    END IF;

    IF v_email_informado IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_email_informado) THEN
            RAISE EXCEPTION 'Já existe uma conta cadastrada com o e-mail %.', v_email_informado;
        END IF;
        v_email := v_email_informado;
    ELSE
        v_email := LOWER(REGEXP_REPLACE(v_matricula, '[^a-zA-Z0-9]', '', 'g')) || '@qthlogs.com.br';
        IF v_email = '@qthlogs.com.br' THEN
            v_email := REPLACE(v_novo_id::TEXT, '-', '') || '@qthlogs.com.br';
        END IF;
        IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_email) THEN
            v_email := LOWER(REGEXP_REPLACE(v_matricula, '[^a-zA-Z0-9]', '', 'g')) || '_' || SUBSTR(REPLACE(v_novo_id::TEXT, '-', ''), 1, 4) || '@qthlogs.com.br';
        END IF;
    END IF;

    v_senha_inicial := '@' || v_matricula;

    SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
    v_instance_id := COALESCE(v_instance_id, '00000000-0000-0000-0000-000000000000'::UUID);

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

    INSERT INTO public.perfis (
        id,
        nome_completo,
        cpf,
        matricula,
        cargo,
        funcao_vtr,
        base,
        municipio_lotacao,
        viatura_atual_id,
        email,
        ativo,
        primeiro_acesso
    ) VALUES (
        v_novo_id,
        v_nome,
        v_cpf,
        v_matricula,
        v_cargo,
        v_funcao_vtr,
        v_base,
        v_municipio,
        p_viatura_atual_id,
        v_email,
        COALESCE(p_ativo, true),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_completo = EXCLUDED.nome_completo,
        cpf = EXCLUDED.cpf,
        matricula = EXCLUDED.matricula,
        cargo = EXCLUDED.cargo,
        funcao_vtr = EXCLUDED.funcao_vtr,
        base = EXCLUDED.base,
        municipio_lotacao = EXCLUDED.municipio_lotacao,
        viatura_atual_id = EXCLUDED.viatura_atual_id,
        email = EXCLUDED.email,
        ativo = EXCLUDED.ativo,
        primeiro_acesso = true;

    RETURN v_novo_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_usuario_equipe(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.concluir_primeiro_acesso(
    p_email TEXT,
    p_nova_senha TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_email TEXT := LOWER(TRIM(COALESCE(p_email, '')));
    v_matricula TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF v_email = '' OR POSITION('@' IN v_email) <= 1 THEN
        RAISE EXCEPTION 'Informe um endereço de e-mail válido.';
    END IF;

    IF LENGTH(COALESCE(p_nova_senha, '')) < 6 THEN
        RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
    END IF;

    SELECT UPPER(TRIM(COALESCE(matricula, ''))) INTO v_matricula
    FROM public.perfis
    WHERE id = v_user_id;

    IF v_matricula <> '' AND (
        UPPER(p_nova_senha) = v_matricula
        OR UPPER(p_nova_senha) = '@' || v_matricula
    ) THEN
        RAISE EXCEPTION 'A nova senha não pode ser igual à sua senha inicial.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE LOWER(email) = v_email AND id <> v_user_id
    ) THEN
        RAISE EXCEPTION 'Este e-mail já está em uso por outro usuário.';
    END IF;

    UPDATE auth.users
    SET
        email = v_email,
        encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_user_id;

    UPDATE auth.identities
    SET
        identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
        updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';

    UPDATE public.perfis
    SET
        email = v_email,
        primeiro_acesso = false
    WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.concluir_primeiro_acesso(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.atualizar_meu_email(
    p_novo_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_email TEXT := LOWER(TRIM(COALESCE(p_novo_email, '')));
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF v_email = '' OR POSITION('@' IN v_email) <= 1 THEN
        RAISE EXCEPTION 'Informe um endereço de e-mail válido.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE LOWER(email) = v_email AND id <> v_user_id
    ) THEN
        RAISE EXCEPTION 'Este e-mail já está em uso por outro usuário.';
    END IF;

    UPDATE auth.users
    SET
        email = v_email,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_user_id;

    UPDATE auth.identities
    SET
        identity_data = jsonb_set(COALESCE(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_email)),
        updated_at = now()
    WHERE user_id = v_user_id AND provider = 'email';

    UPDATE public.perfis
    SET email = v_email
    WHERE id = v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atualizar_meu_email(TEXT) TO authenticated;