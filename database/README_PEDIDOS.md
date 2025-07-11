# Configuração do Banco de Dados - Pedidos

## Como executar o script SQL no Supabase

1. **Acesse o Dashboard do Supabase:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o Editor SQL:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script:**
   - Copie todo o conteúdo do arquivo `create_pedido_tables.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

4. **Verifique se as tabelas foram criadas:**
   - Vá para "Table Editor" no menu lateral
   - Você deve ver as tabelas `pedido` e `detalhe_pedido` listadas

## Estrutura das Tabelas

### Tabela `pedido`

- **id**: BIGSERIAL (Chave primária, auto-incremento)
- **loja**: BIGINT (Referência para tabela store, obrigatório)
- **fornecedor**: BIGINT (Referência para tabela fornecedor, obrigatório)
- **created_at**: TIMESTAMP (Data de criação, automática)
- **updated_at**: TIMESTAMP (Data de atualização, automática)

### Tabela `detalhe_pedido`

- **id**: BIGSERIAL (Chave primária, auto-incremento)
- **qtd_inicial**: INT (Quantidade inicial, obrigatório, > 0)
- **qtd_atual**: INT (Quantidade atual, obrigatório, >= 0)
- **valor_un**: REAL (Valor unitário, obrigatório, > 0)
- **cor**: VARCHAR(100) (Cor da peça, obrigatório)
- **tipo**: BIGINT (Referência para tipo_roupa, obrigatório)
- **pedido**: BIGINT (Referência para pedido, obrigatório)
- **created_at**: TIMESTAMP (Data de criação, automática)
- **updated_at**: TIMESTAMP (Data de atualização, automática)

## Funcionalidades Implementadas

### 📝 **Criação de Pedidos:**

- Seleção de loja (apenas as lojas do usuário logado)
- Seleção de fornecedor
- Criação de múltiplos itens por pedido
- Validação de dados obrigatórios
- Cálculo automático de subtotais e total

### 🛍️ **Itens do Pedido:**

- Quantidade inicial e atual (inicialmente iguais)
- Valor unitário com formatação monetária
- Cor personalizada
- Tipo de roupa (seleção das opções cadastradas)
- Botão para adicionar/remover itens
- Validação de quantidade > 0 e valor > 0

### 📋 **Lista de Pedidos:**

- Visualização de todos os pedidos
- Informações de loja, fornecedor e data
- Cálculo e exibição do valor total
- Design moderno com cards
- Pull-to-refresh para atualizar dados

### 🔍 **Detalhes do Pedido:**

- Modal com informações completas
- Lista detalhada de todos os itens
- Valores formatados em moeda brasileira
- Informações de quantidade inicial e atual

### 🔒 **Recursos de Segurança:**

- **Row Level Security (RLS)**: Habilitado
- **Políticas de Acesso**: Usuários autenticados podem acessar todos os pedidos
- **Triggers**: Atualização automática de `updated_at`
- **Constraints**: Validação de quantidades e valores
- **Integridade Referencial**: Chaves estrangeiras com CASCADE

### 🎨 **Interface:**

- Design responsivo
- Suporte a tema claro/escuro
- Cores temáticas (amarelo #FECA57)
- Formulário intuitivo com picker/dropdown
- Formatação monetária brasileira
- Validações em tempo real

## Recursos Avançados

### ✅ **Validações Implementadas:**

- Quantidade inicial deve ser > 0
- Quantidade atual deve ser >= 0 e <= quantidade inicial
- Valor unitário deve ser > 0
- Cor é obrigatória
- Tipo de roupa é obrigatório
- Loja e fornecedor são obrigatórios

### 🔄 **Funcionalidades Futuras:**

- **Controle de Estoque**: qtd_atual pode ser decrementada conforme entregas
- **Status do Pedido**: Pendente, Em Andamento, Entregue
- **Histórico de Alterações**: Log de mudanças nas quantidades
- **Relatórios**: Análises de compras por período/fornecedor

## Testando as Tabelas

### **Pré-requisitos:**
Certifique-se de que as seguintes tabelas existem:
- `store` (lojas)
- `fornecedor` (fornecedores)  
- `tipo_roupa` (tipos de roupas)

### **Teste Manual:**

```sql
-- Inserir um pedido de exemplo
INSERT INTO pedido (loja, fornecedor) 
VALUES (1, 1);

-- Inserir itens do pedido
INSERT INTO detalhe_pedido (qtd_inicial, qtd_atual, valor_un, cor, tipo, pedido)
VALUES 
  (10, 10, 25.50, 'Azul', 1, 1),
  (5, 5, 45.00, 'Vermelho', 2, 1);
```

## Dependências

### **Pacotes NPM Instalados:**
- `@react-native-picker/picker`: Para seleção de opções (dropdowns)

### **Componentes Utilizados:**
- Modal para exibição de detalhes
- ScrollView para formulários longos
- FlatList para listas
- TouchableOpacity para interações

**Nota**: A tela de pedidos é a funcionalidade principal do sistema, permitindo o controle completo do ciclo de compras da loja de roupas.
