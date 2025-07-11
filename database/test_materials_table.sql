-- Script para testar se a tabela materials existe e se as permissões estão corretas
-- Execute este script no console do Supabase para verificar

-- 1. Verificar se a tabela existe
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'materials';

-- 2. Verificar as colunas da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'materials' 
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
WHERE tablename = 'materials';

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'materials' 
AND schemaname = 'public';

-- 5. Testar inserção manual (execute com usuário autenticado)
-- INSERT INTO materials (name) VALUES ('Teste Material');

-- 6. Testar seleção
-- SELECT * FROM materials;

-- 7. Verificar se existem dados na tabela
SELECT COUNT(*) as total_materials FROM materials;

-- 8. Verificar triggers
SELECT 
    event_object_table,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'materials';
