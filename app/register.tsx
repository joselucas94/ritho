import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthError } from '@/lib/supabase';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { signUp, loading } = useAuth();

  const isDark = colorScheme === 'dark';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Erro', 'Você precisa aceitar os termos de uso');
      return;
    }

    try {
      await signUp(email, password, name);
      Alert.alert(
        'Sucesso!', 
        'Conta criada com sucesso! Verifique seu email para confirmar a conta.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      const authError = error as AuthError;
      Alert.alert('Erro', authError.message || 'Erro ao criar conta');
    }
  };

  const handleLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.content}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={isDark ? '#fff' : '#000'} 
                />
              </TouchableOpacity>
              <ThemedText style={styles.title}>Criar Conta</ThemedText>
              <ThemedText style={styles.subtitle}>
                Preencha seus dados para começar
              </ThemedText>
            </View>

            {/* Formulário */}
            <View style={styles.formContainer}>
              {/* Campo Nome */}
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={isDark ? '#888' : '#666'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#333' : '#ddd',
                    }
                  ]}
                  placeholder="Nome completo"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Campo Email */}
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={isDark ? '#888' : '#666'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#333' : '#ddd',
                    }
                  ]}
                  placeholder="Email"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Campo Senha */}
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isDark ? '#888' : '#666'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#333' : '#ddd',
                    }
                  ]}
                  placeholder="Senha (mín. 6 caracteres)"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={isDark ? '#888' : '#666'}
                  />
                </TouchableOpacity>
              </View>

              {/* Campo Confirmar Senha */}
              <View style={styles.inputContainer}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isDark ? '#888' : '#666'} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#333' : '#ddd',
                    }
                  ]}
                  placeholder="Confirmar senha"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={isDark ? '#888' : '#666'}
                  />
                </TouchableOpacity>
              </View>

              {/* Checkbox Termos */}
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[
                  styles.checkbox,
                  { borderColor: isDark ? '#333' : '#ddd' },
                  acceptTerms && styles.checkboxChecked
                ]}>
                  {acceptTerms && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <ThemedText style={styles.checkboxText}>
                  Aceito os{' '}
                  <ThemedText style={styles.linkText}>termos de uso</ThemedText>
                  {' '}e{' '}
                  <ThemedText style={styles.linkText}>política de privacidade</ThemedText>
                </ThemedText>
              </TouchableOpacity>

              {/* Botão de Cadastro */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  loading && styles.registerButtonDisabled
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Text>
              </TouchableOpacity>

              {/* Login */}
              <View style={styles.loginContainer}>
                <ThemedText style={styles.loginText}>
                  Já tem uma conta?{' '}
                </ThemedText>
                <TouchableOpacity onPress={handleLogin}>
                  <ThemedText style={styles.loginLink}>
                    Fazer login
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    opacity: 0.7,
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
