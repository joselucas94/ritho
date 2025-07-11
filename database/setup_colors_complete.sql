-- Script para verificar e criar tabelas de cores se necessário

-- 1. Verificar se as tabelas existem
DO $$
BEGIN
    -- Verificar tabela colors
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'colors') THEN
        RAISE NOTICE 'Tabela colors não existe. Criando...';
        
        CREATE TABLE colors (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT colors_name_not_empty CHECK (trim(name) != '')
        );
        
        RAISE NOTICE 'Tabela colors criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela colors já existe';
    END IF;
    
    -- Verificar tabela color_shades
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'color_shades') THEN
        RAISE NOTICE 'Tabela color_shades não existe. Criando...';
        
        CREATE TABLE color_shades (
            id BIGSERIAL PRIMARY KEY,
            color_id BIGINT NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT color_shades_name_not_empty CHECK (trim(name) != ''),
            CONSTRAINT color_shades_unique_name_per_color UNIQUE (color_id, name)
        );
        
        RAISE NOTICE 'Tabela color_shades criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela color_shades já existe';
    END IF;
END $$;

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_colors_name ON colors(name);
CREATE INDEX IF NOT EXISTS idx_color_shades_color_id ON color_shades(color_id);
CREATE INDEX IF NOT EXISTS idx_color_shades_name ON color_shades(name);

-- 3. Criar ou atualizar função de trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar triggers
DROP TRIGGER IF EXISTS update_colors_updated_at ON colors;
CREATE TRIGGER update_colors_updated_at
    BEFORE UPDATE ON colors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_color_shades_updated_at ON color_shades;
CREATE TRIGGER update_color_shades_updated_at
    BEFORE UPDATE ON color_shades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_shades ENABLE ROW LEVEL SECURITY;

-- 6. Remover políticas antigas e criar novas
DROP POLICY IF EXISTS "Users can view colors" ON colors;
DROP POLICY IF EXISTS "Users can insert colors" ON colors;
DROP POLICY IF EXISTS "Users can update colors" ON colors;
DROP POLICY IF EXISTS "Users can delete colors" ON colors;
DROP POLICY IF EXISTS "Users can view color_shades" ON color_shades;
DROP POLICY IF EXISTS "Users can insert color_shades" ON color_shades;
DROP POLICY IF EXISTS "Users can update color_shades" ON color_shades;
DROP POLICY IF EXISTS "Users can delete color_shades" ON color_shades;

-- Políticas para colors
CREATE POLICY "Users can view colors" ON colors FOR SELECT USING (true);
CREATE POLICY "Users can insert colors" ON colors FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update colors" ON colors FOR UPDATE USING (true);
CREATE POLICY "Users can delete colors" ON colors FOR DELETE USING (true);

-- Políticas para color_shades
CREATE POLICY "Users can view color_shades" ON color_shades FOR SELECT USING (true);
CREATE POLICY "Users can insert color_shades" ON color_shades FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update color_shades" ON color_shades FOR UPDATE USING (true);
CREATE POLICY "Users can delete color_shades" ON color_shades FOR DELETE USING (true);

-- 7. Inserir dados de teste se as tabelas estiverem vazias
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM colors) = 0 THEN
        RAISE NOTICE 'Inserindo dados de exemplo...';
        
        INSERT INTO colors (name) VALUES
            ('Azul'),
            ('Vermelho'),
            ('Verde'),
            ('Amarelo'),
            ('Preto'),
            ('Branco');
        
        RAISE NOTICE 'Dados de exemplo inseridos';
    ELSE
        RAISE NOTICE 'Tabela colors já possui dados';
    END IF;
END $$;

-- 8. Verificar estrutura final
SELECT 'Verificação final:' as status;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('colors', 'color_shades')
ORDER BY table_name, ordinal_position;

-- 9. Contar registros
SELECT 
    'colors' as tabela,
    COUNT(*) as total_registros
FROM colors
UNION ALL
SELECT 
    'color_shades' as tabela,
    COUNT(*) as total_registros
FROM color_shades;

-- 10. Testar inserção básica
DO $$
DECLARE
    test_color_id BIGINT;
    test_shade_id BIGINT;
BEGIN
    -- Inserir cor de teste
    INSERT INTO colors (name) VALUES ('Teste Cor Completo') RETURNING id INTO test_color_id;
    RAISE NOTICE 'Cor de teste criada com ID: %', test_color_id;
    
    -- Inserir tom de teste
    INSERT INTO color_shades (color_id, name) VALUES (test_color_id, 'Teste Tom Completo') RETURNING id INTO test_shade_id;
    RAISE NOTICE 'Tom de teste criado com ID: %', test_shade_id;
    
    -- Limpar dados de teste
    DELETE FROM color_shades WHERE id = test_shade_id;
    DELETE FROM colors WHERE id = test_color_id;
    
    RAISE NOTICE 'Teste completo realizado com sucesso!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;
