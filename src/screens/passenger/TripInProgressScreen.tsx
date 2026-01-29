// ==========================================
// CERCA - Trip In Progress Screen
// Real-time trip tracking for passengers
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { tripService } from '../../services/tripService';
import { walletService } from '../../services/walletService';

// Conditional import for react-native-maps (not available on web)
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (e) {
    console.log('react-native-maps not available');
  }
}

const { width, height } = Dimensions.get('window');

// ==========================================
// Types
// ==========================================

interface TripInProgressScreenProps {
  navigation: any;
  route: any;
}

type TripStatus =
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed';

// ==========================================
// Status Configuration
// ==========================================

const STATUS_CONFIG: Record<
  TripStatus,
  { title: string; subtitle: string; icon: string; color: string }
> = {
  driver_assigned: {
    title: 'Conductor asignado',
    subtitle: 'Tu conductor esta en camino',
    icon: '🚗',
    color: COLORS.primary,
  },
  driver_arriving: {
    title: 'Conductor llegando',
    subtitle: 'Prepara para abordar',
    icon: '📍',
    color: COLORS.warning,
  },
  driver_arrived: {
    title: 'Conductor llego',
    subtitle: 'Tu conductor te espera',
    icon: '✅',
    color: COLORS.success,
  },
  trip_started: {
    title: 'Viaje en progreso',
    subtitle: 'En camino a tu destino',
    icon: '🛣️',
    color: COLORS.primary,
  },
  trip_completed: {
    title: 'Viaje completado',
    subtitle: 'Has llegado a tu destino',
    icon: '🎉',
    color: COLORS.success,
  },
};

// ==========================================
// Main Component
// ==========================================

export const TripInProgressScreen: React.FC<TripInProgressScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuthStore();
  const { currentTrip, clearTrip } = useTripStore();
  const mapRef = useRef<any>(null);

  // Trip data from route params or store
  const tripData = route?.params?.tripData || currentTrip;

  // State
  const [tripStatus, setTripStatus] = useState<TripStatus>('driver_assigned');
  const [driverLocation, setDriverLocation] = useState(
    tripData?.driver?.location || tripData?.origin
  );
  const [eta, setEta] = useState(tripData?.estimatedTime || 5);
  const [isLoading, setIsLoading] = useState(false);
  const [showDriverInfo, setShowDriverInfo] = useState(true);

  // Animation for status card
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ==========================================
  // Effects
  // ==========================================

  useEffect(() => {
    // Animate status card on mount
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Subscribe to trip updates
    const unsubscribe = subscribeToTripUpdates();

    // Simulate trip progress in dev mode
    if (__DEV__) {
      simulateTripProgress();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ==========================================
  // Trip Updates
  // ==========================================

  const subscribeToTripUpdates = () => {
    if (!tripData?.id) return null;

    return tripService.subscribeToTripUpdates(tripData.id, (update: any) => {
      if (update.status) {
        setTripStatus(update.status);
      }
      if (update.driverLocation) {
        setDriverLocation(update.driverLocation);
      }
      if (update.eta) {
        setEta(update.eta);
      }
      if (update.status === 'trip_completed') {
        handleTripComplete();
      }
    });
  };

  const simulateTripProgress = () => {
    // Simulate driver arriving
    setTimeout(() => {
      setTripStatus('driver_arriving');
      setEta(2);
    }, 5000);

    // Simulate driver arrived
    setTimeout(() => {
      setTripStatus('driver_arrived');
      setEta(0);
    }, 10000);

    // Simulate trip started
    setTimeout(() => {
      setTripStatus('trip_started');
      setEta(tripData?.estimatedTime || 15);
    }, 15000);
  };

  // ==========================================
  // Handlers
  // ==========================================

  const handleTripComplete = async () => {
    setTripStatus('trip_completed');

    // Process payment
    if (user?.id && tripData) {
      await walletService.payTrip({
        passengerId: user.id,
        driverId: tripData.driver?.id,
        tripId: tripData.id,
        amount: tripData.price || tripData.estimatedPrice,
      });
    }

    // Navigate to completed screen
    setTimeout(() => {
      clearTrip();
      navigation.replace('TripCompleted', { tripData });
    }, 2000);
  };

  const handleCallDriver = () => {
    const driverPhone = tripData?.driver?.phone || '+502 5555-1234';
    Linking.openURL(`tel:${driverPhone}`);
  };

  const handleMessageDriver = () => {
    const driverPhone = tripData?.driver?.phone || '+502 5555-1234';
    Linking.openURL(`sms:${driverPhone}`);
  };

  const handleCancelTrip = () => {
    if (tripStatus === 'trip_started') {
      Alert.alert(
        'Viaje en Progreso',
        'No puedes cancelar un viaje que ya inicio. Si hay un problema, contacta al conductor.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Cancelar Viaje',
      'Estas seguro que deseas cancelar el viaje? Puede aplicarse un cargo por cancelacion.',
      [
        { text: 'No, continuar', style: 'cancel' },
        {
          text: 'Si, cancelar',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await tripService.cancelTrip(tripData?.id, 'passenger_cancelled');
              clearTrip();
              navigation.replace('PassengerTabs');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar el viaje');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergencia',
      'Selecciona una opcion:',
      [
        {
          text: 'Llamar al 110 (Policia)',
          onPress: () => Linking.openURL('tel:110'),
        },
        {
          text: 'Llamar al 123 (Bomberos)',
          onPress: () => Linking.openURL('tel:123'),
        },
        {
          text: 'Compartir ubicacion',
          onPress: () => Alert.alert('Ubicacion', 'Tu ubicacion ha sido compartida con tus contactos de emergencia'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  // ==========================================
  // Render Helpers
  // ==========================================

  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
          <Text style={styles.mapPlaceholderText}>
            Mapa no disponible en web
          </Text>
          <View style={styles.tripRouteInfo}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {tripData?.origin?.address || 'Origen'}
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {tripData?.destination?.address || 'Destino'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: tripData?.origin?.latitude || 14.6349,
          longitude: tripData?.origin?.longitude || -90.5069,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Origin marker */}
        <Marker
          coordinate={{
            latitude: tripData?.origin?.latitude || 14.6349,
            longitude: tripData?.origin?.longitude || -90.5069,
          }}
          title="Origen"
        >
          <View style={styles.markerOrigin}>
            <Text>📍</Text>
          </View>
        </Marker>

        {/* Destination marker */}
        <Marker
          coordinate={{
            latitude: tripData?.destination?.latitude || 14.6449,
            longitude: tripData?.destination?.longitude || -90.5169,
          }}
          title="Destino"
        >
          <View style={styles.markerDestination}>
            <Text>🏁</Text>
          </View>
        </Marker>

        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Conductor"
          >
            <View style={styles.markerDriver}>
              <Text>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Route line */}
        {tripData?.origin && tripData?.destination && (
          <Polyline
            coordinates={[
              tripData.origin,
              tripData.destination,
            ]}
            strokeColor={COLORS.primary}
            strokeWidth={4}
          />
        )}
      </MapView>
    );
  };

  const renderStatusCard = () => {
    const config = STATUS_CONFIG[tripStatus];

    return (
      <Animated.View
        style={[
          styles.statusCard,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
          <Text style={styles.statusIcon}>{config.icon}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>{config.title}</Text>
          <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
        </View>
        {eta > 0 && tripStatus !== 'trip_completed' && (
          <View style={styles.etaContainer}>
            <Text style={styles.etaValue}>{eta}</Text>
            <Text style={styles.etaLabel}>min</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderDriverInfo = () => {
    if (!showDriverInfo || !tripData?.driver) return null;

    const driver = tripData.driver;

    return (
      <View style={styles.driverCard}>
        <View style={styles.driverHeader}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {driver.name?.charAt(0) || '👤'}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name || 'Conductor'}</Text>
            <View style={styles.driverRating}>
              <Text style={styles.ratingText}>⭐ {driver.rating || '4.9'}</Text>
              <Text style={styles.tripsText}> • {driver.trips || '150'} viajes</Text>
            </View>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehiclePlate}>
              {driver.vehicle?.licensePlate || 'P-123ABC'}
            </Text>
            <Text style={styles.vehicleModel}>
              {driver.vehicle?.make} {driver.vehicle?.model}
            </Text>
          </View>
        </View>

        <View style={styles.driverActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCallDriver}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMessageDriver}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Mensaje</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleEmergency}
          >
            <Text style={styles.actionIcon}>🆘</Text>
            <Text style={[styles.actionLabel, styles.actionLabelDanger]}>
              SOS
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTripDetails = () => (
    <View style={styles.tripDetails}>
      <View style={styles.tripDetailRow}>
        <View style={styles.locationItem}>
          <View style={[styles.locationDot, { backgroundColor: COLORS.success }]} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Origen</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {tripData?.origin?.address || 'Ubicacion actual'}
            </Text>
          </View>
        </View>

        <View style={styles.locationItem}>
          <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Destino</Text>
            <Text style={styles.locationAddress} numberOfLines={1}>
              {tripData?.destination?.address || 'Destino'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tripPriceRow}>
        <Text style={styles.priceLabel}>Precio estimado</Text>
        <Text style={styles.priceValue}>
          Q{tripData?.price || tripData?.estimatedPrice || '25.00'}
        </Text>
      </View>
    </View>
  );

  // ==========================================
  // Main Render
  // ==========================================

  if (!tripData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorText}>No hay viaje activo</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.replace('PassengerTabs')}
          >
            <Text style={styles.errorButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>{renderMap()}</View>

      {/* Content Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowDriverInfo(!showDriverInfo)}
          >
            <Text style={styles.backButtonText}>
              {showDriverInfo ? '▼' : '▲'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {STATUS_CONFIG[tripStatus].title}
          </Text>
          <TouchableOpacity style={styles.menuButton} onPress={handleEmergency}>
            <Text style={styles.menuButtonText}>🆘</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <SafeAreaView style={styles.bottomSheet} edges={['bottom']}>
        {renderStatusCard()}
        {renderDriverInfo()}
        {renderTripDetails()}

        {/* Cancel Button */}
        {tripStatus !== 'trip_started' && tripStatus !== 'trip_completed' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelTrip}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancelar viaje</Text>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
};

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
  },
  mapPlaceholderIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  mapPlaceholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  tripRouteInfo: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    width: width * 0.8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.gray[300],
    marginLeft: 5,
  },
  routeText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
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
    elevation: 3,
  },
  backButtonText: {
    fontSize: FONT_SIZES.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    overflow: 'hidden',
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
    elevation: 3,
  },
  menuButtonText: {
    fontSize: FONT_SIZES.lg,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  statusIcon: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  etaContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.sm,
    minWidth: 50,
  },
  etaValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  etaLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.8,
  },
  driverCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  driverAvatarText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  tripsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  vehicleInfo: {
    alignItems: 'flex-end',
  },
  vehiclePlate: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vehicleModel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  driverActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.md,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  actionButtonDanger: {
    backgroundColor: COLORS.error + '10',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionLabelDanger: {
    color: COLORS.error,
  },
  tripDetails: {
    marginBottom: SPACING.md,
  },
  tripDetailRow: {
    marginBottom: SPACING.md,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  locationAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  tripPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: SPACING.md,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '500',
  },
  markerOrigin: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  markerDestination: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  markerDriver: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  errorButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
