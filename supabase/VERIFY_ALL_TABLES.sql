-- Verificar estrutura de TODAS as tabelas importantes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('usuarios', 'criancas', 'jogos', 'sessoes_jogo', 'eventos_jogo')
AND column_name LIKE '%id%'
ORDER BY table_name, ordinal_position;
