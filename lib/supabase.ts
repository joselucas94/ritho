import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zlecyfjzvednlhjzxeuc.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Configuração do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipos de dados para autenticação
export interface UserData {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  status: number;
}

// Interface para Delivery
export interface Delivery {
  id?: number;
  qtd: number;
  pedido_item: number;
  user: string;
  created_at?: string;
}

// Interface para dados expandidos de Delivery
export interface DeliveryWithDetails extends Delivery {
  detalhe_pedido?: {
    id: number;
    qtd_inicial: number;
    qtd_atual: number;
    valor_un: number;
    cor: string;
    tipo_roupa?: { nome: string };
    pedido: {
      id: number;
      store?: { nome: string };
      fornecedor_data?: { nome: string };
    };
  };
  user_profile?: {
    email: string;
  };
}

// Interface para Material
export interface Material {
  id?: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para Group
export interface Group {
  id?: number;
  name: string;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  // Campos calculados para hierarquia
  parent?: Group;
  children?: Group[];
  level?: number;
}

// Interface para dados expandidos de Group
export interface GroupWithHierarchy extends Group {
  parent?: Pick<Group, 'id' | 'name'>;
  children?: Pick<Group, 'id' | 'name'>[];
  breadcrumb?: string;
}

// Interface para Color
export interface Color {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Interface para ColorShade
export interface ColorShade {
  id: number;
  color_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// Interface para Color com tons
export interface ColorWithShades extends Color {
  shades?: ColorShade[];
}

// Interface para Pedido
export interface Pedido {
  id?: number;
  loja: number;
  fornecedor: number;
  created_at?: string;
  updated_at?: string;
  // Dados relacionados expandidos
  store?: { id: number; nome: string };
  fornecedor_data?: { id: number; nome: string };
  detalhe_pedido?: DetalhePedido[];
}

// Interface para DetalhePedido (atualizada com novos campos)
export interface DetalhePedido {
  id?: number;
  qtd_inicial: number;
  qtd_atual: number;
  valor_un: number;
  cor: string;
  ref?: string;
  size?: string;
  tipo: number;
  pedido?: number;
  group_id?: number;
  shade_id?: number;
  created_at?: string;
  updated_at?: string;
  // Dados relacionados expandidos
  tipo_roupa?: { id: number; nome: string };
  grupo?: { id: number; name: string };
  shade?: { id: number; name: string; color?: { id: number; name: string } };
}

// Interface para dados expandidos de Pedido
export interface PedidoWithDetails extends Pedido {
  detalhe_pedido?: DetalhePedidoWithDetails[];
}

// Interface para dados expandidos de DetalhePedido
export interface DetalhePedidoWithDetails extends DetalhePedido {
  tipo_roupa?: { id: number; nome: string };
  grupo?: { id: number; name: string; parent?: { id: number; name: string } };
  shade?: { 
    id: number; 
    name: string; 
    color?: { id: number; name: string } 
  };
  pedido_data?: {
    id: number;
    store?: { id: number; nome: string };
    fornecedor_data?: { id: number; nome: string };
  };
}

// Funções de autenticação
export const authService = {
  // Registrar novo usuário
  async signUp(email: string, password: string, name?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
        },
      });

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao criar conta',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Fazer login
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { user: data.user, session: data.session };
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao fazer login',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Fazer logout
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao fazer logout',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      return user;
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao obter usuário',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Resetar senha
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app.com/reset-password',
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao enviar email de recuperação',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Escutar mudanças de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Funções para operações no banco de dados
export const dbService = {
  // Exemplo: Buscar dados de uma tabela
  async fetchData(table: string) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao buscar dados',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Exemplo: Inserir dados em uma tabela
  async insertData(table: string, data: any) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw error;
      }

      return result;
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao inserir dados',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Exemplo: Atualizar dados em uma tabela
  async updateData(table: string, id: string, data: any) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return result;
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao atualizar dados',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Exemplo: Deletar dados de uma tabela
  async deleteData(table: string, id: string) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao deletar dados',
        status: error.status || 400,
      } as AuthError;
    }
  },
};

// Serviço específico para Delivery
export const deliveryService = {
  // Criar nova entrega
  async createDelivery(delivery: Omit<Delivery, 'id' | 'created_at'>) {
    try {
      console.log('Criando entrega:', delivery);
      
      // Primeiro, verificar se há quantidade suficiente disponível
      const { data: itemData, error: itemError } = await supabase
        .from('detalhe_pedido')
        .select('id, qtd_atual')
        .eq('id', delivery.pedido_item)
        .single();

      if (itemError || !itemData) {
        console.error('Erro ao buscar item do pedido:', itemError);
        throw new Error('Item do pedido não encontrado');
      }

      if (itemData.qtd_atual < delivery.qtd) {
        throw new Error(`Quantidade insuficiente. Disponível: ${itemData.qtd_atual}, Solicitado: ${delivery.qtd}`);
      }

      // Criar a entrega
      const { data: deliveryData, error } = await supabase
        .from('delivery')
        .insert([delivery])
        .select(`
          *,
          detalhe_pedido:pedido_item (
            id,
            qtd_inicial,
            qtd_atual,
            valor_un,
            cor,
            tipo_roupa:tipo (nome),
            pedido:pedido (
              id,
              store:loja (nome),
              fornecedor_data:fornecedor (nome)
            )
          )
        `);

      if (error) {
        console.error('Erro ao criar entrega:', error);
        throw error;
      }

      // Atualizar a quantidade atual do item (decrementar)
      const novaQuantidade = itemData.qtd_atual - delivery.qtd;
      const { error: updateError } = await supabase
        .from('detalhe_pedido')
        .update({ qtd_atual: novaQuantidade })
        .eq('id', delivery.pedido_item);

      if (updateError) {
        console.error('Erro ao atualizar quantidade do item:', updateError);
        // Tentar reverter a entrega criada
        await supabase.from('delivery').delete().eq('id', deliveryData[0].id);
        throw new Error('Erro ao atualizar quantidade do item. Entrega cancelada.');
      }

      console.log('Entrega criada e quantidade atualizada com sucesso:', deliveryData[0]);
      console.log(`Quantidade do item ${delivery.pedido_item} atualizada: ${itemData.qtd_atual} -> ${novaQuantidade}`);
      
      return deliveryData[0];
    } catch (error: any) {
      console.error('Erro no deliveryService.createDelivery:', error);
      throw {
        message: error.message || 'Erro ao registrar entrega',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Listar todas as entregas
  async getDeliveries() {
    try {
      const { data, error } = await supabase
        .from('delivery')
        .select(`
          *,
          detalhe_pedido:pedido_item (
            id,
            qtd_inicial,
            qtd_atual,
            valor_un,
            cor,
            tipo_roupa:tipo (nome),
            pedido:pedido (
              id,
              store:loja (nome),
              fornecedor_data:fornecedor (nome)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao buscar entregas',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Buscar entregas por item do pedido
  async getDeliveriesByPedidoItem(pedidoItemId: number) {
    try {
      const { data, error } = await supabase
        .from('delivery')
        .select(`
          *,
          detalhe_pedido:pedido_item (
            id,
            qtd_inicial,
            qtd_atual,
            valor_un,
            cor,
            tipo_roupa:tipo (nome),
            pedido:pedido (
              id,
              store:loja (nome),
              fornecedor_data:fornecedor (nome)
            )
          )
        `)
        .eq('pedido_item', pedidoItemId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao buscar entregas do item',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Atualizar entrega
  async updateDelivery(id: number, updates: Partial<Delivery>) {
    try {
      const { data, error } = await supabase
        .from('delivery')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          detalhe_pedido:pedido_item (
            id,
            qtd_inicial,
            qtd_atual,
            valor_un,
            cor,
            tipo_roupa:tipo (nome),
            pedido:pedido (
              id,
              store:loja (nome),
              fornecedor_data:fornecedor (nome)
            )
          )
        `);

      if (error) {
        throw error;
      }

      return data[0];
    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao atualizar entrega',
        status: error.status || 400,
      } as AuthError;
    }
  },

  // Deletar entrega (e reverter quantidade)
  async deleteDelivery(id: number) {
    try {
      // Primeiro, obter informações da entrega antes de deletar
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery')
        .select('id, qtd, pedido_item')
        .eq('id', id)
        .single();

      if (deliveryError || !deliveryData) {
        throw new Error('Entrega não encontrada');
      }

      // Obter a quantidade atual do item
      const { data: itemData, error: itemError } = await supabase
        .from('detalhe_pedido')
        .select('id, qtd_atual')
        .eq('id', deliveryData.pedido_item)
        .single();

      if (itemError || !itemData) {
        throw new Error('Item do pedido não encontrado');
      }

      // Deletar a entrega
      const { error } = await supabase
        .from('delivery')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Reverter a quantidade (somar de volta)
      const novaQuantidade = itemData.qtd_atual + deliveryData.qtd;
      const { error: updateError } = await supabase
        .from('detalhe_pedido')
        .update({ qtd_atual: novaQuantidade })
        .eq('id', deliveryData.pedido_item);

      if (updateError) {
        console.error('Erro ao reverter quantidade do item:', updateError);
        // A entrega já foi deletada, então logamos o erro mas não falhamos
        console.error('ATENÇÃO: Entrega deletada mas quantidade não foi revertida automaticamente');
      } else {
        console.log(`Quantidade do item ${deliveryData.pedido_item} revertida: ${itemData.qtd_atual} -> ${novaQuantidade}`);
      }

    } catch (error: any) {
      throw {
        message: error.message || 'Erro ao deletar entrega',
        status: error.status || 400,
      } as AuthError;
    }
  },
};

// Funções para gerenciar materiais
export const materiaisService = {
  // Listar todos os materiais
  async getAll() {
    console.log('materiaisService.getAll chamado');
    
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Resultado do getAll:', { data, error });

    if (error) {
      console.error('Erro no getAll:', error);
      throw error;
    }

    return data;
  },

  // Buscar material por ID
  async getById(id: number) {
    const { data, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Criar novo material
  async create(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) {
    console.log('materiaisService.create chamado com:', material);
    
    const { data, error } = await supabase
      .from('materiais')
      .insert([material])
      .select()
      .single();

    console.log('Resultado da inserção:', { data, error });

    if (error) {
      console.error('Erro ao criar material:', error);
      throw error;
    }

    return data;
  },

  // Atualizar material
  async update(id: number, updates: Partial<Omit<Material, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('materiais')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Deletar material
  async delete(id: number) {
    const { error } = await supabase
      .from('materiais')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  },

  // Verificar se material existe pelo nome
  async checkNameExists(name: string, excludeId?: number) {
    console.log('checkNameExists chamado com:', { name, excludeId });
    
    let query = supabase
      .from('materiais')
      .select('id')
      .ilike('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    
    console.log('Resultado do checkNameExists:', { data, error });

    // Se não encontrar, data será null
    // Se encontrar, data terá um objeto com o id
    return data !== null;
  },
};

// Versão corrigida do groupsService sem relacionamentos problemáticos
export const groupsService = {
  // Listar todos os grupos (versão simplificada)
  async getAll() {
    console.log('groupsService.getAll chamado');
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    console.log('Resultado do getAll groups:', { data, error });

    if (error) {
      console.error('Erro no getAll groups:', error);
      throw error;
    }

    return data;
  },

  // Listar apenas grupos raiz (sem parent_id)
  async getRootGroups() {
    console.log('groupsService.getRootGroups chamado');
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true });

    console.log('Resultado do getRootGroups:', { data, error });

    if (error) {
      console.error('Erro no getRootGroups:', error);
      throw error;
    }

    return data;
  },

  // Listar subgrupos de um grupo pai
  async getSubgroups(parentId: number) {
    console.log('groupsService.getSubgroups chamado com:', { parentId });
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    console.log('Resultado do getSubgroups:', { data, error });

    if (error) {
      console.error('Erro no getSubgroups:', error);
      throw error;
    }

    return data;
  },

  // Buscar grupo por ID
  async getById(id: number) {
    console.log('groupsService.getById chamado com:', { id });
    
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    console.log('Resultado do getById group:', { data, error });

    if (error) {
      console.error('Erro no getById group:', error);
      throw error;
    }

    return data;
  },

  // Criar novo grupo
  async create(group: Omit<Group, 'id' | 'created_at' | 'updated_at'>) {
    console.log('groupsService.create chamado com:', group);
    
    const { data, error } = await supabase
      .from('groups')
      .insert([group])
      .select('*')
      .single();

    console.log('Resultado da inserção group:', { data, error });

    if (error) {
      console.error('Erro ao criar grupo:', error);
      throw error;
    }

    return data;
  },

  // Atualizar grupo
  async update(id: number, updates: Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>) {
    console.log('groupsService.update chamado com:', { id, updates });
    
    const { data, error } = await supabase
      .from('groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    console.log('Resultado da atualização group:', { data, error });

    if (error) {
      console.error('Erro ao atualizar grupo:', error);
      throw error;
    }

    return data;
  },

  // Deletar grupo
  async delete(id: number) {
    console.log('groupsService.delete chamado com:', { id });
    
    // Primeiro, verificar se existem subgrupos
    const { data: subgroups, error: subgroupsError } = await supabase
      .from('groups')
      .select('id')
      .eq('parent_id', id);

    if (subgroupsError) {
      console.error('Erro ao verificar subgrupos:', subgroupsError);
      throw subgroupsError;
    }

    if (subgroups && subgroups.length > 0) {
      throw new Error('Não é possível excluir um grupo que possui subgrupos. Exclua os subgrupos primeiro.');
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    console.log('Resultado da exclusão group:', { error });

    if (error) {
      console.error('Erro ao excluir grupo:', error);
      throw error;
    }

    return true;
  },

  // Verificar se grupo existe pelo nome (considerando hierarquia)
  async checkNameExists(name: string, parentId?: number | null, excludeId?: number) {
    console.log('groupsService.checkNameExists chamado com:', { name, parentId, excludeId });
    
    let query = supabase
      .from('groups')
      .select('id')
      .ilike('name', name);

    // Verificar nome no mesmo nível hierárquico
    if (parentId === null || parentId === undefined) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    
    console.log('Resultado do checkNameExists group:', { data, error });

    return data !== null;
  },

  // Obter breadcrumb de um grupo (versão simplificada)
  async getBreadcrumb(id: number): Promise<string> {
    console.log('groupsService.getBreadcrumb chamado com:', { id });
    
    const breadcrumb: string[] = [];
    let currentId: number | null = id;

    while (currentId) {
      const { data: groupData, error } = await supabase
        .from('groups')
        .select('id, name, parent_id')
        .eq('id', currentId)
        .single();

      if (error || !groupData) {
        console.error('Erro ao obter breadcrumb:', error);
        break; // Para evitar loop infinito em caso de erro
      }

      breadcrumb.unshift(groupData.name);
      currentId = groupData.parent_id;
    }

    return breadcrumb.join(' > ');
  },

  // Obter hierarquia completa estruturada (versão simplificada)
  async getHierarchy(): Promise<GroupWithHierarchy[]> {
    console.log('groupsService.getHierarchy chamado');
    
    // Buscar todos os grupos sem relacionamentos
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao obter hierarquia:', error);
      throw error;
    }

    // Organizar em estrutura hierárquica manualmente
    const groupMap = new Map<number, GroupWithHierarchy>();
    const rootGroups: GroupWithHierarchy[] = [];

    // Criar map de todos os grupos
    groups.forEach(group => {
      groupMap.set(group.id, {
        ...group,
        children: []
      });
    });

    // Organizar hierarquia
    groups.forEach(group => {
      const groupWithHierarchy = groupMap.get(group.id)!;
      
      if (group.parent_id) {
        const parent = groupMap.get(group.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(groupWithHierarchy);
        }
      } else {
        rootGroups.push(groupWithHierarchy);
      }
    });

    return rootGroups;
  },

  // Método auxiliar para obter nome do grupo pai
  async getParentName(parentId: number | null): Promise<string | null> {
    if (!parentId) return null;
    
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('name')
        .eq('id', parentId)
        .single();

      if (error) {
        console.error('Erro ao obter nome do pai:', error);
        return null;
      }

      return data.name;
    } catch (error) {
      console.error('Erro ao obter nome do pai:', error);
      return null;
    }
  },

  // Método auxiliar para obter grupos com informações do pai
  async getAllWithParentInfo(): Promise<(Group & { parentName?: string })[]> {
    console.log('groupsService.getAllWithParentInfo chamado');
    
    const groups = await this.getAll();
    
    // Enriquecer com informações do pai
    const groupsWithParentInfo = await Promise.all(
      groups.map(async (group) => {
        const parentName = await this.getParentName(group.parent_id);
        return {
          ...group,
          parentName
        };
      })
    );

    return groupsWithParentInfo;
  },
};
// Adicionar depois do groupsService, métodos auxiliares adicionais

// Método para debugar a estrutura da tabela
export const debugGroupsTable = async () => {
  console.log('=== DEBUG: Verificando estrutura da tabela groups ===');
  
  try {
    // Testar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);

    console.log('Tabela groups existe:', { tableExists, tableError });

    if (tableError) {
      console.error('Erro ao acessar tabela groups:', tableError);
      return false;
    }

    // Testar inserção simples
    const testGroup = {
      name: 'Teste Debug ' + Date.now(),
      parent_id: null
    };

    const { data: insertData, error: insertError } = await supabase
      .from('groups')
      .insert([testGroup])
      .select('*')
      .single();

    console.log('Teste de inserção:', { insertData, insertError });

    if (insertError) {
      console.error('Erro na inserção:', insertError);
      return false;
    }

    // Limpar o teste
    if (insertData) {
      await supabase.from('groups').delete().eq('id', insertData.id);
    }

    console.log('✅ Tabela groups está funcionando corretamente!');
    return true;

  } catch (error) {
    console.error('Erro no debug:', error);
    return false;
  }
};

// ===========================================
// COLORS SERVICE
// ===========================================

export const colorsService = {
  // Criar nova cor
  async create(name: string): Promise<Color> {
    console.log('colorsService.create chamado com:', { name });
    
    if (!name || name.trim() === '') {
      throw new Error('Nome da cor é obrigatório');
    }

    try {
      const { data, error } = await supabase
        .from('colors')
        .insert([{ name: name.trim() }])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar cor:', error);
        throw error;
      }

      console.log('Cor criada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro no colorsService.create:', error);
      throw error;
    }
  },

  // Obter todas as cores
  async getAll(): Promise<Color[]> {
    console.log('colorsService.getAll chamado');
    
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar cores:', error);
        throw error;
      }

      console.log('Cores obtidas:', data);
      return data || [];
    } catch (error) {
      console.error('Erro no colorsService.getAll:', error);
      throw error;
    }
  },

  // Obter cor por ID
  async getById(id: number): Promise<Color | null> {
    console.log('colorsService.getById chamado com:', { id });
    
    try {
      const { data, error } = await supabase
        .from('colors')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar cor por ID:', error);
        throw error;
      }

      console.log('Cor obtida por ID:', data);
      return data || null;
    } catch (error) {
      console.error('Erro no colorsService.getById:', error);
      throw error;
    }
  },

  // Atualizar cor
  async update(id: number, name: string): Promise<Color> {
    console.log('colorsService.update chamado com:', { id, name });
    
    if (!name || name.trim() === '') {
      throw new Error('Nome da cor é obrigatório');
    }

    try {
      const { data, error } = await supabase
        .from('colors')
        .update({ name: name.trim() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao atualizar cor:', error);
        throw error;
      }

      console.log('Cor atualizada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro no colorsService.update:', error);
      throw error;
    }
  },

  // Deletar cor
  async delete(id: number): Promise<void> {
    console.log('colorsService.delete chamado com:', { id });
    
    try {
      const { error } = await supabase
        .from('colors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar cor:', error);
        throw error;
      }

      console.log('Cor deletada com sucesso:', id);
    } catch (error) {
      console.error('Erro no colorsService.delete:', error);
      throw error;
    }
  },

  // Obter cores com tons
 async getAllWithShades(): Promise<ColorWithShades[]> {
    console.log('colorsService.getAllWithShades chamado');
    
    try {
      const colors = await this.getAll();
      console.log('Cores obtidas:', colors);
      
      if (!colors || colors.length === 0) {
        console.log('Nenhuma cor encontrada');
        return [];
      }
      
      // Buscar tons para cada cor de forma segura
      const colorsWithShades = await Promise.all(
        colors.map(async (color) => {
          try {
            console.log(`Buscando tons para cor ID: ${color.id}`);
            const shades = await colorsShadesService.getByColorId(color.id);
            console.log(`Tons encontrados para cor ${color.name}:`, shades);
            
            return {
              ...color,
              shades: shades || []
            };
          } catch (error) {
            console.error(`Erro ao buscar tons para cor ${color.id}:`, error);
            return {
              ...color,
              shades: []
            };
          }
        })
      );

      console.log('Cores com tons obtidas:', colorsWithShades);
      return colorsWithShades;
    } catch (error) {
      console.error('Erro no colorsService.getAllWithShades:', error);
      throw error;
    }
  },

  // Verificar se cor pode ser deletada (não tem tons)
  async canDelete(id: number): Promise<boolean> {
    console.log('colorsService.canDelete chamado com:', { id });
    
    try {
      const shades = await colorsShadesService.getByColorId(id);
      const canDelete = shades.length === 0;
      
      console.log('Cor pode ser deletada:', { id, canDelete, shadesCount: shades.length });
      return canDelete;
    } catch (error) {
      console.error('Erro no colorsService.canDelete:', error);
      throw error;
    }
  },
};

// ===========================================
// COLORS SHADES SERVICE
// ===========================================

export const colorsShadesService = {
// Criar novo tom (versão com debug detalhado)
  async create(color_id: number, name: string): Promise<ColorShade> {
    console.log('colorsShadesService.create INICIADO');
    console.log('Parâmetros recebidos:', { color_id, name, typeof_color_id: typeof color_id, typeof_name: typeof name });
    
    // Validações detalhadas
    if (!color_id) {
      console.error('Erro: color_id é null/undefined:', color_id);
      throw new Error('ID da cor é obrigatório');
    }
    
    if (color_id <= 0) {
      console.error('Erro: color_id é inválido (<=0):', color_id);
      throw new Error('ID da cor deve ser maior que 0');
    }
    
    if (!name) {
      console.error('Erro: name é null/undefined:', name);
      throw new Error('Nome do tom é obrigatório');
    }
    
    if (!name.trim()) {
      console.error('Erro: name está vazio após trim:', name);
      throw new Error('Nome do tom não pode estar vazio');
    }
    
    // Verificar se a cor existe antes de tentar criar o tom
    try {
      console.log('Verificando se a cor existe...');
      const parentColor = await colorsService.getById(color_id);
      console.log('Cor pai encontrada:', parentColor);
      
      if (!parentColor) {
        console.error('Erro: Cor pai não encontrada para ID:', color_id);
        throw new Error(`Cor com ID ${color_id} não existe`);
      }
    } catch (colorCheckError) {
      console.error('Erro ao verificar cor pai:', colorCheckError);
      throw new Error(`Erro ao verificar cor pai: ${colorCheckError}`);
    }
    
    // Preparar dados para inserção
    const insertData = {
      color_id: color_id,
      name: name.trim()
    };
    console.log('Dados preparados para inserção:', insertData);
    
    try {
      console.log('Iniciando inserção no banco...');
      const { data, error } = await supabase
        .from('color_shades')
        .insert([insertData])
        .select('*')
        .single();

      console.log('Resultado da inserção:', { data, error });

      if (error) {
        console.error('Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      if (!data) {
        console.error('Erro: Dados não retornados após inserção');
        throw new Error('Nenhum dado retornado após inserção');
      }

      console.log('Tom criado com sucesso:', data);
      return data;
    } catch (supabaseError) {
      console.error('Erro durante operação no Supabase:', supabaseError);
      
      // Tentar identificar o tipo específico do erro
      if (supabaseError && typeof supabaseError === 'object') {
        const err = supabaseError as any;
        if (err.code === '23503') {
          throw new Error('Violação de chave estrangeira: a cor especificada não existe');
        }
        if (err.code === '23505') {
          throw new Error('Tom com este nome já existe para esta cor');
        }
        if (err.code === '42P01') {
          throw new Error('Tabela color_shades não existe no banco de dados');
        }
        if (err.message && err.message.includes('relation "color_shades" does not exist')) {
          throw new Error('Tabela color_shades não foi criada. Execute o script de setup do banco de dados.');
        }
      }
      
      throw supabaseError;
    }
  },

  // Atualizar tom (versão corrigida)
  async update(id: number, name: string): Promise<ColorShade> {
    console.log('colorsShadesService.update chamado com:', { id, name });
    
    if (!id || id <= 0) {
      throw new Error('ID do tom é obrigatório');
    }
    
    if (!name || !name.trim()) {
      throw new Error('Nome do tom é obrigatório');
    }
    
    try {
      const { data, error } = await supabase
        .from('color_shades')
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar tom:', error);
        throw error;
      }

      console.log('Tom atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro no colorsShadesService.update:', error);
      throw error;
    }
  },

  // Obter todos os tons
  async getAll(): Promise<ColorShade[]> {
    console.log('colorsShadesService.getAll chamado');
    
    try {
      const { data, error } = await supabase
        .from('color_shades')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao buscar tons:', error);
        throw error;
      }

      console.log('Tons obtidos:', data);
      return data || [];
    } catch (error) {
      console.error('Erro no colorsShadesService.getAll:', error);
      throw error;
    }
  },

  // Obter tons por cor ID (versão robusta)
  async getByColorId(color_id: number): Promise<ColorShade[]> {
    console.log('colorsShadesService.getByColorId INICIADO');
    console.log('Parâmetros:', { color_id, typeof_color_id: typeof color_id });
    
    if (!color_id || color_id <= 0) {
      console.log('ID da cor inválido, retornando array vazio:', color_id);
      return [];
    }
    
    try {
      console.log('Executando query no banco...');
      const { data, error } = await supabase
        .from('color_shades')
        .select('*')
        .eq('color_id', color_id)
        .order('name');

      console.log('Resultado da query:', { data, error });

      if (error) {
        console.error('Erro detalhado do Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Se a tabela não existe, retornar array vazio
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.log('Tabela color_shades não existe, retornando array vazio');
          return [];
        }
        
        // Se for erro PGRST116 (no rows found), retornar array vazio
        if (error.code === 'PGRST116') {
          console.log('Nenhum tom encontrado para esta cor, retornando array vazio');
          return [];
        }
        
        throw error;
      }

      console.log(`Tons obtidos para cor ID ${color_id}:`, data);
      return data || [];
    } catch (error) {
      console.error('Erro no colorsShadesService.getByColorId:', error);
      // Em caso de erro, retornar array vazio ao invés de falhar
      return [];
    }
  },

  // Obter tom por ID
  async getById(id: number): Promise<ColorShade | null> {
    console.log('colorsShadesService.getById chamado com:', { id });
    
    try {
      const { data, error } = await supabase
        .from('color_shades')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar tom por ID:', error);
        throw error;
      }

      console.log('Tom obtido por ID:', data);
      return data || null;
    } catch (error) {
      console.error('Erro no colorsShadesService.getById:', error);
      throw error;
    }
  },

  // Deletar tom
  async delete(id: number): Promise<void> {
    console.log('colorsShadesService.delete chamado com:', { id });
    
    try {
      const { error } = await supabase
        .from('color_shades')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar tom:', error);
        throw error;
      }

      console.log('Tom deletado com sucesso:', id);
    } catch (error) {
      console.error('Erro no colorsShadesService.delete:', error);
      throw error;
    }
  },

  // Obter tons com informações da cor
  async getAllWithColorInfo(): Promise<(ColorShade & { colorName?: string })[]> {
    console.log('colorsShadesService.getAllWithColorInfo chamado');
    
    try {
      const shades = await this.getAll();
      
      // Enriquecer com informações da cor
      const shadesWithColorInfo = await Promise.all(
        shades.map(async (shade) => {
          const color = await colorsService.getById(shade.color_id);
          return {
            ...shade,
            colorName: color?.name
          };
        })
      );

      console.log('Tons com informações da cor obtidos:', shadesWithColorInfo);
      return shadesWithColorInfo;
    } catch (error) {
      console.error('Erro no colorsShadesService.getAllWithColorInfo:', error);
      throw error;
    }
  },
};

// ===========================================
// DEBUG COLORS FUNCTIONS
// ===========================================

export const debugColorsTable = async () => {
  console.log('=== DEBUG: Verificando estrutura da tabela colors ===');
  
  try {
    // Testar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('colors')
      .select('*')
      .limit(1);

    console.log('Tabela colors existe:', { tableExists, tableError });

    if (tableError) {
      console.error('Erro ao acessar tabela colors:', tableError);
      return false;
    }

    // Testar inserção simples
    const testColor = {
      name: 'Teste Debug ' + Date.now(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('colors')
      .insert([testColor])
      .select('*')
      .single();

    console.log('Teste de inserção:', { insertData, insertError });

    if (insertError) {
      console.error('Erro na inserção:', insertError);
      return false;
    }

    // Limpar o teste
    if (insertData) {
      await supabase.from('colors').delete().eq('id', insertData.id);
    }

    console.log('✅ Tabela colors está funcionando corretamente!');
    return true;

  } catch (error) {
    console.error('Erro no debug:', error);
    return false;
  }
};

export const debugColorsShadesTable = async () => {
  console.log('=== DEBUG: Verificando estrutura da tabela color_shades ===');
  
  try {
    // Testar se a tabela existe
    const { data: tableExists, error: tableError } = await supabase
      .from('color_shades')
      .select('*')
      .limit(1);

    console.log('Tabela color_shades existe:', { tableExists, tableError });

    if (tableError) {
      console.error('Erro ao acessar tabela color_shades:', tableError);
      return false;
    }

    console.log('✅ Tabela color_shades está funcionando corretamente!');
    return true;

  } catch (error) {
    console.error('Erro no debug:', error);
    return false;
  }
};

// ==============================
// SERVIÇOS DE PEDIDOS
// ==============================

export const pedidosService = {
  // Listar todos os pedidos
  async getAll(): Promise<PedidoWithDetails[]> {
    console.log('pedidosService.getAll chamado');
    
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        *,
        store:loja(id, nome),
        fornecedor_data:fornecedor(id, nome),
        detalhe_pedido(
          *,
          tipo_roupa:tipo(id, nome),
          grupo:group_id(id, name),
          shade:shade_id(id, name, color:color_id(id, name))
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }

    console.log('Pedidos encontrados:', data?.length);
    return data || [];
  },

  // Buscar pedido por ID
  async getById(id: number): Promise<PedidoWithDetails | null> {
    console.log('pedidosService.getById chamado com:', { id });
    
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        *,
        store:loja(id, nome),
        fornecedor_data:fornecedor(id, nome),
        detalhe_pedido(
          *,
          tipo_roupa:tipo(id, nome),
          grupo:group_id(id, name),
          shade:shade_id(id, name, color:color_id(id, name))
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }

    return data;
  },

  // Criar novo pedido
  async create(pedido: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>): Promise<Pedido> {
    console.log('pedidosService.create chamado com:', pedido);
    
    const { data, error } = await supabase
      .from('pedido')
      .insert([pedido])
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }

    console.log('Pedido criado:', data);
    return data;
  },

  // Atualizar pedido
  async update(id: number, pedido: Partial<Pedido>): Promise<Pedido> {
    console.log('pedidosService.update chamado com:', { id, pedido });
    
    const { data, error } = await supabase
      .from('pedido')
      .update(pedido)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw error;
    }

    console.log('Pedido atualizado:', data);
    return data;
  },

  // Deletar pedido
  async delete(id: number): Promise<void> {
    console.log('pedidosService.delete chamado com:', { id });
    
    const { error } = await supabase
      .from('pedido')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar pedido:', error);
      throw error;
    }

    console.log('Pedido deletado com sucesso');
  },

  // Buscar pedidos por loja
  async getByLoja(lojaId: number): Promise<PedidoWithDetails[]> {
    console.log('pedidosService.getByLoja chamado com:', { lojaId });
    
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        *,
        store:loja(id, nome),
        fornecedor_data:fornecedor(id, nome),
        detalhe_pedido(
          *,
          tipo_roupa:tipo(id, nome),
          grupo:group_id(id, name),
          shade:shade_id(id, name, color:color_id(id, name))
        )
      `)
      .eq('loja', lojaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos por loja:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar pedidos por fornecedor
  async getByFornecedor(fornecedorId: number): Promise<PedidoWithDetails[]> {
    console.log('pedidosService.getByFornecedor chamado com:', { fornecedorId });
    
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        *,
        store:loja(id, nome),
        fornecedor_data:fornecedor(id, nome),
        detalhe_pedido(
          *,
          tipo_roupa:tipo(id, nome),
          grupo:group_id(id, name),
          shade:shade_id(id, name, color:color_id(id, name))
        )
      `)
      .eq('fornecedor', fornecedorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos por fornecedor:', error);
      throw error;
    }

    return data || [];
  }
};

export const detalhePedidoService = {
  // Listar todos os detalhes de pedido
  async getAll(): Promise<DetalhePedidoWithDetails[]> {
    console.log('detalhePedidoService.getAll chamado');
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .select(`
        *,
        tipo_roupa:tipo(id, nome),
        grupo:group_id(id, name),
        shade:shade_id(id, name, color:color_id(id, name)),
        pedido_data:pedido(id, store:loja(id, nome), fornecedor_data:fornecedor(id, nome))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes de pedido:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar detalhe por ID
  async getById(id: number): Promise<DetalhePedidoWithDetails | null> {
    console.log('detalhePedidoService.getById chamado com:', { id });
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .select(`
        *,
        tipo_roupa:tipo(id, nome),
        grupo:group_id(id, name),
        shade:shade_id(id, name, color:color_id(id, name)),
        pedido_data:pedido(id, store:loja(id, nome), fornecedor_data:fornecedor(id, nome))
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar detalhe de pedido:', error);
      throw error;
    }

    return data;
  },

  // Criar novo detalhe de pedido
  async create(detalhe: Omit<DetalhePedido, 'id' | 'created_at' | 'updated_at'>): Promise<DetalhePedido> {
    console.log('detalhePedidoService.create chamado com:', detalhe);
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .insert([detalhe])
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao criar detalhe de pedido:', error);
      throw error;
    }

    console.log('Detalhe de pedido criado:', data);
    return data;
  },

  // Atualizar detalhe de pedido
  async update(id: number, detalhe: Partial<DetalhePedido>): Promise<DetalhePedido> {
    console.log('detalhePedidoService.update chamado com:', { id, detalhe });
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .update(detalhe)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Erro ao atualizar detalhe de pedido:', error);
      throw error;
    }

    console.log('Detalhe de pedido atualizado:', data);
    return data;
  },

  // Deletar detalhe de pedido
  async delete(id: number): Promise<void> {
    console.log('detalhePedidoService.delete chamado com:', { id });
    
    const { error } = await supabase
      .from('detalhe_pedido')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar detalhe de pedido:', error);
      throw error;
    }

    console.log('Detalhe de pedido deletado com sucesso');
  },

  // Buscar detalhes por pedido
  async getByPedido(pedidoId: number): Promise<DetalhePedidoWithDetails[]> {
    console.log('detalhePedidoService.getByPedido chamado com:', { pedidoId });
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .select(`
        *,
        tipo_roupa:tipo(id, nome),
        grupo:group_id(id, name),
        shade:shade_id(id, name, color:color_id(id, name))
      `)
      .eq('pedido', pedidoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes por pedido:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar detalhes por grupo
  async getByGrupo(grupoId: number): Promise<DetalhePedidoWithDetails[]> {
    console.log('detalhePedidoService.getByGrupo chamado com:', { grupoId });
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .select(`
        *,
        tipo_roupa:tipo(id, nome),
        grupo:group_id(id, name),
        shade:shade_id(id, name, color:color_id(id, name)),
        pedido_data:pedido(id, store:loja(id, nome), fornecedor_data:fornecedor(id, nome))
      `)
      .eq('group_id', grupoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes por grupo:', error);
      throw error;
    }

    return data || [];
  },

  // Buscar detalhes por shade
  async getByShade(shadeId: number): Promise<DetalhePedidoWithDetails[]> {
    console.log('detalhePedidoService.getByShade chamado com:', { shadeId });
    
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .select(`
        *,
        tipo_roupa:tipo(id, nome),
        grupo:group_id(id, name),
        shade:shade_id(id, name, color:color_id(id, name))
      `)
      .eq('shade_id', shadeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar detalhes por shade:', error);
      throw error;
    }

    return data || [];
  },

  // Usar inserção direta com validações (fallback até função SQL ser criada)
  async createWithValidation(detalhe: {
    qtd_inicial: number;
    qtd_atual: number;
    valor_un: number;
    cor: string;
    ref?: string;
    size?: string;
    tipo: number;
    pedido: number;
    group_id?: number;
    shade_id?: number;
  }): Promise<number> {
    console.log('detalhePedidoService.createWithValidation chamado com:', detalhe);
    
    // Validações manuais
    if (detalhe.qtd_inicial <= 0) {
      throw new Error('Quantidade inicial deve ser maior que 0');
    }
    
    if (detalhe.qtd_atual < 0) {
      throw new Error('Quantidade atual não pode ser negativa');
    }
    
    if (detalhe.qtd_atual > detalhe.qtd_inicial) {
      throw new Error('Quantidade atual não pode ser maior que quantidade inicial');
    }
    
    if (detalhe.valor_un <= 0) {
      throw new Error('Valor unitário deve ser maior que 0');
    }

    // Verificar se o grupo existe (se fornecido)
    if (detalhe.group_id) {
      const { data: groupExists, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('id', detalhe.group_id)
        .single();
      
      if (groupError || !groupExists) {
        throw new Error(`Grupo com ID ${detalhe.group_id} não encontrado`);
      }
    }

    // Verificar se o shade existe (se fornecido)
    if (detalhe.shade_id) {
      const { data: shadeExists, error: shadeError } = await supabase
        .from('color_shades')
        .select('id')
        .eq('id', detalhe.shade_id)
        .single();
      
      if (shadeError || !shadeExists) {
        throw new Error(`Shade com ID ${detalhe.shade_id} não encontrado`);
      }
    }

    // Inserir o registro diretamente
    const { data, error } = await supabase
      .from('detalhe_pedido')
      .insert({
        qtd_inicial: detalhe.qtd_inicial,
        qtd_atual: detalhe.qtd_atual,
        valor_un: detalhe.valor_un,
        cor: detalhe.cor,
        ref: detalhe.ref || null,
        size: detalhe.size || null,
        tipo: detalhe.tipo,
        pedido: detalhe.pedido,
        group_id: detalhe.group_id || null,
        shade_id: detalhe.shade_id || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao criar detalhe com validação:', error);
      throw error;
    }

    console.log('Detalhe criado com validação, ID:', data.id);
    return data.id;
  }
};