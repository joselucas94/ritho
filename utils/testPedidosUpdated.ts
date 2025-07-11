import {
    colorsService,
    detalhePedidoService,
    groupsService,
    pedidosService
} from '@/lib/supabase';

/**
 * Utilitário para testar as funcionalidades atualizadas de pedidos
 * com os novos campos: ref, size, group_id, shade_id
 */
export const testPedidosUpdated = {
  
  /**
   * Testa se todos os serviços estão funcionando
   */
  async testServices() {
    console.log('=== TESTE DOS SERVIÇOS ATUALIZADOS ===');
    
    try {
      // Testar pedidos service
      console.log('Testando pedidosService...');
      const pedidos = await pedidosService.getAll();
      console.log(`✅ Pedidos encontrados: ${pedidos.length}`);
      
      // Testar detalhes service
      console.log('Testando detalhePedidoService...');
      const detalhes = await detalhePedidoService.getAll();
      console.log(`✅ Detalhes encontrados: ${detalhes.length}`);
      
      // Testar grupos service
      console.log('Testando groupsService...');
      const grupos = await groupsService.getAll();
      console.log(`✅ Grupos encontrados: ${grupos.length}`);
      
      // Testar cores service
      console.log('Testando colorsService...');
      const cores = await colorsService.getAllWithShades();
      console.log(`✅ Cores encontradas: ${cores.length}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro nos testes de serviços:', error);
      return false;
    }
  },

  /**
   * Testa a criação de um pedido com os novos campos
   */
  async testCreatePedidoWithNewFields(lojaId: number, fornecedorId: number, tipoId: number) {
    console.log('=== TESTE DE CRIAÇÃO COM NOVOS CAMPOS ===');
    
    try {
      // 1. Buscar dados necessários
      const grupos = await groupsService.getAll();
      const cores = await colorsService.getAllWithShades();
      
      let groupId: number | undefined;
      let shadeId: number | undefined;
      
      if (grupos.length > 0) {
        groupId = grupos[0].id;
        console.log(`✅ Grupo selecionado: ${grupos[0].name} (ID: ${groupId})`);
      }
      
      if (cores.length > 0 && cores[0].shades && cores[0].shades.length > 0) {
        shadeId = cores[0].shades[0].id;
        console.log(`✅ Shade selecionado: ${cores[0].name} - ${cores[0].shades[0].name} (ID: ${shadeId})`);
      }
      
      // 2. Criar pedido
      const pedido = await pedidosService.create({
        loja: lojaId,
        fornecedor: fornecedorId,
      });
      console.log(`✅ Pedido criado com ID: ${pedido.id}`);
      
      // 3. Criar detalhe com novos campos
      const detalheId = await detalhePedidoService.createWithValidation({
        qtd_inicial: 5,
        qtd_atual: 5,
        valor_un: 49.90,
        cor: 'Azul Teste',
        ref: 'TEST_REF_001',    // NOVO
        size: 'M',               // NOVO
        tipo: tipoId,
        pedido: pedido.id!,
        group_id: groupId,      // NOVO
        shade_id: shadeId,      // NOVO
      });
      console.log(`✅ Detalhe criado com ID: ${detalheId}`);
      
      // 4. Verificar dados criados
      const pedidoCompleto = await pedidosService.getById(pedido.id!);
      console.log('✅ Pedido completo criado:', {
        id: pedidoCompleto?.id,
        detalhes: pedidoCompleto?.detalhe_pedido?.length,
        primeiroDetalhe: pedidoCompleto?.detalhe_pedido?.[0]
      });
      
      return pedido.id;
    } catch (error) {
      console.error('❌ Erro no teste de criação:', error);
      throw error;
    }
  },

  /**
   * Testa consultas com os novos campos
   */
  async testQueries() {
    console.log('=== TESTE DE CONSULTAS COM NOVOS CAMPOS ===');
    
    try {
      // Buscar detalhes com grupos
      console.log('Buscando detalhes com grupos...');
      const grupos = await groupsService.getAll();
      if (grupos.length > 0) {
        const detalhesPorGrupo = await detalhePedidoService.getByGrupo(grupos[0].id!);
        console.log(`✅ Detalhes do grupo "${grupos[0].name}": ${detalhesPorGrupo.length}`);
      }
      
      // Buscar detalhes com shades
      console.log('Buscando detalhes com shades...');
      const cores = await colorsService.getAllWithShades();
      if (cores.length > 0 && cores[0].shades && cores[0].shades.length > 0) {
        const detalhesPorShade = await detalhePedidoService.getByShade(cores[0].shades[0].id);
        console.log(`✅ Detalhes do shade "${cores[0].shades[0].name}": ${detalhesPorShade.length}`);
      }
      
      // Buscar todos os detalhes com dados relacionados
      console.log('Buscando todos os detalhes com dados relacionados...');
      const todosDetalhes = await detalhePedidoService.getAll();
      const comNovosCampos = todosDetalhes.filter(d => 
        d.ref || d.size || d.group_id || d.shade_id
      );
      console.log(`✅ Detalhes com novos campos: ${comNovosCampos.length}/${todosDetalhes.length}`);
      
      return true;
    } catch (error) {
      console.error('❌ Erro no teste de consultas:', error);
      return false;
    }
  },

  /**
   * Gera dados de teste para demonstração
   */
  async generateTestData(lojaId: number, fornecedorId: number, tipoId: number, quantidade: number = 3) {
    console.log(`=== GERANDO ${quantidade} REGISTROS DE TESTE ===`);
    
    try {
      const grupos = await groupsService.getAll();
      const cores = await colorsService.getAllWithShades();
      
      const testItems = [
        { ref: 'CAMISETA_001', size: 'P', cor: 'Azul', valor: 29.90 },
        { ref: 'CALCA_002', size: 'M', cor: 'Preto', valor: 89.90 },
        { ref: 'BLUSA_003', size: 'G', cor: 'Branco', valor: 45.50 },
        { ref: 'SAIA_004', size: 'P', cor: 'Vermelho', valor: 65.00 },
        { ref: 'VESTIDO_005', size: 'M', cor: 'Rosa', valor: 120.00 },
      ];
      
      // Criar pedido
      const pedido = await pedidosService.create({
        loja: lojaId,
        fornecedor: fornecedorId,
      });
      console.log(`✅ Pedido de teste criado: ${pedido.id}`);
      
      // Criar detalhes variados
      const detalhesIds: number[] = [];
      for (let i = 0; i < Math.min(quantidade, testItems.length); i++) {
        const item = testItems[i];
        const groupId = grupos.length > 0 ? grupos[i % grupos.length].id : undefined;
        let shadeId: number | undefined;
        
        if (cores.length > 0) {
          const cor = cores[i % cores.length];
          if (cor.shades && cor.shades.length > 0) {
            shadeId = cor.shades[0].id;
          }
        }
        
        const detalheId = await detalhePedidoService.createWithValidation({
          qtd_inicial: 10 + i,
          qtd_atual: 10 + i,
          valor_un: item.valor,
          cor: item.cor,
          ref: item.ref,
          size: item.size,
          tipo: tipoId,
          pedido: pedido.id!,
          group_id: groupId,
          shade_id: shadeId,
        });
        
        detalhesIds.push(detalheId);
        console.log(`✅ Item ${i + 1}: ${item.ref} (${item.size}) - ID: ${detalheId}`);
      }
      
      console.log(`✅ Teste concluído! Pedido: ${pedido.id}, Detalhes: [${detalhesIds.join(', ')}]`);
      return { pedidoId: pedido.id, detalhesIds };
      
    } catch (error) {
      console.error('❌ Erro na geração de dados de teste:', error);
      throw error;
    }
  },

  /**
   * Executa todos os testes
   */
  async runAllTests(lojaId: number, fornecedorId: number, tipoId: number) {
    console.log('🚀 INICIANDO TESTES COMPLETOS DOS PEDIDOS ATUALIZADOS');
    
    try {
      // 1. Testar serviços
      const servicesOk = await this.testServices();
      if (!servicesOk) throw new Error('Falha nos testes de serviços');
      
      // 2. Testar criação
      const pedidoId = await this.testCreatePedidoWithNewFields(lojaId, fornecedorId, tipoId);
      console.log(`✅ Criação testada com sucesso: Pedido ${pedidoId}`);
      
      // 3. Testar consultas
      const queriesOk = await this.testQueries();
      if (!queriesOk) throw new Error('Falha nos testes de consultas');
      
      // 4. Gerar dados de demonstração
      const testData = await this.generateTestData(lojaId, fornecedorId, tipoId, 3);
      console.log(`✅ Dados de teste gerados: ${testData.detalhesIds.length} itens`);
      
      console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
      return true;
      
    } catch (error) {
      console.error('💥 FALHA NOS TESTES:', error);
      return false;
    }
  },

  /**
   * Utilitário para limpar dados de teste
   */
  async cleanupTestData() {
    console.log('🧹 Limpando dados de teste...');
    
    try {
      // Buscar pedidos com referências de teste
      const detalhes = await detalhePedidoService.getAll();
      const testDetalhes = detalhes.filter(d => 
        d.ref?.includes('TEST') || d.ref?.includes('CAMISETA') || d.ref?.includes('CALCA')
      );
      
      console.log(`Encontrados ${testDetalhes.length} detalhes de teste para limpeza`);
      
      // Agrupar por pedido
      const pedidosTest = new Set(testDetalhes.map(d => d.pedido).filter(Boolean));
      
      // Deletar pedidos de teste (cascade irá deletar os detalhes)
      for (const pedidoId of pedidosTest) {
        await pedidosService.delete(pedidoId!);
        console.log(`✅ Pedido de teste ${pedidoId} removido`);
      }
      
      console.log('✅ Limpeza concluída');
      return true;
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      return false;
    }
  }
};

export default testPedidosUpdated;
