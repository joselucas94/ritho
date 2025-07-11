import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { deliveryService, type DeliveryWithDetails } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
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

export default function EntregasScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const [deliveries, setDeliveries] = useState<DeliveryWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithDetails | null>(null);
    const [quantidade, setQuantidade] = useState('');

    const isDark = colorScheme === 'dark';

    const themeStyles = {
        container: {
            backgroundColor: isDark ? '#000' : '#fff',
        },
        text: {
            color: isDark ? '#fff' : '#000',
        },
        card: {
            backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            borderColor: isDark ? '#333' : '#ddd',
        },
        modal: {
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
        },
        input: {
            backgroundColor: isDark ? '#333' : '#fff',
            color: isDark ? '#fff' : '#000',
            borderColor: isDark ? '#555' : '#ddd',
        },
    };

    useEffect(() => {
        if (!user) {
            router.replace('/login');
            return;
        }
        loadDeliveries();
    }, [user]);

    const loadDeliveries = async () => {
        try {
            setLoading(true);
            const data = await deliveryService.getDeliveries();
            setDeliveries(data || []);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao carregar entregas');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDeliveries();
        setRefreshing(false);
    };

    const handleEditDelivery = async () => {
        if (!selectedDelivery || !quantidade || parseInt(quantidade) <= 0) {
            Alert.alert('Erro', 'Informe uma quantidade válida');
            return;
        }

        try {
            await deliveryService.updateDelivery(selectedDelivery.id!, {
                qtd: parseInt(quantidade)
            });
            
            Alert.alert('Sucesso', 'Entrega atualizada com sucesso!');
            setEditModalVisible(false);
            setSelectedDelivery(null);
            setQuantidade('');
            await loadDeliveries();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao atualizar entrega');
        }
    };

    const handleDeleteDelivery = (delivery: DeliveryWithDetails) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta entrega? Isso irá restaurar a quantidade no pedido.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deliveryService.deleteDelivery(delivery.id!);
                            Alert.alert('Sucesso', 'Entrega excluída com sucesso!');
                            await loadDeliveries();
                        } catch (error: any) {
                            Alert.alert('Erro', error.message || 'Erro ao excluir entrega');
                        }
                    },
                },
            ]
        );
    };

    const openEditModal = (delivery: DeliveryWithDetails) => {
        setSelectedDelivery(delivery);
        setQuantidade(delivery.qtd.toString());
        setEditModalVisible(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDeliveryInfo = (delivery: DeliveryWithDetails) => {
        if (!delivery.detalhe_pedido) {
            return {
                loja: 'Loja não informada',
                fornecedor: 'Fornecedor não informado',
                tipo: 'Tipo não informado',
                cor: 'Cor não informada',
            };
        }

        const detalhe = delivery.detalhe_pedido;
        return {
            loja: detalhe.pedido?.store?.nome || 'Loja não informada',
            fornecedor: detalhe.pedido?.fornecedor_data?.nome || 'Fornecedor não informado',
            tipo: detalhe.tipo_roupa?.nome || 'Tipo não informado',
            cor: detalhe.cor || 'Cor não informada',
        };
    };

    const renderDeliveryItem = ({ item }: { item: DeliveryWithDetails }) => {
        const info = getDeliveryInfo(item);
        
        return (
            <View style={[styles.card, themeStyles.card]}>
                <View style={styles.cardHeader}>
                    <ThemedText style={styles.cardTitle}>
                        Entrega #{item.id}
                    </ThemedText>
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => openEditModal(item)}
                        >
                            <Ionicons name="pencil" size={20} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteDelivery(item)}
                        >
                            <Ionicons name="trash" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <ThemedText style={styles.cardText}>
                        <ThemedText style={styles.cardLabel}>Quantidade:</ThemedText> {item.qtd}
                    </ThemedText>
                    <ThemedText style={styles.cardText}>
                        <ThemedText style={styles.cardLabel}>Loja:</ThemedText> {info.loja}
                    </ThemedText>
                    <ThemedText style={styles.cardText}>
                        <ThemedText style={styles.cardLabel}>Fornecedor:</ThemedText> {info.fornecedor}
                    </ThemedText>
                    <ThemedText style={styles.cardText}>
                        <ThemedText style={styles.cardLabel}>Produto:</ThemedText> {info.tipo} ({info.cor})
                    </ThemedText>
                    <ThemedText style={styles.cardDate}>
                        {formatDate(item.created_at!)}
                    </ThemedText>
                </View>
            </View>
        );
    };

    if (!user) {
        return (
            <ThemedView style={[styles.container, themeStyles.container]}>
                <ThemedText>Carregando...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.container, themeStyles.container]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Entregas</ThemedText>
                <View style={styles.headerPlaceholder} />
            </View>

            <FlatList
                data={deliveries}
                renderItem={renderDeliveryItem}
                keyExtractor={(item) => item.id!.toString()}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={64} color="#999" />
                        <ThemedText style={styles.emptyText}>
                            Nenhuma entrega encontrada
                        </ThemedText>
                        <ThemedText style={styles.emptySubtext}>
                            As entregas aparecerão aqui após serem registradas nos pedidos
                        </ThemedText>
                    </View>
                }
            />

            {/* Modal de Edição de Entrega */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, themeStyles.modal]}>
                        <ScrollView>
                            <View style={styles.modalHeader}>
                                <ThemedText style={styles.modalTitle}>Editar Entrega</ThemedText>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditModalVisible(false);
                                        setSelectedDelivery(null);
                                        setQuantidade('');
                                    }}
                                >
                                    <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
                                </TouchableOpacity>
                            </View>

                            {selectedDelivery && (
                                <>
                                    <View style={styles.formGroup}>
                                        <ThemedText style={styles.label}>Produto</ThemedText>
                                        <ThemedText style={styles.readOnlyText}>
                                            {getDeliveryInfo(selectedDelivery).tipo} ({getDeliveryInfo(selectedDelivery).cor})
                                        </ThemedText>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <ThemedText style={styles.label}>Loja / Fornecedor</ThemedText>
                                        <ThemedText style={styles.readOnlyText}>
                                            {getDeliveryInfo(selectedDelivery).loja} - {getDeliveryInfo(selectedDelivery).fornecedor}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <ThemedText style={styles.label}>Quantidade *</ThemedText>
                                        <TextInput
                                            style={[styles.input, themeStyles.input]}
                                            value={quantidade}
                                            onChangeText={setQuantidade}
                                            placeholder="Digite a quantidade"
                                            placeholderTextColor={isDark ? '#999' : '#666'}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </>
                            )}

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        setEditModalVisible(false);
                                        setSelectedDelivery(null);
                                        setQuantidade('');
                                    }}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.saveButton}
                                    onPress={handleEditDelivery}
                                >
                                    <Text style={styles.saveButtonText}>Atualizar</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ThemedView>
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerPlaceholder: {
        width: 40,
    },
    listContainer: {
        padding: 16,
    },
    card: {
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    cardContent: {
        gap: 4,
    },
    cardText: {
        fontSize: 14,
        opacity: 0.8,
    },
    cardLabel: {
        fontWeight: '600',
        opacity: 1,
    },
    cardDate: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        opacity: 0.6,
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        opacity: 0.4,
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 12,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    readOnlyText: {
        fontSize: 16,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        opacity: 0.7,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
});
