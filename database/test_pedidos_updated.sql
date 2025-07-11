-- ====================================
-- SCRIPT DE TESTE - PEDIDOS ATUALIZADOS
-- Testa os novos campos na tabela detalhe_pedido
-- ====================================

-- 1. Verificar se as colunas foram adicionadas corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'detalhe_pedido'
    AND column_name IN ('ref', 'size', 'group_id', 'shade_id')
ORDER BY column_name;

-- 2. Verificar se as foreign keys foram criadas
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'detalhe_pedido'
    AND kcu.column_name IN ('group_id', 'shade_id');

-- 3. Verificar se os índices foram criados
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'detalhe_pedido'
    AND indexname LIKE '%ref%' 
    OR indexname LIKE '%size%'
    OR indexname LIKE '%group_id%'
    OR indexname LIKE '%shade_id%';

-- 4. Testar a função insert_detalhe_pedido (se existir dados de teste)
-- Primeiro, vamos verificar se temos dados necessários
SELECT 'Verificando dados de teste...' as info;

-- Verificar se existem lojas
SELECT COUNT(*) as total_stores, 'stores' as table_name FROM store
UNION ALL
-- Verificar se existem fornecedores  
SELECT COUNT(*) as total_fornecedores, 'fornecedores' as table_name FROM fornecedor
UNION ALL
-- Verificar se existem tipos de roupa
SELECT COUNT(*) as total_tipos_roupa, 'tipos_roupa' as table_name FROM tipo_roupa
UNION ALL
-- Verificar se existem grupos
SELECT COUNT(*) as total_groups, 'groups' as table_name FROM groups
UNION ALL
-- Verificar se existem cores
SELECT COUNT(*) as total_colors, 'colors' as table_name FROM colors
UNION ALL
-- Verificar se existem tons
SELECT COUNT(*) as total_shades, 'color_shades' as table_name FROM colors_shades;

-- 5. Criar dados de teste básicos se necessário
DO $$
DECLARE
    test_store_id bigint;
    test_fornecedor_id bigint;
    test_tipo_id bigint;
    test_group_id bigint;
    test_shade_id bigint;
    test_pedido_id bigint;
    test_detalhe_id bigint;
BEGIN
    -- Verificar se já temos um pedido de teste
    SELECT id INTO test_pedido_id FROM pedido LIMIT 1;
    
    IF test_pedido_id IS NULL THEN
        RAISE NOTICE 'Não há pedidos de teste. Criando dados básicos...';
        
        -- Buscar IDs de teste
        SELECT id INTO test_store_id FROM store LIMIT 1;
        SELECT id INTO test_fornecedor_id FROM fornecedor LIMIT 1;
        SELECT id INTO test_tipo_id FROM tipo_roupa LIMIT 1;
        SELECT id INTO test_group_id FROM groups LIMIT 1;
        SELECT id INTO test_shade_id FROM colors_shades LIMIT 1;
        
        IF test_store_id IS NOT NULL AND test_fornecedor_id IS NOT NULL THEN
            -- Criar pedido de teste
            INSERT INTO pedido (loja, fornecedor)
            VALUES (test_store_id, test_fornecedor_id)
            RETURNING id INTO test_pedido_id;
            
            RAISE NOTICE 'Pedido de teste criado com ID: %', test_pedido_id;
            
            IF test_tipo_id IS NOT NULL THEN
                -- Testar função com novos campos
                SELECT insert_detalhe_pedido(
                    p_qtd_inicial := 10,
                    p_qtd_atual := 10,
                    p_valor_un := 29.90,
                    p_cor := 'Azul Teste',
                    p_ref := 'TEST001',
                    p_siz := 'M',
                    p_tipo := test_tipo_id,
                    p_pedido := test_pedido_id,
                    p_group_id := test_group_id,
                    p_shade_id := test_shade_id
                ) INTO test_detalhe_id;
                
                RAISE NOTICE 'Detalhe de teste criado com ID: %', test_detalhe_id;
            ELSE
                RAISE NOTICE 'Não há tipos de roupa disponíveis para teste';
            END IF;
        ELSE
            RAISE NOTICE 'Não há lojas/fornecedores disponíveis para teste';
        END IF;
    ELSE
        RAISE NOTICE 'Pedidos já existem. ID encontrado: %', test_pedido_id;
    END IF;
END $$;

-- 6. Testar a view vw_detalhe_pedido_completo
SELECT 'Testando view vw_detalhe_pedido_completo...' as info;

SELECT 
    dp.id,
    dp.ref,
    dp.size,
    dp.cor,
    dp.qtd_inicial,
    dp.qtd_atual,
    dp.valor_un,
    dp.grupo_nome,
    dp.shade_nome,
    dp.cor_nome,
    dp.tipo_roupa_nome,
    dp.loja_nome,
    dp.fornecedor_nome
FROM vw_detalhe_pedido_completo dp
WHERE dp.ref IS NOT NULL OR dp.size IS NOT NULL OR dp.grupo_nome IS NOT NULL OR dp.shade_nome IS NOT NULL
LIMIT 5;

-- 7. Testar consultas com os novos campos
SELECT 'Testando consultas com novos campos...' as info;

-- Contar itens por referência
SELECT 
    ref,
    COUNT(*) as total_itens,
    SUM(qtd_inicial) as total_quantidade
FROM detalhe_pedido 
WHERE ref IS NOT NULL
GROUP BY ref
ORDER BY total_quantidade DESC
LIMIT 5;

-- Contar itens por tamanho
SELECT 
    size,
    COUNT(*) as total_itens
FROM detalhe_pedido 
WHERE size IS NOT NULL
GROUP BY size
ORDER BY total_itens DESC;

-- Contar itens por grupo
SELECT 
    g.name as grupo_nome,
    COUNT(dp.id) as total_itens
FROM detalhe_pedido dp
JOIN groups g ON dp.group_id = g.id
GROUP BY g.name
ORDER BY total_itens DESC;

-- Contar itens por tom
SELECT 
    c.name as cor_nome,
    cs.name as shade_nome,
    COUNT(dp.id) as total_itens
FROM detalhe_pedido dp
JOIN colors_shades cs ON dp.shade_id = cs.id
JOIN colors c ON cs.color_id = c.id
GROUP BY c.name, cs.name
ORDER BY total_itens DESC;

-- 8. Verificar integridade dos dados
SELECT 'Verificando integridade dos dados...' as info;

-- Verificar se há group_ids inválidos
SELECT COUNT(*) as invalid_group_ids
FROM detalhe_pedido dp
LEFT JOIN groups g ON dp.group_id = g.id
WHERE dp.group_id IS NOT NULL AND g.id IS NULL;

-- Verificar se há shade_ids inválidos
SELECT COUNT(*) as invalid_shade_ids
FROM detalhe_pedido dp
LEFT JOIN colors_shades cs ON dp.shade_id = cs.id
WHERE dp.shade_id IS NOT NULL AND cs.id IS NULL;

-- 9. Estatísticas finais
SELECT 'Estatísticas dos novos campos:' as info;

SELECT 
    COUNT(*) as total_detalhes,
    COUNT(ref) as com_referencia,
    COUNT(size) as com_tamanho,
    COUNT(group_id) as com_grupo,
    COUNT(shade_id) as com_shade,
    ROUND(COUNT(ref)::numeric / COUNT(*)::numeric * 100, 2) as percent_com_ref,
    ROUND(COUNT(size)::numeric / COUNT(*)::numeric * 100, 2) as percent_com_siz,
    ROUND(COUNT(group_id)::numeric / COUNT(*)::numeric * 100, 2) as percent_com_grupo,
    ROUND(COUNT(shade_id)::numeric / COUNT(*)::numeric * 100, 2) as percent_com_shade
FROM detalhe_pedido;

SELECT 'Teste concluído!' as resultado;
