import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  colorsService,
  deliveryService,
  detalhePedidoService,
  groupsService,
  pedidosService,
  supabase,
  type ColorShade,
  type ColorWithShades,
  type Delivery,
  type DetalhePedido,
  type Group,
  type Pedido
} from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Store {
  id: number;
  nome: string;
}

interface Fornecedor {
  id: number;
  nome: string;
}

interface TipoRoupa {
  id: number;
  nome: string;
}

export default function PedidosScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [tiposRoupas, setTiposRoupas] = useState<TipoRoupa[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [colors, setColors] = useState<ColorWithShades[]>([]);
  const [colorShades, setColorShades] = useState<ColorShade[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [showFinalizados, setShowFinalizados] = useState(false);
  
  const [formData, setFormData] = useState({
    loja: '',
    fornecedor: '',
  });

  const [detalhes, setDetalhes] = useState<DetalhePedido[]>([
    {
      qtd_inicial: 0,
      qtd_atual: 0,
      valor_un: 0,
      cor: '',
      tipo: 0,
      ref: '',
      size: '',
      group_id: undefined,
      shade_id: undefined,
    }
  ]);

  // Estados para o modal de recebimento
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DetalhePedido | null>(null);
  const [quantidadeReceber, setQuantidadeReceber] = useState('');
  
  // Estados para entregas do pedido selecionado
  const [pedidoDeliveries, setPedidoDeliveries] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPedidos();
  }, [showFinalizados]);

  // Função para abrir modal de recebimento
  const openReceiveModal = (item: DetalhePedido) => {
    setSelectedItem(item);
    setQuantidadeReceber('');
    setShowReceiveModal(true);
  };

  // Função para receber item
  const handleReceiveItem = async () => {
    if (!selectedItem || !quantidadeReceber || !user) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const quantidade = parseInt(quantidadeReceber);
    if (quantidade <= 0) {
      Alert.alert('Erro', 'Quantidade deve ser maior que 0');
      return;
    }

    if (quantidade > selectedItem.qtd_atual) {
      Alert.alert('Erro', `Quantidade disponível: ${selectedItem.qtd_atual}`);
      return;
    }

    try {
      const delivery: Omit<Delivery, 'id' | 'created_at'> = {
        qtd: quantidade,
        pedido_item: selectedItem.id!,
        user: user.id,
      };

      await deliveryService.createDelivery(delivery);
      
      Alert.alert('Sucesso', 'Item recebido com sucesso!');
      setShowReceiveModal(false);
      setSelectedItem(null);
      setQuantidadeReceber('');
      
      // Recarregar pedidos para atualizar as quantidades
      await loadPedidos();
      
      // Recarregar entregas se há um pedido selecionado
      if (selectedPedido && selectedPedido.id) {
        await loadPedidoDeliveries(selectedPedido.id);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao receber item');
    }
  };

  const loadInitialData = async () => {
    await Promise.all([
      loadPedidos(),
      loadStores(),
      loadFornecedores(),
      loadTiposRoupas(),
      loadGroups(),
      loadColors(),
    ]);
  };

  const loadPedidos = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os pedidos com seus detalhes
      const { data, error } = await supabase
        .from('pedido')
        .select(`
          *,
          store:loja (nome),
          fornecedor_data:fornecedor (nome),
          detalhe_pedido (
            id,
            qtd_inicial,
            qtd_atual,
            valor_un,
            cor,
            ref,
            size,
            tipo_roupa:tipo (nome),
            grupo:group_id (name),
            shade:shade_id (name, color:color_id (name))
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar conforme o tipo de visualização (abertos ou finalizados)
      const pedidosFiltrados = (data || []).filter(pedido => {
        if (!pedido.detalhe_pedido || pedido.detalhe_pedido.length === 0) {
          return false; // Pedidos sem itens não aparecem em nenhuma lista
        }

        const temItensAbertos = pedido.detalhe_pedido.some((item: any) => item.qtd_atual > 0);
        
        if (showFinalizados) {
          // Para finalizados: todos os itens devem ter qtd_atual = 0
          return !temItensAbertos;
        } else {
          // Para abertos: pelo menos um item deve ter qtd_atual > 0
          return temItensAbertos;
        }
      });

      setPedidos(pedidosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('store')
        .select('*')
        .eq('owner', user?.id)
        .order('nome');

      if (error) throw error;
      setStores(data || []);
      
      // Selecionar a primeira loja automaticamente
      if (data && data.length > 0 && selectedStore === null) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedor')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadTiposRoupas = async () => {
    try {
      const { data, error } = await supabase
        .from('tipo_roupa')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTiposRoupas(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de roupas:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await groupsService.getAll();
      setGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const loadColors = async () => {
    try {
      const data = await colorsService.getAllWithShades();
      setColors(data || []);
      
      // Flatten shades para facilitar o acesso
      const allShades: ColorShade[] = [];
      data.forEach(color => {
        if (color.shades) {
          allShades.push(...color.shades);
        }
      });
      setColorShades(allShades);
    } catch (error) {
      console.error('Erro ao carregar cores:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPedidos();
    setRefreshing(false);
  };

  const addDetalhe = () => {
    setDetalhes([
      ...detalhes,
      {
        qtd_inicial: 0,
        qtd_atual: 0,
        valor_un: 0,
        cor: '',
        tipo: 0,
        ref: '',
        size: '',
        group_id: undefined,
        shade_id: undefined,
      }
    ]);
  };

  const removeDetalhe = (index: number) => {
    if (detalhes.length > 1) {
      const newDetalhes = detalhes.filter((_, i) => i !== index);
      setDetalhes(newDetalhes);
    }
  };

  const updateDetalhe = (index: number, field: keyof DetalhePedido, value: any) => {
    const newDetalhes = [...detalhes];
    newDetalhes[index] = { ...newDetalhes[index], [field]: value };
    
    // Se for qtd_inicial, atualizar qtd_atual automaticamente
    if (field === 'qtd_inicial') {
      newDetalhes[index].qtd_atual = value;
    }
    
    setDetalhes(newDetalhes);
  };

  const validateForm = () => {
    if (!formData.loja) {
      Alert.alert('Erro', 'Selecione uma loja');
      return false;
    }

    if (!formData.fornecedor) {
      Alert.alert('Erro', 'Selecione um fornecedor');
      return false;
    }

    for (let i = 0; i < detalhes.length; i++) {
      const detalhe = detalhes[i];
      
      if (detalhe.qtd_inicial <= 0) {
        Alert.alert('Erro', `Quantidade inicial do item ${i + 1} deve ser maior que zero`);
        return false;
      }

      if (detalhe.valor_un <= 0) {
        Alert.alert('Erro', `Valor unitário do item ${i + 1} deve ser maior que zero`);
        return false;
      }

      if (!detalhe.cor.trim()) {
        Alert.alert('Erro', `Cor do item ${i + 1} é obrigatória`);
        return false;
      }

      if (!detalhe.tipo) {
        Alert.alert('Erro', `Tipo de roupa do item ${i + 1} é obrigatório`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Criar pedido usando o serviço
      const pedidoData = await pedidosService.create({
        loja: parseInt(formData.loja),
        fornecedor: parseInt(formData.fornecedor),
      });

      // Criar detalhes do pedido usando o serviço com validação
      for (const detalhe of detalhes) {
        await detalhePedidoService.createWithValidation({
          qtd_inicial: detalhe.qtd_inicial,
          qtd_atual: detalhe.qtd_atual,
          valor_un: detalhe.valor_un,
          cor: detalhe.cor.trim(),
          ref: detalhe.ref?.trim() || undefined,
          size: detalhe.size?.trim() || undefined,
          tipo: detalhe.tipo,
          pedido: pedidoData.id!,
          group_id: detalhe.group_id || undefined,
          shade_id: detalhe.shade_id || undefined,
        });
      }

      Alert.alert('Sucesso', 'Pedido criado com sucesso!');
      
      // Selecionar a loja do pedido criado
      setSelectedStore(parseInt(formData.loja));
      
      // Resetar formulário
      setFormData({ loja: '', fornecedor: '' });
      setDetalhes([{
        qtd_inicial: 0,
        qtd_atual: 0,
        valor_un: 0,
        cor: '',
        tipo: 0,
        ref: '',
        size: '',
        group_id: undefined,
        shade_id: undefined,
      }]);
      setShowForm(false);
      
      // Recarregar lista
      await loadPedidos();
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar o pedido');
    } finally {
      setLoading(false);
    }
  };

  const showPedidoDetails = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowDetailModal(true);
    
    // Carregar entregas do pedido ao abrir os detalhes
    if (pedido.id) {
      loadPedidoDeliveries(pedido.id);
    }
  };

  const cancelForm = () => {
    setFormData({ loja: '', fornecedor: '' });
    setDetalhes([{
      qtd_inicial: 0,
      qtd_atual: 0,
      valor_un: 0,
      cor: '',
      tipo: 0,
      ref: '',
      size: '',
      group_id: undefined,
      shade_id: undefined,
    }]);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTotalPedido = (detalhes: DetalhePedido[]) => {
    return detalhes.reduce((total, item) => total + (item.qtd_inicial * item.valor_un), 0);
  };

  const getFilteredPedidos = () => {
    if (!selectedStore) return [];
    return pedidos.filter(pedido => pedido.loja === selectedStore);
  };


  // Função para carregar entregas de um pedido
  const loadPedidoDeliveries = async (pedidoId: number) => {
    try {
      console.log('Carregando entregas do pedido:', pedidoId);
      
      // Primeiro, buscar os itens do pedido
      const { data: itens, error: itensError } = await supabase
        .from('detalhe_pedido')
        .select('id')
        .eq('pedido', pedidoId);

      if (itensError) {
        console.error('Erro ao buscar itens do pedido:', itensError);
        throw itensError;
      }

      if (!itens || itens.length === 0) {
        console.log('Nenhum item encontrado para o pedido');
        setPedidoDeliveries([]);
        return;
      }

      const itemIds = itens.map(item => item.id);

      // Buscar entregas desses itens
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
            ref,
            size,
            tipo_roupa:tipo (nome)
          )
        `)
        .in('pedido_item', itemIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar entregas:', error);
        throw error;
      }

      console.log('Entregas carregadas:', data);
      setPedidoDeliveries(data || []);
    } catch (error) {
      console.error('Erro ao carregar entregas do pedido:', error);
      setPedidoDeliveries([]);
    }
  };

  // Função para calcular valor total original do pedido
  const getTotalOriginalPedido = (detalhes: DetalhePedido[]) => {
    return detalhes.reduce((total, item) => total + (item.qtd_inicial * item.valor_un), 0);
  };

  // Função para calcular valor atual restante (apenas itens disponíveis)
  const getTotalAtualPedido = (detalhes: DetalhePedido[]) => {
    return detalhes.reduce((total, item) => total + (item.qtd_atual * item.valor_un), 0);
  };

  // Função para calcular valor já entregue
  const getTotalEntregue = (detalhes: DetalhePedido[]) => {
    return detalhes.reduce((total, item) => {
      const qtdEntregue = item.qtd_inicial - item.qtd_atual;
      return total + (qtdEntregue * item.valor_un);
    }, 0);
  };

  const renderPedidoItem = ({ item }: { item: Pedido }) => (
    <ThemedView style={[styles.pedidoCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <TouchableOpacity onPress={() => showPedidoDetails(item)}>
        <View style={styles.pedidoHeader}>
          <View style={styles.pedidoIcon}>
            <Ionicons name="clipboard" size={24} color="#FECA57" />
          </View>
          <View style={styles.pedidoInfo}>
            <ThemedText style={styles.pedidoTitle}>
              Pedido #{item.id}
            </ThemedText>
            <ThemedText style={styles.pedidoLoja}>
              Loja: {item.store?.nome || 'N/A'}
            </ThemedText>
            <ThemedText style={styles.pedidoFornecedor}>
              Fornecedor: {item.fornecedor_data?.nome || 'N/A'}
            </ThemedText>
            <ThemedText style={styles.pedidoDate}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : 'N/A'}
            </ThemedText>
            {item.detalhe_pedido && (
              <>
                <ThemedText style={styles.pedidoTotal}>
                  Total: {formatCurrency(getTotalPedido(item.detalhe_pedido))}
                </ThemedText>
                {showFinalizados ? (
                  <ThemedText style={styles.pedidoStatusFinalized}>
                    ✅ Pedido finalizado ({item.detalhe_pedido.length} itens entregues)
                  </ThemedText>
                ) : (
                  <ThemedText style={styles.pedidoStatus}>
                    {item.detalhe_pedido.filter(detail => detail.qtd_atual > 0).length} itens pendentes
                  </ThemedText>
                )}
              </>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    </ThemedView>
  );

  const renderDetalheForm = (detalhe: DetalhePedido, index: number) => (
    <ThemedView key={index} style={[styles.detalheContainer, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.detalheHeader}>
        <ThemedText style={styles.detalheTitle}>Item {index + 1}</ThemedText>
        {detalhes.length > 1 && (
          <TouchableOpacity onPress={() => removeDetalhe(index)}>
            <Ionicons name="trash" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <ThemedText style={styles.inputLabel}>Quantidade</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#ffffff' : '#000000' }]}
            value={detalhe.qtd_inicial.toString()}
            onChangeText={(text) => updateDetalhe(index, 'qtd_inicial', parseInt(text) || 0)}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={isDark ? '#999' : '#666'}
          />
        </View>

        <View style={styles.halfInput}>
          <ThemedText style={styles.inputLabel}>Valor Unitário (R$)</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#ffffff' : '#000000' }]}
            value={detalhe.valor_un.toString()}
            onChangeText={(text) => updateDetalhe(index, 'valor_un', parseFloat(text) || 0)}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={isDark ? '#999' : '#666'}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <ThemedText style={styles.inputLabel}>Referência</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#ffffff' : '#000000' }]}
            value={detalhe.ref || ''}
            onChangeText={(text) => updateDetalhe(index, 'ref', text)}
            placeholder="REF001"
            placeholderTextColor={isDark ? '#999' : '#666'}
          />
        </View>

        <View style={styles.halfInput}>
          <ThemedText style={styles.inputLabel}>Tamanho</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#ffffff' : '#000000' }]}
            value={detalhe.size || ''}
            onChangeText={(text) => updateDetalhe(index, 'size', text)}
            placeholder="P, M, G, GG..."
            placeholderTextColor={isDark ? '#999' : '#666'}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Cor</ThemedText>
        <TextInput
          style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#ffffff' : '#000000' }]}
          value={detalhe.cor}
          onChangeText={(text) => updateDetalhe(index, 'cor', text)}
          placeholder="Ex: Azul, Vermelho..."
          placeholderTextColor={isDark ? '#999' : '#666'}
        />
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Tipo de Roupa</ThemedText>
        <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Picker
            selectedValue={detalhe.tipo}
            onValueChange={(value: any) => updateDetalhe(index, 'tipo', value)}
            style={{ color: isDark ? '#ffffff' : '#000000' }}
          >
            <Picker.Item label="Selecione um tipo" value={0} />
            {tiposRoupas.map((tipo) => (
              <Picker.Item key={tipo.id} label={tipo.nome} value={tipo.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Grupo</ThemedText>
        <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Picker
            selectedValue={detalhe.group_id || 0}
            onValueChange={(value: any) => updateDetalhe(index, 'group_id', value === 0 ? undefined : value)}
            style={{ color: isDark ? '#ffffff' : '#000000' }}
          >
            <Picker.Item label="Nenhum grupo" value={0} />
            {groups.map((group) => (
              <Picker.Item key={group.id} label={group.name} value={group.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>Tom/Shade da Cor</ThemedText>
        <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Picker
            selectedValue={detalhe.shade_id || 0}
            onValueChange={(value: any) => updateDetalhe(index, 'shade_id', value === 0 ? undefined : value)}
            style={{ color: isDark ? '#ffffff' : '#000000' }}
          >
            <Picker.Item label="Nenhum tom específico" value={0} />
            {colorShades.map((shade) => {
              const color = colors.find(c => c.shades?.some(s => s.id === shade.id));
              return (
                <Picker.Item 
                  key={shade.id} 
                  label={`${color?.name || ''} - ${shade.name}`} 
                  value={shade.id} 
                />
              );
            })}
          </Picker>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <ThemedText style={styles.totalText}>
          Subtotal: {formatCurrency(detalhe.qtd_inicial * detalhe.valor_un)}
        </ThemedText>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>
          {showFinalizados ? 'Pedidos Finalizados' : 'Pedidos em Aberto'}
        </ThemedText>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowFinalizados(!showFinalizados)}
            style={[styles.toggleButton, { marginRight: 12 }]}
          >
            <Ionicons 
              name={showFinalizados ? "checkmark-done" : "time"} 
              size={20} 
              color={showFinalizados ? "#4CAF50" : "#FF6B6B"} 
            />
          </TouchableOpacity>
          {!showFinalizados && (
            <TouchableOpacity onPress={() => setShowForm(!showForm)}>
              <Ionicons 
                name={showForm ? "close" : "add"} 
                size={24} 
                color={isDark ? '#ffffff' : '#000000'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Indicador de modo de visualização */}
      {!showForm && (
        <ThemedView style={[styles.modeIndicator, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
          <Ionicons 
            name={showFinalizados ? "checkmark-done" : "time"} 
            size={16} 
            color={showFinalizados ? "#4CAF50" : "#FF6B6B"} 
          />
          <ThemedText style={styles.modeText}>
            {showFinalizados ? 'Visualizando pedidos finalizados' : 'Visualizando pedidos em aberto'}
          </ThemedText>
          <TouchableOpacity 
            onPress={() => setShowFinalizados(!showFinalizados)}
            style={styles.switchModeButton}
          >
            <ThemedText style={styles.switchModeText}>
              {showFinalizados ? 'Ver em aberto' : 'Ver finalizados'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Formulário */}
      {showForm && (
        <ScrollView style={styles.formScrollView}>
          <ThemedView style={[styles.formContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <ThemedText style={styles.formTitle}>Novo Pedido</ThemedText>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Loja</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
                <Picker
                  selectedValue={formData.loja}
                  onValueChange={(value: any) => setFormData({ ...formData, loja: value })}
                  style={{ color: isDark ? '#ffffff' : '#000000' }}
                >
                  <Picker.Item label="Selecione uma loja" value="" />
                  {stores.map((store) => (
                    <Picker.Item key={store.id} label={store.nome} value={store.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>Fornecedor</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
                <Picker
                  selectedValue={formData.fornecedor}
                  onValueChange={(value: any) => setFormData({ ...formData, fornecedor: value })}
                  style={{ color: isDark ? '#ffffff' : '#000000' }}
                >
                  <Picker.Item label="Selecione um fornecedor" value="" />
                  {fornecedores.map((fornecedor) => (
                    <Picker.Item key={fornecedor.id} label={fornecedor.nome} value={fornecedor.id.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <ThemedText style={styles.sectionTitle}>Itens do Pedido</ThemedText>
            
            {detalhes.map((detalhe, index) => renderDetalheForm(detalhe, index))}

            <TouchableOpacity style={styles.addButton} onPress={addDetalhe}>
              <Ionicons name="add" size={20} color="#FECA57" />
              <Text style={styles.addButtonText}>Adicionar Item</Text>
            </TouchableOpacity>

            <View style={styles.totalPedidoContainer}>
              <ThemedText style={styles.totalPedidoText}>
                Total do Pedido: {formatCurrency(getTotalPedido(detalhes))}
              </ThemedText>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={cancelForm}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Salvando...' : 'Criar Pedido'}
                </Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      )}

      {/* Lista de Pedidos com Abas por Loja */}
      {!showForm && (
        <View style={styles.listSection}>
          {stores.length === 0 ? (
            /* Mensagem quando não há lojas cadastradas */
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Nenhuma loja cadastrada</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Você precisa cadastrar pelo menos uma loja antes de criar pedidos
              </ThemedText>
              <TouchableOpacity
                style={styles.goToStoresButton}
                onPress={() => router.push('/lojas')}
              >
                <Ionicons name="storefront" size={16} color="#ffffff" />
                <Text style={styles.goToStoresButtonText}>Cadastrar Lojas</Text>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <>
              {/* Abas das Lojas */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
                contentContainerStyle={styles.tabsContent}
              >
                {stores.map((store) => (
                  <TouchableOpacity
                    key={store.id}
                    style={[
                      styles.tab,
                      selectedStore === store.id && styles.activeTab,
                      { backgroundColor: selectedStore === store.id ? '#FECA57' : 'transparent' }
                    ]}
                    onPress={() => setSelectedStore(store.id)}
                  >
                    <Text style={[
                      styles.tabText,
                      selectedStore === store.id && styles.activeTabText,
                      { color: selectedStore === store.id ? '#ffffff' : (isDark ? '#ffffff' : '#000000') }
                    ]}>
                      {store.nome}
                    </Text>
                    <View style={[
                      styles.pedidoCount,
                      { backgroundColor: selectedStore === store.id ? 'rgba(255,255,255,0.3)' : '#FECA57' }
                    ]}>
                      <Text style={[
                        styles.pedidoCountText,
                        { color: selectedStore === store.id ? '#ffffff' : '#ffffff' }
                      ]}>
                        {pedidos.filter(p => p.loja === store.id).length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Lista de Pedidos da Loja Selecionada */}
              <FlatList
                data={getFilteredPedidos()}
                keyExtractor={(item) => item.id?.toString() || '0'}
                renderItem={renderPedidoItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <ThemedView style={styles.emptyContainer}>
                    <Ionicons name="clipboard-outline" size={64} color="#ccc" />
                    <ThemedText style={styles.emptyText}>
                      {selectedStore ? 
                        `Nenhum pedido ${showFinalizados ? 'finalizado' : 'em aberto'} para ${stores.find(s => s.id === selectedStore)?.nome}` : 
                        'Nenhuma loja selecionada'
                      }
                    </ThemedText>
                    <ThemedText style={styles.emptySubtext}>
                      {showFinalizados ? 
                        'Pedidos finalizados são aqueles onde todos os itens já foram entregues.' :
                        'Toque no botão + para criar seu primeiro pedido para esta loja. Apenas pedidos com itens pendentes de entrega são exibidos aqui.'
                      }
                    </ThemedText>
                  </ThemedView>
                }
              />
            </>
          )}
        </View>
      )}

      {/* Modal de Detalhes do Pedido */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Detalhes do Pedido #{selectedPedido?.id}
            </ThemedText>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedPedido && (
              <>
                <ThemedView style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>Informações Gerais</ThemedText>
                  <ThemedText style={styles.modalText}>
                    Loja: {selectedPedido.store?.nome}
                  </ThemedText>
                  <ThemedText style={styles.modalText}>
                    Fornecedor: {selectedPedido.fornecedor_data?.nome}
                  </ThemedText>
                  <ThemedText style={styles.modalText}>
                    Data: {selectedPedido.created_at ? new Date(selectedPedido.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </ThemedText>
                </ThemedView>

                <ThemedView style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>
                    {showFinalizados ? 'Todos os Itens' : 'Itens Disponíveis'}
                  </ThemedText>
                  {showFinalizados ? (
                    // Para pedidos finalizados, mostrar todos os itens
                    selectedPedido.detalhe_pedido?.map((item, index) => (
                      <ThemedView key={index} style={[styles.itemCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
                        <ThemedView style={styles.itemInfo}>
                          <ThemedText style={styles.itemTitle}>
                            {item.tipo_roupa?.nome} - {item.cor}
                          </ThemedText>
                          {item.ref && (
                            <ThemedText style={styles.itemText}>
                              Referência: {item.ref}
                            </ThemedText>
                          )}
                          {item.size && (
                            <ThemedText style={styles.itemText}>
                              Tamanho: {item.size}
                            </ThemedText>
                          )}
                          {item.grupo?.name && (
                            <ThemedText style={styles.itemText}>
                              Grupo: {item.grupo.name}
                            </ThemedText>
                          )}
                          {item.shade?.name && (
                            <ThemedText style={styles.itemText}>
                              Tom: {item.shade.color?.name ? `${item.shade.color.name} - ` : ''}{item.shade.name}
                            </ThemedText>
                          )}
                          <ThemedText style={styles.itemText}>
                            Quantidade: {item.qtd_inicial} (Entregue: {item.qtd_inicial - item.qtd_atual})
                          </ThemedText>
                          <ThemedText style={styles.itemText}>
                            Valor Unitário: {formatCurrency(item.valor_un)}
                          </ThemedText>
                          <ThemedText style={styles.itemTotal}>
                            Subtotal: {formatCurrency(item.qtd_inicial * item.valor_un)}
                          </ThemedText>
                          <ThemedText style={styles.itemStatusFinalized}>
                            ✅ Item totalmente entregue
                          </ThemedText>
                        </ThemedView>
                      </ThemedView>
                    ))
                  ) : (
                    // Para pedidos em aberto, mostrar apenas itens disponíveis
                    selectedPedido.detalhe_pedido?.filter(item => item.qtd_atual > 0).map((item, index) => (
                      <ThemedView key={index} style={[styles.itemCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
                        <ThemedView style={styles.itemHeader}>
                          <ThemedView style={styles.itemInfo}>
                            <ThemedText style={styles.itemTitle}>
                              {item.tipo_roupa?.nome} - {item.cor}
                            </ThemedText>
                            {item.ref && (
                              <ThemedText style={styles.itemText}>
                                Referência: {item.ref}
                              </ThemedText>
                            )}
                            {item.size && (
                              <ThemedText style={styles.itemText}>
                                Tamanho: {item.size}
                              </ThemedText>
                            )}
                            {item.grupo?.name && (
                              <ThemedText style={styles.itemText}>
                                Grupo: {item.grupo.name}
                              </ThemedText>
                            )}
                            {item.shade?.name && (
                              <ThemedText style={styles.itemText}>
                                Tom: {item.shade.color?.name ? `${item.shade.color.name} - ` : ''}{item.shade.name}
                              </ThemedText>
                            )}
                            <ThemedText style={styles.itemText}>
                              Quantidade: {item.qtd_inicial} (Disponível: {item.qtd_atual})
                            </ThemedText>
                            <ThemedText style={styles.itemText}>
                              Valor Unitário: {formatCurrency(item.valor_un)}
                            </ThemedText>
                            <ThemedText style={styles.itemTotal}>
                              Subtotal: {formatCurrency(item.qtd_inicial * item.valor_un)}
                            </ThemedText>
                          </ThemedView>
                          
                          <TouchableOpacity
                            style={styles.receiveButton}
                            onPress={() => openReceiveModal(item)}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.receiveButtonText}>Receber</Text>
                          </TouchableOpacity>
                        </ThemedView>
                      </ThemedView>
                    ))
                  )}
                  
                  {!showFinalizados && selectedPedido.detalhe_pedido?.filter(item => item.qtd_atual > 0).length === 0 && (
                    <ThemedText style={styles.emptyText}>
                      Todos os itens deste pedido já foram entregues.
                    </ThemedText>
                  )}
                  
                  <ThemedView style={styles.totalModalContainer}>
                    <ThemedText style={styles.modalSectionTitle}>Resumo Financeiro</ThemedText>
                    <ThemedText style={styles.modalText}>
                      Valor Total Original: {selectedPedido.detalhe_pedido ? formatCurrency(getTotalOriginalPedido(selectedPedido.detalhe_pedido)) : 'R$ 0,00'}
                    </ThemedText>
                    <ThemedText style={styles.modalText}>
                      Valor Entregue: {selectedPedido.detalhe_pedido ? formatCurrency(getTotalEntregue(selectedPedido.detalhe_pedido)) : 'R$ 0,00'}
                    </ThemedText>
                    <ThemedText style={styles.totalModalText}>
                      Valor Restante: {selectedPedido.detalhe_pedido ? formatCurrency(getTotalAtualPedido(selectedPedido.detalhe_pedido)) : 'R$ 0,00'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                <ThemedView style={styles.modalSection}>
                  <ThemedText style={styles.modalSectionTitle}>Histórico de Entregas</ThemedText>
                  {pedidoDeliveries.length === 0 ? (
                    <ThemedText style={styles.emptyText}>
                      Nenhuma entrega registrada para este pedido.
                    </ThemedText>
                  ) : (
                    pedidoDeliveries.map((delivery, index) => (
                      <ThemedView key={index} style={[styles.itemCard, { backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }]}>
                        <ThemedText style={styles.itemTitle}>
                          Entrega #{delivery.id} - {delivery.qtd} unidades
                        </ThemedText>
                        <ThemedText style={styles.itemText}>
                          Item: {delivery.detalhe_pedido?.tipo_roupa?.nome} - {delivery.detalhe_pedido?.cor}
                          {delivery.detalhe_pedido?.size && ` - Tamanho: ${delivery.detalhe_pedido.size}`}
                          {delivery.detalhe_pedido?.ref && ` - Ref: ${delivery.detalhe_pedido.ref}`}
                        </ThemedText>
                        <ThemedText style={styles.itemText}>
                          Data: {new Date(delivery.created_at).toLocaleString('pt-BR')}
                        </ThemedText>
                        <ThemedText style={styles.itemText}>
                          Usuário: {delivery.user || 'N/A'}
                        </ThemedText>
                      </ThemedView>
                    ))
                  )}
                </ThemedView>
              </>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Modal de Recebimento */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.receiveModalContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.receiveModalHeader}>
              <ThemedText style={styles.modalTitle}>Receber Item</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowReceiveModal(false);
                  setSelectedItem(null);
                  setQuantidadeReceber('');
                }}
              >
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.receiveModalContent}>
                <ThemedText style={styles.itemInfoText}>
                  {selectedItem.tipo_roupa?.nome} - {selectedItem.cor}
                </ThemedText>
                <ThemedText style={styles.itemInfoText}>
                  Quantidade disponível: {selectedItem.qtd_atual}
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Quantidade a receber *</ThemedText>
                  <TextInput
                    style={[
                      styles.receiveInput,
                      {
                        backgroundColor: isDark ? '#333' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        borderColor: isDark ? '#555' : '#ddd',
                      }
                    ]}
                    value={quantidadeReceber}
                    onChangeText={setQuantidadeReceber}
                    placeholder="Digite a quantidade"
                    placeholderTextColor={isDark ? '#999' : '#666'}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.receiveModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelReceiveButton}
                    onPress={() => {
                      setShowReceiveModal(false);
                      setSelectedItem(null);
                      setQuantidadeReceber('');
                    }}
                  >
                    <Text style={styles.cancelReceiveButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmReceiveButton}
                    onPress={handleReceiveItem}
                  >
                    <Text style={styles.confirmReceiveButtonText}>Receber</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 8,
  },
  modeText: {
    flex: 1,
    fontSize: 14,
  },
  switchModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FECA57',
    borderRadius: 6,
  },
  switchModeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  formScrollView: {
    flex: 1,
  },
  formContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  detalheContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  detalheHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detalheTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FECA57',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#FECA57',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FECA57',
    fontWeight: '600',
  },
  totalPedidoContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(254, 202, 87, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  totalPedidoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FECA57',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FECA57',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  pedidoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pedidoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pedidoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(254, 202, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pedidoInfo: {
    flex: 1,
  },
  pedidoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  pedidoLoja: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  pedidoFornecedor: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  pedidoDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  pedidoTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FECA57',
    marginTop: 4,
  },
  pedidoStatus: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 2,
  },
  pedidoStatusFinalized: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FECA57',
    marginTop: 4,
  },
  itemStatusFinalized: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  totalModalContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(254, 202, 87, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  totalModalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FECA57',
  },
  listSection: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FECA57',
  },
  activeTab: {
    backgroundColor: '#FECA57',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  activeTabText: {
    color: '#ffffff',
  },
  pedidoCount: {
    backgroundColor: '#FECA57',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pedidoCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goToStoresButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  goToStoresButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Estilos para o modal de recebimento
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiveModalContainer: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    padding: 20,
  },
  receiveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  receiveModalContent: {
    gap: 16,
  },
  itemInfoText: {
    fontSize: 14,
    opacity: 0.8,
  },
  inputGroup: {
    gap: 8,
  },
  receiveInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  receiveModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelReceiveButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelReceiveButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmReceiveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmReceiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Estilos para itens com botão receber
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  receiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  receiveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
