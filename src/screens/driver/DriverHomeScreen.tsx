// ==========================================
// CERCA - Pantalla Principal del Conductor
// With real trip matching integration
// ==========================================

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Switch,
  Alert,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { EmergencyButton } from '../../components/emergency/EmergencyButton';
import { COLORS, SPACING, FONT_SIZES, ARMENIA_CONFIG, TRIP_CONFIG } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { tripService } from '../../services/tripService';
import { notificationService } from '../../services/notificationService';
import { Coordinates, Trip } from '../../types';
import { formatCurrency } from '../../utils/validation';
import { config } from '../../config/environment';

const { width, height } = Dimensions.get('window');

// Conditionally import MapView for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('react-native-maps not available');
  }
}

type DriverHomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({ navigation }) => {
  const mapRef = useRef<any>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const tripSubscription = useRef<any>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);

  const { user } = useAuthStore();
  const {
    isOnline,
    setOnline,
    setDriverLocation,
    pendingTripRequests,
    addPendingRequest,
    removePendingRequest,
  } = useTripStore();

  useEffect(() => {
    // Register for push notifications
    const setupNotifications = async () => {
      const result = await notificationService.registerForPushNotifications();
      if (result.success && result.data?.token && user?.id) {
        await notificationService.savePushToken(user.id, result.data.token);
      }
    };
    setupNotifications();

    // Load today's stats
    loadDriverStats();
  }, []);

  useEffect(() => {
    if (isOnline) {
      startLocationTracking();
      subscribeToTripRequests();
    } else {
      stopLocationTracking();
      unsubscribeFromTripRequests();
    }

    return () => {
      stopLocationTracking();
      unsubscribeFromTripRequests();
    };
  }, [isOnline]);

  const loadDriverStats = async () => {
    if (!user?.id) return;

    try {
      const result = await tripService.getDriverStats(user.id, 'today');
      if (result.success && result.data) {
        setTodayEarnings(result.data.earnings || 0);
        setTodayTrips(result.data.tripCount || 0);
      }
    } catch (error) {
      console.error('Error loading driver stats:', error);
    }
  };

  const subscribeToTripRequests = () => {
    if (!user?.id) return;

    // Prevent duplicate subscriptions (memory leak fix)
    if (tripSubscription.current) {
      tripSubscription.current.unsubscribe();
    }

    tripSubscription.current = tripService.subscribeToDriverRequests(
      user.id,
      (newTrip) => {
        console.log('New trip request received:', newTrip.id);

        // Vibrate to alert driver
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 500, 200, 500]);
        }

        // Add to pending requests
        addPendingRequest(newTrip);

        // Show local notification
        notificationService.sendLocalNotification(
          'Nueva solicitud de viaje',
          `${formatCurrency(newTrip.price?.total || 0)} - ${newTrip.origin?.address || 'Origen'}`,
          { tripId: newTrip.id, type: 'trip_request' }
        );
      }
    );
  };

  const unsubscribeFromTripRequests = () => {
    if (tripSubscription.current) {
      tripSubscription.current.unsubscribe();
      tripSubscription.current = null;
    }
  };

  const startLocationTracking = async () => {
    // Prevent duplicate subscriptions (memory leak fix)
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos tu ubicacion para recibir viajes');
        setOnline(false);
        return;
      }

      // Request background location permission
      if (Platform.OS !== 'web') {
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
          Alert.alert(
            'Ubicacion en segundo plano',
            'Para mejores resultados, permite la ubicacion siempre activa en configuracion.'
          );
        }
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        async (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(coords);
          setDriverLocation(coords);

          // Update driver location in database
          if (user?.id) {
            await tripService.updateDriverLocation(user.id, coords);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setOnline(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setDriverLocation(null);
  };

  const handleToggleOnline = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Conectarte',
        'Listo para recibir viajes?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Si, conectar', onPress: () => setOnline(true) },
        ]
      );
    } else {
      setOnline(false);
    }
  };

  const handleAcceptTrip = async (trip: Trip) => {
    if (!user?.id) return;

    try {
      const result = await tripService.acceptTrip(trip.id, user.id);

      if (result.success) {
        removePendingRequest(trip.id);

        // Navigate to active trip screen
        navigation.navigate('ActiveTrip', { tripId: trip.id, trip: result.data });
      } else {
        Alert.alert('Error', result.error || 'No se pudo aceptar el viaje');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexion. Intenta de nuevo.');
    }
  };

  const handleRejectTrip = async (trip: Trip) => {
    if (!user?.id) return;

    try {
      await tripService.rejectTrip(trip.id, user.id);
      removePendingRequest(trip.id);
    } catch (error) {
      console.error('Error rejecting trip:', error);
      // Still remove from local state
      removePendingRequest(trip.id);
    }
  };

  // Web fallback map
  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.webMap}>
          <Text style={styles.webMapIcon}>{isOnline ? '🟢' : '🔴'}</Text>
          <Text style={styles.webMapText}>
            {isOnline ? 'Esperando solicitudes...' : 'Desconectado'}
          </Text>
          {currentLocation && (
            <Text style={styles.webMapLocation}>
              📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </Text>
          )}
          {config.isDevelopment && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>MODO DESARROLLO</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={ARMENIA_CONFIG.initialRegion}
        showsUserLocation={isOnline}
        showsMyLocationButton={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      {renderMap()}

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('DriverProfile')}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        {/* Toggle Online/Offline */}
        <View style={[
          styles.onlineToggle,
          isOnline && styles.onlineToggleActive,
        ]}>
          <Text style={[
            styles.onlineText,
            isOnline && styles.onlineTextActive,
          ]}>
            {isOnline ? 'CONECTADO' : 'DESCONECTADO'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primaryLight }}
            thumbColor={isOnline ? COLORS.primary : COLORS.gray[500]}
          />
        </View>
      </SafeAreaView>

      {/* Earnings Panel */}
      <View style={styles.earningsPanel}>
        <Card style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Hoy</Text>
              <Text style={styles.earningValue}>
                {formatCurrency(todayEarnings)}
              </Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Viajes</Text>
              <Text style={styles.earningValue}>{todayTrips}</Text>
            </View>
            <View style={styles.earningDivider} />
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Rating</Text>
              <Text style={styles.earningValue}>⭐ {user?.rating?.toFixed(1) || '5.0'}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Pending Trip Requests */}
      {pendingTripRequests.length > 0 && (
        <View style={styles.tripRequestContainer}>
          {pendingTripRequests.map((trip) => (
            <Card key={trip.id} style={styles.tripRequestCard}>
              <View style={styles.tripRequestHeader}>
                <Text style={styles.tripRequestPrice}>
                  {formatCurrency(trip.price?.total || 0)}
                </Text>
                <Text style={styles.tripRequestDistance}>
                  {((trip.route?.distance || 0) / 1000).toFixed(1)} km
                </Text>
              </View>

              <View style={styles.tripRequestLocations}>
                <View style={styles.tripLocation}>
                  <View style={styles.originDot} />
                  <Text style={styles.tripLocationText} numberOfLines={1}>
                    {trip.origin?.address || 'Origen'}
                  </Text>
                </View>
                <View style={styles.tripLocation}>
                  <View style={styles.destinationDot} />
                  <Text style={styles.tripLocationText} numberOfLines={1}>
                    {trip.destination?.address || 'Destino'}
                  </Text>
                </View>
              </View>

              <View style={styles.tripRequestActions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleRejectTrip(trip)}
                >
                  <Text style={styles.rejectButtonText}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptTrip(trip)}
                >
                  <Text style={styles.acceptButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('CommunityRoutes')}
        >
          <Text style={styles.quickActionIcon}>📅</Text>
          <Text style={styles.quickActionText}>Mis Rutas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Documents')}
        >
          <Text style={styles.quickActionIcon}>📄</Text>
          <Text style={styles.quickActionText}>Documentos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Text style={styles.quickActionIcon}>💰</Text>
          <Text style={styles.quickActionText}>Ganancias</Text>
        </TouchableOpacity>
      </View>

      {/* Offline Panel */}
      {!isOnline && (
        <View style={styles.offlinePanel}>
          <Card style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>Estas desconectado</Text>
            <Text style={styles.offlineSubtitle}>
              Activa la conexion para empezar a recibir viajes
            </Text>
            <TouchableOpacity
              style={styles.goOnlineButton}
              onPress={() => handleToggleOnline(true)}
            >
              <Text style={styles.goOnlineButtonText}>CONECTARME</Text>
            </TouchableOpacity>
          </Card>
        </View>
      )}

      {/* Commission Info */}
      <View style={styles.commissionInfo}>
        <Text style={styles.commissionText}>
          Comision CERCA: {(TRIP_CONFIG.commissionRate * 100).toFixed(0)}%
        </Text>
      </View>

      {/* Emergency Button */}
      <EmergencyButton currentLocation={currentLocation || undefined} />
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
    height,
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
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  webMapLocation: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  devBadge: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  devBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
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
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 25,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  onlineToggleActive: {
    backgroundColor: COLORS.primary,
  },
  onlineText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  onlineTextActive: {
    color: COLORS.white,
  },
  earningsPanel: {
    position: 'absolute',
    top: 110,
    left: SPACING.md,
    right: SPACING.md,
  },
  earningsCard: {
    padding: SPACING.md,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningItem: {
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  earningValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  earningDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray[200],
  },
  tripRequestContainer: {
    position: 'absolute',
    top: 200,
    left: SPACING.md,
    right: SPACING.md,
  },
  tripRequestCard: {
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tripRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tripRequestPrice: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tripRequestDistance: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  tripRequestLocations: {
    marginBottom: SPACING.md,
  },
  tripLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.emergency,
    marginRight: SPACING.sm,
  },
  tripLocationText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  tripRequestActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rejectButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  rejectButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  quickActions: {
    position: 'absolute',
    bottom: 120,
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
  offlinePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  offlineCard: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  offlineTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  offlineSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  goOnlineButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  goOnlineButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  commissionInfo: {
    position: 'absolute',
    bottom: SPACING.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  commissionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
  },
});
