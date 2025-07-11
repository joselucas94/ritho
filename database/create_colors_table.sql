-- ===========================================
-- TABELA DE CORES E TONS
-- ===========================================

-- Tabela principal de cores
CREATE TABLE IF NOT EXISTS colors (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT colors_name_not_empty CHECK (trim(name) != '')
);

-- Tabela de tons das cores
CREATE TABLE IF NOT EXISTS color_shades (
    id BIGSERIAL PRIMARY KEY,
    color_id BIGINT NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT color_shades_name_not_empty CHECK (trim(name) != ''),
    CONSTRAINT color_shades_unique_name_per_color UNIQUE (color_id, name)
);

-- ===========================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ===========================================

-- Índice para nome das cores (busca rápida)
CREATE INDEX IF NOT EXISTS idx_colors_name ON colors(name);

-- Índice para relacionamento cor-tom
CREATE INDEX IF NOT EXISTS idx_color_shades_color_id ON color_shades(color_id);

-- Índice para nome dos tons
CREATE INDEX IF NOT EXISTS idx_color_shades_name ON color_shades(name);

-- ===========================================
-- TRIGGERS PARA UPDATED_AT
-- ===========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para tabela colors
DROP TRIGGER IF EXISTS update_colors_updated_at ON colors;
CREATE TRIGGER update_colors_updated_at
    BEFORE UPDATE ON colors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tabela color_shades
DROP TRIGGER IF EXISTS update_color_shades_updated_at ON color_shades;
CREATE TRIGGER update_color_shades_updated_at
    BEFORE UPDATE ON color_shades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS nas tabelas
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_shades ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela colors
-- Permitir SELECT para usuários autenticados
CREATE POLICY "Users can view colors" ON colors
    FOR SELECT
    TO authenticated
    USING (true);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Users can insert colors" ON colors
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "Users can update colors" ON colors
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Permitir DELETE para usuários autenticados
CREATE POLICY "Users can delete colors" ON colors
    FOR DELETE
    TO authenticated
    USING (true);

-- Políticas para tabela color_shades
-- Permitir SELECT para usuários autenticados
CREATE POLICY "Users can view color_shades" ON color_shades
    FOR SELECT
    TO authenticated
    USING (true);

-- Permitir INSERT para usuários autenticados
CREATE POLICY "Users can insert color_shades" ON color_shades
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Permitir UPDATE para usuários autenticados
CREATE POLICY "Users can update color_shades" ON color_shades
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Permitir DELETE para usuários autenticados
CREATE POLICY "Users can delete color_shades" ON color_shades
    FOR DELETE
    TO authenticated
    USING (true);

-- ===========================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- ===========================================

-- Inserir algumas cores de exemplo
INSERT INTO colors (name) VALUES
    ('Azul'),
    ('Vermelho'),
    ('Verde'),
    ('Amarelo'),
    ('Preto'),
    ('Branco')
ON CONFLICT DO NOTHING;

-- Inserir alguns tons de exemplo
INSERT INTO color_shades (color_id, name) VALUES
    ((SELECT id FROM colors WHERE name = 'Azul'), 'Azul Claro'),
    ((SELECT id FROM colors WHERE name = 'Azul'), 'Azul Escuro'),
    ((SELECT id FROM colors WHERE name = 'Azul'), 'Azul Marinho'),
    ((SELECT id FROM colors WHERE name = 'Vermelho'), 'Vermelho Claro'),
    ((SELECT id FROM colors WHERE name = 'Vermelho'), 'Vermelho Escuro'),
    ((SELECT id FROM colors WHERE name = 'Verde'), 'Verde Claro'),
    ((SELECT id FROM colors WHERE name = 'Verde'), 'Verde Escuro'),
    ((SELECT id FROM colors WHERE name = 'Verde'), 'Verde Limão')
ON CONFLICT DO NOTHING;

-- ===========================================
-- VERIFICAÇÕES FINAIS
-- ===========================================

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname, 
    tablename, 
    tableowner, 
    tablespace, 
    hasindexes, 
    hasrules, 
    hastriggers 
FROM pg_tables 
WHERE tablename IN ('colors', 'color_shades');

-- Verificar constraints
SELECT 
    conname,
    contype,
    conrelid::regclass AS table_name
FROM pg_constraint 
WHERE conrelid IN (
    'colors'::regclass,
    'color_shades'::regclass
);

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('colors', 'color_shades');

COMMIT;
