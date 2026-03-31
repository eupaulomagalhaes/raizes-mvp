-- Verificar tipo atual de id_crianca
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'criancas' 
AND column_name IN ('id_crianca', 'id_responsavel');

-- Se id_crianca for BIGINT, dropar e recriar a tabela com UUID
-- ATENÇÃO: Isso vai deletar todos os dados! Execute apenas se confirmar que id_crianca é BIGINT

-- Backup dos dados (se houver)
-- CREATE TABLE criancas_backup AS SELECT * FROM criancas;

-- Dropar tabela
DROP TABLE IF EXISTS criancas CASCADE;

-- Recriar com UUID (conforme migration original)
CREATE TABLE criancas (
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

-- RLS
ALTER TABLE criancas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas suas crianças" ON criancas
    FOR SELECT USING (id_responsavel = auth.uid());

CREATE POLICY "Usuários podem inserir suas crianças" ON criancas
    FOR INSERT WITH CHECK (id_responsavel = auth.uid());

CREATE POLICY "Usuários podem atualizar suas crianças" ON criancas
    FOR UPDATE USING (id_responsavel = auth.uid());

CREATE POLICY "Usuários podem deletar suas crianças" ON criancas
    FOR DELETE USING (id_responsavel = auth.uid());
