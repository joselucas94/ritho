// Utilitário para testar os novos campos da tabela detalhe_pedido
import { colorsService, detalhePedidoService, groupsService, pedidosService } from '@/lib/supabase';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export const testNewFields = {
  // Teste básico de inserção com novos campos
  async testBasicInsert(): Promise<TestResult> {
    try {
      console.log('🧪 Iniciando teste básico de inserção...');
      
      // Verificar se existe pelo menos um pedido para usar
      const pedidos = await pedidosService.getAll();
      if (!pedidos.length) {
        return {
          success: false,
          message: 'Nenhum pedido encontrado. Crie um pedido primeiro.'
        };
      }

      const testData = {
        qtd_inicial: 10,
        qtd_atual: 10,
        valor_un: 25.99,
        cor: 'Vermelho Teste',
        ref: 'TEST_NEW_FIELDS_001',
        size: 'G',
        tipo: 1, // Assumindo que existe tipo 1
        pedido: pedidos[0].id!,
        group_id: undefined,
        shade_id: undefined
      };

      const result = await detalhePedidoService.createWithValidation(testData);
      
      return {
        success: true,
        message: `✅ Detalhe criado com sucesso! ID: ${result}`,
        data: { id: result, ...testData }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Erro: ${error.message}`
      };
    }
  },

  // Teste com grupos e shades
  async testWithGroupsAndShades(): Promise<TestResult> {
    try {
      console.log('🧪 Testando com grupos e shades...');
      
      // Buscar grupos disponíveis
      const groups = await groupsService.getAll();
      const colors = await colorsService.getAllWithShades();
      const pedidos = await pedidosService.getAll();
      
      if (!pedidos.length) {
        return {
          success: false,
          message: 'Nenhum pedido encontrado. Crie um pedido primeiro.'
        };
      }

      const testData = {
        qtd_inicial: 15,
        qtd_atual: 15,
        valor_un: 35.50,
        cor: 'Verde Teste',
        ref: 'TEST_GROUPS_SHADES_001',
        size: 'P',
        tipo: 1,
        pedido: pedidos[0].id!,
        group_id: groups.length > 0 ? groups[0].id : undefined,
        shade_id: colors.length > 0 && colors[0].shades && colors[0].shades.length > 0 ? colors[0].shades[0].id : undefined
      };

      const result = await detalhePedidoService.createWithValidation(testData);
      
      return {
        success: true,
        message: `✅ Detalhe com grupos/shades criado! ID: ${result}${groups.length > 0 ? ` | Grupo: ${groups[0].name}` : ''}${colors.length > 0 && colors[0].shades && colors[0].shades.length > 0 ? ` | Shade: ${colors[0].shades[0].name}` : ''}`,
        data: { id: result, ...testData }
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Erro: ${error.message}`
      };
    }
  },

  // Teste de validação de campos obrigatórios
  async testValidation(): Promise<TestResult> {
    try {
      console.log('🧪 Testando validações...');
      
      const pedidos = await pedidosService.getAll();
      if (!pedidos.length) {
        return {
          success: false,
          message: 'Nenhum pedido encontrado. Crie um pedido primeiro.'
        };
      }

      // Testar quantidade inválida
      try {
        await detalhePedidoService.createWithValidation({
          qtd_inicial: 0, // Inválido
          qtd_atual: 0,
          valor_un: 10.00,
          cor: 'Cor Teste',
          tipo: 1,
          pedido: pedidos[0].id!
        });
        
        return {
          success: false,
          message: '❌ Validação falhou - deveria ter rejeitado quantidade 0'
        };
      } catch (validationError) {
        // Esperado
      }

      // Testar valor unitário inválido
      try {
        await detalhePedidoService.createWithValidation({
          qtd_inicial: 5,
          qtd_atual: 5,
          valor_un: 0, // Inválido
          cor: 'Cor Teste',
          tipo: 1,
          pedido: pedidos[0].id!
        });
        
        return {
          success: false,
          message: '❌ Validação falhou - deveria ter rejeitado valor 0'
        };
      } catch (validationError) {
        // Esperado
      }

      return {
        success: true,
        message: '✅ Validações funcionando corretamente!'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `❌ Erro inesperado: ${error.message}`
      };
    }
  },

  // Executar todos os testes
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Executando todos os testes dos novos campos...');
    
    const results: TestResult[] = [];
    
    // Teste básico
    results.push(await this.testBasicInsert());
    
    // Teste com grupos e shades
    results.push(await this.testWithGroupsAndShades());
    
    // Teste de validação
    results.push(await this.testValidation());
    
    return results;
  }
};

export default testNewFields;
