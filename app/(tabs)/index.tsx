import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UserProfile } from '@/components/UserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardData {
  totalPedidos: number;
  pedidosPorLoja: { nome: string; count: number; color: string }[];
  pedidosPorFornecedor: { nome: string; count: number; color: string }[];
  recentePedidos: {
    id: number;
    loja_nome: string;
    fornecedor_nome: string;
    data_pedido: string;
    total_itens: number;
  }[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalPedidos: 0,
    pedidosPorLoja: [],
    pedidosPorFornecedor: [],
    recentePedidos: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Barra lateral
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.8)).current;

  const menuOptions = [
    {
      id: 'lojas',
      title: 'Lojas',
      subtitle: 'Gerenciar informações das lojas',
      icon: 'storefront-outline',
      color: '#FF6B6B',
    },
    {
      id: 'fornecedores',
      title: 'Fornecedores',
      subtitle: 'Cadastrar e gerenciar fornecedores',
      icon: 'business-outline',
      color: '#4ECDC4',
    },
    {
      id: 'tipos-roupas',
      title: 'Tipos de Roupas',
      subtitle: 'Categorias e tipos de produtos',
      icon: 'shirt-outline',
      color: '#96CEB4',
    },
    {
      id: 'materiais',
      title: 'Materiais',
      subtitle: 'Gerenciar tipos de materiais',
      icon: 'hammer-outline',
      color: '#FF6B6B',
    },
    {
      id: 'grupos',
      title: 'Grupos',
      subtitle: 'Organizar produtos em grupos',
      icon: 'folder-outline',
      color: '#4ECDC4',
    },
    {
      id: 'cores',
      title: 'Cores',
      subtitle: 'Gerenciar cores e tons',
      icon: 'color-palette-outline',
      color: '#FF7675',
    },
    {
      id: 'pedidos',
      title: 'Pedidos',
      subtitle: 'Gerenciar pedidos e compras',
      icon: 'clipboard-outline',
      color: '#FECA57',
    },
    {
      id: 'entregas',
      title: 'Entregas',
      subtitle: 'Acompanhar entregas realizadas',
      icon: 'cube-outline',
      color: '#FF9F43',
    },
  ];

  useEffect(() => {
    // Mostrar boas-vindas por 3 segundos após o login
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      loadDashboardData();
    }
  }, [showWelcome]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar dados dos pedidos sem relacionamentos
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedido')
        .select(`
          id,
          created_at,
          loja,
          fornecedor
        `)
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;

      // Buscar detalhes dos pedidos separadamente
      const { data: detalhesPedidos } = await supabase
        .from('detalhe_pedido')
        .select('pedido, qtd_inicial');

      // Buscar lojas e fornecedores separadamente
      const { data: lojas } = await supabase
        .from('store')
        .select('id, nome');

      const { data: fornecedores } = await supabase
        .from('fornecedor')
        .select('id, nome');

      // Criar maps para lookup rápido
      const lojaMap = new Map(lojas?.map(loja => [loja.id, loja.nome]) || []);
      const fornecedorMap = new Map(fornecedores?.map(fornecedor => [fornecedor.id, fornecedor.nome]) || []);
      
      // Criar map de detalhes por pedido_id
      const detalhesMap = new Map();
      detalhesPedidos?.forEach((detalhe: any) => {
        const pedidoId = detalhe.pedido;
        if (!detalhesMap.has(pedidoId)) {
          detalhesMap.set(pedidoId, []);
        }
        detalhesMap.get(pedidoId).push(detalhe);
      });

      // Processar dados para dashboard
      const totalPedidos = pedidos?.length || 0;
      
      // Agrupar por loja
      const pedidosPorLojaMap = new Map();
      const pedidosPorFornecedorMap = new Map();
      const cores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9F43'];
      
      pedidos?.forEach((pedido: any) => {
        const lojaNome = lojaMap.get(pedido.loja) || 'Sem loja';
        const fornecedorNome = fornecedorMap.get(pedido.fornecedor) || 'Sem fornecedor';
        
        pedidosPorLojaMap.set(lojaNome, (pedidosPorLojaMap.get(lojaNome) || 0) + 1);
        pedidosPorFornecedorMap.set(fornecedorNome, (pedidosPorFornecedorMap.get(fornecedorNome) || 0) + 1);
      });

      // Converter para arrays
      const pedidosPorLoja = Array.from(pedidosPorLojaMap.entries())
        .map(([nome, count], index) => ({
          nome,
          count,
          color: cores[index % cores.length]
        }))
        .sort((a, b) => b.count - a.count);

      const pedidosPorFornecedor = Array.from(pedidosPorFornecedorMap.entries())
        .map(([nome, count], index) => ({
          nome,
          count,
          color: cores[index % cores.length]
        }))
        .sort((a, b) => b.count - a.count);

      // Pedidos recentes
      const recentePedidos = pedidos?.slice(0, 5).map((pedido: any) => {
        const detalhes = detalhesMap.get(pedido.id) || [];
        const totalItens = detalhes.reduce((sum: number, item: any) => sum + (item.qtd_inicial || 0), 0);
        
        return {
          id: pedido.id,
          loja_nome: lojaMap.get(pedido.loja) || 'Sem loja',
          fornecedor_nome: fornecedorMap.get(pedido.fornecedor) || 'Sem fornecedor',
          data_pedido: pedido.created_at,
          total_itens: totalItens
        };
      }) || [];

      setDashboardData({
        totalPedidos,
        pedidosPorLoja,
        pedidosPorFornecedor,
        recentePedidos
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -screenWidth * 0.8 : 0;
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    setSidebarVisible(!sidebarVisible);
  };

  const handleGesture = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      const { translationX, velocityX } = nativeEvent;
      
      if (translationX > 100 || velocityX > 500) {
        // Swipe right - abrir sidebar
        if (!sidebarVisible) {
          toggleSidebar();
        }
      } else if (translationX < -100 || velocityX < -500) {
        // Swipe left - fechar sidebar
        if (sidebarVisible) {
          toggleSidebar();
        }
      }
    }
  };

  const handleMenuPress = async (optionId: string) => {
    console.log('Menu pressionado:', optionId);
    
    try {
      // Fechar sidebar primeiro
      setSidebarVisible(false);
      Animated.spring(slideAnim, {
        toValue: -screenWidth * 0.8,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      // Navegar imediatamente
      switch (optionId) {
        case 'lojas':
          console.log('Navegando para /lojas');
          router.push('/lojas');
          break;
        case 'fornecedores':
          console.log('Navegando para /fornecedores');
          router.push('/fornecedores');
          break;
        case 'tipos-roupas':
          console.log('Navegando para /tipos-roupas');
          router.push('/tipos-roupas');
          break;
        case 'materiais':
          console.log('Navegando para /materiais');
          router.push('/materiais');
          break;
        case 'grupos':
          console.log('Navegando para /grupos');
          router.push('/grupos' as any);
          break;
        case 'cores':
          console.log('Navegando para /cores');
          router.push('/cores' as any);
          break;
        case 'pedidos':
          console.log('Navegando para /pedidos');
          router.push('/pedidos');
          break;
        case 'entregas':
          console.log('Navegando para /entregas');
          router.push('/entregas' as any);
          break;
        default:
          console.log(`Opção não reconhecida: ${optionId}`);
          return;
      }
    } catch (error) {
      console.error('Erro na navegação:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (showWelcome && user) {
    return (
      <ThemedView style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <View style={[
            styles.logoContainer,
            { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }
          ]}>
            <Ionicons 
              name="checkmark-circle" 
              size={80} 
              color="#00D4AA" 
            />
          </View>
          
          <ThemedText style={styles.welcomeTitle}>
            Bem-vindo ao Ritho!
          </ThemedText>
          
          {user?.user_metadata?.name && (
            <ThemedText style={styles.userName}>
              Olá, {user.user_metadata.name}! 👋
            </ThemedText>
          )}
          
          <ThemedText style={styles.subtitle}>
            Login realizado com sucesso
          </ThemedText>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setShowWelcome(false)}
          >
            <Text style={styles.skipButtonText}>Pular</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <PanGestureHandler onHandlerStateChange={handleGesture}>
        <View style={styles.container}>
          
          {/* Header com botão de menu */}
          <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleSidebar}
            >
              <Ionicons name="menu" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
            <View style={styles.menuButton} />
          </View>

          {/* Conteúdo principal */}
          <ScrollView
            style={styles.mainContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Cards de resumo */}
            <View style={styles.summaryCards}>
              <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                <Ionicons name="bag-handle" size={32} color="#007AFF" />
                <ThemedText style={styles.summaryNumber}>{dashboardData.totalPedidos}</ThemedText>
                <ThemedText style={styles.summaryLabel}>Total de Pedidos</ThemedText>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
                <Ionicons name="storefront" size={32} color="#FF6B6B" />
                <ThemedText style={styles.summaryNumber}>{dashboardData.pedidosPorLoja.length}</ThemedText>
                <ThemedText style={styles.summaryLabel}>Lojas Ativas</ThemedText>
              </View>
            </View>

            {/* Gráfico de pedidos por loja */}
            <View style={[styles.chartContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              <ThemedText style={styles.chartTitle}>📊 Pedidos por Loja</ThemedText>
              {dashboardData.pedidosPorLoja.map((item, index) => (
                <View key={index} style={styles.chartItem}>
                  <View style={styles.chartLabel}>
                    <View style={[styles.chartColor, { backgroundColor: item.color }]} />
                    <ThemedText style={styles.chartText}>{item.nome}</ThemedText>
                  </View>
                  <View style={styles.chartBar}>
                    <View 
                      style={[
                        styles.chartFill, 
                        { 
                          backgroundColor: item.color,
                          width: `${(item.count / Math.max(...dashboardData.pedidosPorLoja.map(p => p.count))) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.chartValue}>{item.count}</ThemedText>
                </View>
              ))}
            </View>

            {/* Gráfico de pedidos por fornecedor */}
            <View style={[styles.chartContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              <ThemedText style={styles.chartTitle}>🏢 Pedidos por Fornecedor</ThemedText>
              {dashboardData.pedidosPorFornecedor.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.chartItem}>
                  <View style={styles.chartLabel}>
                    <View style={[styles.chartColor, { backgroundColor: item.color }]} />
                    <ThemedText style={styles.chartText}>{item.nome}</ThemedText>
                  </View>
                  <View style={styles.chartBar}>
                    <View 
                      style={[
                        styles.chartFill, 
                        { 
                          backgroundColor: item.color,
                          width: `${(item.count / Math.max(...dashboardData.pedidosPorFornecedor.map(p => p.count))) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                  <ThemedText style={styles.chartValue}>{item.count}</ThemedText>
                </View>
              ))}
            </View>

            {/* Pedidos recentes */}
            <View style={[styles.recentContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              <ThemedText style={styles.chartTitle}>🕒 Pedidos Recentes</ThemedText>
              {dashboardData.recentePedidos.map((pedido, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => router.push('/pedidos')}
                >
                  <View style={styles.recentInfo}>
                    <ThemedText style={styles.recentLoja}>{pedido.loja_nome}</ThemedText>
                    <ThemedText style={styles.recentFornecedor}>{pedido.fornecedor_nome}</ThemedText>
                    <ThemedText style={styles.recentDate}>{formatDate(pedido.data_pedido)}</ThemedText>
                  </View>
                  <View style={styles.recentBadge}>
                    <ThemedText style={styles.recentBadgeText}>{pedido.total_itens} itens</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </PanGestureHandler>

      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar,
          { 
            transform: [{ translateX: slideAnim }],
            backgroundColor: isDark ? '#1a1a1a' : '#fff'
          }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <TouchableOpacity
            style={styles.closeSidebar}
            onPress={toggleSidebar}
          >
            <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sidebarContent}>
          {/* Perfil do usuário */}
          <View style={styles.sidebarProfile}>
            <UserProfile />
          </View>

          {/* Menu de navegação */}
          <View style={styles.sidebarMenu}>
            <ThemedText style={styles.sidebarMenuTitle}>Menu</ThemedText>
            {menuOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.sidebarMenuItem}
                onPress={() => handleMenuPress(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.sidebarMenuIcon, { backgroundColor: `${option.color}20` }]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={option.color} 
                  />
                </View>
                <View style={styles.sidebarMenuText}>
                  <ThemedText style={styles.sidebarMenuItemTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.sidebarMenuItemSubtitle}>{option.subtitle}</ThemedText>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={isDark ? '#666' : '#999'} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Overlay quando sidebar está aberta */}
      {/* {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  chartColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartText: {
    fontSize: 14,
    flex: 1,
  },
  chartBar: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    borderRadius: 10,
    minWidth: 4,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'right',
  },
  recentContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  recentInfo: {
    flex: 1,
  },
  recentLoja: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentFornecedor: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  recentDate: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  recentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  closeSidebar: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarProfile: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sidebarMenu: {
    padding: 20,
  },
  sidebarMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    opacity: 0.7,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
  },
  sidebarMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sidebarMenuText: {
    flex: 1,
  },
  sidebarMenuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sidebarMenuItemSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#00D4AA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  skipButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
