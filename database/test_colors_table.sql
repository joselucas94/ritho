-- ===========================================
-- TESTE DAS TABELAS DE CORES E TONS
-- ===========================================

-- Limpar dados existentes (cuidado em produção)
DELETE FROM color_shades;
DELETE FROM colors;

-- Resetar sequências
ALTER SEQUENCE colors_id_seq RESTART WITH 1;
ALTER SEQUENCE color_shades_id_seq RESTART WITH 1;

-- Inserir cores de teste
INSERT INTO colors (name) VALUES
    ('Azul'),
    ('Vermelho'),
    ('Verde'),
    ('Amarelo'),
    ('Preto'),
    ('Branco'),
    ('Rosa'),
    ('Roxo'),
    ('Laranja'),
    ('Marrom');

-- Inserir tons de teste
INSERT INTO color_shades (color_id, name) VALUES
    -- Azul
    (1, 'Azul Claro'),
    (1, 'Azul Escuro'),
    (1, 'Azul Marinho'),
    (1, 'Azul Bebê'),
    (1, 'Azul Turquesa'),
    
    -- Vermelho
    (2, 'Vermelho Claro'),
    (2, 'Vermelho Escuro'),
    (2, 'Vermelho Sangue'),
    (2, 'Vermelho Cereja'),
    
    -- Verde
    (3, 'Verde Claro'),
    (3, 'Verde Escuro'),
    (3, 'Verde Limão'),
    (3, 'Verde Floresta'),
    (3, 'Verde Água'),
    
    -- Amarelo
    (4, 'Amarelo Claro'),
    (4, 'Amarelo Escuro'),
    (4, 'Amarelo Ouro'),
    (4, 'Amarelo Canário'),
    
    -- Preto
    (5, 'Preto Fosco'),
    (5, 'Preto Brilhante'),
    
    -- Branco
    (6, 'Branco Puro'),
    (6, 'Branco Gelo'),
    (6, 'Branco Pérola'),
    
    -- Rosa
    (7, 'Rosa Claro'),
    (7, 'Rosa Escuro'),
    (7, 'Rosa Choque'),
    (7, 'Rosa Bebê'),
    
    -- Roxo
    (8, 'Roxo Claro'),
    (8, 'Roxo Escuro'),
    (8, 'Roxo Violeta'),
    
    -- Laranja
    (9, 'Laranja Claro'),
    (9, 'Laranja Escuro'),
    (9, 'Laranja Neon'),
    
    -- Marrom
    (10, 'Marrom Claro'),
    (10, 'Marrom Escuro'),
    (10, 'Marrom Café');

-- Verificar dados inseridos
SELECT 
    c.id,
    c.name as cor,
    COUNT(cs.id) as total_tons
FROM colors c
LEFT JOIN color_shades cs ON c.id = cs.color_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Verificar tons por cor
SELECT 
    c.name as cor,
    cs.name as tom,
    cs.created_at
FROM colors c
JOIN color_shades cs ON c.id = cs.color_id
ORDER BY c.name, cs.name;

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

-- Testar constraint de nome único por cor
-- Esta inserção deve falhar
INSERT INTO color_shades (color_id, name) VALUES (1, 'Azul Claro');

-- Testar constraint de nome não vazio
-- Esta inserção deve falhar
INSERT INTO colors (name) VALUES ('');

-- Testar constraint de nome de tom não vazio
-- Esta inserção deve falhar
INSERT INTO color_shades (color_id, name) VALUES (1, '');

-- Verificar se triggers estão funcionando
UPDATE colors SET name = 'Azul Modificado' WHERE id = 1;
SELECT id, name, created_at, updated_at FROM colors WHERE id = 1;

UPDATE color_shades SET name = 'Azul Claro Modificado' WHERE id = 1;
SELECT id, name, created_at, updated_at FROM color_shades WHERE id = 1;

-- Testar cascade delete
-- Criar uma cor temporária com tons
INSERT INTO colors (name) VALUES ('Cor Temporária');
INSERT INTO color_shades (color_id, name) VALUES 
    ((SELECT id FROM colors WHERE name = 'Cor Temporária'), 'Tom Temporário 1'),
    ((SELECT id FROM colors WHERE name = 'Cor Temporária'), 'Tom Temporário 2');

-- Verificar se os tons foram criados
SELECT c.name as cor, cs.name as tom 
FROM colors c 
JOIN color_shades cs ON c.id = cs.color_id 
WHERE c.name = 'Cor Temporária';

-- Deletar a cor (deve deletar os tons automaticamente)
DELETE FROM colors WHERE name = 'Cor Temporária';

-- Verificar se os tons foram deletados
SELECT c.name as cor, cs.name as tom 
FROM colors c 
JOIN color_shades cs ON c.id = cs.color_id 
WHERE c.name = 'Cor Temporária';

COMMIT;
