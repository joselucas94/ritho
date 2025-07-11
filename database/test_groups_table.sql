-- Script para testar a funcionalidade de grupos

-- 1. Verificar se a tabela existe
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'groups';

-- 2. Verificar as colunas da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar as políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'groups';

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'groups' 
AND schemaname = 'public';

-- 5. Verificar constraints e índices
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'groups'::regclass;

-- 6. Verificar triggers
SELECT 
    event_object_table,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'groups';

-- 7. Verificar se existem dados na tabela
SELECT COUNT(*) as total_groups FROM groups;

-- 8. Visualizar hierarquia (se existir dados)
SELECT * FROM get_group_hierarchy();

-- 9. Testar inserção de grupo raiz
INSERT INTO groups (name) VALUES ('Teste Grupo Raiz');

-- 10. Testar inserção de subgrupo
INSERT INTO groups (name, parent_id) VALUES 
('Teste Subgrupo', (SELECT id FROM groups WHERE name = 'Teste Grupo Raiz' LIMIT 1));

-- 11. Verificar hierarquia após inserção
SELECT * FROM get_group_hierarchy();

-- 12. Testar prevenção de referência circular (deve falhar)
-- UPDATE groups SET parent_id = id WHERE name = 'Teste Grupo Raiz';

-- 13. Testar constraint de nome único no mesmo nível (deve falhar)
-- INSERT INTO groups (name) VALUES ('Teste Grupo Raiz');

-- 14. Limpar dados de teste
DELETE FROM groups WHERE name LIKE 'Teste%';

-- 15. Verificar limpeza
SELECT COUNT(*) as total_groups_after_cleanup FROM groups;
