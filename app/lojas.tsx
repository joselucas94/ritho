import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
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

interface Store {
  id: number;
  nome: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export default function LojasScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
  });
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store')
        .select('*')
        .eq('owner', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStores(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as lojas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome da loja');
      return;
    }

    try {
      setLoading(true);

      if (editingStore) {
        // Atualizar loja existente
        const { error } = await supabase
          .from('store')
          .update({
            nome: formData.nome.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingStore.id)
          .eq('owner', user?.id);

        if (error) throw error;
        Alert.alert('Sucesso', 'Loja atualizada com sucesso!');
      } else {
        // Criar nova loja
        const { error } = await supabase
          .from('store')
          .insert([
            {
              nome: formData.nome.trim(),
              owner: user?.id,
            },
          ]);

        if (error) throw error;
        Alert.alert('Sucesso', 'Loja cadastrada com sucesso!');
      }

      // Resetar formulário
      setFormData({ nome: '' });
      setEditingStore(null);
      setShowForm(false);
      
      // Recarregar lista
      await loadStores();
    } catch (error) {
      console.error('Erro ao salvar loja:', error);
      Alert.alert('Erro', 'Não foi possível salvar a loja');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({ nome: store.nome });
    setShowForm(true);
  };

  const handleDelete = (store: Store) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a loja "${store.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteStore(store.id),
        },
      ]
    );
  };

  const deleteStore = async (storeId: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('store')
        .delete()
        .eq('id', storeId)
        .eq('owner', user?.id);

      if (error) throw error;

      Alert.alert('Sucesso', 'Loja excluída com sucesso!');
      await loadStores();
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      Alert.alert('Erro', 'Não foi possível excluir a loja');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ nome: '' });
    setEditingStore(null);
    setShowForm(false);
  };

  const renderStoreItem = ({ item }: { item: Store }) => (
    <ThemedView style={[styles.storeCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.storeHeader}>
        <View style={styles.storeIcon}>
          <Ionicons name="storefront" size={24} color="#FF6B6B" />
        </View>
        <View style={styles.storeInfo}>
          <ThemedText style={styles.storeName}>{item.nome}</ThemedText>
          <ThemedText style={styles.storeDate}>
            Criado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.storeActions}>
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
        <ThemedText style={styles.headerTitle}>Lojas</ThemedText>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons 
            name={showForm ? "close" : "add"} 
            size={24} 
            color={isDark ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
      </View>

      {/* Formulário */}
      {showForm && (
        <ThemedView style={[styles.formContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <ThemedText style={styles.formTitle}>
            {editingStore ? 'Editar Loja' : 'Nova Loja'}
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nome da Loja</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: isDark ? '#444' : '#ddd',
                }
              ]}
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              placeholder="Digite o nome da loja"
              placeholderTextColor={isDark ? '#999' : '#666'}
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
                {loading ? 'Salvando...' : editingStore ? 'Atualizar' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      {/* Lista de Lojas */}
      <FlatList
        data={stores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStoreItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Nenhuma loja cadastrada</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Toque no botão + para adicionar sua primeira loja
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
  storeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  storeDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  storeActions: {
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
    backgroundColor: '#4ECDC4',
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
