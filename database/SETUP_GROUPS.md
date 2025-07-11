# Configuração do Sistema de Grupos

## Pré-requisitos

1. **Banco de dados Supabase configurado**
2. **Tabela materials já criada** (se ainda não foi)
3. **Acesso ao Supabase Dashboard**

## Instruções de Instalação

### 1. Criar a Tabela Groups

1. **Abra o Supabase Dashboard**
   - Acesse <https://app.supabase.io/>
   - Faça login e selecione o projeto ritho

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o script de criação**
   - Copie todo o conteúdo do arquivo `create_groups_table.sql`
   - Cole no editor SQL
   - Clique em "Run" para executar

### 2. Verificar a Instalação

1. **Execute o script de teste**
   - Abra uma nova query no SQL Editor
   - Copie e cole o conteúdo de `test_groups_table.sql`
   - Execute para verificar se tudo foi criado corretamente

2. **Verificar no Table Editor**
   - Vá para "Table Editor" no menu lateral
   - Verifique se a tabela "groups" aparece na lista

### 3. Testar a Aplicação

1. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run start
   ```

2. **Navegue para a tela de grupos**
   - Abra a aplicação
   - Clique no menu lateral (hamburger)
   - Selecione "Grupos"

3. **Teste as funcionalidades**
   - Clique no botão de teste (🐛) para executar diagnósticos
   - Tente criar um grupo raiz
   - Tente criar um subgrupo
   - Teste a alternância entre visualização hierárquica e plana

## Estrutura Criada

### Tabela `groups`
- `id`: Chave primária auto-incremento
- `name`: Nome do grupo (obrigatório)
- `parent_id`: ID do grupo pai (opcional, NULL para grupos raiz)
- `created_at`: Timestamp de criação
- `updated_at`: Timestamp de atualização

### Funcionalidades Implementadas
- ✅ Criação de grupos raiz e subgrupos
- ✅ Edição de grupos existentes
- ✅ Exclusão com validação de subgrupos
- ✅ Visualização hierárquica
- ✅ Visualização plana
- ✅ Prevenção de referências circulares
- ✅ Validação de nomes únicos por nível
- ✅ Interface responsiva (modo escuro/claro)

### Navegação
- ✅ Adicionado ao menu principal
- ✅ Rota `/grupos` configurada
- ✅ Navegação lateral funcional

## Dados de Exemplo

O script de criação inclui alguns dados de exemplo:

```
Roupas Masculinas (raiz)
├── Camisas (subgrupo)
└── Calças (subgrupo)

Roupas Femininas (raiz)
├── Vestidos (subgrupo)
└── Saias (subgrupo)

Roupas Infantis (raiz)
└── Camisetas (subgrupo)
```

## Solução de Problemas

### Problema: Tabela não existe
**Solução**: Execute o script `create_groups_table.sql` no Supabase Dashboard

### Problema: Erro de permissão
**Solução**: Verifique se as políticas RLS foram criadas corretamente

### Problema: Navegação não funciona
**Solução**: Verifique se a rota foi adicionada em `app/_layout.tsx`

### Problema: Botão do menu não funciona
**Solução**: Verifique se o case 'grupos' foi adicionado no switch de navegação

### Problema: Dados não carregam
**Solução**: 
1. Clique no botão de teste (🐛)
2. Verifique o console para erros
3. Confirme se a tabela exists no banco

### Problema: Erro de referência circular
**Solução**: Isso é esperado - o sistema previne loops na hierarquia

## Próximos Passos

1. **Testar todas as funcionalidades**
2. **Criar alguns grupos de exemplo**
3. **Verificar responsividade em diferentes dispositivos**
4. **Integrar com outros módulos** (se necessário)

## Suporte

Se encontrar problemas:

1. **Verifique os logs**: Console do navegador/app
2. **Execute o teste**: Botão 🐛 na tela de grupos
3. **Confirme a instalação**: Execute `test_groups_table.sql`
4. **Verifique a documentação**: `README_GROUPS.md`

## Comandos Úteis

### Verificar se a tabela existe
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'groups';
```

### Visualizar hierarquia
```sql
SELECT * FROM get_group_hierarchy();
```

### Limpar dados de teste
```sql
DELETE FROM groups WHERE name LIKE 'Teste%';
```

### Reiniciar sequência (se necessário)
```sql
ALTER SEQUENCE groups_id_seq RESTART WITH 1;
```
