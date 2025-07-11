# Sistema de Pedidos - Atualização com Novos Campos

## Resumo das Alterações

O sistema de pedidos foi atualizado para incluir novos campos na tabela `detalhe_pedido`, permitindo melhor controle e categorização dos itens.

## Novos Campos Adicionados

### Tabela `detalhe_pedido`

1. **`ref` (TEXT)** - Referência ou código do produto
   - Campo opcional para identificar produtos por código/referência
   - Exemplo: "REF001", "ABC123", etc.

2. **`size` (TEXT)** - Tamanho do produto  
   - Campo opcional para especificar tamanho
   - Exemplo: "P", "M", "G", "GG", "38", "40", etc.

3. **`group_id` (BIGINT)** - ID do grupo relacionado
   - Foreign Key para tabela `groups`
   - Permite categorizar produtos por grupos hierárquicos
   - Relacionamento: `ON DELETE SET NULL`

4. **`shade_id` (BIGINT)** - ID do tom/shade da cor
   - Foreign Key para tabela `colors_shades`
   - Permite especificar tons específicos de cores
   - Relacionamento: `ON DELETE SET NULL`

## Estrutura Atualizada

### Schema SQL
```sql
-- Campos existentes
id BIGSERIAL PRIMARY KEY,
qtd_inicial INT NOT NULL CHECK (qtd_inicial > 0),
qtd_atual INT NOT NULL CHECK (qtd_atual >= 0),
valor_un REAL NOT NULL CHECK (valor_un > 0),
cor VARCHAR(100) NOT NULL,
tipo BIGINT NOT NULL REFERENCES tipo_roupa(id) ON DELETE CASCADE,
pedido BIGINT NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- Novos campos adicionados
ref TEXT,
size TEXT,
group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
shade_id BIGINT REFERENCES colors_shades(id) ON DELETE SET NULL
```

### Índices
- `idx_detalhe_pedido_ref` - Para buscas por referência
- `idx_detalhe_pedido_siz` - Para buscas por tamanho
- `idx_detalhe_pedido_group_id` - Para performance nos JOINs com grupos
- `idx_detalhe_pedido_shade_id` - Para performance nos JOINs com tons

## Implementações

### 1. Backend (TypeScript)

#### Interfaces Atualizadas
```typescript
interface DetalhePedido {
  id?: number;
  qtd_inicial: number;
  qtd_atual: number;
  valor_un: number;
  cor: string;
  ref?: string;           // NOVO
  size?: string;           // NOVO
  tipo: number;
  pedido?: number;
  group_id?: number;      // NOVO
  shade_id?: number;      // NOVO
  created_at?: string;
  updated_at?: string;
  // Dados relacionados expandidos
  tipo_roupa?: { id: number; nome: string };
  grupo?: { id: number; name: string };        // NOVO
  shade?: { 
    id: number; 
    name: string; 
    color?: { id: number; name: string } 
  };  // NOVO
}
```

#### Novos Serviços
- `pedidosService` - CRUD completo para pedidos
- `detalhePedidoService` - CRUD completo para detalhes com novos campos
- Função `createWithValidation` que utiliza a função SQL para validações

### 2. Frontend (React Native)

#### Formulário Atualizado
- Campos de entrada para `ref` (referência)
- Campos de entrada para `size` (tamanho)
- Picker para seleção de `group_id` (grupo)
- Picker para seleção de `shade_id` (tom da cor)

#### Exibição Melhorada
- Visualização dos novos campos nos detalhes do pedido
- Indicação do grupo e tom selecionados
- Interface mais rica e informativa

### 3. Validações

#### SQL (Function)
```sql
CREATE OR REPLACE FUNCTION insert_detalhe_pedido(...)
```
- Validação de quantidades
- Validação de existência de grupo
- Validação de existência de shade
- Inserção com tratamento de erros

## Migrations Aplicadas

### Arquivo: `update_detalhe_pedido.sql`
1. Adição das novas colunas
2. Criação das foreign keys
3. Criação dos índices
4. Adição de comentários
5. Criação da view `vw_detalhe_pedido_completo`
6. Criação da função `insert_detalhe_pedido`

## Como Usar

### 1. Criação de Pedido com Novos Campos
```typescript
const detalhe = {
  qtd_inicial: 10,
  qtd_atual: 10,
  valor_un: 29.90,
  cor: 'Azul',
  ref: 'REF001',           // NOVO
  size: 'M',                // NOVO
  tipo: 1,
  pedido: 1,
  group_id: 2,             // NOVO - ID do grupo
  shade_id: 5              // NOVO - ID do tom
};

await detalhePedidoService.createWithValidation(detalhe);
```

### 2. Consulta com Dados Relacionados
A view `vw_detalhe_pedido_completo` facilita consultas:
```sql
SELECT * FROM vw_detalhe_pedido_completo 
WHERE pedido_id = 1;
```

### 3. Interface de Usuário
- No formulário de criação de pedido, os usuários agora podem:
  - Especificar uma referência do produto
  - Escolher o tamanho
  - Selecionar um grupo para categorização
  - Escolher um tom específico da cor

## Benefícios

1. **Melhor Organização**: Grupos hierárquicos para categorização
2. **Controle de Cores**: Tons específicos além da cor base
3. **Identificação**: Referências para facilitar identificação
4. **Flexibilidade**: Tamanhos variados conforme necessidade
5. **Relatórios**: Possibilidade de relatórios mais detalhados
6. **Busca**: Melhores opções de filtro e busca

## Compatibilidade

- ✅ Campos opcionais - não quebra pedidos existentes
- ✅ Foreign keys com `ON DELETE SET NULL` - segurança nos relacionamentos
- ✅ Índices adicionais - performance mantida
- ✅ Interface retrocompatível - funciona com dados antigos

## Próximos Passos

1. Testar a criação de pedidos com os novos campos
2. Validar a integração com grupos e tons
3. Implementar relatórios que utilizem os novos campos
4. Documentar casos de uso específicos
5. Treinar usuários nas novas funcionalidades
