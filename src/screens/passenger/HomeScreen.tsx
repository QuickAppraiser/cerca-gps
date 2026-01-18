// ==========================================
// CERCA - Pantalla Principal del Pasajero
// ==========================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { EmergencyButton } from '../../components/emergency/EmergencyButton';
import { COLORS, SPACING, FONT_SIZES, ARMENIA_CONFIG } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { Coordinates } from '../../types';

const { width, height } = Dimensions.get('window');

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const { user } = useAuthStore();
  const { setOrigin } = useTripStore();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'CERCA necesita acceso a tu ubicación para funcionar correctamente.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);
      setIsLoadingLocation(false);

      // Centrar mapa en ubicación actual
      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setIsLoadingLocation(false);
    }
  };

  const handleWhereToPress = () => {
    if (currentLocation) {
      setOrigin({
        coordinates: currentLocation,
        address: 'Mi ubicación actual',
      });
    }
    navigation.navigate('SetDestination');
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={ARMENIA_CONFIG.initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Tu ubicación"
          />
        )}
      </MapView>

      {/* Header con info del usuario */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.creditsButton}
          onPress={() => navigation.navigate('Credits')}
        >
          <Text style={styles.creditsLabel}>Créditos</Text>
          <Text style={styles.creditsAmount}>
            ${user?.credits?.toLocaleString() || 0}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Acciones rápidas */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('CommunityRoutes')}
        >
          <Text style={styles.quickActionIcon}>🚐</Text>
          <Text style={styles.quickActionText}>Rutas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('TrafficReports')}
        >
          <Text style={styles.quickActionIcon}>🚧</Text>
          <Text style={styles.quickActionText}>Reportes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Favorites')}
        >
          <Text style={styles.quickActionIcon}>⭐</Text>
          <Text style={styles.quickActionText}>Favoritos</Text>
        </TouchableOpacity>
      </View>

      {/* Card de búsqueda */}
      <View style={styles.searchContainer}>
        <Card style={styles.searchCard}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleWhereToPress}
          >
            <View style={styles.searchDot} />
            <Text style={styles.searchText}>¿A dónde vamos?</Text>
          </TouchableOpacity>

          {/* Destinos recientes */}
          <View style={styles.recentDestinations}>
            <TouchableOpacity style={styles.recentItem}>
              <Text style={styles.recentIcon}>🏠</Text>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>Casa</Text>
                <Text style={styles.recentAddress}>Agregar dirección</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.recentDivider} />

            <TouchableOpacity style={styles.recentItem}>
              <Text style={styles.recentIcon}>💼</Text>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName}>Trabajo</Text>
                <Text style={styles.recentAddress}>Agregar dirección</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Tokens del usuario */}
        <TouchableOpacity
          style={styles.tokensBar}
          onPress={() => navigation.navigate('Tokens')}
        >
          <Text style={styles.tokensIcon}>🪙</Text>
          <Text style={styles.tokensText}>
            {user?.tokens || 0} tokens CERCA
          </Text>
          <Text style={styles.tokensArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de emergencia */}
      <EmergencyButton
        currentLocation={currentLocation || undefined}
      />

      {/* Botón de centrar ubicación */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={requestLocationPermission}
      >
        <Text style={styles.locationIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width,
    height: height * 0.65,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  menuIcon: {
    fontSize: 20,
  },
  creditsButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  creditsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  creditsAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  quickActions: {
    position: 'absolute',
    top: 120,
    left: SPACING.md,
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  quickAction: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionIcon: {
    fontSize: 16,
  },
  quickActionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  searchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  searchCard: {
    padding: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  searchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  searchText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  recentDestinations: {
    padding: SPACING.md,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  recentIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  recentAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  recentDivider: {
    height: 1,
    backgroundColor: COLORS.gray[100],
    marginVertical: SPACING.xs,
    marginLeft: 48,
  },
  tokensBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 12,
  },
  tokensIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  tokensText: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  tokensArrow: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
  },
  locationButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 280,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  locationIcon: {
    fontSize: 20,
  },
});
