// Exemplo de como usar o deliveryService atualizado
import { deliveryService } from '@/lib/supabase';

// Exemplo de uso das novas funcionalidades do deliveryService
export const exemploDeliveryService = {
  
  // Exemplo: Registrar uma entrega
  async exemploRegistrarEntrega(pedidoItemId: number, quantidade: number, userId: string) {
    try {
      console.log('🚚 Registrando entrega...');
      console.log(`Item: ${pedidoItemId}, Quantidade: ${quantidade}, Usuário: ${userId}`);
      
      // Criar a entrega - automaticamente atualiza qtd_atual
      const entrega = await deliveryService.createDelivery({
        qtd: quantidade,
        pedido_item: pedidoItemId,
        user: userId
      });
      
      console.log('✅ Entrega registrada com sucesso!');
      console.log('- ID da entrega:', entrega.id);
      console.log('- Quantidade entregue:', entrega.qtd);
      console.log('- Nova quantidade atual do item foi automaticamente atualizada');
      
      return entrega;
      
    } catch (error: any) {
      console.error('❌ Erro ao registrar entrega:', error.message);
      throw error;
    }
  },

  // Exemplo: Cancelar uma entrega
  async exemploCancelarEntrega(entregaId: number) {
    try {
      console.log('🔄 Cancelando entrega...');
      console.log(`Entrega ID: ${entregaId}`);
      
      // Deletar a entrega - automaticamente reverte qtd_atual
      await deliveryService.deleteDelivery(entregaId);
      
      console.log('✅ Entrega cancelada com sucesso!');
      console.log('- Entrega removida do sistema');
      console.log('- Quantidade do item foi automaticamente revertida');
      
    } catch (error: any) {
      console.error('❌ Erro ao cancelar entrega:', error.message);
      throw error;
    }
  },

  // Exemplo: Verificar histórico de entregas de um item
  async exemploHistoricoEntregas(pedidoItemId: number) {
    try {
      console.log('📋 Consultando histórico de entregas...');
      console.log(`Item ID: ${pedidoItemId}`);
      
      const entregas = await deliveryService.getDeliveriesByPedidoItem(pedidoItemId);
      
      console.log(`✅ Encontradas ${entregas.length} entregas para este item:`);
      
      entregas.forEach((entrega, index) => {
        console.log(`${index + 1}. Entrega #${entrega.id}`);
        console.log(`   - Quantidade: ${entrega.qtd}`);
        console.log(`   - Data: ${new Date(entrega.created_at!).toLocaleDateString('pt-BR')}`);
        console.log(`   - Usuário: ${entrega.user}`);
      });
      
      return entregas;
      
    } catch (error: any) {
      console.error('❌ Erro ao consultar histórico:', error.message);
      throw error;
    }
  },

  // Exemplo: Fluxo completo de entrega com validações
  async exemploFluxoCompletoEntrega(pedidoItemId: number, quantidadeDesejada: number, userId: string) {
    try {
      console.log('🔍 Iniciando fluxo completo de entrega...');
      
      // 1. Consultar histórico atual
      console.log('📋 Passo 1: Consultando histórico atual...');
      const historicoAntes = await this.exemploHistoricoEntregas(pedidoItemId);
      
      // 2. Registrar a nova entrega
      console.log('🚚 Passo 2: Registrando nova entrega...');
      const novaEntrega = await this.exemploRegistrarEntrega(pedidoItemId, quantidadeDesejada, userId);
      
      // 3. Consultar histórico atualizado
      console.log('📋 Passo 3: Consultando histórico atualizado...');
      const historicoDepois = await this.exemploHistoricoEntregas(pedidoItemId);
      
      console.log('✅ Fluxo completo executado com sucesso!');
      console.log(`- Entregas antes: ${historicoAntes.length}`);
      console.log(`- Entregas depois: ${historicoDepois.length}`);
      console.log(`- Nova entrega ID: ${novaEntrega.id}`);
      
      return {
        novaEntrega,
        historicoAntes,
        historicoDepois
      };
      
    } catch (error: any) {
      console.error('❌ Erro no fluxo completo:', error.message);
      throw error;
    }
  }
};

export default exemploDeliveryService;
