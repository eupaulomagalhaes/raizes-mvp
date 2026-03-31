-- ============================================
-- RAÍZES EDUCACIONAL - SCHEMA DE RELATÓRIOS E PROGRESSO
-- Tabelas para acompanhamento de desenvolvimento infantil
-- ============================================

-- Tabela de relatórios mensais de desenvolvimento
CREATE TABLE IF NOT EXISTS relatorios_desenvolvimento (
    id_relatorio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
    ano_referencia INTEGER NOT NULL,
    
    -- Áreas de desenvolvimento (0-100 pontos)
    pontuacao_cognicao INTEGER DEFAULT 0 CHECK (pontuacao_cognicao BETWEEN 0 AND 100),
    pontuacao_motricidade INTEGER DEFAULT 0 CHECK (pontuacao_motricidade BETWEEN 0 AND 100),
    pontuacao_linguagem INTEGER DEFAULT 0 CHECK (pontuacao_linguagem BETWEEN 0 AND 100),
    pontuacao_socioemocional INTEGER DEFAULT 0 CHECK (pontuacao_socioemocional BETWEEN 0 AND 100),
    pontuacao_autorregulacao INTEGER DEFAULT 0 CHECK (pontuacao_autorregulacao BETWEEN 0 AND 100),
    
    -- Resumo geral
    pontuacao_total INTEGER DEFAULT 0 CHECK (pontuacao_total BETWEEN 0 AND 100),
    
    -- Observações e insights
    observacoes_gerais TEXT,
    pontos_fortes TEXT,
    areas_desenvolver TEXT,
    
    -- Alertas automáticos
    alerta_gerado BOOLEAN DEFAULT false,
    tipo_alerta VARCHAR(50), -- 'atencao', 'desenvolvimento', 'celebracao'
    
    -- Recomendações para pais
    recomendacoes_praticas TEXT,
    atividades_sugeridas TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(id_crianca, mes_referencia, ano_referencia)
);

-- Tabela de observações por atividade
CREATE TABLE IF NOT EXISTS observacoes_atividades (
    id_observacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    id_sessao UUID REFERENCES sessoes_jogo(id_sessao) ON DELETE SET NULL,
    
    -- Informações da atividade
    nome_atividade VARCHAR(255) NOT NULL,
    area_desenvolvimento VARCHAR(50) NOT NULL, -- 'cognicao', 'motricidade', 'linguagem', 'socioemocional', 'autorregulacao'
    idade_recomendada_meses INTEGER,
    
    -- Avaliação do cuidador (sistema de estrelas)
    avaliacao VARCHAR(20) NOT NULL CHECK (avaliacao IN ('fez', 'tentou', 'nao_fez')),
    pontos INTEGER NOT NULL CHECK (pontos IN (0, 1, 2)),
    
    -- Observações detalhadas
    observacao_livre TEXT,
    tempo_duracao_segundos INTEGER,
    necessitou_ajuda BOOLEAN DEFAULT false,
    tipo_ajuda TEXT,
    
    -- Contexto
    humor_crianca VARCHAR(50), -- 'animado', 'cansado', 'distraido', 'frustrado', 'colaborativo'
    momento_dia VARCHAR(50), -- 'manha', 'tarde', 'noite'
    
    -- Anexos (fotos/vídeos)
    urls_anexos TEXT[],
    
    data_observacao TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de marcos de desenvolvimento (checklist)
CREATE TABLE IF NOT EXISTS marcos_desenvolvimento (
    id_marco UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do marco
    codigo_marco VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    area_desenvolvimento VARCHAR(50) NOT NULL,
    
    -- Faixa etária esperada
    idade_minima_meses INTEGER NOT NULL,
    idade_maxima_meses INTEGER NOT NULL,
    
    -- Protocolo de referência
    protocolo_referencia VARCHAR(50), -- '0-12', '12-24', '24-36', '36-48', '48-60', '60-72'
    
    -- Indicador de complexidade
    nivel_dificuldade INTEGER DEFAULT 1 CHECK (nivel_dificuldade BETWEEN 1 AND 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de acompanhamento de marcos por criança
CREATE TABLE IF NOT EXISTS marcos_crianca (
    id_marco_crianca UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    id_marco UUID NOT NULL REFERENCES marcos_desenvolvimento(id_marco) ON DELETE CASCADE,
    
    -- Status do marco
    status VARCHAR(20) DEFAULT 'nao_avaliado' CHECK (status IN ('nao_avaliado', 'em_desenvolvimento', 'conquistado', 'nao_aplicavel')),
    
    -- Datas
    data_conquista DATE,
    data_primeira_tentativa DATE,
    
    -- Contexto
    idade_conquista_meses INTEGER,
    observacoes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(id_crianca, id_marco)
);

-- Tabela de sessões de terapia/acompanhamento profissional
CREATE TABLE IF NOT EXISTS sessoes_profissionais (
    id_sessao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    
    -- Profissional
    nome_profissional VARCHAR(255),
    tipo_profissional VARCHAR(100), -- 'fonoaudiologo', 'psicologo', 'terapeuta_ocupacional', 'pedagogo', 'neuropediatra'
    registro_profissional VARCHAR(100),
    
    -- Sessão
    data_sessao DATE NOT NULL,
    duracao_minutos INTEGER,
    
    -- Avaliações
    avaliacao_profissional TEXT,
    recomendacoes TEXT,
    exercicios_casa TEXT[],
    
    -- Integração com Raízes
    atividades_recomendadas TEXT[], -- IDs dos jogos/ativiades sugeridas
    
    anexos_urls TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_crianca ON relatorios_desenvolvimento(id_crianca);
CREATE INDEX IF NOT EXISTS idx_relatorios_periodo ON relatorios_desenvolvimento(ano_referencia, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_observacoes_crianca ON observacoes_atividades(id_crianca);
CREATE INDEX IF NOT EXISTS idx_observacoes_area ON observacoes_atividades(area_desenvolvimento);
CREATE INDEX IF NOT EXISTS idx_observacoes_data ON observacoes_atividades(data_observacao);
CREATE INDEX IF NOT EXISTS idx_marcos_crianca ON marcos_crianca(id_crianca);
CREATE INDEX IF NOT EXISTS idx_marcos_status ON marcos_crianca(status);
CREATE INDEX IF NOT EXISTS idx_marcos_ref_area ON marcos_desenvolvimento(area_desenvolvimento, idade_minima_meses);
CREATE INDEX IF NOT EXISTS idx_sessoes_prof_crianca ON sessoes_profissionais(id_crianca);

-- RLS Policies (desabilitadas temporariamente - adicionar depois de verificar tipos no banco)
-- ALTER TABLE relatorios_desenvolvimento ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE observacoes_atividades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE marcos_crianca ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE marcos_desenvolvimento ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessoes_profissionais ENABLE ROW LEVEL SECURITY;

-- Seed: Marcos de desenvolvimento para 3-6 anos (Cognição)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('COG_36_01', 'Classifica objetos por cor, forma e tamanho', 'cognicao', 36, 42, '3-4', 1),
('COG_36_02', 'Reconhece sequências simples (padrões)', 'cognicao', 36, 42, '3-4', 2),
('COG_36_03', 'Compreende conceitos de número (1-5)', 'cognicao', 36, 42, '3-4', 2),
('COG_48_01', 'Resolve problemas com planejamento simples', 'cognicao', 48, 54, '4-5', 3),
('COG_48_02', 'Compreende relações de causa e efeito', 'cognicao', 48, 54, '4-5', 3),
('COG_48_03', 'Classifica por múltiplos critérios simultâneos', 'cognicao', 48, 54, '4-5', 3),
('COG_60_01', 'Raciocínio lógico com matrizes simples', 'cognicao', 60, 66, '5-6', 4),
('COG_60_02', 'Compreende equivalência e compensação', 'cognicao', 60, 66, '5-6', 4),
('COG_60_03', 'Faz inferências e predições', 'cognicao', 60, 66, '5-6', 4)
ON CONFLICT (codigo_marco) DO NOTHING;

-- Seed: Marcos de desenvolvimento para 3-6 anos (Linguagem)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('LIN_36_01', 'Frases de 4-6 palavras', 'linguagem', 36, 42, '3-4', 1),
('LIN_36_02', 'Usa passado e futuro', 'linguagem', 36, 42, '3-4', 2),
('LIN_36_03', 'Consciência fonológica inicial (rimas)', 'linguagem', 36, 42, '3-4', 2),
('LIN_48_01', 'Vocabulário de 2000+ palavras', 'linguagem', 48, 54, '4-5', 3),
('LIN_48_02', 'Consciência fonêmica completa', 'linguagem', 48, 54, '4-5', 3),
('LIN_48_03', 'Produz narrativas estruturadas', 'linguagem', 48, 54, '4-5', 3),
('LIN_60_01', 'Leitura independente com compreensão', 'linguagem', 60, 66, '5-6', 4),
('LIN_60_02', 'Consciência silábica e fonêmica avançada', 'linguagem', 60, 66, '5-6', 4),
('LIN_60_03', 'Produz textos em gêneros funcionais', 'linguagem', 60, 66, '5-6', 5)
ON CONFLICT (codigo_marco) DO NOTHING;

-- Seed: Marcos de desenvolvimento para 3-6 anos (Socioemocional)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('SOC_36_01', 'Brinca cooperativamente', 'socioemocional', 36, 42, '3-4', 2),
('SOC_36_02', 'Demonstra empatia avançada', 'socioemocional', 36, 42, '3-4', 2),
('SOC_36_03', 'Entende regras de jogos', 'socioemocional', 36, 42, '3-4', 2),
('SOC_48_01', 'Amizades recíprocas', 'socioemocional', 48, 54, '4-5', 3),
('SOC_48_02', 'Teoria da mente consolidada', 'socioemocional', 48, 54, '4-5', 3),
('SOC_48_03', 'Resolução de conflitos', 'socioemocional', 48, 54, '4-5', 3),
('SOC_60_01', 'Identidade cultural', 'socioemocional', 60, 66, '5-6', 4),
('SOC_60_02', 'Senso de justiça', 'socioemocional', 60, 66, '5-6', 4)
ON CONFLICT (codigo_marco) DO NOTHING;

-- Seed: Marcos de desenvolvimento para 3-6 anos (Autorregulação)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('AUT_36_01', 'Segue sequências de regras', 'autorregulacao', 36, 42, '3-4', 2),
('AUT_36_02', 'Tolerância à frustração', 'autorregulacao', 36, 42, '3-4', 2),
('AUT_36_03', 'Usa fala interna para se guiar', 'autorregulacao', 36, 42, '3-4', 3),
('AUT_48_01', 'Metacognição inicial', 'autorregulacao', 48, 54, '4-5', 3),
('AUT_48_02', 'Planejamento de tarefas complexas', 'autorregulacao', 48, 54, '4-5', 3),
('AUT_48_03', 'Flexibilidade cognitiva', 'autorregulacao', 48, 54, '4-5', 4),
('AUT_60_01', 'Definição de metas de curto prazo', 'autorregulacao', 60, 66, '5-6', 4),
('AUT_60_02', 'Mentalidade de crescimento', 'autorregulacao', 60, 66, '5-6', 4)
ON CONFLICT (codigo_marco) DO NOTHING;

-- Seed: Marcos de desenvolvimento para 3-6 anos (Motricidade)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('MOT_36_01', 'Pula em um pé só', 'motricidade', 36, 42, '3-4', 2),
('MOT_36_02', 'Usa tesoura com controle', 'motricidade', 36, 42, '3-4', 2),
('MOT_36_03', 'Traça linhas e pré-letras', 'motricidade', 36, 42, '3-4', 2),
('MOT_48_01', 'Traça letras e números', 'motricidade', 48, 54, '4-5', 3),
('MOT_48_02', 'Coordenação rítmica', 'motricidade', 48, 54, '4-5', 3),
('MOT_48_03', 'Copia formas complexas', 'motricidade', 48, 54, '4-5', 3),
('MOT_60_01', 'Traçado de letras com direção', 'motricidade', 60, 66, '5-6', 4),
('MOT_60_02', 'Coordenação rítmico-motora', 'motricidade', 60, 66, '5-6', 4)
ON CONFLICT (codigo_marco) DO NOTHING;

-- ============================================
-- FIM DA MIGRATION DE RELATÓRIOS
-- ============================================
