# Atualização: Exibição de Pedidos em Aberto

## Objetivo
Modificar a tela de pedidos para exibir apenas pedidos que têm itens pendentes de entrega (qtd_atual > 0).

## Alterações Implementadas

### 1. Modificação da função `loadPedidos()`
- **Antes**: Carregava todos os pedidos usando `pedidosService.getAll()`
- **Depois**: 
  - Busca pedidos diretamente com query personalizada
  - Inclui dados relacionados (store, fornecedor, detalhe_pedido)
  - Filtra apenas pedidos que têm pelo menos um item com `qtd_atual > 0`

### 2. Atualização do título da tela
- **Antes**: "Pedidos"
- **Depois**: "Pedidos em Aberto"

### 3. Melhoria na exibição dos cards de pedidos
- **Adicionado**: Indicador de quantos itens estão pendentes de entrega
- **Estilo**: Texto em vermelho (`#FF6B6B`) para destacar itens pendentes

### 4. Atualização das mensagens de estado vazio
- **Antes**: "Nenhum pedido para {loja}"
- **Depois**: "Nenhum pedido em aberto para {loja}"
- **Adicionado**: Explicação de que apenas pedidos com itens pendentes são exibidos

## Código Implementado

### Query SQL Personalizada
```sql
SELECT *,
  store:loja (nome),
  fornecedor_data:fornecedor (nome),
  detalhe_pedido (
    id, qtd_inicial, qtd_atual, valor_un, cor, ref, size,
    tipo_roupa:tipo (nome),
    grupo:group_id (name),
    shade:shade_id (name, color:color_id (name))
  )
FROM pedido
ORDER BY created_at DESC
```

### Filtro JavaScript
```javascript
const pedidosEmAberto = (data || []).filter(pedido => {
  return pedido.detalhe_pedido && 
         pedido.detalhe_pedido.some((item: any) => item.qtd_atual > 0);
});
```

### Indicador Visual
```jsx
<ThemedText style={styles.pedidoStatus}>
  {item.detalhe_pedido.filter(detail => detail.qtd_atual > 0).length} itens pendentes
</ThemedText>
```

## Benefícios

1. **Foco em ações pendentes**: Usuários veem apenas pedidos que requerem ação
2. **Melhor UX**: Interface mais limpa, sem pedidos já finalizados
3. **Informação útil**: Contador de itens pendentes por pedido
4. **Performance**: Reduz a quantidade de dados exibidos na tela

## Comportamento

- **Pedidos completamente entregues**: Não aparecem na listagem
- **Pedidos parcialmente entregues**: Aparecem com contador de itens pendentes
- **Pedidos novos**: Aparecem normalmente com todos os itens pendentes
- **Atualização automática**: Quando um pedido é completamente entregue, ele sai da listagem automaticamente na próxima atualização

## Testes Recomendados

1. Criar um pedido novo → Deve aparecer na lista
2. Entregar alguns itens → Pedido continua na lista com contador atualizado
3. Entregar todos os itens → Pedido deve sair da lista
4. Verificar contador de itens pendentes → Deve mostrar número correto
5. Testar mensagem de lista vazia → Deve explicar sobre pedidos em aberto

## Arquivos Modificados

- `app/pedidos.tsx` - Função `loadPedidos()`, renderização de cards, estilos
- `PEDIDOS_ABERTOS_UPDATE.md` - Esta documentação

Data: 11/07/2025
