-- Criar tabela groups para gerenciar grupos hierárquicos
CREATE TABLE IF NOT EXISTS groups (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_parent_id ON groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at);

-- Criar constraint para evitar nomes duplicados no mesmo nível hierárquico
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_name_parent_unique 
    ON groups(name, COALESCE(parent_id, 0));

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_groups_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_groups_updated_at 
    BEFORE UPDATE ON groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_groups_updated_at_column();

-- Função para prevenir referências circulares
CREATE OR REPLACE FUNCTION prevent_circular_reference()
RETURNS TRIGGER AS $$
DECLARE
    current_parent_id BIGINT;
    check_id BIGINT;
BEGIN
    -- Se não tem parent_id, não há problema
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Não pode ser pai de si mesmo
    IF NEW.id = NEW.parent_id THEN
        RAISE EXCEPTION 'Um grupo não pode ser pai de si mesmo';
    END IF;
    
    -- Verificar se não cria referência circular
    check_id := NEW.parent_id;
    
    WHILE check_id IS NOT NULL LOOP
        -- Se encontrar o próprio grupo na hierarquia, é circular
        IF check_id = NEW.id THEN
            RAISE EXCEPTION 'Referência circular detectada: grupo não pode ser descendente de si mesmo';
        END IF;
        
        -- Pegar o próximo pai na hierarquia
        SELECT parent_id INTO current_parent_id 
        FROM groups 
        WHERE id = check_id;
        
        check_id := current_parent_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para prevenir referências circulares
CREATE TRIGGER prevent_circular_reference_trigger
    BEFORE INSERT OR UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION prevent_circular_reference();

-- Política de segurança (RLS) - permitir acesso a todos os usuários autenticados
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela groups
CREATE POLICY "Authenticated users can view all groups" ON groups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert groups" ON groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update groups" ON groups
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete groups" ON groups
    FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns grupos de exemplo (opcional)
INSERT INTO groups (name, parent_id) VALUES 
    ('Roupas Masculinas', NULL),
    ('Roupas Femininas', NULL),
    ('Roupas Infantis', NULL);

-- Inserir subgrupos para demonstrar hierarquia
INSERT INTO groups (name, parent_id) VALUES 
    ('Camisas', (SELECT id FROM groups WHERE name = 'Roupas Masculinas' AND parent_id IS NULL)),
    ('Calças', (SELECT id FROM groups WHERE name = 'Roupas Masculinas' AND parent_id IS NULL)),
    ('Vestidos', (SELECT id FROM groups WHERE name = 'Roupas Femininas' AND parent_id IS NULL)),
    ('Saias', (SELECT id FROM groups WHERE name = 'Roupas Femininas' AND parent_id IS NULL)),
    ('Camisetas', (SELECT id FROM groups WHERE name = 'Roupas Infantis' AND parent_id IS NULL));

-- Função auxiliar para visualizar hierarquia
CREATE OR REPLACE FUNCTION get_group_hierarchy()
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    parent_id BIGINT,
    level INTEGER,
    path TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE group_hierarchy AS (
        -- Grupos raiz (nível 0)
        SELECT 
            g.id,
            g.name,
            g.parent_id,
            0 as level,
            g.name::TEXT as path
        FROM groups g
        WHERE g.parent_id IS NULL
        
        UNION ALL
        
        -- Subgrupos (níveis > 0)
        SELECT 
            g.id,
            g.name,
            g.parent_id,
            gh.level + 1,
            (gh.path || ' > ' || g.name)::TEXT
        FROM groups g
        JOIN group_hierarchy gh ON g.parent_id = gh.id
    )
    SELECT 
        gh.id,
        gh.name,
        gh.parent_id,
        gh.level,
        gh.path
    FROM group_hierarchy gh
    ORDER BY gh.path;
END;
$$ LANGUAGE plpgsql;

-- Para visualizar a hierarquia, execute: SELECT * FROM get_group_hierarchy();
