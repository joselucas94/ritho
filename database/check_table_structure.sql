-- ==========================================
-- VERIFICAÇÃO RÁPIDA - ESTRUTURA DA TABELA
-- ==========================================

-- 1. Verificar se a tabela detalhe_pedido existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'detalhe_pedido') 
        THEN '✅ Tabela detalhe_pedido existe' 
        ELSE '❌ Tabela detalhe_pedido NÃO existe' 
    END as status_tabela;

-- 2. Verificar estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('ref', 'size', 'group_id', 'shade_id') THEN '🆕 NOVO'
        ELSE '📋 Original'
    END as tipo_campo
FROM information_schema.columns
WHERE table_name = 'detalhe_pedido'
ORDER BY 
    CASE 
        WHEN column_name IN ('ref', 'size', 'group_id', 'shade_id') THEN 2
        ELSE 1
    END,
    ordinal_position;

-- 3. Verificar se os novos campos existem
SELECT 
    'ref' as campo,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'ref')
        THEN '✅ Existe' 
        ELSE '❌ Não existe' 
    END as status
UNION ALL
SELECT 
    'size' as campo,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'size')
        THEN '✅ Existe' 
        ELSE '❌ Não existe' 
    END as status
UNION ALL
SELECT 
    'group_id' as campo,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'group_id')
        THEN '✅ Existe' 
        ELSE '❌ Não existe' 
    END as status
UNION ALL
SELECT 
    'shade_id' as campo,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'detalhe_pedido' AND column_name = 'shade_id')
        THEN '✅ Existe' 
        ELSE '❌ Não existe' 
    END as status;

-- 4. Verificar foreign keys
SELECT 
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name,
    '🔗 FK' as tipo
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE kcu.table_name = 'detalhe_pedido' 
    AND kcu.column_name IN ('group_id', 'shade_id');

-- 5. Verificar índices dos novos campos
SELECT 
    indexname,
    tablename,
    '📊 Índice' as tipo
FROM pg_indexes
WHERE tablename = 'detalhe_pedido'
    AND (indexname LIKE '%ref%' 
         OR indexname LIKE '%size%'
         OR indexname LIKE '%group_id%'
         OR indexname LIKE '%shade_id%');

-- 6. Contar registros existentes
SELECT 
    COUNT(*) as total_detalhes,
    COUNT(ref) as com_ref,
    COUNT(size) as com_siz,
    COUNT(group_id) as com_group_id,
    COUNT(shade_id) as com_shade_id,
    '📈 Dados' as tipo
FROM detalhe_pedido;

-- 7. Verificar tabelas relacionadas
SELECT 
    'groups' as tabela_relacionada,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'groups')
        THEN CONCAT('✅ Existe (', (SELECT COUNT(*) FROM groups), ' registros)')
        ELSE '❌ Não existe' 
    END as status
UNION ALL
SELECT 
    'colors_shades' as tabela_relacionada,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'colors_shades')
        THEN CONCAT('✅ Existe (', (SELECT COUNT(*) FROM colors_shades), ' registros)')
        ELSE '❌ Não existe' 
    END as status;
