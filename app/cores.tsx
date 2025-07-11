import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CustomButton } from '../components/CustomButton';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { colorsService, colorsShadesService, type Color, type ColorShade, type ColorWithShades } from '../lib/supabase';
import { checkSupabaseConfig, debugColorsComplete, testShadeCreation } from '../utils/debugColors';
import { testColors, testColorShades } from '../utils/testColors';

export default function CoresScreen() {
  const [colors, setColors] = useState<ColorWithShades[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [shadeModalVisible, setShadeModalVisible] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [editingShade, setEditingShade] = useState<ColorShade | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [colorName, setColorName] = useState('');
  const [shadeName, setShadeName] = useState('');
  const [expandedColors, setExpandedColors] = useState<Set<number>>(new Set());
  const [showTests, setShowTests] = useState(false);

  // Carregar cores
const loadColors = async () => {
  console.log('loadColors chamado');
  try {
    setLoading(true);
    console.log('Chamando colorsService.getAllWithShades()...');
    
    // Tentar carregar cores com tons
    const data = await colorsService.getAllWithShades();
    console.log('Dados recebidos (cores com tons):', data);
    setColors(data || []);
    
    // Calcular estatísticas
    const totalColors = data.length;
    const totalShades = data.reduce((sum, color) => sum + (color.shades?.length || 0), 0);
    
    console.log('Estatísticas:', { totalColors, totalShades });
    
  } catch (error) {
    console.error('Erro ao carregar cores:', error);
    
    // Tentar carregar apenas as cores se houver erro com tons
    try {
      console.log('Tentando carregar apenas cores...');
      const basicColors = await colorsService.getAll();
      
      const colorsWithoutShades = basicColors.map(color => ({
        ...color,
        shades: []
      }));
      
      setColors(colorsWithoutShades);
      console.log('Cores carregadas sem tons:', colorsWithoutShades);
      
    } catch (basicError) {
      console.error('Erro ao carregar cores básicas:', basicError);
      Alert.alert('Erro', 'Não foi possível carregar as cores. Verifique se as tabelas foram criadas no banco de dados.');
    }
  } finally {
    setLoading(false);
  }
};

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadColors();
    setRefreshing(false);
  };

  // Carregar dados inicial
  useEffect(() => {
    loadColors();
  }, []);

  // Criar ou atualizar cor
  const handleSaveColor = async () => {
    if (!colorName.trim()) {
      Alert.alert('Erro', 'Nome da cor é obrigatório');
      return;
    }

    try {
      if (editingColor) {
        await colorsService.update(editingColor.id, colorName.trim());
        Alert.alert('Sucesso', 'Cor atualizada com sucesso');
      } else {
        await colorsService.create(colorName.trim());
        Alert.alert('Sucesso', 'Cor criada com sucesso');
      }
      
      setModalVisible(false);
      setColorName('');
      setEditingColor(null);
      await loadColors();
    } catch (error) {
      console.error('Erro ao salvar cor:', error);
      Alert.alert('Erro', 'Não foi possível salvar a cor');
    }
  };

  // Deletar cor
  const handleDeleteColor = async (color: Color) => {
    const canDelete = await colorsService.canDelete(color.id);
    
    if (!canDelete) {
      Alert.alert(
        'Não é possível deletar',
        'Esta cor possui tons cadastrados. Delete os tons primeiro.'
      );
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente deletar a cor "${color.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await colorsService.delete(color.id);
              Alert.alert('Sucesso', 'Cor deletada com sucesso');
              await loadColors();
            } catch (error) {
              console.error('Erro ao deletar cor:', error);
              Alert.alert('Erro', 'Não foi possível deletar a cor');
            }
          },
        },
      ]
    );
  };

  // Deletar tom
  const handleDeleteShade = async (shade: ColorShade) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente deletar o tom "${shade.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await colorsShadesService.delete(shade.id);
              Alert.alert('Sucesso', 'Tom deletado com sucesso');
              await loadColors();
            } catch (error) {
              console.error('Erro ao deletar tom:', error);
              Alert.alert('Erro', 'Não foi possível deletar o tom');
            }
          },
        },
      ]
    );
  };

  // Abrir modal para criar cor
  const openCreateColorModal = () => {
    setEditingColor(null);
    setColorName('');
    setModalVisible(true);
  };

  // Abrir modal para editar cor
  const openEditColorModal = (color: Color) => {
    setEditingColor(color);
    setColorName(color.name);
    setModalVisible(true);
  };

  // Abrir modal para criar tom
  const openCreateShadeModal = (color: Color) => {
    setSelectedColor(color);
    setEditingShade(null);
    setShadeName('');
    setShadeModalVisible(true);
  };

  // Abrir modal para editar tom
  const openEditShadeModal = (shade: ColorShade, color: Color) => {
    setSelectedColor(color);
    setEditingShade(shade);
    setShadeName(shade.name);
    setShadeModalVisible(true);
  };

  // Toggle expandir/recolher cor
  const toggleColorExpansion = (colorId: number) => {
    const newExpanded = new Set(expandedColors);
    if (newExpanded.has(colorId)) {
      newExpanded.delete(colorId);
    } else {
      newExpanded.add(colorId);
    }
    setExpandedColors(newExpanded);
  };

  // Expandir/recolher todas as cores
  const toggleAllExpansion = () => {
    if (expandedColors.size === colors.length) {
      setExpandedColors(new Set());
    } else {
      setExpandedColors(new Set(colors.map(c => c.id)));
    }
  };

  // Executar diagnóstico completo
  const runDiagnostic = async () => {
    setShowTests(true);
    console.log('Executando diagnóstico completo...');
    
    try {
      // Verificar configuração primeiro
      const configOk = checkSupabaseConfig();
      if (!configOk) {
        return;
      }
      
      // Executar diagnóstico completo
      await debugColorsComplete();
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
      Alert.alert('Erro', 'Erro ao executar diagnóstico. Verifique o console.');
    } finally {
      setShowTests(false);
    }
  };

  // Executar testes
  const runTests = async () => {
    setShowTests(true);
    console.log('Executando testes de cores...');
    
    try {
      await testColors.runAllTests();
      await testColorShades.runAllTests();
      Alert.alert('Testes', 'Testes executados! Verifique o console para resultados.');
    } catch (error) {
      console.error('Erro nos testes:', error);
      Alert.alert('Erro', 'Erro ao executar testes');
    } finally {
      setShowTests(false);
    }
  };

  // Função melhorada para salvar tom com logs detalhados
  const handleSaveShadeDetailed = async () => {
    console.log('=== handleSaveShadeDetailed INICIADO ===');
    console.log('Estado atual:', {
      shadeName,
      selectedColor,
      editingShade,
      shadeNameLength: shadeName?.length,
      shadeNameTrimmed: shadeName?.trim()
    });
    
    if (!shadeName.trim()) {
      console.log('Erro: Nome do tom vazio');
      Alert.alert('Erro', 'Nome do tom é obrigatório');
      return;
    }

    if (!selectedColor) {
      console.log('Erro: Cor não selecionada');
      Alert.alert('Erro', 'Cor não selecionada');
      return;
    }

    try {
      console.log('Iniciando salvamento do tom...');
      
      if (editingShade) {
        console.log('Modo: Editando tom existente, ID:', editingShade.id);
        await colorsShadesService.update(editingShade.id, shadeName.trim());
        Alert.alert('Sucesso', 'Tom atualizado com sucesso');
      } else {
        console.log('Modo: Criando novo tom para cor:', selectedColor);
        
        // Usar função de teste específica para mais logs
        const result = await testShadeCreation(selectedColor.id, shadeName.trim());
        console.log('Resultado da criação:', result);
        Alert.alert('Sucesso', 'Tom criado com sucesso');
      }
      
      setShadeModalVisible(false);
      setShadeName('');
      setEditingShade(null);
      setSelectedColor(null);
      console.log('Recarregando cores...');
      await loadColors();
    } catch (error) {
      console.error('Erro detalhado ao salvar tom:', error);
      
      // Mostrar detalhes específicos do erro
      let errorMessage = 'Não foi possível salvar o tom';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      console.error('Mensagem do erro a ser exibida:', errorMessage);
      Alert.alert('Erro Detalhado', errorMessage);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <ThemedText style={styles.loadingText}>Carregando cores...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Cores e Tons
        </ThemedText>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#FF6B6B' }]}
            onPress={runDiagnostic}
            disabled={showTests}
          >
            <Text style={styles.testButtonText}>
              {showTests ? 'Diagnosticando...' : 'Diagnóstico'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { marginLeft: 8 }]}
            onPress={runTests}
            disabled={showTests}
          >
            <Text style={styles.testButtonText}>
              {showTests ? 'Testando...' : 'Testes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{colors.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Cores</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>
            {colors.reduce((total, color) => total + (color.shades?.length || 0), 0)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Tons</ThemedText>
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <CustomButton
          title="Nova Cor"
          onPress={openCreateColorModal}
          style={styles.addButton}
        />
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleAllExpansion}
        >
          <Text style={styles.expandButtonText}>
            {expandedColors.size === colors.length ? 'Recolher Todas' : 'Expandir Todas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de cores */}
      <ScrollView
        style={styles.colorsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {colors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              Nenhuma cor cadastrada
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Toque em Nova Cor para começar
            </ThemedText>
          </View>
        ) : (
          colors.map((color) => (
            <View key={color.id} style={styles.colorItem}>
              {/* Cabeçalho da cor */}
              <View style={styles.colorHeader}>
                <TouchableOpacity
                  style={styles.colorTitleContainer}
                  onPress={() => toggleColorExpansion(color.id)}
                >
                  <Text style={styles.expandIcon}>
                    {expandedColors.has(color.id) ? '▼' : '▶'}
                  </Text>
                  <ThemedText style={styles.colorName}>{color.name}</ThemedText>
                  <ThemedText style={styles.shadesCount}>
                    ({color.shades?.length || 0} tons)
                  </ThemedText>
                </TouchableOpacity>
                
                <View style={styles.colorActions}>
                  <TouchableOpacity
                    style={styles.addShadeButton}
                    onPress={() => openCreateShadeModal(color)}
                  >
                    <Text style={styles.actionButtonText}>+ Tom</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditColorModal(color)}
                  >
                    <Ionicons name="pencil" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteColor(color)}
                  >
                    <Ionicons name="trash" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tons da cor */}
              {expandedColors.has(color.id) && color.shades && color.shades.length > 0 && (
                <View style={styles.shadesContainer}>
                  {color.shades.map((shade) => (
                    <View key={shade.id} style={styles.shadeItem}>
                      <ThemedText style={styles.shadeName}>{shade.name}</ThemedText>
                      <View style={styles.shadeActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => openEditShadeModal(shade, color)}
                        >
                          <Ionicons name="pencil" size={16} color="#ffffff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteShade(shade)}
                        >
                          <Text style={styles.actionButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Placeholder para cores sem tons */}
              {expandedColors.has(color.id) && (!color.shades || color.shades.length === 0) && (
                <View style={styles.noShadesContainer}>
                  <ThemedText style={styles.noShadesText}>
                    Nenhum tom cadastrado
                  </ThemedText>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para criar/editar cor */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {editingColor ? 'Editar Cor' : 'Nova Cor'}
            </ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="Nome da cor"
              value={colorName}
              onChangeText={setColorName}
              autoCapitalize="words"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveColor}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para criar/editar tom */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={shadeModalVisible}
        onRequestClose={() => setShadeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>
              {editingShade ? 'Editar Tom' : 'Novo Tom'}
            </ThemedText>
            
            {selectedColor && (
              <ThemedText style={styles.selectedColor}>
                Cor: {selectedColor.name}
              </ThemedText>
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Nome do tom"
              value={shadeName}
              onChangeText={setShadeName}
              autoCapitalize="words"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShadeModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveShadeDetailed}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  addButton: {
    flex: 1,
    marginRight: 8,
  },
  expandButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  expandButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  colorsList: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  colorItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  colorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  colorTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    width: 12,
  },
  colorName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  shadesCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  colorActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addShadeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shadesContainer: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  shadeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  shadeName: {
    fontSize: 14,
    flex: 1,
  },
  shadeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noShadesContainer: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
    alignItems: 'center',
  },
  noShadesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedColor: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
