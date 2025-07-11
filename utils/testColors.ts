import { colorsService, colorsShadesService, debugColorsShadesTable, debugColorsTable } from '../lib/supabase';

// Utilitários de teste para cores
export const testColors = {
  // Teste básico de CRUD para cores
  async testBasicCRUD() {
    console.log('=== TESTE BÁSICO CRUD - CORES ===');
    
    try {
      // 1. Criar
      console.log('1. Testando criação de cor...');
      const newColor = await colorsService.create('Cor Teste ' + Date.now());
      console.log('Cor criada:', newColor);

      // 2. Buscar por ID
      console.log('2. Testando busca por ID...');
      const foundColor = await colorsService.getById(newColor.id);
      console.log('Cor encontrada:', foundColor);

      // 3. Listar todas
      console.log('3. Testando listagem de todas as cores...');
      const allColors = await colorsService.getAll();
      console.log('Total de cores:', allColors.length);

      // 4. Atualizar
      console.log('4. Testando atualização...');
      const updatedColor = await colorsService.update(newColor.id, 'Cor Atualizada ' + Date.now());
      console.log('Cor atualizada:', updatedColor);

      // 5. Deletar
      console.log('5. Testando deleção...');
      await colorsService.delete(newColor.id);
      console.log('Cor deletada com sucesso');

      // 6. Verificar se foi deletada
      const deletedColor = await colorsService.getById(newColor.id);
      console.log('Cor após deleção (deve ser null):', deletedColor);

      console.log('✅ Teste básico CRUD concluído com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste básico CRUD:', error);
      return false;
    }
  },

  // Teste de validação
  async testValidation() {
    console.log('=== TESTE DE VALIDAÇÃO - CORES ===');
    
    try {
      // Testar nome vazio
      console.log('1. Testando nome vazio...');
      try {
        await colorsService.create('');
        console.error('❌ Deveria ter falhado para nome vazio');
        return false;
      } catch (error) {
        console.log('✅ Nome vazio rejeitado corretamente');
      }

      // Testar nome apenas com espaços
      console.log('2. Testando nome com apenas espaços...');
      try {
        await colorsService.create('   ');
        console.error('❌ Deveria ter falhado para nome com apenas espaços');
        return false;
      } catch (error) {
        console.log('✅ Nome com apenas espaços rejeitado corretamente');
      }

      console.log('✅ Teste de validação concluído com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste de validação:', error);
      return false;
    }
  },

  // Teste de cores com tons
  async testColorsWithShades() {
    console.log('=== TESTE CORES COM TONS ===');
    
    try {
      // Criar cor
      const color = await colorsService.create('Cor com Tons ' + Date.now());
      console.log('Cor criada:', color);

      // Criar tons
      const shade1 = await colorsShadesService.create(color.id, 'Tom Claro');
      const shade2 = await colorsShadesService.create(color.id, 'Tom Escuro');
      console.log('Tons criados:', { shade1, shade2 });

      // Buscar cores com tons
      const colorsWithShades = await colorsService.getAllWithShades();
      const colorWithShades = colorsWithShades.find(c => c.id === color.id);
      console.log('Cor com tons:', colorWithShades);

      // Verificar se cor pode ser deletada (não deveria poder)
      const canDelete = await colorsService.canDelete(color.id);
      console.log('Cor pode ser deletada (deve ser false):', canDelete);

      // Deletar tons
      await colorsShadesService.delete(shade1.id);
      await colorsShadesService.delete(shade2.id);
      console.log('Tons deletados');

      // Verificar se cor pode ser deletada agora
      const canDeleteNow = await colorsService.canDelete(color.id);
      console.log('Cor pode ser deletada agora (deve ser true):', canDeleteNow);

      // Deletar cor
      await colorsService.delete(color.id);
      console.log('Cor deletada');

      console.log('✅ Teste de cores com tons concluído com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste de cores com tons:', error);
      return false;
    }
  },

  // Executar todos os testes
  async runAllTests() {
    console.log('=== INICIANDO TODOS OS TESTES DE CORES ===');
    
    // Debug das tabelas
    await debugColorsTable();
    await debugColorsShadesTable();
    
    // Testes funcionais
    const results = {
      basicCRUD: await this.testBasicCRUD(),
      validation: await this.testValidation(),
      colorsWithShades: await this.testColorsWithShades(),
    };

    console.log('=== RESULTADOS DOS TESTES ===');
    console.log('Teste básico CRUD:', results.basicCRUD ? '✅' : '❌');
    console.log('Teste de validação:', results.validation ? '✅' : '❌');
    console.log('Teste cores com tons:', results.colorsWithShades ? '✅' : '❌');

    const allPassed = Object.values(results).every(result => result === true);
    console.log('=== RESULTADO GERAL ===');
    console.log(allPassed ? '✅ TODOS OS TESTES PASSARAM!' : '❌ ALGUNS TESTES FALHARAM!');

    return results;
  }
};

// Utilitários de teste para tons
export const testColorShades = {
  // Teste básico de CRUD para tons
  async testBasicCRUD() {
    console.log('=== TESTE BÁSICO CRUD - TONS ===');
    
    try {
      // Criar cor primeiro
      const color = await colorsService.create('Cor para Teste Tons ' + Date.now());

      // 1. Criar tom
      console.log('1. Testando criação de tom...');
      const newShade = await colorsShadesService.create(color.id, 'Tom Teste ' + Date.now());
      console.log('Tom criado:', newShade);

      // 2. Buscar por ID
      console.log('2. Testando busca por ID...');
      const foundShade = await colorsShadesService.getById(newShade.id);
      console.log('Tom encontrado:', foundShade);

      // 3. Buscar por cor ID
      console.log('3. Testando busca por cor ID...');
      const shadesByColor = await colorsShadesService.getByColorId(color.id);
      console.log('Tons da cor:', shadesByColor);

      // 4. Listar todos
      console.log('4. Testando listagem de todos os tons...');
      const allShades = await colorsShadesService.getAll();
      console.log('Total de tons:', allShades.length);

      // 5. Atualizar
      console.log('5. Testando atualização...');
      const updatedShade = await colorsShadesService.update(newShade.id, 'Tom Atualizado ' + Date.now());
      console.log('Tom atualizado:', updatedShade);

      // 6. Deletar
      console.log('6. Testando deleção...');
      await colorsShadesService.delete(newShade.id);
      console.log('Tom deletado com sucesso');

      // 7. Verificar se foi deletado
      const deletedShade = await colorsShadesService.getById(newShade.id);
      console.log('Tom após deleção (deve ser null):', deletedShade);

      // Limpar cor de teste
      await colorsService.delete(color.id);

      console.log('✅ Teste básico CRUD de tons concluído com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste básico CRUD de tons:', error);
      return false;
    }
  },

  // Teste de validação de tons
  async testValidation() {
    console.log('=== TESTE DE VALIDAÇÃO - TONS ===');
    
    try {
      // Criar cor primeiro
      const color = await colorsService.create('Cor para Validação ' + Date.now());

      // Testar nome vazio
      console.log('1. Testando nome vazio...');
      try {
        await colorsShadesService.create(color.id, '');
        console.error('❌ Deveria ter falhado para nome vazio');
        return false;
      } catch (error) {
        console.log('✅ Nome vazio rejeitado corretamente');
      }

      // Testar nome com apenas espaços
      console.log('2. Testando nome com apenas espaços...');
      try {
        await colorsShadesService.create(color.id, '   ');
        console.error('❌ Deveria ter falhado para nome com apenas espaços');
        return false;
      } catch (error) {
        console.log('✅ Nome com apenas espaços rejeitado corretamente');
      }

      // Testar nome duplicado na mesma cor
      console.log('3. Testando nome duplicado na mesma cor...');
      await colorsShadesService.create(color.id, 'Tom Duplicado');
      try {
        await colorsShadesService.create(color.id, 'Tom Duplicado');
        console.error('❌ Deveria ter falhado para nome duplicado');
        return false;
      } catch (error) {
        console.log('✅ Nome duplicado rejeitado corretamente');
      }

      // Limpar cor de teste
      await colorsService.delete(color.id);

      console.log('✅ Teste de validação de tons concluído com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste de validação de tons:', error);
      return false;
    }
  },

  // Teste de tons com informações da cor
  async testShadesWithColorInfo() {
    console.log('=== TESTE TONS COM INFORMAÇÕES DA COR ===');
    
    try {
      // Criar cor
      const color = await colorsService.create('Cor Info ' + Date.now());

      // Criar tons
      const shade1 = await colorsShadesService.create(color.id, 'Tom Info 1');
      const shade2 = await colorsShadesService.create(color.id, 'Tom Info 2');

      // Buscar tons com informações da cor
      const shadesWithInfo = await colorsShadesService.getAllWithColorInfo();
      const testShades = shadesWithInfo.filter(s => s.color_id === color.id);

      console.log('Tons com informações da cor:', testShades);

      // Verificar se tem informações da cor
      const hasColorInfo = testShades.every(shade => shade.colorName === color.name);
      console.log('Todos os tons têm informações da cor:', hasColorInfo);

      // Limpar dados de teste
      await colorsShadesService.delete(shade1.id);
      await colorsShadesService.delete(shade2.id);
      await colorsService.delete(color.id);

      console.log('✅ Teste de tons com informações da cor concluído com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro no teste de tons com informações da cor:', error);
      return false;
    }
  },

  // Executar todos os testes
  async runAllTests() {
    console.log('=== INICIANDO TODOS OS TESTES DE TONS ===');
    
    const results = {
      basicCRUD: await this.testBasicCRUD(),
      validation: await this.testValidation(),
      shadesWithColorInfo: await this.testShadesWithColorInfo(),
    };

    console.log('=== RESULTADOS DOS TESTES DE TONS ===');
    console.log('Teste básico CRUD:', results.basicCRUD ? '✅' : '❌');
    console.log('Teste de validação:', results.validation ? '✅' : '❌');
    console.log('Teste tons com info da cor:', results.shadesWithColorInfo ? '✅' : '❌');

    const allPassed = Object.values(results).every(result => result === true);
    console.log('=== RESULTADO GERAL DOS TONS ===');
    console.log(allPassed ? '✅ TODOS OS TESTES PASSARAM!' : '❌ ALGUNS TESTES FALHARAM!');

    return results;
  }
};

// Executar todos os testes
export const runAllColorsTests = async () => {
  console.log('=== EXECUTANDO TODOS OS TESTES DE CORES E TONS ===');
  
  const colorResults = await testColors.runAllTests();
  const shadeResults = await testColorShades.runAllTests();

  const allResults = {
    colors: colorResults,
    shades: shadeResults
  };

  console.log('=== RESULTADO FINAL ===');
  console.log('Testes de cores:', colorResults);
  console.log('Testes de tons:', shadeResults);

  return allResults;
};
