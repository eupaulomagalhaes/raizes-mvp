-- RESET COMPLETO DO BANCO
-- Execute isso para dropar TODAS as tabelas e começar do zero

DROP TABLE IF EXISTS sessoes_profissionais CASCADE;
DROP TABLE IF EXISTS marcos_crianca CASCADE;
DROP TABLE IF EXISTS marcos_desenvolvimento CASCADE;
DROP TABLE IF EXISTS observacoes_atividades CASCADE;
DROP TABLE IF EXISTS relatorios_desenvolvimento CASCADE;
DROP TABLE IF EXISTS eventos_jogo CASCADE;
DROP TABLE IF EXISTS sessoes_jogo CASCADE;
DROP TABLE IF EXISTS jogos CASCADE;
DROP TABLE IF EXISTS criancas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Depois de executar isso:
-- 1. Execute legacy/supabase_migration.sql (cria tabelas com UUID)
-- 2. Execute migrations/002_relatorios_progresso.sql (versão UUID)
