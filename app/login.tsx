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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthError } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { signIn, loading, resetPassword } = useAuth();

  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      const result = await signIn(email, password);
      if (result.success) {
        // Navegar para as tabs onde a tela de boas-vindas será mostrada
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const authError = error as AuthError;
      Alert.alert('Erro', authError.message || 'Erro ao fazer login');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email necessário', 'Por favor, digite seu email para recuperar a senha');
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert('Sucesso', 'Email de recuperação enviado com sucesso!');
    } catch (error: any) {
      const authError = error as AuthError;
      Alert.alert('Erro', authError.message || 'Erro ao enviar email de recuperação');
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ThemedView style={styles.content}>
          {/* Logo/Título */}
          <View style={styles.headerContainer}>
            <ThemedText style={styles.title}>Ritho</ThemedText>
            <ThemedText style={styles.subtitle}>Bem-vindo de volta!</ThemedText>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
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
                placeholder="Senha"
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

            {/* Esqueci a senha */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                Esqueci minha senha
              </ThemedText>
            </TouchableOpacity>

            {/* Botão de Login */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
              <ThemedText style={styles.dividerText}>ou</ThemedText>
              <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#ddd' }]} />
            </View>

            {/* Botões de redes sociais */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={[styles.socialButton, { borderColor: isDark ? '#333' : '#ddd' }]}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { borderColor: isDark ? '#333' : '#ddd' }]}>
                <Ionicons name="logo-apple" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, { borderColor: isDark ? '#333' : '#ddd' }]}>
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
            </View>

            {/* Cadastro */}
            <View style={styles.registerContainer}>
              <ThemedText style={styles.registerText}>
                Não tem uma conta?{' '}
              </ThemedText>
              <TouchableOpacity onPress={handleRegister}>
                <ThemedText style={styles.registerLink}>
                  Cadastre-se
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    opacity: 0.7,
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
