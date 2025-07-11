import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isDark = colorScheme === 'dark';

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ThemedView style={styles.content}>
        {/* Header com animação */}
        <View style={styles.headerContainer}>
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
        </View>

        {/* Cards de funcionalidades */}
        <View style={styles.featuresContainer}>
          <View style={[
            styles.featureCard,
            { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }
          ]}>
            <Ionicons 
              name="shield-checkmark-outline" 
              size={40} 
              color="#007AFF" 
            />
            <ThemedText style={styles.featureTitle}>Seguro</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Sua conta está protegida com autenticação segura
            </ThemedText>
          </View>

          <View style={[
            styles.featureCard,
            { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }
          ]}>
            <Ionicons 
              name="sync-outline" 
              size={40} 
              color="#34C759" 
            />
            <ThemedText style={styles.featureTitle}>Sincronizado</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Seus dados estão sincronizados na nuvem
            </ThemedText>
          </View>

          <View style={[
            styles.featureCard,
            { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }
          ]}>
            <Ionicons 
              name="rocket-outline" 
              size={40} 
              color="#FF9500" 
            />
            <ThemedText style={styles.featureTitle}>Pronto</ThemedText>
            <ThemedText style={styles.featureDescription}>
              Tudo configurado e pronto para usar
            </ThemedText>
          </View>
        </View>

        {/* Informações do usuário */}
        <View style={[
          styles.userInfoContainer,
          { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }
        ]}>
          <ThemedText style={styles.userInfoTitle}>Suas informações:</ThemedText>
          <View style={styles.userInfoRow}>
            <Ionicons 
              name="mail-outline" 
              size={16} 
              color={isDark ? '#888' : '#666'} 
            />
            <ThemedText style={styles.userInfoText}>
              {user?.email}
            </ThemedText>
          </View>
          <View style={styles.userInfoRow}>
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={isDark ? '#888' : '#666'} 
            />
            <ThemedText style={styles.userInfoText}>
              Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-BR')}
            </ThemedText>
          </View>
        </View>

        {/* Botão continuar */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            Continuar para o App
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Texto adicional */}
        <ThemedText style={styles.footerText}>
          Você pode acessar seu perfil e configurações nas abas do aplicativo
        </ThemedText>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    opacity: 0.7,
    flex: 2,
    marginLeft: 8,
  },
  userInfoContainer: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoText: {
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 20,
  },
});
