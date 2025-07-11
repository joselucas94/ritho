-- Criar tabela store para gerenciar lojas
CREATE TABLE IF NOT EXISTS store (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar performance nas consultas por owner
CREATE INDEX IF NOT EXISTS idx_store_owner ON store(owner);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_store_updated_at 
    BEFORE UPDATE ON store 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Política de segurança (RLS) - usuários só podem ver suas próprias lojas
ALTER TABLE store ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view their own stores" ON store
    FOR SELECT USING (auth.uid() = owner);

-- Política para INSERT
CREATE POLICY "Users can insert their own stores" ON store
    FOR INSERT WITH CHECK (auth.uid() = owner);

-- Política para UPDATE
CREATE POLICY "Users can update their own stores" ON store
    FOR UPDATE USING (auth.uid() = owner);

-- Política para DELETE
CREATE POLICY "Users can delete their own stores" ON store
    FOR DELETE USING (auth.uid() = owner);
