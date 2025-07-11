# 🔧 GUIA RÁPIDO - RESOLVER ERRO DE FUNÇÃO SQL

## ❌ Problema Identificado
O erro ocorre porque a função `insert_detalhe_pedido` não existe no banco de dados. Isso acontece quando o script SQL de atualização ainda não foi executado.

```
Erro: Could not find the function public.insert_detalhe_pedido
```

## ✅ Soluções Imediatas

### Opção 1: Script Simplificado (RECOMENDADO)
Execute o script simplificado que adiciona apenas os campos necessários:

```sql
-- Executar no banco de dados
\i database/add_new_fields_simple.sql
```

### Opção 2: Verificar Estrutura Atual
Primeiro verifique o que já existe na tabela:

```sql
-- Verificar estrutura atual
\i database/check_table_structure.sql
```

### Opção 3: Adicionar Campos Manualmente
Se preferir, execute os comandos SQL diretamente:

```sql
-- Adicionar colunas básicas
ALTER TABLE detalhe_pedido 
ADD COLUMN IF NOT EXISTS ref TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS group_id BIGINT,
ADD COLUMN IF NOT EXISTS shade_id BIGINT;

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_ref ON detalhe_pedido(ref);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_siz ON detalhe_pedido(size);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_group_id ON detalhe_pedido(group_id);
CREATE INDEX IF NOT EXISTS idx_detalhe_pedido_shade_id ON detalhe_pedido(shade_id);
```

## 🧪 Testando a Correção

### Na Tela de Pedidos:
1. **Abra a tela de pedidos**
2. **Clique em "Teste Direto"** (botão roxo) - Este teste não depende da função SQL
3. **Verifique se o pedido é criado** com os novos campos

### Teste Manual:
1. **Crie um novo pedido** usando o formulário
2. **Preencha os novos campos**:
   - Referência: `TEST001`
   - Tamanho: `M`
   - Selecione um grupo
   - Selecione um tom de cor
3. **Salve o pedido**

## 🔍 Verificações

### 1. Verificar se os campos foram adicionados:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'detalhe_pedido' 
  AND column_name IN ('ref', 'size', 'group_id', 'shade_id');
```

### 2. Testar inserção direta:
```sql
INSERT INTO detalhe_pedido (
    qtd_inicial, qtd_atual, valor_un, cor, ref, size, tipo, pedido
) VALUES (
    1, 1, 10.00, 'Teste', 'REF001', 'M', 1, 1
);
```

## 🚨 Se Ainda Houver Problemas

### 1. Verificar Permissões
Certifique-se de que o usuário tem permissões para alterar a tabela:

```sql
GRANT ALL PRIVILEGES ON TABLE detalhe_pedido TO seu_usuario;
```

### 2. Verificar se a Tabela Existe
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'detalhe_pedido';
```

### 3. Verificar Logs do Banco
Procure por erros nos logs do PostgreSQL/Supabase.

## ✅ Resultado Esperado

Após executar a correção, você deve conseguir:
- ✅ Criar pedidos com referência e tamanho
- ✅ Selecionar grupos para os itens
- ✅ Selecionar tons específicos de cores
- ✅ Ver os novos campos nos detalhes do pedido
- ✅ Usar todos os botões de teste sem erros

## 📞 Próximos Passos

1. **Execute** um dos scripts de correção
2. **Teste** a funcionalidade com o botão "Teste Direto"
3. **Crie** um pedido real para validar
4. **Verifique** se os dados aparecem corretamente nos detalhes

---

**Nota:** O sistema foi projetado para funcionar com inserção direta mesmo sem a função SQL, então depois da correção dos campos, tudo deve funcionar normalmente!
