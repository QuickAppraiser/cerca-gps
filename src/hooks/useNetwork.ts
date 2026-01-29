// ==========================================
// CERCA - Network Status Hook
// Detects online/offline status and handles reconnection
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export interface NetworkState {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

// For web platform, use navigator.onLine
// For native, this is a simplified version that works without extra dependencies
export const useNetwork = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    isInternetReachable: true,
    connectionType: 'unknown',
  });

  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web platform - use navigator.onLine
      const handleOnline = () => {
        setNetworkState({
          isOnline: true,
          isInternetReachable: true,
          connectionType: 'wifi',
        });
        setShowOfflineBanner(false);
      };

      const handleOffline = () => {
        setNetworkState({
          isOnline: false,
          isInternetReachable: false,
          connectionType: null,
        });
        setShowOfflineBanner(true);
      };

      // Initial state
      setNetworkState({
        isOnline: navigator.onLine,
        isInternetReachable: navigator.onLine,
        connectionType: navigator.onLine ? 'wifi' : null,
      });
      setShowOfflineBanner(!navigator.onLine);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // For native platforms, we'll do a simple fetch check
      const checkConnection = async () => {
        try {
          // Try to fetch a small resource to check connectivity
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          setNetworkState({
            isOnline: true,
            isInternetReachable: true,
            connectionType: 'wifi',
          });
          setShowOfflineBanner(false);
        } catch {
          setNetworkState({
            isOnline: false,
            isInternetReachable: false,
            connectionType: null,
          });
          setShowOfflineBanner(true);
        }
      };

      // Check immediately
      checkConnection();

      // Check periodically (every 30 seconds)
      const interval = setInterval(checkConnection, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  const dismissOfflineBanner = useCallback(() => {
    setShowOfflineBanner(false);
  }, []);

  const retryConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      setNetworkState({
        isOnline: true,
        isInternetReachable: true,
        connectionType: 'wifi',
      });
      setShowOfflineBanner(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    ...networkState,
    showOfflineBanner,
    dismissOfflineBanner,
    retryConnection,
  };
};
