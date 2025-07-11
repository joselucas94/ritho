-- Criar tabela materiais para gerenciar materiais
CREATE TABLE IF NOT EXISTS materiais (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_materiais_name ON materiais(name);
CREATE INDEX IF NOT EXISTS idx_materiais_created_at ON materiais(created_at);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_materiais_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_materiais_updated_at 
    BEFORE UPDATE ON materiais 
    FOR EACH ROW 
    EXECUTE FUNCTION update_materiais_updated_at_column();

-- Política de segurança (RLS) - permitir acesso a todos os usuários autenticados
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela materiais
CREATE POLICY "Authenticated users can view all materiais" ON materiais
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert materiais" ON materiais
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update materiais" ON materiais
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete materiais" ON materiais
    FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns materiais de exemplo (opcional)
INSERT INTO materiais (name) VALUES 
    ('Algodão'),
    ('Poliéster'),
    ('Viscose'),
    ('Lã'),
    ('Linho'),
    ('Seda'),
    ('Elastano'),
    ('Nylon'),
    ('Acrílico'),
    ('Modal')
ON CONFLICT (name) DO NOTHING;
