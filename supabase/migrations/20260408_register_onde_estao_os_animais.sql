-- Registrar novo jogo "Onde estão os animais" na tabela jogos
INSERT INTO jogos (slug, nome, descricao, habilitado)
VALUES (
  'onde-estao-os-animais',
  'Onde estão os animais?',
  'Jogo de memória visual onde a criança observa animais na floresta e depois precisa encontrá-los escondidos nos elementos do cenário.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  habilitado = EXCLUDED.habilitado;
