import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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

interface TipoRoupa {
  id: number;
  nome: string;
  created_at: string;
  updated_at: string;
}

export default function TiposRoupasScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [tiposRoupas, setTiposRoupas] = useState<TipoRoupa[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
  });
  const [editingTipoRoupa, setEditingTipoRoupa] = useState<TipoRoupa | null>(null);

  useEffect(() => {
    loadTiposRoupas();
  }, []);

  const loadTiposRoupas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipo_roupa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTiposRoupas(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de roupas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os tipos de roupas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTiposRoupas();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do tipo de roupa');
      return;
    }

    try {
      setLoading(true);

      if (editingTipoRoupa) {
        // Atualizar tipo de roupa existente
        const { error } = await supabase
          .from('tipo_roupa')
          .update({
            nome: formData.nome.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTipoRoupa.id);

        if (error) throw error;
        Alert.alert('Sucesso', 'Tipo de roupa atualizado com sucesso!');
      } else {
        // Verificar se o nome já existe
        const { data: existingTipo } = await supabase
          .from('tipo_roupa')
          .select('id')
          .ilike('nome', formData.nome.trim())
          .single();

        if (existingTipo) {
          Alert.alert('Erro', 'Já existe um tipo de roupa com este nome');
          return;
        }

        // Criar novo tipo de roupa
        const { error } = await supabase
          .from('tipo_roupa')
          .insert([
            {
              nome: formData.nome.trim(),
            },
          ]);

        if (error) throw error;
        Alert.alert('Sucesso', 'Tipo de roupa cadastrado com sucesso!');
      }

      // Resetar formulário
      setFormData({ nome: '' });
      setEditingTipoRoupa(null);
      setShowForm(false);
      
      // Recarregar lista
      await loadTiposRoupas();
    } catch (error) {
      console.error('Erro ao salvar tipo de roupa:', error);
      Alert.alert('Erro', 'Não foi possível salvar o tipo de roupa');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tipoRoupa: TipoRoupa) => {
    setEditingTipoRoupa(tipoRoupa);
    setFormData({ nome: tipoRoupa.nome });
    setShowForm(true);
  };

  const handleDelete = (tipoRoupa: TipoRoupa) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o tipo de roupa "${tipoRoupa.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteTipoRoupa(tipoRoupa.id),
        },
      ]
    );
  };

  const deleteTipoRoupa = async (tipoRoupaId: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('tipo_roupa')
        .delete()
        .eq('id', tipoRoupaId);

      if (error) throw error;

      Alert.alert('Sucesso', 'Tipo de roupa excluído com sucesso!');
      await loadTiposRoupas();
    } catch (error) {
      console.error('Erro ao excluir tipo de roupa:', error);
      Alert.alert('Erro', 'Não foi possível excluir o tipo de roupa');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ nome: '' });
    setEditingTipoRoupa(null);
    setShowForm(false);
  };

  const renderTipoRoupaItem = ({ item }: { item: TipoRoupa }) => (
    <ThemedView style={[styles.tipoRoupaCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.tipoRoupaHeader}>
        <View style={styles.tipoRoupaIcon}>
          <Ionicons name="shirt" size={24} color="#96CEB4" />
        </View>
        <View style={styles.tipoRoupaInfo}>
          <ThemedText style={styles.tipoRoupaName}>{item.nome}</ThemedText>
          <ThemedText style={styles.tipoRoupaDate}>
            Criado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </ThemedText>
          {item.updated_at !== item.created_at && (
            <ThemedText style={styles.tipoRoupaUpdated}>
              Atualizado em: {new Date(item.updated_at).toLocaleDateString('pt-BR')}
            </ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.tipoRoupaActions}>
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
        <ThemedText style={styles.headerTitle}>Tipos de Roupas</ThemedText>
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
            {editingTipoRoupa ? 'Editar Tipo de Roupa' : 'Novo Tipo de Roupa'}
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nome do Tipo de Roupa</ThemedText>
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
              placeholder="Ex: Camiseta, Calça, Vestido..."
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
                {loading ? 'Salvando...' : editingTipoRoupa ? 'Atualizar' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      {/* Lista de Tipos de Roupas */}
      <FlatList
        data={tiposRoupas}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTipoRoupaItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Nenhum tipo de roupa cadastrado</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Toque no botão + para adicionar seu primeiro tipo de roupa
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
    backgroundColor: '#96CEB4',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  tipoRoupaCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipoRoupaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipoRoupaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(150, 206, 180, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipoRoupaInfo: {
    flex: 1,
  },
  tipoRoupaName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipoRoupaDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  tipoRoupaUpdated: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  tipoRoupaActions: {
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
