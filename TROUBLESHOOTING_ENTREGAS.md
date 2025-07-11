# Troubleshooting - Sistema de Entregas

## Problema: Quantidade não está sendo subtraída

### Possíveis Causas e Soluções

#### 1. **Triggers não estão instalados**
**Verificar:**
```sql
SELECT trigger_name, event_manipulation, action_timing 
FROM information_schema.triggers 
WHERE event_object_table = 'delivery';
```

**Deve retornar:**
- `update_qtd_atual_on_delivery_trigger` (AFTER INSERT)
- `revert_qtd_atual_on_delivery_delete_trigger` (AFTER DELETE)  
- `validate_delivery_update_trigger` (BEFORE UPDATE)

**Solução:** Execute o script `create_delivery_table.sql` no Supabase SQL Editor.

#### 2. **Tabela delivery não existe**
**Verificar:**
```sql
\d delivery
```

**Solução:** Execute o script de criação da tabela.

#### 3. **Dados não estão sendo enviados corretamente**
**Verificar no console do navegador:**
- Logs de `Criando entrega:` devem mostrar `qtd`, `pedido_item`, `user`
- Logs de `Entrega criada com sucesso:` confirmam inserção

**Solução:** Verifique se todos os campos obrigatórios estão sendo enviados.

#### 4. **Política RLS bloqueando triggers**
**Verificar:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'delivery';
```

**Solução:** Triggers executam com privilégios de superusuário, não deveria ser afetado por RLS.

#### 5. **Erro nos triggers**
**Verificar logs:**
```sql
-- Execute uma inserção manualmente para testar
INSERT INTO delivery (qtd, pedido_item, "user") 
VALUES (1, [ID_DO_ITEM], '[USER_UUID]');
```

Se houver erro, será mostrado na resposta.

### Passos para Debug

#### Passo 1: Verificar estrutura
```sql
-- Verificar se tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('delivery', 'detalhe_pedido') 
AND table_schema = 'public';
```

#### Passo 2: Verificar dados de teste
```sql
-- Buscar um item para teste
SELECT id, qtd_inicial, qtd_atual, cor 
FROM detalhe_pedido 
WHERE qtd_atual > 0 
LIMIT 1;
```

#### Passo 3: Teste manual de inserção
```sql
-- Substituir pelos valores reais
INSERT INTO delivery (qtd, pedido_item, "user") 
VALUES (1, [ITEM_ID], '[USER_ID]');

-- Verificar se qtd_atual foi reduzida
SELECT qtd_atual FROM detalhe_pedido WHERE id = [ITEM_ID];
```

#### Passo 4: Verificar logs da aplicação
Abra o DevTools do navegador e:
1. Vá para a aba Console
2. Tente registrar uma entrega
3. Verifique os logs de `Criando entrega:` e `Entrega criada com sucesso:`

### Teste Rápido via App

1. **Abra a tela de Pedidos**
2. **Selecione um pedido com itens disponíveis** (qtd_atual > 0)
3. **Clique em "Receber" em um item**
4. **Digite uma quantidade menor que a disponível**
5. **Confirme o recebimento**
6. **Verifique se a quantidade foi reduzida** (atualize a tela)

### Comandos de Debug Úteis

```sql
-- Ver todas as entregas
SELECT d.*, dp.qtd_atual 
FROM delivery d 
JOIN detalhe_pedido dp ON d.pedido_item = dp.id;

-- Ver histórico de um item específico
SELECT d.created_at, d.qtd, dp.qtd_atual 
FROM delivery d 
JOIN detalhe_pedido dp ON d.pedido_item = dp.id 
WHERE dp.id = [ITEM_ID] 
ORDER BY d.created_at;

-- Resetar quantidade de um item (CUIDADO!)
UPDATE detalhe_pedido 
SET qtd_atual = qtd_inicial 
WHERE id = [ITEM_ID];
```

### Resultado Esperado

Após registrar uma entrega de quantidade X:
- Nova linha deve aparecer na tabela `delivery`
- Campo `qtd_atual` do `detalhe_pedido` deve ser reduzido em X
- App deve mostrar a nova quantidade disponível

### Se nada funcionar

1. **Remover e recriar triggers:**
```sql
DROP TRIGGER IF EXISTS update_qtd_atual_on_delivery_trigger ON delivery;
DROP TRIGGER IF EXISTS revert_qtd_atual_on_delivery_delete_trigger ON delivery;
DROP TRIGGER IF EXISTS validate_delivery_update_trigger ON delivery;
```

2. **Executar novamente o script `create_delivery_table.sql`**

3. **Testar manualmente** com comandos SQL diretos

4. **Verificar se o usuário tem as permissões necessárias** no Supabase
