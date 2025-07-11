import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { materiaisService, type Material } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


export default function MateriaisScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  useEffect(() => {
    loadMateriais();
  }, []);

  const loadMateriais = async () => {
    console.log('loadMateriais chamado');
    try {
      setLoading(true);
      console.log('Chamando materiaisService.getAll()...');
      const data = await materiaisService.getAll();
      console.log('Dados recebidos:', data);
      setMateriais(data || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      Alert.alert('Erro', 'Não foi possível carregar os materiais');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMateriais();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    console.log('handleSubmit chamado com formData:', formData);
    
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do material');
      return;
    }

    try {
      setLoading(true);
      console.log('Iniciando processo de salvamento...');

      if (editingMaterial) {
        console.log('Editando material existente:', editingMaterial);
        // Verificar se o nome já existe (excluindo o material atual)
        const nameExists = await materiaisService.checkNameExists(formData.name.trim(), editingMaterial.id);
        if (nameExists) {
          Alert.alert('Erro', 'Já existe um material com este nome');
          return;
        }

        // Atualizar material existente
        await materiaisService.update(editingMaterial.id!, {
          name: formData.name.trim(),
        });

        Alert.alert('Sucesso', 'Material atualizado com sucesso!');
      } else {
        console.log('Criando novo material...');
        // Verificar se o nome já existe
        const nameExists = await materiaisService.checkNameExists(formData.name.trim());
        console.log('Nome já existe?', nameExists);
        
        if (nameExists) {
          Alert.alert('Erro', 'Já existe um material com este nome');
          return;
        }

        // Criar novo material
        console.log('Chamando materiaisService.create...');
        const result = await materiaisService.create({
          name: formData.name.trim(),
        });
        console.log('Resultado da criação:', result);

        Alert.alert('Sucesso', 'Material cadastrado com sucesso!');
      }

      // Resetar formulário
      setFormData({ name: '' });
      setEditingMaterial(null);
      setShowForm(false);
      
      // Recarregar lista
      console.log('Recarregando lista de materiais...');
      await loadMateriais();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      Alert.alert('Erro', 'Não foi possível salvar o material');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({ name: material.name });
    setShowForm(true);
  };

  const handleDelete = (material: Material) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o material "${material.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteMaterial(material.id!),
        },
      ]
    );
  };

  const deleteMaterial = async (materialId: number) => {
    try {
      setLoading(true);
      await materiaisService.delete(materialId);
      Alert.alert('Sucesso', 'Material excluído com sucesso!');
      await loadMateriais();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
      Alert.alert('Erro', 'Não foi possível excluir o material');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ name: '' });
    setEditingMaterial(null);
    setShowForm(false);
  };

  const renderMaterialItem = ({ item }: { item: Material }) => (
    <ThemedView style={[styles.materialCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.materialHeader}>
        <View style={styles.materialIcon}>
          <Ionicons name="hammer" size={24} color="#FF6B6B" />
        </View>
        <View style={styles.materialInfo}>
          <ThemedText style={styles.materialName}>{item.name}</ThemedText>
          <ThemedText style={styles.materialDate}>
            Criado em: {new Date(item.created_at!).toLocaleDateString('pt-BR')}
          </ThemedText>
          {item.updated_at !== item.created_at && (
            <ThemedText style={styles.materialUpdated}>
              Atualizado em: {new Date(item.updated_at!).toLocaleDateString('pt-BR')}
            </ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.materialActions}>
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
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Materiais</ThemedText>
        <View style={styles.headerActions}>
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
            {editingMaterial ? 'Editar Material' : 'Novo Material'}
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nome do Material</ThemedText>
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
              placeholder="Ex: Algodão, Poliéster, Lã, Seda..."
              placeholderTextColor={isDark ? '#999' : '#666'}
              autoCapitalize="words"
            />
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
                {loading ? 'Salvando...' : editingMaterial ? 'Atualizar' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      {/* Lista de Materiais */}
      <FlatList
        data={materiais}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderMaterialItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="hammer-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Nenhum material cadastrado</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Toque no botão + para adicionar seu primeiro material
            </ThemedText>
          </ThemedView>
        }
      />
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
    gap: 12,
  },
  testButton: {
    padding: 4,
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
    backgroundColor: '#FF6B6B',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  materialCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  materialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  materialDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  materialUpdated: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  materialActions: {
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
});
