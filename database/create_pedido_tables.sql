-- Criar tabela pedido para gerenciar pedidos
CREATE TABLE IF NOT EXISTS pedido (
    id BIGSERIAL PRIMARY KEY,
    loja BIGINT NOT NULL REFERENCES store(id) ON DELETE CASCADE,
    fornecedor BIGINT NOT NULL REFERENCES fornecedor(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela detalhe_pedido para gerenciar itens dos pedidos
CREATE TABLE IF NOT EXISTS detalhe_pedido (
    id BIGSERIAL PRIMARY KEY,
    qtd_inicial INT NOT NULL CHECK (qtd_inicial > 0),
    qtd_atual INT NOT NULL CHECK (qtd_atual >= 0),
    valor_un REAL NOT NULL CHECK (valor_un > 0),
    cor VARCHAR(100) NOT NULL,
    tipo BIGINT NOT NULL REFERENCES tipo_roupa(id) ON DELETE CASCADE,
    pedido BIGINT NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pedido_loja ON pedido(loja);
CREATE INDEX IF NOT EXISTS idx_pedido_fornecedor ON pedido(fornecedor);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_pedido ON detalhe_pedido(pedido);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_tipo ON detalhe_pedido(tipo);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedido_updated_at 
    BEFORE UPDATE ON pedido 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_detalhe_pedido_updated_at 
    BEFORE UPDATE ON detalhe_pedido 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para garantir que qtd_atual <= qtd_inicial
CREATE OR REPLACE FUNCTION check_qtd_atual() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qtd_atual > NEW.qtd_inicial THEN
        RAISE EXCEPTION 'Quantidade atual não pode ser maior que quantidade inicial';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_qtd_atual_trigger
    BEFORE INSERT OR UPDATE ON detalhe_pedido
    FOR EACH ROW
    EXECUTE FUNCTION check_qtd_atual();

-- Política de segurança (RLS) - permitir acesso a todos os usuários autenticados
ALTER TABLE pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalhe_pedido ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela pedido
CREATE POLICY "Authenticated users can view all pedidos" ON pedido
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert pedidos" ON pedido
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pedidos" ON pedido
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete pedidos" ON pedido
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para tabela detalhe_pedido
CREATE POLICY "Authenticated users can view all detalhe_pedidos" ON detalhe_pedido
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert detalhe_pedidos" ON detalhe_pedido
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update detalhe_pedidos" ON detalhe_pedido
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete detalhe_pedidos" ON detalhe_pedido
    FOR DELETE USING (auth.role() = 'authenticated');
