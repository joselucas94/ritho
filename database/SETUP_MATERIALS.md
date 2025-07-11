# Script para executar a criação da tabela materials no Supabase

## Instruções:

1. **Abra o Supabase Dashboard**
   - Acesse: https://app.supabase.io/
   - Faça login na sua conta
   - Selecione o projeto ritho

2. **Abra o SQL Editor**
   - No menu lateral esquerdo, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script SQL**
   - Copie todo o conteúdo do arquivo `create_materials_table.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique se a tabela foi criada**
   - Vá para "Table Editor" no menu lateral
   - Verifique se a tabela "materials" aparece na lista

5. **Teste a tabela**
   - Volte para o SQL Editor
   - Execute o script `test_materials_table.sql` para verificar se tudo está funcionando

## Verificação rápida:

Execute este comando no SQL Editor para verificar se a tabela existe:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'materials';
```

## Inserir dados de teste:

```sql
INSERT INTO materials (name) VALUES 
    ('Algodão'),
    ('Poliéster'),
    ('Viscose'),
    ('Lã'),
    ('Linho'),
    ('Seda'),
    ('Elastano'),
    ('Nylon');
```

## Verificar dados:

```sql
SELECT * FROM materials ORDER BY created_at DESC;
```

Se a tabela não existir, execute o arquivo `create_materials_table.sql` primeiro.
