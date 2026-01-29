// ==========================================
// CERCA - App Principal
// La movilidad, la ayuda y la comunidad, siempre cerca.
// ==========================================

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { LoadingScreen } from './src/components/common/Loading';
import { config, logConfig, validateConfig } from './src/config/environment';
import { useNetwork } from './src/hooks/useNetwork';
import { COLORS, SPACING, FONT_SIZES } from './src/constants/theme';

// ==========================================
// Offline Banner Component
// ==========================================

const OfflineBanner: React.FC<{ onRetry: () => void; onDismiss: () => void }> = ({
  onRetry,
  onDismiss,
}) => (
  <View style={styles.offlineBanner}>
    <Text style={styles.offlineText}>📶 Sin conexión a internet</Text>
    <View style={styles.offlineActions}>
      <TouchableOpacity onPress={onRetry} style={styles.offlineButton}>
        <Text style={styles.offlineButtonText}>Reintentar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} style={styles.offlineButtonSecondary}>
        <Text style={styles.offlineButtonTextSecondary}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ==========================================
// Development Mode Banner
// ==========================================

const DevModeBanner: React.FC = () => {
  if (!config.isDevelopment || !config.features.enableMockData) return null;

  return (
    <View style={styles.devBanner}>
      <Text style={styles.devBannerText}>
        🔧 Modo Desarrollo - Datos Simulados
      </Text>
    </View>
  );
};

// ==========================================
// Main App Component
// ==========================================

const AppContent: React.FC = () => {
  const { setLoading, isLoading } = useAuthStore();
  const { showOfflineBanner, dismissOfflineBanner, retryConnection } = useNetwork();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Log configuration in development
    logConfig();

    // Validate configuration
    const validation = validateConfig();
    if (!validation.isValid) {
      console.error('Configuration errors:', validation.errors);
    }

    // Initialize app
    const initializeApp = async () => {
      try {
        // Simulate checking for existing session
        // In production, this would check Supabase auth
        await new Promise(resolve => setTimeout(resolve, 1000));

        setLoading(false);
        setAppReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoading(false);
        setAppReady(true);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (!appReady || isLoading) {
    return <LoadingScreen message="Iniciando CERCA..." />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <DevModeBanner />
      <AppNavigator />
      {showOfflineBanner && (
        <OfflineBanner
          onRetry={retryConnection}
          onDismiss={dismissOfflineBanner}
        />
      )}
    </>
  );
};

// ==========================================
// App Entry Point with Error Boundary
// ==========================================

export default function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to console in development
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);

    // TODO: In production, send to error reporting service (Sentry, etc.)
  };

  return (
    <ErrorBoundary onError={handleError}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.warning,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  offlineActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  offlineButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
  offlineButtonText: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  offlineButtonSecondary: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  offlineButtonTextSecondary: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
  },
  devBanner: {
    backgroundColor: COLORS.info,
    padding: SPACING.xs,
    alignItems: 'center',
  },
  devBannerText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
});
