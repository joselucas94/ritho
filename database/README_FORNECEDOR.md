# Configuração do Banco de Dados - Fornecedores

## Como executar o script SQL no Supabase

1. **Acesse o Dashboard do Supabase:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o Editor SQL:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script:**
   - Copie todo o conteúdo do arquivo `create_fornecedor_table.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique se a tabela foi criada:**
   - Vá para "Table Editor" no menu lateral
   - Você deve ver a tabela `fornecedor` listada

## Estrutura da Tabela Fornecedor

A tabela `fornecedor` possui as seguintes colunas:

- **id**: BIGSERIAL (Chave primária, auto-incremento)
- **name**: VARCHAR(255) (Nome do fornecedor, obrigatório)
- **cnpj**: VARCHAR(18) (CNPJ formatado XX.XXX.XXX/XXXX-XX, único)
- **created_at**: TIMESTAMP (Data de criação, automática)
- **updated_at**: TIMESTAMP (Data de atualização, automática)

## Funcionalidades Implementadas

### 🎭 **Máscara de CNPJ**
- Formatação automática durante a digitação
- Formato: `XX.XXX.XXX/XXXX-XX`
- Aceita apenas números
- Limita a 18 caracteres (incluindo formatação)

### ✅ **Validação de CNPJ**
- Validação matemática dos dígitos verificadores
- Verificação de CNPJs com todos os dígitos iguais
- Feedback visual (borda vermelha para CNPJ inválido)
- Validação antes de salvar no banco

### 🔐 **Recursos de Segurança**
- **Row Level Security (RLS)**: Habilitado
- **Políticas de Acesso**: Usuários autenticados podem acessar todos os fornecedores
- **Trigger**: Atualização automática do campo `updated_at`
- **Constraint UNIQUE**: Impede CNPJs duplicados

## Testando a Tabela

Após executar o script, você pode testar inserindo um fornecedor manualmente:

```sql
INSERT INTO fornecedor (name, cnpj) 
VALUES ('Fornecedor Teste', '11.222.333/0001-81');
```

## Algoritmo de Validação de CNPJ

O CNPJ é validado usando o algoritmo oficial:

1. **Verifica se tem 14 dígitos**
2. **Verifica se não são todos iguais**
3. **Calcula o primeiro dígito verificador**
4. **Calcula o segundo dígito verificador**
5. **Compara com os dígitos informados**

## Exemplos de CNPJs Válidos para Teste

- `11.222.333/0001-81`
- `11.444.777/0001-61`
- `12.345.678/0001-95`

**Nota**: Estes são CNPJs com formatação válida apenas para teste. Use CNPJs reais em produção.
