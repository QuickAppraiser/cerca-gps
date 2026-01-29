// ==========================================
// CERCA - Trip Receipt Screen
// View and share trip receipts/invoices
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { formatCurrency, formatDuration, formatDistance } from '../../utils';
import type { Trip } from '../../types';

// ==========================================
// Types
// ==========================================

type TripReceiptRouteProp = RouteProp<{ TripReceipt: { tripId: string } }, 'TripReceipt'>;

interface ReceiptData {
  trip: Trip;
  receiptNumber: string;
  issuedAt: string;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
    discount: number;
    tip: number;
    total: number;
  };
}

// ==========================================
// Mock Data
// ==========================================

const generateReceiptNumber = (tripId: string) => {
  const date = new Date();
  return `CERCA-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${tripId.slice(-6).toUpperCase()}`;
};

const MOCK_RECEIPT: ReceiptData = {
  trip: {
    id: 'trip-123456',
    passengerId: 'user-1',
    driverId: 'driver-1',
    status: 'completed',
    origin: {
      address: 'Carrera 14 #23-45, Armenia',
      latitude: 4.5339,
      longitude: -75.6811,
    },
    destination: {
      address: 'Centro Comercial Portal del Quindio',
      latitude: 4.5450,
      longitude: -75.6700,
    },
    price: {
      base: 4500,
      distance: 3200,
      time: 1800,
      surge: 0,
      discount: 2000,
      total: 7500,
    },
    distance: 3.2,
    duration: 12,
    paymentMethod: 'credits',
    createdAt: '2024-01-20T14:30:00',
    acceptedAt: '2024-01-20T14:32:00',
    startedAt: '2024-01-20T14:40:00',
    completedAt: '2024-01-20T14:52:00',
    driver: {
      id: 'driver-1',
      name: 'Carlos Rodriguez',
      phone: '3001234567',
      rating: 4.9,
      vehicle: {
        plate: 'ABC123',
        model: 'Toyota Corolla',
        year: '2022',
        color: 'Blanco',
        type: 'sedan',
      },
    },
  } as any,
  receiptNumber: '',
  issuedAt: new Date().toISOString(),
  breakdown: {
    baseFare: 4500,
    distanceFare: 3200,
    timeFare: 1800,
    surgeFare: 0,
    discount: 2000,
    tip: 0,
    total: 7500,
  },
};

// ==========================================
// Components
// ==========================================

const ReceiptHeader: React.FC<{ receiptNumber: string; issuedAt: string }> = ({
  receiptNumber,
  issuedAt,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.receiptHeader}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>CERCA</Text>
        <Text style={styles.logoSubtext}>Tu viaje, tu comunidad</Text>
      </View>
      <View style={styles.receiptInfo}>
        <Text style={styles.receiptLabel}>Recibo No.</Text>
        <Text style={styles.receiptNumber}>{receiptNumber}</Text>
        <Text style={styles.receiptDate}>{formatDate(issuedAt)}</Text>
      </View>
    </View>
  );
};

const TripDetails: React.FC<{ trip: Trip }> = ({ trip }) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Detalles del viaje</Text>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.originDot]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Origen</Text>
            <Text style={styles.routeAddress}>{trip.origin.address}</Text>
            <Text style={styles.routeTime}>{formatTime(trip.startedAt)}</Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.destinationDot]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Destino</Text>
            <Text style={styles.routeAddress}>{trip.destination.address}</Text>
            <Text style={styles.routeTime}>{formatTime(trip.completedAt)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripStats}>
        <View style={styles.tripStat}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statValue}>{formatDistance(trip.distance * 1000)}</Text>
          <Text style={styles.statLabel}>Distancia</Text>
        </View>
        <View style={styles.tripStat}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{formatDuration(trip.duration)}</Text>
          <Text style={styles.statLabel}>Duracion</Text>
        </View>
      </View>
    </View>
  );
};

const DriverInfo: React.FC<{ driver: any }> = ({ driver }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Conductor</Text>
    <View style={styles.driverCard}>
      <View style={styles.driverAvatar}>
        <Text style={styles.driverInitial}>
          {driver.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverRating}>⭐ {driver.rating.toFixed(1)}</Text>
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehiclePlate}>{driver.vehicle.plate}</Text>
        <Text style={styles.vehicleModel}>
          {driver.vehicle.model} - {driver.vehicle.color}
        </Text>
      </View>
    </View>
  </View>
);

const PriceBreakdown: React.FC<{ breakdown: ReceiptData['breakdown'] }> = ({ breakdown }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Desglose del precio</Text>
    <View style={styles.breakdownCard}>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Tarifa base</Text>
        <Text style={styles.breakdownValue}>{formatCurrency(breakdown.baseFare)}</Text>
      </View>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Distancia</Text>
        <Text style={styles.breakdownValue}>{formatCurrency(breakdown.distanceFare)}</Text>
      </View>
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Tiempo</Text>
        <Text style={styles.breakdownValue}>{formatCurrency(breakdown.timeFare)}</Text>
      </View>
      {breakdown.surgeFare > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Tarifa dinamica</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(breakdown.surgeFare)}</Text>
        </View>
      )}
      {breakdown.discount > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, styles.discountText]}>Descuento</Text>
          <Text style={[styles.breakdownValue, styles.discountText]}>
            -{formatCurrency(breakdown.discount)}
          </Text>
        </View>
      )}
      {breakdown.tip > 0 && (
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Propina</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(breakdown.tip)}</Text>
        </View>
      )}
      <View style={[styles.breakdownRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total pagado</Text>
        <Text style={styles.totalValue}>{formatCurrency(breakdown.total)}</Text>
      </View>
    </View>
  </View>
);

const PaymentInfo: React.FC<{ method: string }> = ({ method }) => {
  const getMethodName = () => {
    switch (method) {
      case 'credits':
        return 'Creditos CERCA';
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      default:
        return method;
    }
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'credits':
        return '💳';
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      default:
        return '💰';
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Metodo de pago</Text>
      <View style={styles.paymentCard}>
        <Text style={styles.paymentIcon}>{getMethodIcon()}</Text>
        <Text style={styles.paymentMethod}>{getMethodName()}</Text>
        <Text style={styles.paymentStatus}>✓ Pagado</Text>
      </View>
    </View>
  );
};

// ==========================================
// Main Component
// ==========================================

export const TripReceiptScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TripReceiptRouteProp>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceipt();
  }, []);

  const loadReceipt = async () => {
    try {
      const tripId = route.params?.tripId || 'trip-123456';
      await new Promise(resolve => setTimeout(resolve, 300));

      const mockReceipt = {
        ...MOCK_RECEIPT,
        receiptNumber: generateReceiptNumber(tripId),
        issuedAt: new Date().toISOString(),
      };

      setReceipt(mockReceipt);
    } catch (error) {
      console.error('Error loading receipt:', error);
      Alert.alert('Error', 'No se pudo cargar el recibo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;

    const receiptText = `
RECIBO CERCA
${receipt.receiptNumber}

Fecha: ${new Date(receipt.issuedAt).toLocaleDateString('es-CO')}

De: ${receipt.trip.origin.address}
A: ${receipt.trip.destination.address}

Distancia: ${formatDistance(receipt.trip.distance * 1000)}
Duracion: ${formatDuration(receipt.trip.duration)}

Conductor: ${receipt.trip.driver?.name}
Vehiculo: ${receipt.trip.driver?.vehicle.plate}

TOTAL: ${formatCurrency(receipt.breakdown.total)}

Gracias por viajar con CERCA!
    `.trim();

    try {
      await Share.share({
        message: receiptText,
        title: `Recibo CERCA - ${receipt.receiptNumber}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = () => {
    Alert.alert(
      'Descargar recibo',
      'El recibo se ha guardado en tu dispositivo como PDF.',
      [{ text: 'OK' }]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Reportar problema',
      'Que tipo de problema deseas reportar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cobro incorrecto', onPress: () => Alert.alert('Reporte enviado', 'Revisaremos tu caso en 24-48 horas') },
        { text: 'Ruta incorrecta', onPress: () => Alert.alert('Reporte enviado', 'Revisaremos tu caso en 24-48 horas') },
        { text: 'Otro problema', onPress: () => Alert.alert('Reporte enviado', 'Revisaremos tu caso en 24-48 horas') },
      ]
    );
  };

  if (isLoading || !receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando recibo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.receiptContainer}>
          <ReceiptHeader
            receiptNumber={receipt.receiptNumber}
            issuedAt={receipt.issuedAt}
          />

          <TripDetails trip={receipt.trip} />

          {receipt.trip.driver && <DriverInfo driver={receipt.trip.driver} />}

          <PriceBreakdown breakdown={receipt.breakdown} />

          <PaymentInfo method={receipt.trip.paymentMethod} />
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
            <Text style={styles.actionIcon}>📥</Text>
            <Text style={styles.actionText}>Descargar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={styles.actionText}>Reportar</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este documento es un comprobante de pago electronico valido.
          </Text>
          <Text style={styles.footerText}>
            CERCA Colombia SAS - NIT: 901.XXX.XXX-X
          </Text>
          <Text style={styles.footerText}>
            soporte@cercaapp.co | www.cercaapp.co
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  receiptContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  receiptHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + '80',
  },
  receiptInfo: {
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white + '80',
  },
  receiptNumber: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 1,
  },
  receiptDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + '80',
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  routeContainer: {
    marginBottom: SPACING.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: SPACING.md,
  },
  originDot: {
    backgroundColor: COLORS.success,
  },
  destinationDot: {
    backgroundColor: COLORS.primary,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.border,
    marginLeft: 5,
    marginVertical: SPACING.xs,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  routeAddress: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  routeTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  tripStat: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  driverInitial: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
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
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  vehicleInfo: {
    alignItems: 'flex-end',
  },
  vehiclePlate: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleModel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  breakdownCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  discountText: {
    color: COLORS.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  paymentMethod: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  paymentStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
});

export default TripReceiptScreen;
