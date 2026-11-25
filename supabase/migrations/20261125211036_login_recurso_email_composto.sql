CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Adiciona coluna email_login na tabela viatura_credenciais caso ainda não exista
ALTER TABLE public.viatura_credenciais
  ADD COLUMN IF NOT EXISTS email_login text;

CREATE UNIQUE INDEX IF NOT EXISTS viatura_credenciais_email_login_uk
  ON public.viatura_credenciais (upper(trim(email_login)))
  WHERE email_login IS NOT NULL AND trim(email_login) <> '';

-- Atualiza registros existentes com o padrão <PREFIXO_SEM_ESPACO><SIGLA><UF>@QTHLOGS.LOCAL
UPDATE public.viatura_credenciais vc
   SET email_login = vc.prefixo_normalizado || upper(trim(i.sigla)) || upper(trim(i.uf)) || '@QTHLOGS.LOCAL'
  FROM public.instituicoes i
 WHERE vc.instituicao_id = i.id
   AND (vc.email_login IS NULL OR trim(vc.email_login) = '');

DROP FUNCTION IF EXISTS public.upsert_credencial_viatura(uuid, uuid, text, text);
-- 1. RPC para criar/atualizar credencial da viatura gerando o e-mail composto
CREATE OR REPLACE FUNCTION public.upsert_credencial_viatura(
  p_instituicao_id uuid,
  p_viatura_id uuid,
  p_prefixo text,
  p_senha text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_prefixo_limpo text := upper(trim(coalesce(p_prefixo, '')));
  v_prefixo_norm text := regexp_replace(upper(trim(coalesce(p_prefixo, ''))), '\s+', '', 'g');
  v_sigla text;
  v_uf text;
  v_email_composto text;
  v_id uuid;
BEGIN
  IF p_instituicao_id IS NULL THEN
    RAISE EXCEPTION 'Selecione uma instituição vinculada para gerar o acesso da viatura.';
  END IF;

  IF v_prefixo_norm = '' THEN
    RAISE EXCEPTION 'Prefixo da viatura inválido.';
  END IF;

  IF length(trim(coalesce(p_senha, ''))) < 6 THEN
    RAISE EXCEPTION 'A senha do recurso deve ter no mínimo 6 caracteres.';
  END IF;

  SELECT upper(trim(sigla)), upper(trim(uf))
    INTO v_sigla, v_uf
    FROM public.instituicoes
   WHERE id = p_instituicao_id;

  IF v_sigla IS NULL OR v_sigla = '' OR v_uf IS NULL OR v_uf = '' THEN
    RAISE EXCEPTION 'A instituição vinculada precisa ter Sigla e UF preenchidas.';
  END IF;

  v_email_composto := v_prefixo_norm || v_sigla || v_uf || '@QTHLOGS.LOCAL';

  INSERT INTO public.viatura_credenciais (
    instituicao_id,
    viatura_id,
    prefixo_exibicao,
    prefixo_normalizado,
    email_login,
    senha_hash,
    ativo,
    atualizado_em
  )
  VALUES (
    p_instituicao_id,
    p_viatura_id,
    v_prefixo_limpo,
    v_prefixo_norm,
    v_email_composto,
    crypt(trim(p_senha), gen_salt('bf')),
    true,
    now()
  )
  ON CONFLICT (instituicao_id, prefixo_normalizado)
  DO UPDATE SET
    viatura_id = COALESCE(EXCLUDED.viatura_id, public.viatura_credenciais.viatura_id),
    prefixo_exibicao = EXCLUDED.prefixo_exibicao,
    email_login = EXCLUDED.email_login,
    senha_hash = EXCLUDED.senha_hash,
    ativo = true,
    atualizado_em = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'id', v_id,
    'email_login', v_email_composto,
    'prefixo', v_prefixo_limpo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_credencial_viatura(uuid, uuid, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.alterar_senha_viatura(uuid, uuid, text, text);
-- 2. RPC para coordenador/gestor alterar ou restaurar senha da viatura
CREATE OR REPLACE FUNCTION public.alterar_senha_viatura(
  p_instituicao_id uuid,
  p_viatura_id uuid,
  p_prefixo text,
  p_nova_senha text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_prefixo_limpo text := upper(trim(coalesce(p_prefixo, '')));
  v_prefixo_norm text := regexp_replace(upper(trim(coalesce(p_prefixo, ''))), '\s+', '', 'g');
  v_sigla text;
  v_uf text;
  v_email_composto text;
BEGIN
  IF length(trim(coalesce(p_nova_senha, ''))) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
  END IF;

  IF p_instituicao_id IS NOT NULL THEN
    SELECT upper(trim(sigla)), upper(trim(uf))
      INTO v_sigla, v_uf
      FROM public.instituicoes
     WHERE id = p_instituicao_id;
    IF v_sigla IS NOT NULL AND v_uf IS NOT NULL THEN
      v_email_composto := v_prefixo_norm || v_sigla || v_uf || '@QTHLOGS.LOCAL';
    END IF;
  END IF;

  UPDATE public.viatura_credenciais
     SET senha_hash = crypt(trim(p_nova_senha), gen_salt('bf')),
         viatura_id = COALESCE(p_viatura_id, viatura_id),
         prefixo_exibicao = CASE WHEN v_prefixo_limpo <> '' THEN v_prefixo_limpo ELSE prefixo_exibicao END,
         email_login = COALESCE(v_email_composto, email_login),
         ativo = true,
         atualizado_em = now()
   WHERE (p_viatura_id IS NOT NULL AND viatura_id = p_viatura_id)
      OR (p_instituicao_id IS NOT NULL AND instituicao_id = p_instituicao_id AND prefixo_normalizado = v_prefixo_norm);

  IF NOT FOUND THEN
    IF p_instituicao_id IS NULL OR v_email_composto IS NULL THEN
      RAISE EXCEPTION 'Viatura sem instituição vinculada (com Sigla e UF) para criar credencial.';
    END IF;

    INSERT INTO public.viatura_credenciais (
      instituicao_id,
      viatura_id,
      prefixo_exibicao,
      prefixo_normalizado,
      email_login,
      senha_hash,
      ativo
    )
    VALUES (
      p_instituicao_id,
      p_viatura_id,
      v_prefixo_limpo,
      v_prefixo_norm,
      v_email_composto,
      crypt(trim(p_nova_senha), gen_salt('bf')),
      true
    );
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.alterar_senha_viatura(uuid, uuid, text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.autenticar_viatura_por_email(text, text);
-- 3. RPC de autenticação direta pelo e-mail composto <PREFIXO><SIGLA><UF>@QTHLOGS.LOCAL
CREATE OR REPLACE FUNCTION public.autenticar_viatura_por_email(
  p_email text,
  p_senha text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_login text := upper(trim(coalesce(p_email, '')));
  v_cred record;
BEGIN
  IF v_login = '' OR coalesce(p_senha, '') = '' THEN
    RAISE EXCEPTION 'Informe o e-mail do recurso e a senha.';
  END IF;

  IF position('@' in v_login) = 0 THEN
    v_login := regexp_replace(v_login, '\s+', '', 'g') || '@QTHLOGS.LOCAL';
  END IF;

  SELECT
    c.id AS credencial_id,
    c.instituicao_id,
    coalesce(c.viatura_id, v.id) AS viatura_id,
    coalesce(v.prefixo, c.prefixo_exibicao) AS prefixo,
    c.email_login,
    c.senha_hash,
    i.sigla AS instituicao_sigla,
    i.nome AS instituicao_nome,
    i.uf AS instituicao_uf
    INTO v_cred
    FROM public.viatura_credenciais c
    JOIN public.instituicoes i ON i.id = c.instituicao_id
    LEFT JOIN public.viaturas v
      ON v.id = c.viatura_id
      OR (v.instituicao_id = c.instituicao_id AND regexp_replace(upper(trim(v.prefixo)), '\s+', '', 'g') = c.prefixo_normalizado)
   WHERE (
       upper(trim(coalesce(c.email_login, ''))) = v_login
       OR (c.prefixo_normalizado || upper(trim(i.sigla)) || upper(trim(i.uf)) || '@QTHLOGS.LOCAL') = v_login
     )
     AND c.ativo = true
     AND coalesce(i.ativa, true) = true
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurso ''%'' não encontrado ou inativo.', v_login;
  END IF;

  IF v_cred.senha_hash <> crypt(p_senha, v_cred.senha_hash) THEN
    RAISE EXCEPTION 'Senha do recurso incorreta.';
  END IF;

  RETURN jsonb_build_object(
    'credencial_id', v_cred.credencial_id,
    'instituicao_id', v_cred.instituicao_id,
    'instituicao_sigla', upper(trim(v_cred.instituicao_sigla)),
    'instituicao_nome', upper(trim(v_cred.instituicao_nome)),
    'viatura_id', coalesce(v_cred.viatura_id::text, ''),
    'prefixo', upper(trim(v_cred.prefixo)),
    'email_login', upper(trim(coalesce(v_cred.email_login, v_login))),
    'cargo', 'CONDUTOR'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.autenticar_viatura_por_email(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';