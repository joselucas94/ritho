-- Script para verificar e debugar o sistema de entregas

-- 1. Verificar se a tabela delivery existe
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'delivery' 
ORDER BY ordinal_position;

-- 2. Verificar se os triggers existem
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'delivery';

-- 3. Verificar algumas entregas existentes (se houver)
SELECT 
    d.id,
    d.qtd,
    d.pedido_item,
    d.created_at,
    dp.qtd_inicial,
    dp.qtd_atual,
    dp.cor
FROM delivery d
JOIN detalhe_pedido dp ON d.pedido_item = dp.id
ORDER BY d.created_at DESC
LIMIT 5;

-- 4. Verificar itens de pedido disponíveis para recebimento
SELECT 
    dp.id,
    dp.qtd_inicial,
    dp.qtd_atual,
    dp.cor,
    tr.nome as tipo_roupa,
    p.id as pedido_id
FROM detalhe_pedido dp
JOIN tipo_roupa tr ON dp.tipo = tr.id
JOIN pedido p ON dp.pedido = p.id
WHERE dp.qtd_atual > 0
ORDER BY dp.created_at DESC
LIMIT 10;

-- 5. Testar função de debug
SELECT test_delivery_triggers();

-- 6. Verificar se há logs de erro nos triggers
-- (Este comando pode não funcionar em todos os sistemas)
-- SELECT * FROM pg_stat_user_functions WHERE funcname LIKE '%delivery%';

-- INSTRUÇÕES DE TESTE:
-- 1. Execute este script no seu banco Supabase
-- 2. Verifique se os triggers aparecem na consulta #2
-- 3. Teste criar uma entrega pelo app
-- 4. Execute novamente a consulta #3 para ver se a entrega foi criada
-- 5. Verifique se a qtd_atual foi reduzida na consulta #4
