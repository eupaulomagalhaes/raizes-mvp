# Raízes Educacional - Execução de Migration

## Como aplicar a migration de relatórios

### Opção 1: SQL Editor (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/vjeizqpzzfgdxbhetfdc/sql-editor
2. Cole o conteúdo do arquivo abaixo
3. Clique em "Run" ou "New Query"

### Opção 2: Supabase CLI

```bash
supabase login
supabase link --project-ref vjeizqpzzfgdxbhetfdc
supabase db push
```

## Migration 002 - Relatórios e Progresso

```sql
-- ============================================
-- RAÍZES EDUCACIONAL - SCHEMA DE RELATÓRIOS
-- ============================================

-- 1. Tabela de relatórios mensais
CREATE TABLE IF NOT EXISTS relatorios_desenvolvimento (
    id_relatorio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    mes_referencia INTEGER NOT NULL CHECK (mes_referencia BETWEEN 1 AND 12),
    ano_referencia INTEGER NOT NULL,
    pontuacao_cognicao INTEGER DEFAULT 0 CHECK (pontuacao_cognicao BETWEEN 0 AND 100),
    pontuacao_motricidade INTEGER DEFAULT 0 CHECK (pontuacao_motricidade BETWEEN 0 AND 100),
    pontuacao_linguagem INTEGER DEFAULT 0 CHECK (pontuacao_linguagem BETWEEN 0 AND 100),
    pontuacao_socioemocional INTEGER DEFAULT 0 CHECK (pontuacao_socioemocional BETWEEN 0 AND 100),
    pontuacao_autorregulacao INTEGER DEFAULT 0 CHECK (pontuacao_autorregulacao BETWEEN 0 AND 100),
    pontuacao_total INTEGER DEFAULT 0 CHECK (pontuacao_total BETWEEN 0 AND 100),
    observacoes_gerais TEXT,
    pontos_fortes TEXT,
    areas_desenvolver TEXT,
    alerta_gerado BOOLEAN DEFAULT false,
    tipo_alerta VARCHAR(50),
    recomendacoes_praticas TEXT,
    atividades_sugeridas TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_crianca, mes_referencia, ano_referencia)
);

-- 2. Tabela de observações por atividade
CREATE TABLE IF NOT EXISTS observacoes_atividades (
    id_observacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    id_sessao UUID REFERENCES sessoes_jogo(id_sessao) ON DELETE SET NULL,
    nome_atividade VARCHAR(255) NOT NULL,
    area_desenvolvimento VARCHAR(50) NOT NULL,
    idade_recomendada_meses INTEGER,
    avaliacao VARCHAR(20) NOT NULL CHECK (avaliacao IN ('fez', 'tentou', 'nao_fez')),
    pontos INTEGER NOT NULL CHECK (pontos IN (0, 1, 2)),
    observacao_livre TEXT,
    tempo_duracao_segundos INTEGER,
    necessitou_ajuda BOOLEAN DEFAULT false,
    tipo_ajuda TEXT,
    humor_crianca VARCHAR(50),
    momento_dia VARCHAR(50),
    urls_anexos TEXT[],
    data_observacao TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de marcos de desenvolvimento (checklist)
CREATE TABLE IF NOT EXISTS marcos_desenvolvimento (
    id_marco UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_marco VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    area_desenvolvimento VARCHAR(50) NOT NULL,
    idade_minima_meses INTEGER NOT NULL,
    idade_maxima_meses INTEGER NOT NULL,
    protocolo_referencia VARCHAR(50),
    nivel_dificuldade INTEGER DEFAULT 1 CHECK (nivel_dificuldade BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de acompanhamento de marcos por criança
CREATE TABLE IF NOT EXISTS marcos_crianca (
    id_marco_crianca UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    id_marco UUID NOT NULL REFERENCES marcos_desenvolvimento(id_marco) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'nao_avaliado' CHECK (status IN ('nao_avaliado', 'em_desenvolvimento', 'conquistado', 'nao_aplicavel')),
    data_conquista DATE,
    data_primeira_tentativa DATE,
    idade_conquista_meses INTEGER,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_crianca, id_marco)
);

-- 5. Tabela de sessões de terapia/acompanhamento profissional
CREATE TABLE IF NOT EXISTS sessoes_profissionais (
    id_sessao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
    nome_profissional VARCHAR(255),
    tipo_profissional VARCHAR(100),
    registro_profissional VARCHAR(100),
    data_sessao DATE NOT NULL,
    duracao_minutos INTEGER,
    avaliacao_profissional TEXT,
    recomendacoes TEXT,
    exercicios_casa TEXT[],
    atividades_recomendadas TEXT[],
    anexos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_relatorios_crianca ON relatorios_desenvolvimento(id_crianca);
CREATE INDEX IF NOT EXISTS idx_observacoes_crianca ON observacoes_atividades(id_crianca);
CREATE INDEX IF NOT EXISTS idx_marcos_crianca ON marcos_crianca(id_crianca);

-- RLS Policies
ALTER TABLE relatorios_desenvolvimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE observacoes_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcos_crianca ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcos_desenvolvimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_profissionais ENABLE ROW LEVEL SECURITY;

-- Política: Responsáveis veem só dados de suas crianças
CREATE POLICY "Responsáveis veem relatórios de suas crianças" ON relatorios_desenvolvimento
    FOR SELECT USING (EXISTS (SELECT 1 FROM criancas WHERE id_crianca = relatorios_desenvolvimento.id_crianca AND id_responsavel = auth.uid()));

CREATE POLICY "Responsáveis veem observações de suas crianças" ON observacoes_atividades
    FOR SELECT USING (EXISTS (SELECT 1 FROM criancas WHERE id_crianca = observacoes_atividades.id_crianca AND id_responsavel = auth.uid()));

CREATE POLICY "Responsáveis veem marcos de suas crianças" ON marcos_crianca
    FOR SELECT USING (EXISTS (SELECT 1 FROM criancas WHERE id_crianca = marcos_crianca.id_crianca AND id_responsavel = auth.uid()));

CREATE POLICY "Todos veem marcos de desenvolvimento" ON marcos_desenvolvimento
    FOR SELECT USING (true);

-- Seed: Marcos para 3-6 anos (Cognição)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('COG_36_01', 'Classifica objetos por cor, forma e tamanho', 'cognicao', 36, 42, '3-4', 1),
('COG_36_02', 'Reconhece sequências simples (padrões)', 'cognicao', 36, 42, '3-4', 2),
('COG_48_01', 'Resolve problemas com planejamento simples', 'cognicao', 48, 54, '4-5', 3),
('COG_48_02', 'Compreende relações de causa e efeito', 'cognicao', 48, 54, '4-5', 3),
('COG_60_01', 'Raciocínio lógico com matrizes simples', 'cognicao', 60, 66, '5-6', 4)
ON CONFLICT (codigo_marco) DO NOTHING;

-- Seed: Marcos para 3-6 anos (Linguagem)
INSERT INTO marcos_desenvolvimento (codigo_marco, descricao, area_desenvolvimento, idade_minima_meses, idade_maxima_meses, protocolo_referencia, nivel_dificuldade) VALUES
('LIN_36_01', 'Frases de 4-6 palavras', 'linguagem', 36, 42, '3-4', 1),
('LIN_36_02', 'Consciência fonológica inicial (rimas)', 'linguagem', 36, 42, '3-4', 2),
('LIN_48_01', 'Vocabulário de 2000+ palavras', 'linguagem', 48, 54, '4-5', 3),
('LIN_60_01', 'Leitura independente com compreensão', 'linguagem', 60, 66, '5-6', 4)
ON CONFLICT (codigo_marco) DO NOTHING;
```

## Verificação após execução

Após rodar a migration, execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('relatorios_desenvolvimento', 'observacoes_atividades', 'marcos_desenvolvimento', 'marcos_crianca', 'sessoes_profissionais');

-- Verificar seed data
SELECT COUNT(*) as total_marcos FROM marcos_desenvolvimento;
```

## Arquivos

- Migration completa: `supabase/migrations/002_relatorios_progresso.sql`
