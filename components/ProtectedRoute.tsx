import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Aguarda o carregamento

    const inAuthRoute = segments[0] === 'login' || segments[0] === 'register';
    const inProtectedRoute = segments[0] === '(tabs)' || 
                           segments[0] === 'lojas' || 
                           segments[0] === 'fornecedores' || 
                           segments[0] === 'tipos-roupas' || 
                           segments[0] === 'pedidos';

    if (!user && inProtectedRoute) {
      // Usuário não autenticado tentando acessar rota protegida
      router.replace('/login');
    } else if (user && inAuthRoute) {
      // Usuário autenticado tentando acessar página de login/registro
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return <>{children}</>;
}
