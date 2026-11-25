CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela dedicada de credenciais operacionais das viaturas/recursos
CREATE TABLE IF NOT EXISTS public.viatura_credenciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id) ON DELETE CASCADE,
  viatura_id uuid REFERENCES public.viaturas(id) ON DELETE CASCADE,
  prefixo_exibicao text NOT NULL,
  prefixo_normalizado text NOT NULL,
  senha_hash text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT viatura_credenciais_inst_prefixo_uk UNIQUE (instituicao_id, prefixo_normalizado)
);

ALTER TABLE public.viatura_credenciais ENABLE ROW LEVEL SECURITY;

-- Bloqueia acesso direto via PostgREST; acesso apenas pelas RPCs SECURITY DEFINER
DROP POLICY IF EXISTS "Bloquear acesso direto viatura_credenciais" ON public.viatura_credenciais;
CREATE POLICY "Bloquear acesso direto viatura_credenciais"
  ON public.viatura_credenciais
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 2. RPC para criar/atualizar credencial da viatura no cadastro da frota
CREATE OR REPLACE FUNCTION public.upsert_credencial_viatura(
  p_instituicao_id uuid,
  p_viatura_id uuid,
  p_prefixo text,
  p_senha text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$ DECLARE v_prefixo_limpo text := upper(trim(coalesce(p_prefixo, ''))); v_prefixo_norm text := regexp_replace(upper(trim(coalesce(p_prefixo, ''))), '\s+', '', 'g'); v_id uuid; BEGIN IF p_instituicao_id IS NULL THEN RAISE EXCEPTION 'Selecione uma instituição vinculada para gerar o acesso da viatura.'; END IF;    IF v_prefixo_norm = '' THEN RAISE EXCEPTION 'Prefixo da viatura inválido.'; END IF;    IF length(trim(coalesce(p_senha, ''))) < 6 THEN RAISE EXCEPTION 'A senha do recurso deve ter no mínimo 6 caracteres.'; END IF;    INSERT INTO public.viatura_credenciais ( instituicao_id, viatura_id, prefixo_exibicao, prefixo_normalizado, senha_hash, ativo, atualizado_em ) VALUES ( p_instituicao_id, p_viatura_id, v_prefixo_limpo, v_prefixo_norm, crypt(trim(p_senha), gen_salt('bf')), true, now() ) ON CONFLICT (instituicao_id, prefixo_normalizado) DO UPDATE SET viatura_id = COALESCE(EXCLUDED.viatura_id, public.viatura_credenciais.viatura_id), prefixo_exibicao = EXCLUDED.prefixo_exibicao, senha_hash = EXCLUDED.senha_hash, ativo = true, atualizado_em = now() RETURNING id INTO v_id;    RETURN v_id; END; $$;

GRANT EXECUTE ON FUNCTION public.upsert_credencial_viatura(uuid, uuid, text, text) TO authenticated;

-- 3. RPC para coordenador/gestor alterar ou restaurar senha da viatura
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
AS $$ DECLARE v_prefixo_limpo text := upper(trim(coalesce(p_prefixo, ''))); v_prefixo_norm text := regexp_replace(upper(trim(coalesce(p_prefixo, ''))), '\s+', '', 'g'); BEGIN IF length(trim(coalesce(p_nova_senha, ''))) < 6 THEN RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.'; END IF;    UPDATE public.viatura_credenciais SET senha_hash = crypt(trim(p_nova_senha), gen_salt('bf')), viatura_id = COALESCE(p_viatura_id, viatura_id), prefixo_exibicao = CASE WHEN v_prefixo_limpo <> '' THEN v_prefixo_limpo ELSE prefixo_exibicao END, ativo = true, atualizado_em = now() WHERE (p_viatura_id IS NOT NULL AND viatura_id = p_viatura_id) OR (p_instituicao_id IS NOT NULL AND instituicao_id = p_instituicao_id AND prefixo_normalizado = v_prefixo_norm);    IF NOT FOUND THEN IF p_instituicao_id IS NULL THEN RAISE EXCEPTION 'Viatura sem instituição vinculada para criar credencial.'; END IF;      INSERT INTO public.viatura_credenciais ( instituicao_id, viatura_id, prefixo_exibicao, prefixo_normalizado, senha_hash, ativo ) VALUES ( p_instituicao_id, p_viatura_id, v_prefixo_limpo, v_prefixo_norm, crypt(trim(p_nova_senha), gen_salt('bf')), true ); END IF;    RETURN true; END; $$;

GRANT EXECUTE ON FUNCTION public.alterar_senha_viatura(uuid, uuid, text, text) TO authenticated;

-- 4. RPC de autenticação exclusiva da viatura cruzando Sigla + UF + Prefixo + Senha
CREATE OR REPLACE FUNCTION public.autenticar_viatura_institucional(
  p_sigla text,
  p_uf text,
  p_prefixo text,
  p_senha text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$ DECLARE v_sigla text := upper(trim(coalesce(p_sigla, ''))); v_uf text := upper(trim(coalesce(p_uf, ''))); v_prefixo_norm text := regexp_replace(upper(trim(coalesce(p_prefixo, ''))), '\s+', '', 'g'); v_inst record; v_cred record; BEGIN IF v_sigla = '' OR v_uf = '' OR v_prefixo_norm = '' OR coalesce(p_senha, '') = '' THEN RAISE EXCEPTION 'Preencha Sigla, UF, Recurso e Senha.'; END IF;    SELECT id, nome, sigla, uf INTO v_inst FROM public.instituicoes WHERE upper(trim(sigla)) = v_sigla AND upper(trim(uf)) = v_uf AND coalesce(ativa, true) = true LIMIT 1;    IF NOT FOUND THEN RAISE EXCEPTION 'Instituição ''\%'' (\%) não encontrada ou inativa.', v_sigla, v_uf; END IF;    SELECT c.id AS credencial_id, c.instituicao_id, coalesce(c.viatura_id, v.id) AS viatura_id, coalesce(v.prefixo, c.prefixo_exibicao) AS prefixo, c.senha_hash INTO v_cred FROM public.viatura_credenciais c LEFT JOIN public.viaturas v ON v.id = c.viatura_id OR (v.instituicao_id = c.instituicao_id AND regexp_replace(upper(trim(v.prefixo)), '\s+', '', 'g') = c.prefixo_normalizado) WHERE c.instituicao_id = v_inst.id AND c.prefixo_normalizado = v_prefixo_norm AND c.ativo = true LIMIT 1;    IF NOT FOUND THEN RAISE EXCEPTION 'Recurso ''\%'' não cadastrado ou inativo na instituição \%.', upper(trim(p_prefixo)), v_sigla; END IF;    IF v_cred.senha_hash <> crypt(p_senha, v_cred.senha_hash) THEN RAISE EXCEPTION 'Senha do recurso incorreta.'; END IF;    RETURN jsonb_build_object( 'credencial_id', v_cred.credencial_id, 'instituicao_id', v_inst.id, 'instituicao_sigla', upper(trim(v_inst.sigla)), 'instituicao_nome', upper(trim(v_inst.nome)), 'viatura_id', coalesce(v_cred.viatura_id::text, ''), 'prefixo', upper(trim(v_cred.prefixo)), 'cargo', 'CONDUTOR' ); END; $$;

GRANT EXECUTE ON FUNCTION public.autenticar_viatura_institucional(text, text, text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';