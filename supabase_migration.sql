-- ============================================
-- RAÍZES EDUCACIONAL - SCHEMA COMPLETO
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela de usuários (responsáveis)
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    parentesco VARCHAR(50),
    escolaridade VARCHAR(100),
    profissao VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    celular VARCHAR(20),
    cidade_estado VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de crianças
CREATE TABLE IF NOT EXISTS criancas (
    id_crianca UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_responsavel UUID NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    sexo VARCHAR(10),
    estuda BOOLEAN DEFAULT false,
    tipo_escola VARCHAR(100),
    terapia BOOLEAN DEFAULT false,
    tipos_terapia TEXT[],
    outras_terapias TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de jogos disponíveis
CREATE TABLE IF NOT EXISTS jogos (
    id_jogo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    slug VARCHAR(100) UNIQUE NOT NULL,
    habilitado BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões de jogo
CREATE TABLE IF NOT EXISTS sessoes_jogo (
    id_sessao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    id_jogo UUID REFERENCES jogos(id_jogo),
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    finalizada BOOLEAN DEFAULT false,
    pontos INTEGER DEFAULT 0,
    acertos INTEGER DEFAULT 0,
    tentativas INTEGER DEFAULT 0,
    duracao_segundos INTEGER
);

-- Tabela de eventos durante as sessões
CREATE TABLE IF NOT EXISTS eventos_jogo (
    id_evento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_sessao UUID NOT NULL REFERENCES sessoes_jogo(id_sessao) ON DELETE CASCADE,
    tipo_evento VARCHAR(50) NOT NULL,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    dados_adicionais JSONB
);

-- Inserir jogos iniciais
INSERT INTO jogos (nome, descricao, slug, habilitado) VALUES
('Onde está o brinquedo!', 'Memória visual com grid adaptativo', 'onde-esta-o-brinquedo', true),
('Jogo #2', 'Em breve', 'em-breve-2', false),
('Jogo #3', 'Em breve', 'em-breve-3', false),
('Jogo #4', 'Em breve', 'em-breve-4', false)
ON CONFLICT (slug) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE criancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_jogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_jogo ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para usuários
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON usuarios;
CREATE POLICY "Usuários podem ver seus próprios dados" ON usuarios
    FOR SELECT USING (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON usuarios;
CREATE POLICY "Usuários podem inserir seus próprios dados" ON usuarios
    FOR INSERT WITH CHECK (auth.uid() = id_usuario);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON usuarios;
CREATE POLICY "Usuários podem atualizar seus próprios dados" ON usuarios
    FOR UPDATE USING (auth.uid() = id_usuario);

-- Políticas para crianças
DROP POLICY IF EXISTS "Responsáveis podem ver suas crianças" ON criancas;
CREATE POLICY "Responsáveis podem ver suas crianças" ON criancas
    FOR SELECT USING (auth.uid() = id_responsavel);

DROP POLICY IF EXISTS "Responsáveis podem inserir suas crianças" ON criancas;
CREATE POLICY "Responsáveis podem inserir suas crianças" ON criancas
    FOR INSERT WITH CHECK (auth.uid() = id_responsavel);

DROP POLICY IF EXISTS "Responsáveis podem atualizar suas crianças" ON criancas;
CREATE POLICY "Responsáveis podem atualizar suas crianças" ON criancas
    FOR UPDATE USING (auth.uid() = id_responsavel);

DROP POLICY IF EXISTS "Responsáveis podem deletar suas crianças" ON criancas;
CREATE POLICY "Responsáveis podem deletar suas crianças" ON criancas
    FOR DELETE USING (auth.uid() = id_responsavel);

-- Políticas para sessões (através das crianças)
DROP POLICY IF EXISTS "Responsáveis podem ver sessões de suas crianças" ON sessoes_jogo;
CREATE POLICY "Responsáveis podem ver sessões de suas crianças" ON sessoes_jogo
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM criancas WHERE id_crianca = sessoes_jogo.id_crianca AND id_responsavel = auth.uid())
        OR id_crianca IS NULL
    );

DROP POLICY IF EXISTS "Responsáveis podem inserir sessões de suas crianças" ON sessoes_jogo;
CREATE POLICY "Responsáveis podem inserir sessões de suas crianças" ON sessoes_jogo
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM criancas WHERE id_crianca = sessoes_jogo.id_crianca AND id_responsavel = auth.uid())
        OR id_crianca IS NULL
    );

DROP POLICY IF EXISTS "Responsáveis podem atualizar sessões de suas crianças" ON sessoes_jogo;
CREATE POLICY "Responsáveis podem atualizar sessões de suas crianças" ON sessoes_jogo
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM criancas WHERE id_crianca = sessoes_jogo.id_crianca AND id_responsavel = auth.uid())
        OR id_crianca IS NULL
    );

-- Políticas para eventos (através das sessões)
DROP POLICY IF EXISTS "Responsáveis podem ver eventos das sessões de suas crianças" ON eventos_jogo;
CREATE POLICY "Responsáveis podem ver eventos das sessões de suas crianças" ON eventos_jogo
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessoes_jogo sj 
            LEFT JOIN criancas c ON sj.id_crianca = c.id_crianca 
            WHERE sj.id_sessao = eventos_jogo.id_sessao 
            AND (c.id_responsavel = auth.uid() OR sj.id_crianca IS NULL)
        )
    );

DROP POLICY IF EXISTS "Responsáveis podem inserir eventos das sessões de suas crianças" ON eventos_jogo;
CREATE POLICY "Responsáveis podem inserir eventos das sessões de suas crianças" ON eventos_jogo
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessoes_jogo sj 
            LEFT JOIN criancas c ON sj.id_crianca = c.id_crianca 
            WHERE sj.id_sessao = eventos_jogo.id_sessao 
            AND (c.id_responsavel = auth.uid() OR sj.id_crianca IS NULL)
        )
    );

-- Políticas para jogos (leitura pública)
DROP POLICY IF EXISTS "Todos podem ver jogos" ON jogos;
CREATE POLICY "Todos podem ver jogos" ON jogos
    FOR SELECT USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_criancas_responsavel ON criancas(id_responsavel);
CREATE INDEX IF NOT EXISTS idx_sessoes_crianca ON sessoes_jogo(id_crianca);
CREATE INDEX IF NOT EXISTS idx_sessoes_jogo ON sessoes_jogo(id_jogo);
CREATE INDEX IF NOT EXISTS idx_eventos_sessao ON eventos_jogo(id_sessao);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ============================================
-- FIM DA MIGRATION
-- ============================================
