# Sistema de Cores e Tons

## Visão Geral

O sistema de cores e tons permite gerenciar um catálogo hierárquico de cores, onde cada cor pode ter múltiplos tons/variações. Este sistema é útil para controle de estoque, catálogos de produtos, e qualquer aplicação que necessite de organização cromática.

## Estrutura das Tabelas

### Tabela `colors`
- **id**: Chave primária (BIGSERIAL)
- **name**: Nome da cor (TEXT, obrigatório, não pode ser vazio)
- **created_at**: Data de criação (TIMESTAMP)
- **updated_at**: Data de atualização (TIMESTAMP)

### Tabela `color_shades`
- **id**: Chave primária (BIGSERIAL)
- **color_id**: Referência à cor (FK para colors.id)
- **name**: Nome do tom (TEXT, obrigatório, não pode ser vazio)
- **created_at**: Data de criação (TIMESTAMP)
- **updated_at**: Data de atualização (TIMESTAMP)

## Características Implementadas

### 1. Relacionamento Hierárquico
- Cada tom pertence a uma cor (relação 1:N)
- Cascade delete: ao deletar uma cor, todos os tons são deletados automaticamente
- Constraint de unicidade: não pode haver tons com o mesmo nome na mesma cor

### 2. Validações
- Nomes de cores e tons não podem ser vazios ou apenas espaços
- Nomes de tons devem ser únicos por cor
- Verificação de dependências antes de deletar cores

### 3. Triggers
- Auto-atualização do campo `updated_at` em ambas as tabelas
- Execução automática em qualquer UPDATE

### 4. Índices para Performance
- Índice em `colors.name` para buscas rápidas
- Índice em `color_shades.color_id` para relacionamentos
- Índice em `color_shades.name` para buscas de tons

### 5. Row Level Security (RLS)
- Todas as operações (SELECT, INSERT, UPDATE, DELETE) permitidas para usuários autenticados
- Políticas separadas para cada tabela

## Funcionalidades do Frontend

### Tela Principal (cores.tsx)
- Listagem de todas as cores com contagem de tons
- Visualização hierárquica (expandir/recolher)
- Estatísticas (total de cores e tons)
- Controles para expandir/recolher todas as cores

### Operações CRUD

#### Cores
- **Criar**: Modal para inserir nova cor
- **Editar**: Modal para editar cor existente
- **Deletar**: Verificação de dependências (não permite deletar se houver tons)
- **Listar**: Visualização ordenada por nome

#### Tons
- **Criar**: Modal para inserir novo tom em uma cor específica
- **Editar**: Modal para editar tom existente
- **Deletar**: Deleção direta (não há dependências)
- **Listar**: Visualização agrupada por cor

### Recursos Adicionais
- Refresh pull-to-refresh
- Indicadores de carregamento
- Validação de formulários
- Confirmações de deleção
- Sistema de testes integrado

## Backend Services

### colorsService
```typescript
- create(name: string): Promise<Color>
- getAll(): Promise<Color[]>
- getById(id: number): Promise<Color | null>
- update(id: number, name: string): Promise<Color>
- delete(id: number): Promise<void>
- getAllWithShades(): Promise<ColorWithShades[]>
- canDelete(id: number): Promise<boolean>
```

### colorsShadesService
```typescript
- create(color_id: number, name: string): Promise<ColorShade>
- getAll(): Promise<ColorShade[]>
- getByColorId(color_id: number): Promise<ColorShade[]>
- getById(id: number): Promise<ColorShade | null>
- update(id: number, name: string): Promise<ColorShade>
- delete(id: number): Promise<void>
- getAllWithColorInfo(): Promise<(ColorShade & { colorName?: string })[]>
```

## Testes Automatizados

### Testes de Cores
- CRUD básico (criar, ler, atualizar, deletar)
- Validação de campos obrigatórios
- Integração com tons (verificação de dependências)

### Testes de Tons
- CRUD básico
- Validação de campos obrigatórios
- Constraint de unicidade por cor
- Relacionamento com cores

### Execução dos Testes
```typescript
// Executar todos os testes
import { runAllColorsTests } from '@/utils/testColors';
await runAllColorsTests();

// Executar testes específicos
import { testColors, testColorShades } from '@/utils/testColors';
await testColors.runAllTests();
await testColorShades.runAllTests();
```

## Navegação

O sistema está integrado ao menu principal da aplicação:
- **Rota**: `/cores`
- **Ícone**: `color-palette-outline`
- **Título**: "Cores"
- **Subtitle**: "Gerenciar cores e tons"

## Arquivos Relacionados

### Database
- `database/create_colors_table.sql` - Criação das tabelas e configurações
- `database/test_colors_table.sql` - Testes SQL e dados de exemplo

### Frontend
- `app/cores.tsx` - Tela principal do sistema
- `utils/testColors.ts` - Utilitários de teste

### Backend
- `lib/supabase.ts` - Services e interfaces (colorsService, colorsShadesService)

## Exemplos de Uso

### Cores Comuns
- Azul (tons: Azul Claro, Azul Escuro, Azul Marinho)
- Vermelho (tons: Vermelho Claro, Vermelho Escuro, Vermelho Sangue)
- Verde (tons: Verde Claro, Verde Escuro, Verde Limão)

### Casos de Uso
1. **Catálogo de Produtos**: Organizar produtos por cor e tonalidade
2. **Controle de Estoque**: Rastrear quantidades por cor/tom específico
3. **Pedidos**: Especificar cores exatas em pedidos
4. **Relatórios**: Análises por preferências cromáticas

## Considerações Técnicas

### Performance
- Índices otimizados para buscas frequentes
- Consultas eficientes com relacionamentos
- Carregamento lazy de tons (expandir/recolher)

### Segurança
- RLS habilitado em todas as tabelas
- Validação tanto no frontend quanto no backend
- Políticas de acesso baseadas em autenticação

### Escalabilidade
- Estrutura preparada para grandes volumes
- Paginação implementável se necessário
- Arquitetura modular para expansões futuras

## Manutenção

### Backup
- Incluir ambas as tabelas em rotinas de backup
- Atenção especial para a constraint de cascade delete

### Monitoramento
- Acompanhar performance das consultas hierárquicas
- Monitorar uso de índices
- Verificar logs de RLS

### Atualizações
- Testar sempre em ambiente de desenvolvimento
- Verificar compatibilidade com versões do Supabase
- Validar integridade referencial após mudanças
