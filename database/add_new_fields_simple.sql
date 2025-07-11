-- ========================================
-- SCRIPT SIMPLIFICADO - NOVOS CAMPOS
-- Adiciona apenas os novos campos à tabela detalhe_pedido
-- ========================================

-- 1. Verificar se a tabela detalhe_pedido existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'detalhe_pedido') THEN
        RAISE EXCEPTION 'Tabela detalhe_pedido não encontrada. Execute primeiro o script de criação das tabelas de pedidos.';
    END IF;
END $$;

-- 2. Adicionar as novas colunas (se não existirem)
DO $$
BEGIN
    -- Adicionar coluna ref
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'ref') THEN
        ALTER TABLE detalhe_pedido ADD COLUMN ref TEXT;
        RAISE NOTICE 'Coluna ref adicionada';
    ELSE
        RAISE NOTICE 'Coluna ref já existe';
    END IF;

    -- Adicionar coluna size
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'size') THEN
        ALTER TABLE detalhe_pedido ADD COLUMN size TEXT;
        RAISE NOTICE 'Coluna size adicionada';
    ELSE
        RAISE NOTICE 'Coluna size já existe';
    END IF;

    -- Adicionar coluna group_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'group_id') THEN
        ALTER TABLE detalhe_pedido ADD COLUMN group_id BIGINT;
        RAISE NOTICE 'Coluna group_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna group_id já existe';
    END IF;

    -- Adicionar coluna shade_id
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'shade_id') THEN
        ALTER TABLE detalhe_pedido ADD COLUMN shade_id BIGINT;
        RAISE NOTICE 'Coluna shade_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna shade_id já existe';
    END IF;
END $$;

-- 3. Adicionar foreign keys (se as tabelas relacionadas existirem)
DO $$
BEGIN
    -- Foreign key para groups (se a tabela existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_detalhe_pedido_group_id') THEN
            ALTER TABLE detalhe_pedido 
            ADD CONSTRAINT fk_detalhe_pedido_group_id 
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
            RAISE NOTICE 'Foreign key para groups adicionada';
        ELSE
            RAISE NOTICE 'Foreign key para groups já existe';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela groups não encontrada - foreign key não criada';
    END IF;

    -- Foreign key para colors_shades (se a tabela existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'colors_shades') THEN
        IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_detalhe_pedido_shade_id') THEN
            ALTER TABLE detalhe_pedido 
            ADD CONSTRAINT fk_detalhe_pedido_shade_id 
            FOREIGN KEY (shade_id) REFERENCES colors_shades(id) ON DELETE SET NULL;
            RAISE NOTICE 'Foreign key para colors_shades adicionada';
        ELSE
            RAISE NOTICE 'Foreign key para colors_shades já existe';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela colors_shades não encontrada - foreign key não criada';
    END IF;
END $$;

-- 4. Criar índices para performance
DO $$
BEGIN
    -- Índice para ref
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_detalhe_pedido_ref') THEN
        CREATE INDEX idx_detalhe_pedido_ref ON detalhe_pedido(ref);
        RAISE NOTICE 'Índice para ref criado';
    ELSE
        RAISE NOTICE 'Índice para ref já existe';
    END IF;

    -- Índice para size
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_detalhe_pedido_siz') THEN
        CREATE INDEX idx_detalhe_pedido_siz ON detalhe_pedido(size);
        RAISE NOTICE 'Índice para size criado';
    ELSE
        RAISE NOTICE 'Índice para size já existe';
    END IF;

    -- Índice para group_id
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_detalhe_pedido_group_id') THEN
        CREATE INDEX idx_detalhe_pedido_group_id ON detalhe_pedido(group_id);
        RAISE NOTICE 'Índice para group_id criado';
    ELSE
        RAISE NOTICE 'Índice para group_id já existe';
    END IF;

    -- Índice para shade_id
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_detalhe_pedido_shade_id') THEN
        CREATE INDEX idx_detalhe_pedido_shade_id ON detalhe_pedido(shade_id);
        RAISE NOTICE 'Índice para shade_id criado';
    ELSE
        RAISE NOTICE 'Índice para shade_id já existe';
    END IF;
END $$;

-- 5. Adicionar comentários para documentar os novos campos
COMMENT ON COLUMN detalhe_pedido.ref IS 'Referência ou código do produto';
COMMENT ON COLUMN detalhe_pedido.size IS 'Tamanho do produto (P, M, G, GG, etc.)';
COMMENT ON COLUMN detalhe_pedido.group_id IS 'ID do grupo ao qual o produto pertence';
COMMENT ON COLUMN detalhe_pedido.shade_id IS 'ID do tom/shade específico da cor';

-- 6. Verificar a estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'detalhe_pedido'
    AND column_name IN ('ref', 'size', 'group_id', 'shade_id')
ORDER BY column_name;

-- 7. Mostrar estatísticas
SELECT 'Atualização concluída!' as resultado;
SELECT 
    COUNT(*) as total_detalhes,
    COUNT(ref) as com_referencia,
    COUNT(size) as com_tamanho,
    COUNT(group_id) as com_grupo,
    COUNT(shade_id) as com_shade
FROM detalhe_pedido;
