// ==========================================
// CERCA - Pantalla Principal del Conductor
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { EmergencyButton } from '../../components/emergency/EmergencyButton';
import { COLORS, SPACING, FONT_SIZES, ARMENIA_CONFIG, TRIP_CONFIG } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { Coordinates, Trip } from '../../types';

const { width, height } = Dimensions.get('window');

type DriverHomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({ navigation }) => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const { user } = useAuthStore();
  const {
    isOnline,
    setOnline,
    setDriverLocation,
    pendingTripRequests,
  } = useTripStore();

  useEffect(() => {
    if (isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isOnline]);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos tu ubicación para recibir viajes');
        setOnline(false);
        return;
      }

      // Solicitar permiso de ubicación en segundo plano
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        Alert.alert(
          'Ubicación en segundo plano',
          'Para mejores resultados, permite la ubicación siempre activa en configuración.'
        );
      }

      locationSubscription.current = await Location.watchPositionAsync(
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
          setCurrentLocation(coords);
          setDriverLocation(coords);
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
        '¿Listo para recibir viajes?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, conectar', onPress: () => setOnline(true) },
        ]
      );
    } else {
      setOnline(false);
    }
  };

  const handleAcceptTrip = (trip: Trip) => {
    // TODO: Implementar aceptación de viaje
    navigation.navigate('ActiveTrip', { tripId: trip.id });
  };

  // Calcular ganancias del día (mock)
  const todayEarnings = 125000;
  const todayTrips = 8;

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={ARMENIA_CONFIG.initialRegion}
        showsUserLocation={isOnline}
        showsMyLocationButton={false}
      />

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

      {/* Panel de ganancias */}
      <View style={styles.earningsPanel}>
        <Card style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Hoy</Text>
              <Text style={styles.earningValue}>
                ${todayEarnings.toLocaleString()}
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

      {/* Solicitudes de viaje pendientes */}
      {pendingTripRequests.length > 0 && (
        <View style={styles.tripRequestContainer}>
          {pendingTripRequests.map((trip) => (
            <Card key={trip.id} style={styles.tripRequestCard}>
              <View style={styles.tripRequestHeader}>
                <Text style={styles.tripRequestPrice}>
                  ${trip.price.total.toLocaleString()}
                </Text>
                <Text style={styles.tripRequestDistance}>
                  {((trip.route?.distance || 0) / 1000).toFixed(1)} km
                </Text>
              </View>

              <View style={styles.tripRequestLocations}>
                <View style={styles.tripLocation}>
                  <View style={styles.originDot} />
                  <Text style={styles.tripLocationText} numberOfLines={1}>
                    {trip.origin.address}
                  </Text>
                </View>
                <View style={styles.tripLocation}>
                  <View style={styles.destinationDot} />
                  <Text style={styles.tripLocationText} numberOfLines={1}>
                    {trip.destination.address}
                  </Text>
                </View>
              </View>

              <View style={styles.tripRequestActions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => {/* TODO: Rechazar */}}
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

      {/* Acciones rápidas del conductor */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('CommunityRoutes')}
        >
          <Text style={styles.quickActionIcon}>🗓️</Text>
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

      {/* Panel inferior cuando está offline */}
      {!isOnline && (
        <View style={styles.offlinePanel}>
          <Card style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>Estás desconectado</Text>
            <Text style={styles.offlineSubtitle}>
              Activa la conexión para empezar a recibir viajes
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

      {/* Indicador de comisión CERCA */}
      <View style={styles.commissionInfo}>
        <Text style={styles.commissionText}>
          Comisión CERCA: {(TRIP_CONFIG.commissionRate * 100).toFixed(0)}%
        </Text>
      </View>

      {/* Botón de emergencia */}
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
