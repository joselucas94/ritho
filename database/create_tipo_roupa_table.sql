-- Criar tabela tipo_roupa para gerenciar tipos de roupas
CREATE TABLE IF NOT EXISTS tipo_roupa (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar performance nas consultas por nome
CREATE INDEX IF NOT EXISTS idx_tipo_roupa_name ON tipo_roupa(name);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tipo_roupa_updated_at 
    BEFORE UPDATE ON tipo_roupa 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Política de segurança (RLS) - permitir acesso a todos os usuários autenticados
ALTER TABLE tipo_roupa ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários autenticados podem visualizar todos os tipos de roupas
CREATE POLICY "Authenticated users can view all tipo_roupa" ON tipo_roupa
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT - usuários autenticados podem inserir tipos de roupas
CREATE POLICY "Authenticated users can insert tipo_roupa" ON tipo_roupa
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - usuários autenticados podem atualizar tipos de roupas
CREATE POLICY "Authenticated users can update tipo_roupa" ON tipo_roupa
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE - usuários autenticados podem deletar tipos de roupas
CREATE POLICY "Authenticated users can delete tipo_roupa" ON tipo_roupa
    FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns tipos de roupas padrão
INSERT INTO tipo_roupa (nome) VALUES 
    ('Camiseta'),
    ('Calça Jeans'),
    ('Vestido'),
    ('Blusa'),
    ('Shorts'),
    ('Saia'),
    ('Jaqueta'),
    ('Moletom'),
    ('Camisa Social'),
    ('Bermuda'),
    ('Top'),
    ('Legging'),
    ('Casaco'),
    ('Regata'),
    ('Polo')
ON CONFLICT (nome) DO NOTHING;
