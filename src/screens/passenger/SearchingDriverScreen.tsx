// ==========================================
// CERCA - Pantalla de Búsqueda de Conductor
// With real trip matching integration
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useTripStore } from '../../store/tripStore';
import { tripService } from '../../services/tripService';
import { formatCurrency } from '../../utils/validation';

const { width } = Dimensions.get('window');

// Conditionally import MapView for native platforms
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available');
  }
}

type SearchingDriverScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const SearchingDriverScreen: React.FC<SearchingDriverScreenProps> = ({
  navigation,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [searchRadius, setSearchRadius] = useState(500);
  const [driversNearby, setDriversNearby] = useState(0);
  const [isSearching, setIsSearching] = useState(true);
  const [driverFound, setDriverFound] = useState<any>(null);
  const tripSubscription = useRef<any>(null);

  const {
    origin,
    destination,
    currentTrip,
    updateTripStatus,
    setCurrentTrip,
    clearTripSetup,
  } = useTripStore();

  useEffect(() => {
    // Start pulse animation
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

    // Find nearby drivers and update count
    const findDrivers = async () => {
      if (origin?.coordinates) {
        const result = await tripService.findNearbyDrivers(origin.coordinates);
        if (result.success && result.data) {
          setDriversNearby(result.data.length);
        }
      }
    };

    findDrivers();

    // Expand search radius periodically
    const radiusInterval = setInterval(() => {
      setSearchRadius((prev) => Math.min(prev + 200, 2000));
    }, 3000);

    // Subscribe to trip updates if we have a current trip
    if (currentTrip?.id) {
      tripSubscription.current = tripService.subscribeToTrip(
        currentTrip.id,
        (updatedTrip) => {
          console.log('Trip updated:', updatedTrip.status);

          if (updatedTrip.status === 'accepted' && updatedTrip.driver) {
            setIsSearching(false);
            setDriverFound(updatedTrip.driver);

            // Update store with driver info
            setCurrentTrip({
              ...currentTrip,
              driverId: updatedTrip.driver.id,
              status: 'accepted',
              acceptedAt: new Date(),
            });

            pulse.stop();
            clearInterval(radiusInterval);

            // Navigate to trip in progress after short delay
            setTimeout(() => {
              navigation.replace('TripInProgress', { trip: updatedTrip });
            }, 2000);
          }
        }
      );
    }

    return () => {
      pulse.stop();
      clearInterval(radiusInterval);
      tripSubscription.current?.unsubscribe();
    };
  }, [currentTrip?.id]);

  const handleCancelSearch = () => {
    Alert.alert(
      'Cancelar búsqueda',
      '¿Estás seguro de que quieres cancelar?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            if (currentTrip?.id) {
              await tripService.cancelTrip(currentTrip.id, 'user_cancelled', 'passenger');
            }
            updateTripStatus('cancelled');
            clearTripSetup();
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

  // Web fallback map
  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.webMap}>
          <Text style={styles.webMapIcon}>🗺️</Text>
          <Text style={styles.webMapText}>Buscando conductores cerca de ti...</Text>
          <Text style={styles.webMapLocation}>{origin.address}</Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...origin.coordinates,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {Circle && (
          <Circle
            center={origin.coordinates}
            radius={searchRadius}
            fillColor={COLORS.primary + '20'}
            strokeColor={COLORS.primary}
            strokeWidth={2}
          />
        )}
        {Marker && (
          <Marker coordinate={origin.coordinates} title="Tu ubicación" />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      {renderMap()}

      {/* Search Panel */}
      <SafeAreaView style={styles.overlay}>
        <View style={styles.searchPanel}>
          {/* Search Animation */}
          {isSearching ? (
            <>
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
            </>
          ) : (
            <>
              {/* Driver Found */}
              <View style={styles.driverFoundContainer}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverAvatarText}>🚗</Text>
                </View>
                <Text style={styles.driverFoundTitle}>¡Conductor encontrado!</Text>
                {driverFound && (
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{driverFound.name}</Text>
                    <Text style={styles.driverRating}>⭐ {driverFound.rating}</Text>
                    <Text style={styles.driverVehicle}>{driverFound.vehicle}</Text>
                    <Text style={styles.driverPlate}>{driverFound.plate}</Text>
                    <Text style={styles.driverEta}>Llega en {driverFound.eta} min</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Trip Info */}
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
                {formatCurrency(currentTrip?.price?.total || 0)}
              </Text>
            </View>
          </View>

          {/* Cancel Button (only when searching) */}
          {isSearching && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSearch}
            >
              <Text style={styles.cancelButtonText}>Cancelar búsqueda</Text>
            </TouchableOpacity>
          )}
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
  webMap: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  webMapIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  webMapText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  webMapLocation: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  driverFoundContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  driverAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  driverAvatarText: {
    fontSize: 40,
  },
  driverFoundTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  driverInfo: {
    alignItems: 'center',
  },
  driverName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  driverRating: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  driverVehicle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  driverPlate: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  driverEta: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    marginTop: SPACING.xs,
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
