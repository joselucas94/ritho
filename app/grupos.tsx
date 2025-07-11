import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { groupsService, type Group, type GroupWithHierarchy } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function GroupsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [groups, setGroups] = useState<GroupWithHierarchy[]>([]);
  const [flatGroups, setFlatGroups] = useState<Group[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: null as number | null,
  });
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);

  useEffect(() => {
    if (showHierarchy) {
      loadGroupsHierarchy();
    } else {
      loadGroupsFlat();
    }
  }, [showHierarchy]);

  const loadGroupsHierarchy = async () => {
    console.log('loadGroupsHierarchy chamado');
    try {
      setLoading(true);
      console.log('Chamando groupsService.getHierarchy()...');
      const data = await groupsService.getHierarchy();
      console.log('Dados recebidos (hierarquia):', data);
      setGroups(data || []);
      
      // Expandir grupos raiz por padrão
      const rootIds = new Set(data.map(group => group.id).filter(id => id !== undefined) as number[]);
      setExpandedGroups(rootIds);
    } catch (error) {
      console.error('Erro ao carregar hierarquia de grupos:', error);
      Alert.alert('Erro', 'Não foi possível carregar a hierarquia de grupos');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupsFlat = async () => {
    console.log('loadGroupsFlat chamado');
    try {
      setLoading(true);
      console.log('Chamando groupsService.getAll()...');
      const data = await groupsService.getAll();
      console.log('Dados recebidos (flat):', data);
      setFlatGroups(data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os grupos');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpansion = (groupId: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const expandAllGroups = () => {
    const allIds = new Set<number>();
    
    const collectIds = (groups: GroupWithHierarchy[]) => {
      groups.forEach(group => {
        if (group.id) allIds.add(group.id);
        if (group.children) collectIds(group.children);
      });
    };
    
    collectIds(groups);
    setExpandedGroups(allIds);
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (showHierarchy) {
      await loadGroupsHierarchy();
    } else {
      await loadGroupsFlat();
    }
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    console.log('handleSubmit chamado com formData:', formData);
    
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do grupo');
      return;
    }

    try {
      setLoading(true);
      console.log('Iniciando processo de salvamento...');

      if (editingGroup) {
        console.log('Editando grupo existente:', editingGroup);
        // Verificar se o nome já existe no mesmo nível hierárquico
        const nameExists = await groupsService.checkNameExists(
          formData.name.trim(), 
          formData.parent_id, 
          editingGroup.id
        );
        if (nameExists) {
          Alert.alert('Erro', 'Já existe um grupo com este nome no mesmo nível');
          return;
        }

        // Atualizar grupo existente
        await groupsService.update(editingGroup.id!, {
          name: formData.name.trim(),
          parent_id: formData.parent_id || undefined,
        });

        Alert.alert('Sucesso', 'Grupo atualizado com sucesso!');
      } else {
        console.log('Criando novo grupo...');
        // Verificar se o nome já existe no mesmo nível hierárquico
        const nameExists = await groupsService.checkNameExists(
          formData.name.trim(), 
          formData.parent_id
        );
        console.log('Nome já existe?', nameExists);
        
        if (nameExists) {
          Alert.alert('Erro', 'Já existe um grupo com este nome no mesmo nível');
          return;
        }

        // Criar novo grupo
        console.log('Chamando groupsService.create...');
        const result = await groupsService.create({
          name: formData.name.trim(),
          parent_id: formData.parent_id || undefined,
        });
        console.log('Resultado da criação:', result);

        Alert.alert('Sucesso', 'Grupo cadastrado com sucesso!');
      }

      // Resetar formulário
      setFormData({ name: '', parent_id: null });
      setEditingGroup(null);
      setShowForm(false);
      
      // Recarregar lista
      console.log('Recarregando lista de grupos...');
      if (showHierarchy) {
        await loadGroupsHierarchy();
      } else {
        await loadGroupsFlat();
      }
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      Alert.alert('Erro', 'Não foi possível salvar o grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({ 
      name: group.name,
      parent_id: group.parent_id || null
    });
    setShowForm(true);
  };

  const handleDelete = (group: Group) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o grupo "${group.name}"?\n\nAtenção: Se este grupo tiver subgrupos, eles também serão excluídos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteGroup(group.id!),
        },
      ]
    );
  };

  const deleteGroup = async (groupId: number) => {
    try {
      setLoading(true);
      await groupsService.delete(groupId);
      Alert.alert('Sucesso', 'Grupo excluído com sucesso!');
      if (showHierarchy) {
        await loadGroupsHierarchy();
      } else {
        await loadGroupsFlat();
      }
    } catch (error: any) {
      console.error('Erro ao excluir grupo:', error);
      Alert.alert('Erro', error.message || 'Não foi possível excluir o grupo');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ name: '', parent_id: null });
    setEditingGroup(null);
    setShowForm(false);
  };

  const getParentName = (parentId: number | null) => {
    if (!parentId) return 'Grupo Raiz';
    
    const findParent = (groups: GroupWithHierarchy[]): string => {
      for (const group of groups) {
        if (group.id === parentId) {
          return group.name;
        }
        if (group.children) {
          const found = findParent(group.children);
          if (found) return found;
        }
      }
      return 'Grupo não encontrado';
    };
    
    return findParent(groups);
  };

  const renderHierarchyItem = (item: GroupWithHierarchy, level: number = 0) => {
    const items = [];
    const isExpanded = expandedGroups.has(item.id!);
    const hasChildren = item.children && item.children.length > 0;
    
    // Renderizar item atual
    items.push(
      <ThemedView 
        key={item.id} 
        style={[
          styles.groupCard, 
          { 
            backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
            marginLeft: level * 20,
          }
        ]}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupHeaderLeft}>
            {/* Botão de expandir/colapsar */}
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleGroupExpansion(item.id!)}
                style={styles.expandButton}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-down" : "chevron-forward"} 
                  size={16} 
                  color={isDark ? '#ffffff' : '#000000'} 
                />
              </TouchableOpacity>
            )}
            
            {/* Ícone do grupo */}
            <View style={styles.groupIcon}>
              <Ionicons 
                name={level === 0 ? "folder" : "folder-outline"} 
                size={24} 
                color={level === 0 ? "#4ECDC4" : "#96CEB4"} 
              />
            </View>
            
            {/* Informações do grupo */}
            <View style={styles.groupInfo}>
              <ThemedText style={[styles.groupName, level > 0 && styles.subgroupName]}>
                {item.name}
              </ThemedText>
              <ThemedText style={styles.groupDate}>
                {level === 0 ? 'Grupo Raiz' : 'Subgrupo'}
                {hasChildren && (
                  <Text style={styles.childrenCount}>
                    {' • '}{item.children!.length} subgrupo{item.children!.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </ThemedText>
              <ThemedText style={styles.groupDate}>
                Criado em: {new Date(item.created_at!).toLocaleDateString('pt-BR')}
              </ThemedText>
            </View>
          </View>
          
          {/* Ações do grupo */}
          <View style={styles.groupActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(item)}
            >
              <Ionicons name="pencil" size={16} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>
    );
    
    // Renderizar subgrupos apenas se expandido
    if (hasChildren && isExpanded) {
      item.children!.forEach(child => {
        items.push(...renderHierarchyItem(child, level + 1));
      });
    }
    
    return items;
  };

  const renderFlatItem = ({ item }: { item: Group }) => (
    <ThemedView style={[styles.groupCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.groupHeader}>
        <View style={styles.groupHeaderLeft}>
          <View style={styles.groupIcon}>
            <Ionicons 
              name={item.parent_id ? "folder-outline" : "folder"} 
              size={24} 
              color={item.parent_id ? "#96CEB4" : "#4ECDC4"} 
            />
          </View>
          <View style={styles.groupInfo}>
            <ThemedText style={styles.groupName}>{item.name}</ThemedText>
            <ThemedText style={styles.groupDate}>
              {item.parent_id ? 'Subgrupo' : 'Grupo Raiz'}
            </ThemedText>
            <ThemedText style={styles.groupDate}>
              Criado em: {new Date(item.created_at!).toLocaleDateString('pt-BR')}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.groupActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil" size={16} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
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
        <ThemedText style={styles.headerTitle}>Grupos</ThemedText>
        <View style={styles.headerActions}>
          
          {/* Botões de expandir/colapsar (apenas em modo hierarquia) */}
          {showHierarchy && (
            <>
              <TouchableOpacity 
                onPress={expandAllGroups}
                style={styles.testButton}
              >
                <Ionicons name="chevron-down-outline" size={20} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={collapseAllGroups}
                style={styles.testButton}
              >
                <Ionicons name="chevron-up-outline" size={20} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            onPress={() => setShowHierarchy(!showHierarchy)}
            style={styles.testButton}
          >
            <Ionicons 
              name={showHierarchy ? "list" : "git-network"} 
              size={20} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons 
              name={showForm ? "close" : "add"} 
              size={24} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Formulário */}
      {showForm && (
        <ThemedView style={[styles.formContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <ThemedText style={styles.formTitle}>
            {editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nome do Grupo</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: isDark ? '#444' : '#ddd',
                }
              ]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ex: Roupas Masculinas, Camisas, etc..."
              placeholderTextColor={isDark ? '#999' : '#666'}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Grupo Pai</ThemedText>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                  borderColor: isDark ? '#444' : '#ddd',
                  justifyContent: 'center',
                }
              ]}
              onPress={() => setShowParentPicker(true)}
            >
              <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>
                {getParentName(formData.parent_id)}
              </Text>
            </TouchableOpacity>
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
                {loading ? 'Salvando...' : editingGroup ? 'Atualizar' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      {/* Lista de Grupos */}
      {showHierarchy ? (
        <FlatList
          data={groups.flatMap(group => renderHierarchyItem(group))}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => item}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Nenhum grupo cadastrado</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Toque no botão + para adicionar seu primeiro grupo
              </ThemedText>
            </ThemedView>
          }
        />
      ) : (
        <FlatList
          data={flatGroups}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={renderFlatItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>Nenhum grupo cadastrado</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Toque no botão + para adicionar seu primeiro grupo
              </ThemedText>
            </ThemedView>
          }
        />
      )}

      {/* Modal para seleção de grupo pai */}
      <Modal
        visible={showParentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowParentPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
            <ThemedText style={styles.modalTitle}>Selecionar Grupo Pai</ThemedText>
            
            <TouchableOpacity
              style={styles.parentOption}
              onPress={() => {
                setFormData({ ...formData, parent_id: null });
                setShowParentPicker(false);
              }}
            >
              <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>
                Grupo Raiz (sem pai)
              </Text>
            </TouchableOpacity>

            {groups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.parentOption}
                onPress={() => {
                  setFormData({ ...formData, parent_id: group.id || null });
                  setShowParentPicker(false);
                }}
              >
                <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowParentPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
    backgroundColor: '#4ECDC4',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  groupCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expandButton: {
    padding: 4,
    marginRight: 8,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subgroupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  groupDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  childrenCount: {
    fontSize: 12,
    opacity: 0.8,
    fontStyle: 'italic',
    color: '#4ECDC4',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#96CEB4',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    minWidth: 300,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  parentOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
});