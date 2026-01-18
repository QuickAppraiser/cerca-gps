// ==========================================
// CERCA - Pantalla de Confirmación de Viaje
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, FONT_SIZES, TRIP_CONFIG } from '../../constants/theme';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { PaymentMethod, AccessibilityOption } from '../../types';

const { width } = Dimensions.get('window');

type ConfirmTripScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const VEHICLE_TYPES = [
  { id: 'standard', name: 'Estándar', icon: '🚗', multiplier: 1 },
  { id: 'comfort', name: 'Confort', icon: '🚙', multiplier: 1.3 },
  { id: 'taxi', name: 'Taxi', icon: '🚕', multiplier: 1.1 },
];

const RIDE_MODES = [
  { id: 'silent', name: 'Silencioso', icon: '🤫' },
  { id: 'normal', name: 'Normal', icon: '😊' },
  { id: 'conversational', name: 'Conversación', icon: '💬' },
];

export const ConfirmTripScreen: React.FC<ConfirmTripScreenProps> = ({
  navigation,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('standard');
  const [isSearching, setIsSearching] = useState(false);

  const { user } = useAuthStore();
  const {
    origin,
    destination,
    selectedPaymentMethod,
    setPaymentMethod,
    rideMode,
    setRideMode,
    setCurrentTrip,
  } = useTripStore();

  // Calcular precio estimado (mock)
  const distance = 5.2; // km (mock - calcular con API de rutas)
  const duration = 15; // minutos (mock)
  const basePrice =
    TRIP_CONFIG.baseFare +
    distance * TRIP_CONFIG.perKmRate +
    duration * TRIP_CONFIG.perMinuteRate;

  const vehicleMultiplier =
    VEHICLE_TYPES.find((v) => v.id === selectedVehicle)?.multiplier || 1;
  const estimatedPrice = Math.round(basePrice * vehicleMultiplier);

  useEffect(() => {
    if (origin && destination && mapRef.current) {
      // Ajustar mapa para mostrar origen y destino
      mapRef.current.fitToCoordinates(
        [origin.coordinates, destination.coordinates],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  }, [origin, destination]);

  const handleRequestTrip = () => {
    if (selectedPaymentMethod === 'credits' && (user?.credits || 0) < estimatedPrice) {
      Alert.alert(
        'Créditos insuficientes',
        `Necesitas $${estimatedPrice.toLocaleString()} COP. Tu saldo es $${(user?.credits || 0).toLocaleString()} COP.`,
        [
          { text: 'Pagar en efectivo', onPress: () => setPaymentMethod('cash') },
          { text: 'Recargar créditos', onPress: () => navigation.navigate('Credits') },
        ]
      );
      return;
    }

    setIsSearching(true);

    // Simular búsqueda de conductor
    setTimeout(() => {
      const trip = {
        id: `trip_${Date.now()}`,
        passengerId: user?.id || '',
        origin: origin!,
        destination: destination!,
        status: 'searching' as const,
        requestedAt: new Date(),
        price: {
          base: TRIP_CONFIG.baseFare,
          distance: distance * TRIP_CONFIG.perKmRate,
          time: duration * TRIP_CONFIG.perMinuteRate,
          total: estimatedPrice,
          currency: 'COP' as const,
        },
        paymentMethod: selectedPaymentMethod,
        rideMode,
        isAccessibilityTrip: false,
        accessibilityNeeds: [],
      };

      setCurrentTrip(trip);
      setIsSearching(false);
      navigation.replace('SearchingDriver');
    }, 1500);
  };

  if (!origin || !destination) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error: Origen o destino no definido</Text>
        <Button title="Volver" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...origin.coordinates,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={origin.coordinates}
          title="Origen"
          pinColor={COLORS.primary}
        />
        <Marker
          coordinate={destination.coordinates}
          title="Destino"
          pinColor={COLORS.emergency}
        />
        <Polyline
          coordinates={[origin.coordinates, destination.coordinates]}
          strokeColor={COLORS.primary}
          strokeWidth={4}
        />
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Panel inferior */}
      <View style={styles.bottomPanel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Resumen de ruta */}
          <View style={styles.routeSummary}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.originDot]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {origin.address}
              </Text>
            </View>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.destinationDot]} />
              <Text style={styles.routeText} numberOfLines={1}>
                {destination.address}
              </Text>
            </View>
          </View>

          {/* Tipos de vehículo */}
          <Text style={styles.sectionTitle}>Tipo de vehículo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.vehicleScroll}
          >
            {VEHICLE_TYPES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleOption,
                  selectedVehicle === vehicle.id && styles.vehicleOptionSelected,
                ]}
                onPress={() => setSelectedVehicle(vehicle.id)}
              >
                <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                <Text
                  style={[
                    styles.vehicleName,
                    selectedVehicle === vehicle.id && styles.vehicleNameSelected,
                  ]}
                >
                  {vehicle.name}
                </Text>
                <Text
                  style={[
                    styles.vehiclePrice,
                    selectedVehicle === vehicle.id && styles.vehiclePriceSelected,
                  ]}
                >
                  ${Math.round(basePrice * vehicle.multiplier).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Modo de viaje */}
          <Text style={styles.sectionTitle}>Modo de viaje</Text>
          <View style={styles.rideModeContainer}>
            {RIDE_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.rideModeOption,
                  rideMode === mode.id && styles.rideModeSelected,
                ]}
                onPress={() => setRideMode(mode.id as typeof rideMode)}
              >
                <Text style={styles.rideModeIcon}>{mode.icon}</Text>
                <Text
                  style={[
                    styles.rideModeName,
                    rideMode === mode.id && styles.rideModeNameSelected,
                  ]}
                >
                  {mode.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Método de pago */}
          <Text style={styles.sectionTitle}>Método de pago</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'credits' && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod('credits')}
            >
              <Text style={styles.paymentIcon}>💳</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>Créditos CERCA</Text>
                <Text style={styles.paymentBalance}>
                  Saldo: ${(user?.credits || 0).toLocaleString()}
                </Text>
              </View>
              {selectedPaymentMethod === 'credits' && (
                <Text style={styles.paymentCheck}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'cash' && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <Text style={styles.paymentIcon}>💵</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>Efectivo</Text>
                <Text style={styles.paymentBalance}>Paga al conductor</Text>
              </View>
              {selectedPaymentMethod === 'cash' && (
                <Text style={styles.paymentCheck}>✓</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info del viaje */}
          <View style={styles.tripInfo}>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>Distancia</Text>
              <Text style={styles.tripInfoValue}>{distance} km</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>Tiempo est.</Text>
              <Text style={styles.tripInfoValue}>{duration} min</Text>
            </View>
            <View style={styles.tripInfoItem}>
              <Text style={styles.tripInfoLabel}>Comisión</Text>
              <Text style={styles.tripInfoValue}>
                {(TRIP_CONFIG.commissionRate * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Botón de solicitar */}
        <View style={styles.confirmContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Precio estimado</Text>
            <Text style={styles.priceValue}>
              ${estimatedPrice.toLocaleString()} COP
            </Text>
          </View>
          <Button
            title={isSearching ? 'Buscando...' : 'Solicitar CERCA'}
            onPress={handleRequestTrip}
            loading={isSearching}
            fullWidth
            size="lg"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  map: {
    width,
    height: '45%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
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
    elevation: 4,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: SPACING.md,
  },
  routeSummary: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  routeDot: {
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
  routeText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  vehicleScroll: {
    paddingHorizontal: SPACING.md,
  },
  vehicleOption: {
    alignItems: 'center',
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    minWidth: 100,
  },
  vehicleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  vehicleName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  vehicleNameSelected: {
    color: COLORS.primary,
  },
  vehiclePrice: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  vehiclePriceSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  rideModeContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  rideModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    gap: SPACING.xs,
  },
  rideModeSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  rideModeIcon: {
    fontSize: 16,
  },
  rideModeName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  rideModeNameSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  paymentOptions: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  paymentBalance: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  paymentCheck: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
  },
  tripInfoItem: {
    alignItems: 'center',
  },
  tripInfoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  tripInfoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  confirmContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    backgroundColor: COLORS.white,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  priceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
