-- Registrar novo jogo "Onde estão os animais" na tabela jogos
INSERT INTO jogos (slug, titulo, descricao, categoria, faixa_etaria_min, faixa_etaria_max, nivel_dificuldade, ativo)
VALUES (
  'onde-estao-os-animais',
  'Onde estão os animais?',
  'Jogo de memória visual onde a criança observa animais na floresta e depois precisa encontrá-los escondidos nos elementos do cenário.',
  'cognitivo',
  60, -- 5 anos (60 meses)
  72, -- 6 anos (72 meses)
  2, -- nível médio
  true
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  faixa_etaria_min = EXCLUDED.faixa_etaria_min,
  faixa_etaria_max = EXCLUDED.faixa_etaria_max,
  nivel_dificuldade = EXCLUDED.nivel_dificuldade,
  ativo = EXCLUDED.ativo;
