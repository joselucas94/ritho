# Configuração do Banco de Dados - Tipos de Roupas

## Como executar o script SQL no Supabase

1. **Acesse o Dashboard do Supabase:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o Editor SQL:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script:**
   - Copie todo o conteúdo do arquivo `create_tipo_roupa_table.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique se a tabela foi criada:**
   - Vá para "Table Editor" no menu lateral
   - Você deve ver a tabela `tipo_roupa` listada

## Estrutura da Tabela Tipo_Roupa

A tabela `tipo_roupa` possui as seguintes colunas:

- **id**: BIGSERIAL (Chave primária, auto-incremento)
- **name**: VARCHAR(255) (Nome do tipo de roupa, obrigatório, único)
- **created_at**: TIMESTAMP (Data de criação, automática)
- **updated_at**: TIMESTAMP (Data de atualização, automática)

## Funcionalidades Implementadas

### 📝 **Formulário de Cadastro/Edição:**
- Campo para nome do tipo de roupa
- Validação de campos obrigatórios
- Verificação de nomes duplicados (case-insensitive)
- Modo de edição para alterar tipos existentes

### 📋 **Lista de Tipos:**
- Exibição de todos os tipos de roupas
- Design moderno com cards
- Informações de data de criação e atualização
- Pull-to-refresh para atualizar dados

### ⚙️ **Ações Disponíveis:**
- ➕ **Adicionar** novo tipo de roupa
- ✏️ **Editar** tipo existente
- 🗑️ **Excluir** tipo (com confirmação)
- 🔄 **Atualizar** lista

### 🔒 **Recursos de Segurança:**
- **Row Level Security (RLS)**: Habilitado
- **Políticas de Acesso**: Usuários autenticados podem acessar todos os tipos
- **Trigger**: Atualização automática do campo `updated_at`
- **Constraint UNIQUE**: Impede nomes duplicados

### 🎨 **Interface:**
- Design responsivo
- Suporte a tema claro/escuro
- Ícones temáticos de roupas
- Cores verde suave (#96CEB4)
- Animações e feedbacks visuais

## Dados Pré-cadastrados

O script já inclui alguns tipos de roupas comuns:

- Camiseta
- Calça Jeans
- Vestido
- Blusa
- Shorts
- Saia
- Jaqueta
- Moletom
- Camisa Social
- Bermuda
- Top
- Legging
- Casaco
- Regata
- Polo

## Testando a Tabela

Após executar o script, você pode testar inserindo um tipo de roupa manualmente:

```sql
INSERT INTO tipo_roupa (name) 
VALUES ('Suéter');
```

## Exemplos de Tipos de Roupas

### **Roupas Femininas:**
- Vestido
- Saia
- Blusa
- Top
- Legging

### **Roupas Masculinas:**
- Camisa Social
- Polo
- Bermuda
- Calça Social

### **Roupas Unissex:**
- Camiseta
- Calça Jeans
- Shorts
- Jaqueta
- Moletom

### **Roupas de Inverno:**
- Casaco
- Suéter
- Blusa de Frio
- Jaqueta

### **Roupas de Verão:**
- Regata
- Shorts
- Vestido Leve
- Camiseta

**Nota**: Você pode adicionar quantos tipos de roupas precisar através da aplicação.
