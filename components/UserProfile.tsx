import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function UserProfile() {
  const { user, signOut, loading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
console.log(user)
  const handleSignOut = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Erro', 'Erro ao fazer logout');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Usuário não encontrado</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.profileContainer}>
        <View style={[
          styles.avatar,
          { backgroundColor: isDark ? '#333' : '#f0f0f0' }
        ]}>
          <Ionicons 
            name="person" 
            size={40} 
            color={isDark ? '#fff' : '#666'} 
          />
        </View>
        
        <ThemedText style={styles.title}>Perfil do Usuário</ThemedText>
        
        <View style={styles.infoContainer}>
          <ThemedText style={styles.label}>Email:</ThemedText>
          <ThemedText style={styles.value}>{user.email}</ThemedText>
        </View>

        {user.user_metadata?.name && (
          <View style={styles.infoContainer}>
            <ThemedText style={styles.label}>Nome:</ThemedText>
            <ThemedText style={styles.value}>{user.user_metadata.name}</ThemedText>
          </View>
        )}

        <View style={styles.infoContainer}>
          <ThemedText style={styles.label}>Criado em:</ThemedText>
          <ThemedText style={styles.value}>
            {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.signOutButton,
          loading && styles.signOutButtonDisabled
        ]}
        onPress={handleSignOut}
        disabled={loading}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.signOutButtonText}>
          {loading ? 'Saindo...' : 'Sair da conta'}
        </Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
