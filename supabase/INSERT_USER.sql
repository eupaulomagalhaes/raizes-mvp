-- Inserir usuário autenticado na tabela usuarios
-- Substitua '1651629a-d423-41a6-a042-4af1992d13a0' pelo seu UUID (veja no erro)
INSERT INTO usuarios (id_usuario, nome_completo, email)
VALUES (
    '1651629a-d423-41a6-a042-4af1992d13a0',
    'Usuário Teste',
    'seu-email@exemplo.com'
)
ON CONFLICT (id_usuario) DO NOTHING;

-- OU criar trigger automático (melhor solução):
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id_usuario, nome_completo, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  )
  ON CONFLICT (id_usuario) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa quando novo usuário é criado no Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
