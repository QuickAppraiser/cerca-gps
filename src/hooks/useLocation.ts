// ==========================================
// CERCA - Location Hook
// Handles location permissions and tracking
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Coordinates } from '../types';
import { ARMENIA_CONFIG } from '../constants/theme';

export interface LocationState {
  location: Coordinates | null;
  address: string | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

export const useLocation = (watchPosition: boolean = false) => {
  const [state, setState] = useState<LocationState>({
    location: null,
    address: null,
    isLoading: true,
    error: null,
    permissionStatus: 'undetermined',
  });

  const requestPermission = useCallback(async () => {
    try {
      // On web, we use the browser's geolocation API
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'La geolocalización no está disponible en este navegador',
            permissionStatus: 'denied',
          }));
          return false;
        }

        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setState(prev => ({ ...prev, permissionStatus: 'granted' }));
              resolve(true);
            },
            () => {
              setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Permiso de ubicación denegado',
                permissionStatus: 'denied',
              }));
              resolve(false);
            }
          );
        });
      }

      // Native platforms
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Permiso de ubicación denegado',
          permissionStatus: 'denied',
        }));
        return false;
      }

      setState(prev => ({ ...prev, permissionStatus: 'granted' }));
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al solicitar permiso de ubicación',
      }));
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Web platform
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          // Return Armenia default location for web testing
          const defaultLocation = {
            latitude: ARMENIA_CONFIG.center.latitude,
            longitude: ARMENIA_CONFIG.center.longitude,
          };
          setState(prev => ({
            ...prev,
            location: defaultLocation,
            address: 'Armenia, Quindío (ubicación simulada)',
            isLoading: false,
          }));
          return defaultLocation;
        }

        return new Promise<Coordinates | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setState(prev => ({
                ...prev,
                location: coords,
                isLoading: false,
              }));
              resolve(coords);
            },
            () => {
              // Return default location on error
              const defaultLocation = {
                latitude: ARMENIA_CONFIG.center.latitude,
                longitude: ARMENIA_CONFIG.center.longitude,
              };
              setState(prev => ({
                ...prev,
                location: defaultLocation,
                address: 'Armenia, Quindío (ubicación simulada)',
                isLoading: false,
              }));
              resolve(defaultLocation);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }

      // Native platforms
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        // Return Armenia default location
        const defaultLocation = {
          latitude: ARMENIA_CONFIG.center.latitude,
          longitude: ARMENIA_CONFIG.center.longitude,
        };
        setState(prev => ({
          ...prev,
          location: defaultLocation,
          address: 'Armenia, Quindío (ubicación por defecto)',
          isLoading: false,
        }));
        return defaultLocation;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setState(prev => ({
        ...prev,
        location: coords,
        isLoading: false,
      }));

      return coords;
    } catch (error) {
      console.error('Error getting location:', error);

      // Return Armenia default location on error
      const defaultLocation = {
        latitude: ARMENIA_CONFIG.center.latitude,
        longitude: ARMENIA_CONFIG.center.longitude,
      };

      setState(prev => ({
        ...prev,
        location: defaultLocation,
        address: 'Armenia, Quindío (ubicación por defecto)',
        isLoading: false,
        error: 'Error al obtener ubicación, usando ubicación por defecto',
      }));

      return defaultLocation;
    }
  }, [requestPermission]);

  const reverseGeocode = useCallback(async (coords: Coordinates) => {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll use a simple approximation or skip
        setState(prev => ({
          ...prev,
          address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        }));
        return;
      }

      const addresses = await Location.reverseGeocodeAsync(coords);
      if (addresses.length > 0) {
        const addr = addresses[0];
        const addressString = [
          addr.street,
          addr.city,
          addr.region,
        ].filter(Boolean).join(', ');

        setState(prev => ({
          ...prev,
          address: addressString || 'Dirección no disponible',
        }));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  }, []);

  // Initial location fetch
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Watch position if enabled (for driver mode)
  useEffect(() => {
    if (!watchPosition || Platform.OS === 'web') return;

    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setState(prev => ({
            ...prev,
            location: coords,
          }));
        }
      );
    };

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, [watchPosition, requestPermission]);

  return {
    ...state,
    requestPermission,
    getCurrentLocation,
    reverseGeocode,
  };
};
