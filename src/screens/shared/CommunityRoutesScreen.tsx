// ==========================================
// CERCA - Pantalla de Rutas Comunitarias
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { CommunityRoute, RouteSchedule } from '../../types';

type CommunityRoutesScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Mock de rutas comunitarias en Armenia
const MOCK_ROUTES: CommunityRoute[] = [
  {
    id: 'route_1',
    driverId: 'driver_1',
    name: 'Ruta Universidad - Centro',
    description: 'Salida desde Uniquindío hacia el centro por la Av. Bolívar',
    origin: {
      coordinates: { latitude: 4.5450, longitude: -75.6650 },
      address: 'Universidad del Quindío',
      name: 'Uniquindío',
    },
    destination: {
      coordinates: { latitude: 4.5390, longitude: -75.6780 },
      address: 'Plaza de Bolívar, Centro',
      name: 'Centro',
    },
    waypoints: [],
    schedule: [
      { dayOfWeek: 1, departureTime: '07:00', isActive: true },
      { dayOfWeek: 2, departureTime: '07:00', isActive: true },
      { dayOfWeek: 3, departureTime: '07:00', isActive: true },
      { dayOfWeek: 4, departureTime: '07:00', isActive: true },
      { dayOfWeek: 5, departureTime: '07:00', isActive: true },
    ],
    pricePerSeat: 3500,
    availableSeats: 3,
    totalSeats: 4,
    isActive: true,
    reservations: [],
    createdAt: new Date(),
  },
  {
    id: 'route_2',
    driverId: 'driver_2',
    name: 'Norte - Terminal',
    description: 'Desde el barrio Norte hacia la Terminal de Transportes',
    origin: {
      coordinates: { latitude: 4.5500, longitude: -75.6700 },
      address: 'Barrio Norte',
      name: 'Norte',
    },
    destination: {
      coordinates: { latitude: 4.5320, longitude: -75.6850 },
      address: 'Terminal de Transportes',
      name: 'Terminal',
    },
    waypoints: [],
    schedule: [
      { dayOfWeek: 0, departureTime: '06:30', isActive: true },
      { dayOfWeek: 1, departureTime: '06:30', isActive: true },
      { dayOfWeek: 2, departureTime: '06:30', isActive: true },
      { dayOfWeek: 3, departureTime: '06:30', isActive: true },
      { dayOfWeek: 4, departureTime: '06:30', isActive: true },
      { dayOfWeek: 5, departureTime: '06:30', isActive: true },
      { dayOfWeek: 6, departureTime: '06:30', isActive: true },
    ],
    pricePerSeat: 4000,
    availableSeats: 2,
    totalSeats: 4,
    isActive: true,
    reservations: [],
    createdAt: new Date(),
  },
  {
    id: 'route_3',
    driverId: 'driver_3',
    name: 'Portal - Unicentro',
    description: 'Ruta comercial entre los dos centros comerciales',
    origin: {
      coordinates: { latitude: 4.5400, longitude: -75.6700 },
      address: 'Centro Comercial Portal del Quindío',
      name: 'Portal',
    },
    destination: {
      coordinates: { latitude: 4.5350, longitude: -75.6900 },
      address: 'Centro Comercial Unicentro',
      name: 'Unicentro',
    },
    waypoints: [],
    schedule: [
      { dayOfWeek: 6, departureTime: '10:00', isActive: true },
      { dayOfWeek: 0, departureTime: '10:00', isActive: true },
    ],
    pricePerSeat: 3000,
    availableSeats: 4,
    totalSeats: 4,
    isActive: true,
    reservations: [],
    createdAt: new Date(),
  },
];

// Mock de conductores
const MOCK_DRIVERS: Record<string, { name: string; rating: number; trips: number; photo?: string }> = {
  driver_1: { name: 'Carlos Gómez', rating: 4.9, trips: 234 },
  driver_2: { name: 'María López', rating: 4.8, trips: 156 },
  driver_3: { name: 'Juan Pérez', rating: 4.7, trips: 89 },
};

export const CommunityRoutesScreen: React.FC<CommunityRoutesScreenProps> = ({
  navigation,
}) => {
  const [routes] = useState<CommunityRoute[]>(MOCK_ROUTES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<CommunityRoute | null>(null);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [seatsToReserve, setSeatsToReserve] = useState(1);

  const { user, activeRole } = useAuthStore();
  const isDriver = activeRole === 'driver';

  const handleReserve = () => {
    if (!selectedRoute) return;

    if (seatsToReserve > selectedRoute.availableSeats) {
      Alert.alert('Error', 'No hay suficientes cupos disponibles');
      return;
    }

    const totalPrice = selectedRoute.pricePerSeat * seatsToReserve;

    Alert.alert(
      'Confirmar Reserva',
      `¿Reservar ${seatsToReserve} cupo(s) por $${totalPrice.toLocaleString()} COP?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reservar',
          onPress: () => {
            // TODO: Crear reserva en backend
            setShowReserveModal(false);
            setSelectedRoute(null);
            Alert.alert(
              '¡Reserva confirmada!',
              `Tu cupo en la ruta "${selectedRoute.name}" ha sido reservado. El conductor te contactará.`
            );
          },
        },
      ]
    );
  };

  const getScheduleText = (schedule: RouteSchedule[]) => {
    const days = schedule
      .filter(s => s.isActive)
      .map(s => DAYS_OF_WEEK[s.dayOfWeek]);

    if (days.length === 7) return 'Todos los días';
    if (days.length === 5 && !schedule.find(s => s.dayOfWeek === 0 || s.dayOfWeek === 6)) {
      return 'Lun - Vie';
    }
    return days.join(', ');
  };

  const renderRouteCard = ({ item }: { item: CommunityRoute }) => {
    const driver = MOCK_DRIVERS[item.driverId];
    const nextDeparture = item.schedule.find(s => s.isActive);

    return (
      <Card style={styles.routeCard} onPress={() => {
        setSelectedRoute(item);
        setShowReserveModal(true);
      }}>
        <View style={styles.routeHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{item.name}</Text>
            <Text style={styles.routeSchedule}>
              {getScheduleText(item.schedule)} • {nextDeparture?.departureTime}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>
              ${item.pricePerSeat.toLocaleString()}
            </Text>
            <Text style={styles.priceLabel}>por cupo</Text>
          </View>
        </View>

        <View style={styles.routeStops}>
          <View style={styles.stopRow}>
            <View style={[styles.stopDot, styles.originDot]} />
            <Text style={styles.stopText}>{item.origin.name || item.origin.address}</Text>
          </View>
          <View style={styles.stopConnector} />
          <View style={styles.stopRow}>
            <View style={[styles.stopDot, styles.destinationDot]} />
            <Text style={styles.stopText}>{item.destination.name || item.destination.address}</Text>
          </View>
        </View>

        <View style={styles.routeFooter}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>{driver?.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.driverName}>{driver?.name}</Text>
              <Text style={styles.driverRating}>⭐ {driver?.rating} • {driver?.trips} viajes</Text>
            </View>
          </View>
          <View style={styles.seatsInfo}>
            <Text style={styles.seatsAvailable}>{item.availableSeats}</Text>
            <Text style={styles.seatsLabel}>cupos</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rutas Comunitarias</Text>
        {isDriver && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>🚐</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Ahorra viajando en comunidad</Text>
          <Text style={styles.infoText}>
            Reserva cupos en rutas programadas y paga menos que un viaje individual
          </Text>
        </View>
      </View>

      {/* Lista de rutas */}
      <FlatList
        data={routes}
        renderItem={renderRouteCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛣️</Text>
            <Text style={styles.emptyTitle}>No hay rutas disponibles</Text>
            <Text style={styles.emptyText}>
              {isDriver
                ? 'Crea tu primera ruta comunitaria'
                : 'Pronto habrá rutas en tu zona'}
            </Text>
          </View>
        }
      />

      {/* Modal de reserva */}
      <Modal
        visible={showReserveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReserveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRoute && (
              <>
                <Text style={styles.modalTitle}>{selectedRoute.name}</Text>

                <View style={styles.routeDetailSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Origen</Text>
                    <Text style={styles.detailValue}>
                      {selectedRoute.origin.name || selectedRoute.origin.address}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Destino</Text>
                    <Text style={styles.detailValue}>
                      {selectedRoute.destination.name || selectedRoute.destination.address}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Horario</Text>
                    <Text style={styles.detailValue}>
                      {getScheduleText(selectedRoute.schedule)} • {selectedRoute.schedule[0]?.departureTime}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Precio por cupo</Text>
                    <Text style={styles.detailValue}>
                      ${selectedRoute.pricePerSeat.toLocaleString()} COP
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cupos disponibles</Text>
                    <Text style={styles.detailValue}>{selectedRoute.availableSeats}</Text>
                  </View>
                </View>

                {selectedRoute.description && (
                  <Text style={styles.routeDescription}>{selectedRoute.description}</Text>
                )}

                <View style={styles.seatsSelector}>
                  <Text style={styles.seatsSelectorLabel}>¿Cuántos cupos necesitas?</Text>
                  <View style={styles.seatsButtons}>
                    {[1, 2, 3, 4].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.seatButton,
                          seatsToReserve === num && styles.seatButtonSelected,
                          num > selectedRoute.availableSeats && styles.seatButtonDisabled,
                        ]}
                        onPress={() => setSeatsToReserve(num)}
                        disabled={num > selectedRoute.availableSeats}
                      >
                        <Text
                          style={[
                            styles.seatButtonText,
                            seatsToReserve === num && styles.seatButtonTextSelected,
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total a pagar</Text>
                  <Text style={styles.totalAmount}>
                    ${(selectedRoute.pricePerSeat * seatsToReserve).toLocaleString()} COP
                  </Text>
                </View>

                <View style={styles.savingsContainer}>
                  <Text style={styles.savingsIcon}>💰</Text>
                  <Text style={styles.savingsText}>
                    Ahorras hasta 40% vs un viaje individual
                  </Text>
                </View>

                <Button
                  title="Reservar cupo"
                  onPress={handleReserve}
                  fullWidth
                  size="lg"
                />

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowReserveModal(false);
                    setSelectedRoute(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal para crear ruta (solo conductores) */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Ruta Comunitaria</Text>
            <Text style={styles.modalSubtitle}>
              Publica una ruta recurrente y gana pasajeros fijos
            </Text>

            <ScrollView style={styles.formContainer}>
              <Input
                label="Nombre de la ruta"
                placeholder="Ej: Casa - Trabajo diario"
              />

              <Input
                label="Punto de origen"
                placeholder="¿Desde dónde sales?"
              />

              <Input
                label="Punto de destino"
                placeholder="¿A dónde vas?"
              />

              <Text style={styles.formLabel}>Días de la semana</Text>
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map((day, index) => (
                  <TouchableOpacity key={index} style={styles.dayButton}>
                    <Text style={styles.dayButtonText}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Hora de salida"
                placeholder="07:00"
                keyboardType="numbers-and-punctuation"
              />

              <Input
                label="Precio por cupo (COP)"
                placeholder="3500"
                keyboardType="numeric"
              />

              <Input
                label="Cupos disponibles"
                placeholder="4"
                keyboardType="numeric"
              />
            </ScrollView>

            <Button
              title="Publicar Ruta"
              onPress={() => {
                setShowCreateModal(false);
                Alert.alert('¡Ruta creada!', 'Tu ruta comunitaria ha sido publicada.');
              }}
              fullWidth
              size="lg"
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '15',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: SPACING.md,
    paddingTop: 0,
  },
  routeCard: {
    marginBottom: SPACING.md,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  routeSchedule: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  routeStops: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray[100],
    marginBottom: SPACING.md,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopDot: {
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
  stopConnector: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.gray[300],
    marginLeft: 4,
    marginVertical: 2,
  },
  stopText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  driverInitial: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  driverName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  driverRating: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  seatsInfo: {
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  seatsAvailable: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  seatsLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  routeDetailSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  },
  routeDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  seatsSelector: {
    marginBottom: SPACING.lg,
  },
  seatsSelectorLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  seatsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  seatButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  seatButtonDisabled: {
    opacity: 0.3,
  },
  seatButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  seatButtonTextSelected: {
    color: COLORS.white,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray[200],
    marginBottom: SPACING.md,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success + '15',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  savingsIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  savingsText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  formContainer: {
    maxHeight: 300,
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textPrimary,
  },
});
