# Guia de Configuração - Sistema de Cores e Tons

## Pré-requisitos

1. **Supabase configurado** - Banco de dados PostgreSQL
2. **Autenticação ativa** - Sistema de login funcionando
3. **React Native** - Ambiente de desenvolvimento configurado

## Instalação

### 1. Executar Script SQL

Execute o arquivo `create_colors_table.sql` no seu banco Supabase:

```sql
-- Via Dashboard do Supabase
-- 1. Acesse o SQL Editor
-- 2. Copie o conteúdo do arquivo create_colors_table.sql
-- 3. Execute o script
```

### 2. Verificar Tabelas Criadas

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('colors', 'color_shades');

-- Verificar estrutura das tabelas
\d colors
\d color_shades
```

### 3. Testar com Dados de Exemplo

Execute o arquivo `test_colors_table.sql` para inserir dados de teste:

```sql
-- Insere cores e tons de exemplo
-- Testa constraints e triggers
-- Verifica RLS
```

## Configuração do Frontend

### 1. Verificar Dependências

No `package.json`, certifique-se de que tem:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "react-native-gesture-handler": "^2.x.x",
    "expo-router": "^3.x.x"
  }
}
```

### 2. Configurar Rota

O arquivo `app/cores.tsx` já está configurado. Certifique-se de que a rota está registrada no `app/_layout.tsx`.

### 3. Adicionar ao Menu Principal

No arquivo `app/(tabs)/index.tsx`, a opção "Cores" já foi adicionada ao menu principal.

## Configuração do Backend

### 1. Services no Supabase

Os services `colorsService` e `colorsShadesService` já estão implementados no arquivo `lib/supabase.ts`.

### 2. Tipos TypeScript

As interfaces necessárias já estão definidas:
- `Color`
- `ColorShade`
- `ColorWithShades`

## Testes

### 1. Executar Testes Automatizados

```typescript
// No código do React Native
import { runAllColorsTests } from '@/utils/testColors';

// Executar todos os testes
await runAllColorsTests();
```

### 2. Testes Manuais

1. **Criar Cor**
   - Abrir tela de cores
   - Clicar em "Nova Cor"
   - Inserir nome e salvar

2. **Criar Tom**
   - Expandir uma cor
   - Clicar em "+ Tom"
   - Inserir nome do tom

3. **Editar/Deletar**
   - Testar botões de edição
   - Testar deleção com confirmação

### 3. Verificar Logs

```typescript
// Ativar logs no console
console.log('Verificando logs do sistema de cores...');
```

## Troubleshooting

### Problemas Comuns

1. **Tabelas não criadas**
   ```sql
   -- Verificar se o script foi executado completamente
   SELECT COUNT(*) FROM colors;
   SELECT COUNT(*) FROM color_shades;
   ```

2. **Erro de RLS**
   ```sql
   -- Verificar se as políticas estão ativas
   SELECT * FROM pg_policies WHERE tablename IN ('colors', 'color_shades');
   ```

3. **Erro de autenticação**
   ```typescript
   // Verificar se o usuário está logado
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Usuário:', user);
   ```

### Logs de Debug

```typescript
// Executar debug das tabelas
import { debugColorsTable, debugColorsShadesTable } from '@/lib/supabase';

await debugColorsTable();
await debugColorsShadesTable();
```

## Personalização

### 1. Cores do Interface

No arquivo `app/cores.tsx`, você pode personalizar as cores:

```typescript
const styles = StyleSheet.create({
  // Personalizar cores dos botões
  addButton: {
    backgroundColor: '#007AFF', // Azul padrão
  },
  deleteButton: {
    backgroundColor: '#F44336', // Vermelho
  },
  // ... outras cores
});
```

### 2. Adicionar Campos

Para adicionar novos campos (ex: código hexadecimal):

```sql
-- 1. Adicionar coluna na tabela
ALTER TABLE colors ADD COLUMN hex_code TEXT;

-- 2. Atualizar interface TypeScript
interface Color {
  // ... campos existentes
  hex_code?: string;
}

-- 3. Atualizar formulários no frontend
```

### 3. Validações Customizadas

```typescript
// No service, adicionar validações customizadas
const validateColorName = (name: string): boolean => {
  // Sua lógica de validação
  return name.length >= 2 && name.length <= 50;
};
```

## Monitoramento

### 1. Métricas Básicas

```sql
-- Estatísticas básicas
SELECT 
  COUNT(*) as total_cores,
  (SELECT COUNT(*) FROM color_shades) as total_tons,
  AVG(tons_por_cor.count) as media_tons_por_cor
FROM colors
LEFT JOIN (
  SELECT color_id, COUNT(*) as count
  FROM color_shades
  GROUP BY color_id
) tons_por_cor ON colors.id = tons_por_cor.color_id;
```

### 2. Performance

```sql
-- Verificar performance de consultas
EXPLAIN ANALYZE SELECT * FROM color_shades WHERE color_id = 1;
```

## Backup e Restauração

### Backup

```sql
-- Backup das tabelas
pg_dump -t colors -t color_shades sua_database > colors_backup.sql
```

### Restauração

```sql
-- Restaurar do backup
psql sua_database < colors_backup.sql
```

## Próximos Passos

1. **Integração com outros módulos**
   - Usar cores em pedidos
   - Relacionar com materiais

2. **Funcionalidades avançadas**
   - Seletor de cores visual
   - Importação em massa
   - Relatórios por cor

3. **Otimizações**
   - Cache de dados
   - Paginação
   - Busca avançada

## Suporte

Para problemas ou dúvidas:
1. Verificar logs do console
2. Executar testes automatizados
3. Consultar documentação do Supabase
4. Verificar políticas RLS
