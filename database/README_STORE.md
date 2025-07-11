# Configuração do Banco de Dados - Lojas

## Como executar o script SQL no Supabase

1. **Acesse o Dashboard do Supabase:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o Editor SQL:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script:**
   - Copie todo o conteúdo do arquivo `create_store_table.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique se a tabela foi criada:**
   - Vá para "Table Editor" no menu lateral
   - Você deve ver a tabela `store` listada

## Estrutura da Tabela Store

A tabela `store` possui as seguintes colunas:

- **id**: BIGSERIAL (Chave primária, auto-incremento)
- **nome**: VARCHAR(255) (Nome da loja, obrigatório)
- **owner**: UUID (ID do usuário proprietário, referência para auth.users)
- **created_at**: TIMESTAMP (Data de criação, automática)
- **updated_at**: TIMESTAMP (Data de atualização, automática)

## Recursos de Segurança

- **Row Level Security (RLS)**: Habilitado
- **Políticas de Acesso**: Usuários só podem acessar suas próprias lojas
- **Trigger**: Atualização automática do campo `updated_at`

## Testando a Tabela

Após executar o script, você pode testar inserindo uma loja manualmente:

```sql
INSERT INTO store (nome, owner) 
VALUES ('Minha Loja', auth.uid());
```

**Importante**: Execute este comando apenas se estiver logado no Supabase Dashboard.
