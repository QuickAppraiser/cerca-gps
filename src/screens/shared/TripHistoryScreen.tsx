// ==========================================
// CERCA - Trip History Screen
// Shows past trips for passengers and drivers
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { tripService } from '../../services/tripService';
import { formatCurrency, formatDistance, formatDuration } from '../../utils/validation';

type TripHistoryScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface Trip {
  id: string;
  origin_address?: string;
  destination_address?: string;
  status: string;
  estimated_price?: number;
  final_price?: number;
  estimated_distance?: number;
  estimated_duration?: number;
  created_at: string;
  completed_at?: string;
  rating_for_driver?: number;
  rating_for_passenger?: number;
  driver?: {
    name: string;
    vehicle?: string;
    plate?: string;
  };
  passenger?: {
    name: string;
  };
}

export const TripHistoryScreen: React.FC<TripHistoryScreenProps> = ({
  navigation,
}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const { user } = useAuthStore();
  const userRole = user?.role || 'passenger';

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const loadTrips = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const result = await tripService.getTripHistory(user.id, userRole as 'passenger' | 'driver', 50);
      if (result.success) {
        let filteredTrips = result.data;
        if (filter === 'completed') {
          filteredTrips = result.data.filter((t: Trip) => t.status === 'completed');
        } else if (filter === 'cancelled') {
          filteredTrips = result.data.filter((t: Trip) => t.status === 'cancelled');
        }
        setTrips(filteredTrips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTrips();
    setIsRefreshing(false);
  }, [user?.id, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoy, ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ayer, ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
      return `${days[date.getDay()]}, ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Completado', color: COLORS.success };
      case 'cancelled':
        return { label: 'Cancelado', color: COLORS.error };
      case 'in_progress':
        return { label: 'En curso', color: COLORS.info };
      default:
        return { label: status, color: COLORS.gray[500] };
    }
  };

  const renderTripItem = ({ item: trip }: { item: Trip }) => {
    const statusBadge = getStatusBadge(trip.status);
    const price = trip.final_price || trip.estimated_price || 0;
    const rating = userRole === 'passenger' ? trip.rating_for_driver : trip.rating_for_passenger;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
        activeOpacity={0.7}
      >
        <Card style={styles.tripCard}>
          {/* Header */}
          <View style={styles.tripHeader}>
            <Text style={styles.tripDate}>{formatDate(trip.created_at)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '20' }]}>
              <Text style={[styles.statusText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Locations */}
          <View style={styles.locations}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.originDot]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {trip.origin_address || 'Origen'}
              </Text>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, styles.destinationDot]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {trip.destination_address || 'Destino'}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.tripFooter}>
            {/* Driver/Passenger Info */}
            {userRole === 'passenger' && trip.driver && (
              <View style={styles.personInfo}>
                <Text style={styles.personIcon}>🚗</Text>
                <Text style={styles.personName}>{trip.driver.name}</Text>
                {trip.driver.plate && (
                  <Text style={styles.plate}>{trip.driver.plate}</Text>
                )}
              </View>
            )}
            {userRole === 'driver' && trip.passenger && (
              <View style={styles.personInfo}>
                <Text style={styles.personIcon}>👤</Text>
                <Text style={styles.personName}>{trip.passenger.name}</Text>
              </View>
            )}

            {/* Price and Rating */}
            <View style={styles.tripMeta}>
              {rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {rating}</Text>
                </View>
              )}
              <Text style={[
                styles.tripPrice,
                trip.status === 'cancelled' && styles.tripPriceCancelled,
              ]}>
                {formatCurrency(price)}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🚗</Text>
      <Text style={styles.emptyTitle}>Sin viajes</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? 'Aun no has realizado ningun viaje'
          : filter === 'completed'
          ? 'No tienes viajes completados'
          : 'No tienes viajes cancelados'
        }
      </Text>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filters}>
      {(['all', 'completed', 'cancelled'] as const).map((f) => (
        <TouchableOpacity
          key={f}
          style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          onPress={() => setFilter(f)}
        >
          <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
            {f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Cancelados'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <Text style={styles.headerTitle}>Historial de viajes</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filters */}
      {renderFilters()}

      {/* Trip List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  placeholder: {
    width: 40,
  },
  filters: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  tripCard: {
    marginBottom: SPACING.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tripDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  locations: {
    marginBottom: SPACING.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  locationLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.gray[300],
    marginLeft: 4,
    marginVertical: 4,
  },
  locationText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personIcon: {
    fontSize: 20,
    marginRight: SPACING.xs,
  },
  personName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  plate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratingBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  ratingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
  tripPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tripPriceCancelled: {
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
