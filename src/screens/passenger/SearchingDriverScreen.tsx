// ==========================================
// CERCA - Pantalla de Búsqueda de Conductor
// ==========================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useTripStore } from '../../store/tripStore';
import { Driver } from '../../types';

const { width } = Dimensions.get('window');

type SearchingDriverScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const SearchingDriverScreen: React.FC<SearchingDriverScreenProps> = ({
  navigation,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [searchRadius, setSearchRadius] = useState(500);
  const [driversNearby, setDriversNearby] = useState(0);

  const { origin, destination, currentTrip, updateTripStatus, setCurrentTrip } = useTripStore();

  useEffect(() => {
    // Animación de pulso
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Simular búsqueda de conductores
    const searchInterval = setInterval(() => {
      setDriversNearby((prev) => Math.min(prev + Math.floor(Math.random() * 3), 8));
      setSearchRadius((prev) => Math.min(prev + 200, 2000));
    }, 2000);

    // Simular conductor encontrado después de 5-8 segundos
    const foundTimeout = setTimeout(() => {
      const mockDriver: Partial<Driver> = {
        id: 'driver_123',
        firstName: 'Carlos',
        lastName: 'Gómez',
        rating: 4.8,
        totalTrips: 234,
        vehicle: {
          id: 'vehicle_123',
          plate: 'ABC 123',
          brand: 'Chevrolet',
          model: 'Spark',
          year: 2020,
          color: 'Blanco',
          type: 'sedan',
          photos: [],
          accessibility: [],
          capacity: 4,
        },
      };

      // Actualizar viaje con conductor asignado
      if (currentTrip) {
        setCurrentTrip({
          ...currentTrip,
          driverId: mockDriver.id,
          status: 'accepted',
          acceptedAt: new Date(),
        });
      }

      pulse.stop();
      clearInterval(searchInterval);
      navigation.replace('TripInProgress');
    }, 5000 + Math.random() * 3000);

    return () => {
      pulse.stop();
      clearInterval(searchInterval);
      clearTimeout(foundTimeout);
    };
  }, []);

  const handleCancelSearch = () => {
    Alert.alert(
      'Cancelar búsqueda',
      '¿Estás seguro de que quieres cancelar?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            updateTripStatus('cancelled');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  if (!origin) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...origin.coordinates,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Circle
          center={origin.coordinates}
          radius={searchRadius}
          fillColor={COLORS.primary + '20'}
          strokeColor={COLORS.primary}
          strokeWidth={2}
        />
        <Marker
          coordinate={origin.coordinates}
          title="Tu ubicación"
        />
      </MapView>

      {/* Panel de búsqueda */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.searchPanel}>
          {/* Animación de búsqueda */}
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing2,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <View style={styles.searchIcon}>
              <Text style={styles.searchIconText}>🔍</Text>
            </View>
          </View>

          <Text style={styles.searchTitle}>Buscando conductor CERCA</Text>
          <Text style={styles.searchSubtitle}>
            {driversNearby} conductores en tu zona
          </Text>

          {/* Info del viaje */}
          <View style={styles.tripInfo}>
            <View style={styles.tripInfoRow}>
              <View style={styles.tripLocation}>
                <View style={[styles.dot, styles.originDot]} />
                <Text style={styles.tripLocationText} numberOfLines={1}>
                  {origin.address}
                </Text>
              </View>
              <View style={styles.tripLocation}>
                <View style={[styles.dot, styles.destinationDot]} />
                <Text style={styles.tripLocationText} numberOfLines={1}>
                  {destination?.address || 'Destino'}
                </Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Precio estimado</Text>
              <Text style={styles.priceValue}>
                ${currentTrip?.price.total.toLocaleString() || 0} COP
              </Text>
            </View>
          </View>

          {/* Cancelar */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSearch}
          >
            <Text style={styles.cancelButtonText}>Cancelar búsqueda</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  searchPanel: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  pulseContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
  },
  pulseRing2: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  searchIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  searchIconText: {
    fontSize: 28,
  },
  searchTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  searchSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  tripInfo: {
    width: '100%',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  tripInfoRow: {
    marginBottom: SPACING.md,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  originDot: {
    backgroundColor: COLORS.primary,
  },
  destinationDot: {
    backgroundColor: COLORS.emergency,
  },
  tripLocationText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  priceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '500',
  },
});
