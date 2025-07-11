import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ProtectedRoute>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="lojas" options={{ title: 'Lojas' }} />
              <Stack.Screen name="fornecedores" options={{ title: 'Fornecedores' }} />
              <Stack.Screen name="tipos-roupas" options={{ title: 'Tipos de Roupas' }} />
              <Stack.Screen name="materiais" options={{ title: 'Materiais' }} />
              <Stack.Screen name="grupos" options={{ title: 'Grupos' }} />
              <Stack.Screen name="pedidos" options={{ title: 'Pedidos' }} />
              <Stack.Screen name="entregas" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ProtectedRoute>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
