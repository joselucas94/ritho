-- ===========================================
-- ATUALIZAÇÃO DA TABELA DETALHE_PEDIDO
-- Adicionando novos campos: ref, size, group_id, shade_id
-- ===========================================

-- 1. Adicionar novas colunas à tabela detalhe_pedido
ALTER TABLE detalhe_pedido 
ADD COLUMN IF NOT EXISTS ref TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS group_id BIGINT,
ADD COLUMN IF NOT EXISTS shade_id BIGINT;

-- 2. Adicionar foreign keys para as novas colunas
-- Foreign key para groups
ALTER TABLE detalhe_pedido 
ADD CONSTRAINT IF NOT EXISTS fk_detalhe_pedido_group_id 
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Foreign key para color_shades
ALTER TABLE detalhe_pedido 
ADD CONSTRAINT IF NOT EXISTS fk_detalhe_pedido_shade_id 
FOREIGN KEY (shade_id) REFERENCES colors_shades(id) ON DELETE SET NULL;

-- 3. Criar índices para os novos campos para melhorar performance
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_ref ON detalhe_pedido(ref);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_siz ON detalhe_pedido(size);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_group_id ON detalhe_pedido(group_id);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_shade_id ON detalhe_pedido(shade_id);

-- 4. Adicionar comentários para documentar os novos campos
COMMENT ON COLUMN detalhe_pedido.ref IS 'Referência ou código do produto';
COMMENT ON COLUMN detalhe_pedido.size IS 'Tamanho do produto (P, M, G, GG, etc.)';
COMMENT ON COLUMN detalhe_pedido.group_id IS 'ID do grupo ao qual o produto pertence';
COMMENT ON COLUMN detalhe_pedido.shade_id IS 'ID do tom/shade específico da cor';

-- 5. Verificar se as tabelas relacionadas existem
DO $$
BEGIN
    -- Verificar se a tabela groups existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups') THEN
        RAISE WARNING 'Tabela "groups" não encontrada. Certifique-se de criar a tabela groups antes de usar group_id.';
    END IF;
    
    -- Verificar se a tabela colors_shades existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'colors_shades') THEN
        RAISE WARNING 'Tabela "colors_shades" não encontrada. Certifique-se de criar a tabela colors_shades antes de usar shade_id.';
    END IF;
END $$;

-- 6. Mostrar a estrutura atualizada da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'detalhe_pedido'
ORDER BY ordinal_position;

-- 7. Criar view para facilitar consultas com dados relacionados
CREATE OR REPLACE VIEW vw_detalhe_pedido_completo AS
SELECT 
    dp.id,
    dp.qtd_inicial,
    dp.qtd_atual,
    dp.valor_un,
    dp.cor,
    dp.ref,
    dp.size,
    dp.created_at,
    dp.updated_at,
    -- Dados do pedido
    p.id as pedido_id,
    p.created_at as pedido_data,
    -- Dados da loja
    s.nome as loja_nome,
    -- Dados do fornecedor
    f.nome as fornecedor_nome,
    -- Dados do tipo de roupa
    tr.nome as tipo_roupa_nome,
    -- Dados do grupo
    g.name as grupo_nome,
    -- Dados do tom/shade
    cs.name as shade_nome,
    -- Dados da cor (através do shade)
    c.name as cor_nome
FROM detalhe_pedido dp
JOIN pedido p ON dp.pedido = p.id
LEFT JOIN store s ON p.loja = s.id
LEFT JOIN fornecedor f ON p.fornecedor = f.id
LEFT JOIN tipo_roupa tr ON dp.tipo = tr.id
LEFT JOIN groups g ON dp.group_id = g.id
LEFT JOIN colors_shades cs ON dp.shade_id = cs.id
LEFT JOIN colors c ON cs.color_id = c.id;

-- 8. Criar função para inserir detalhe_pedido com validações
CREATE OR REPLACE FUNCTION insert_detalhe_pedido(
    p_qtd_inicial INT,
    p_qtd_atual INT,
    p_valor_un REAL,
    p_cor VARCHAR(100),
    p_ref TEXT DEFAULT NULL,
    p_siz TEXT DEFAULT NULL,
    p_tipo BIGINT,
    p_pedido BIGINT,
    p_group_id BIGINT DEFAULT NULL,
    p_shade_id BIGINT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    new_id BIGINT;
BEGIN
    -- Validações
    IF p_qtd_inicial <= 0 THEN
        RAISE EXCEPTION 'Quantidade inicial deve ser maior que 0';
    END IF;
    
    IF p_qtd_atual < 0 THEN
        RAISE EXCEPTION 'Quantidade atual não pode ser negativa';
    END IF;
    
    IF p_qtd_atual > p_qtd_inicial THEN
        RAISE EXCEPTION 'Quantidade atual não pode ser maior que quantidade inicial';
    END IF;
    
    IF p_valor_un <= 0 THEN
        RAISE EXCEPTION 'Valor unitário deve ser maior que 0';
    END IF;
    
    -- Verificar se o grupo existe (se fornecido)
    IF p_group_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM groups WHERE id = p_group_id) THEN
            RAISE EXCEPTION 'Grupo com ID % não encontrado', p_group_id;
        END IF;
    END IF;
    
    -- Verificar se o shade existe (se fornecido)
    IF p_shade_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM colors_shades WHERE id = p_shade_id) THEN
            RAISE EXCEPTION 'Shade com ID % não encontrado', p_shade_id;
        END IF;
    END IF;
    
    -- Inserir o registro
    INSERT INTO detalhe_pedido (
        qtd_inicial, qtd_atual, valor_un, cor, ref, size, 
        tipo, pedido, group_id, shade_id
    ) VALUES (
        p_qtd_inicial, p_qtd_atual, p_valor_un, p_cor, p_ref, p_siz,
        p_tipo, p_pedido, p_group_id, p_shade_id
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Exemplo de uso da função
-- SELECT insert_detalhe_pedido(
--     p_qtd_inicial := 10,
--     p_qtd_atual := 10,
--     p_valor_un := 29.90,
--     p_cor := 'Azul',
--     p_ref := 'REF001',
--     p_siz := 'M',
--     p_tipo := 1,
--     p_pedido := 1,
--     p_group_id := 1,
--     p_shade_id := 1
-- );

-- 10. Mostrar estatísticas das novas colunas
SELECT 
    'Estatísticas dos novos campos' as info,
    COUNT(*) as total_registros,
    COUNT(ref) as com_ref,
    COUNT(size) as com_siz,
    COUNT(group_id) as com_group_id,
    COUNT(shade_id) as com_shade_id
FROM detalhe_pedido;

COMMIT;
