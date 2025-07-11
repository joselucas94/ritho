-- Criar tabela fornecedor para gerenciar fornecedores
CREATE TABLE IF NOT EXISTS fornecedor (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar performance nas consultas por CNPJ
CREATE INDEX IF NOT EXISTS idx_fornecedor_cnpj ON fornecedor(cnpj);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fornecedor_updated_at 
    BEFORE UPDATE ON fornecedor 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Política de segurança (RLS) - permitir acesso a todos os usuários autenticados
ALTER TABLE fornecedor ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuários autenticados podem visualizar todos os fornecedores
CREATE POLICY "Authenticated users can view all fornecedores" ON fornecedor
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para INSERT - usuários autenticados podem inserir fornecedores
CREATE POLICY "Authenticated users can insert fornecedores" ON fornecedor
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE - usuários autenticados podem atualizar fornecedores
CREATE POLICY "Authenticated users can update fornecedores" ON fornecedor
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE - usuários autenticados podem deletar fornecedores
CREATE POLICY "Authenticated users can delete fornecedores" ON fornecedor
    FOR DELETE USING (auth.role() = 'authenticated');
