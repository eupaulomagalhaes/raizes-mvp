-- Tabela para armazenar respostas do questionário de captação de leads
CREATE TABLE IF NOT EXISTS questionario_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_crianca UUID NOT NULL REFERENCES criancas(id_crianca) ON DELETE CASCADE,
  situacao_diagnostico TEXT,
  desafios TEXT[], -- Array de strings
  interesse_teste TEXT,
  beneficio_desejado TEXT[], -- Array de strings
  uso_digital TEXT,
  grupo_vip TEXT,
  data_resposta TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_questionario_leads_crianca ON questionario_leads(id_crianca);
CREATE INDEX IF NOT EXISTS idx_questionario_leads_data ON questionario_leads(data_resposta);
CREATE INDEX IF NOT EXISTS idx_questionario_leads_interesse ON questionario_leads(interesse_teste);
CREATE INDEX IF NOT EXISTS idx_questionario_leads_vip ON questionario_leads(grupo_vip);

-- RLS Policies
ALTER TABLE questionario_leads ENABLE ROW LEVEL SECURITY;

-- Permitir inserção autenticada
CREATE POLICY "Usuários podem inserir suas próprias respostas"
  ON questionario_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id_crianca IN (
      SELECT id_crianca FROM criancas WHERE id_responsavel = auth.uid()
    )
  );

-- Permitir leitura das próprias respostas
CREATE POLICY "Usuários podem ver suas próprias respostas"
  ON questionario_leads
  FOR SELECT
  TO authenticated
  USING (
    id_crianca IN (
      SELECT id_crianca FROM criancas WHERE id_responsavel = auth.uid()
    )
  );
