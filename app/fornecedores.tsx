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

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  created_at: string;
  updated_at: string;
}

export default function FornecedoresScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
  });
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);

  useEffect(() => {
    loadFornecedores();
  }, []);

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara XX.XXX.XXX/XXXX-XX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  // Função para validar CNPJ
  const validateCNPJ = (cnpj: string) => {
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (numbers.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(numbers[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(numbers[12]) !== digit1) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(numbers[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(numbers[13]) === digit2;
  };

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fornecedor')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFornecedores();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do fornecedor');
      return;
    }

    if (!formData.cnpj.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o CNPJ');
      return;
    }

    if (!validateCNPJ(formData.cnpj)) {
      Alert.alert('Erro', 'CNPJ inválido. Verifique os dados informados.');
      return;
    }

    try {
      setLoading(true);

      if (editingFornecedor) {
        // Atualizar fornecedor existente
        const { error } = await supabase
          .from('fornecedor')
          .update({
            nome: formData.nome.trim(),
            cnpj: formData.cnpj,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFornecedor.id);

        if (error) throw error;
        Alert.alert('Sucesso', 'Fornecedor atualizado com sucesso!');
      } else {
        // Verificar se CNPJ já existe
        const { data: existingFornecedor } = await supabase
          .from('fornecedor')
          .select('id')
          .eq('cnpj', formData.cnpj)
          .single();

        if (existingFornecedor) {
          Alert.alert('Erro', 'Já existe um fornecedor cadastrado com este CNPJ');
          return;
        }

        // Criar novo fornecedor
        const { error } = await supabase
          .from('fornecedor')
          .insert([
            {
              nome: formData.nome.trim(),
              cnpj: formData.cnpj,
            },
          ]);

        if (error) throw error;
        Alert.alert('Sucesso', 'Fornecedor cadastrado com sucesso!');
      }

      // Resetar formulário
      setFormData({ nome: '', cnpj: '' });
      setEditingFornecedor(null);
      setShowForm(false);

      // Recarregar lista
      await loadFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      Alert.alert('Erro', 'Não foi possível salvar o fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({ nome: fornecedor.nome, cnpj: fornecedor.cnpj });
    setShowForm(true);
  };

  const handleDelete = (fornecedor: Fornecedor) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteFornecedor(fornecedor.id),
        },
      ]
    );
  };

  const deleteFornecedor = async (fornecedorId: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fornecedor')
        .delete()
        .eq('id', fornecedorId);

      if (error) throw error;

      Alert.alert('Sucesso', 'Fornecedor excluído com sucesso!');
      await loadFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      Alert.alert('Erro', 'Não foi possível excluir o fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const cancelForm = () => {
    setFormData({ nome: '', cnpj: '' });
    setEditingFornecedor(null);
    setShowForm(false);
  };

  const handleCNPJChange = (text: string) => {
    const formatted = formatCNPJ(text);
    setFormData({ ...formData, cnpj: formatted });
  };

  const renderFornecedorItem = ({ item }: { item: Fornecedor }) => (
    <ThemedView style={[styles.fornecedorCard, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]}>
      <View style={styles.fornecedorHeader}>
        <View style={styles.fornecedorIcon}>
          <Ionicons nome="business" size={24} color="#4ECDC4" />
        </View>
        <View style={styles.fornecedorInfo}>
          <ThemedText style={styles.fornecedornome}>{item.nome}</ThemedText>
          <ThemedText style={styles.fornecedorCNPJ}>CNPJ: {item.cnpj}</ThemedText>
          <ThemedText style={styles.fornecedorDate}>
            Criado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.fornecedorActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons nome="pencil" size={16} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons nome="trash" size={16} color="#ffffff" />
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
        <ThemedText style={styles.headerTitle}>Fornecedores</ThemedText>
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
            {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nome do Fornecedor</ThemedText>
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
              placeholder="Digite o nome do fornecedor"
              placeholderTextColor={isDark ? '#999' : '#666'}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>CNPJ</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: validateCNPJ(formData.cnpj) || formData.cnpj === '' ? (isDark ? '#444' : '#ddd') : '#FF6B6B',
                }
              ]}
              value={formData.cnpj}
              onChangeText={handleCNPJChange}
              placeholder="00.000.000/0000-00"
              placeholderTextColor={isDark ? '#999' : '#666'}
              keyboardType="numeric"
              maxLength={18}
            />
            {formData.cnpj !== '' && !validateCNPJ(formData.cnpj) && (
              <ThemedText style={styles.errorText}>CNPJ inválido</ThemedText>
            )}
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
                {loading ? 'Salvando...' : editingFornecedor ? 'Atualizar' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      )}

      {/* Lista de Fornecedores */}
      <FlatList
        data={fornecedores}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFornecedorItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <Ionicons nome="business-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>Nenhum fornecedor cadastrado</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Toque no botão + para adicionar seu primeiro fornecedor
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
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
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
  fornecedorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fornecedorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fornecedorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fornecedorInfo: {
    flex: 1,
  },
  fornecedornome: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  fornecedorCNPJ: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  fornecedorDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  fornecedorActions: {
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
