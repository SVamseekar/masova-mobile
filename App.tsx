/**
 * MaSoVa Mobile App
 * Customer ordering application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainerRef } from '@react-navigation/native';

import { ThemeProvider, useTheme } from './src/hooks/useTheme';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { StoreProvider } from './src/contexts/StoreContext';
import { RootNavigator } from './src/navigation';
import { RootStackParamList } from './src/types';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

// Navigation ref for handling notification taps when app is not in foreground
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

/**
 * App content
 */
const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator ref={navigationRef} />
    </>
  );
};

/**
 * App with providers
 */
const AppWithProviders: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppWithProviders />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
