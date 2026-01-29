// ==========================================
// CERCA - Driver Earnings Screen
// Detailed earnings view and withdrawal management
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils';

const { width } = Dimensions.get('window');

// ==========================================
// Types
// ==========================================

interface EarningsOverview {
  availableBalance: number;
  pendingBalance: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalTrips: number;
  averagePerTrip: number;
  rating: number;
}

interface DailyEarnings {
  date: string;
  trips: number;
  earnings: number;
  tips: number;
  bonuses: number;
}

interface Transaction {
  id: string;
  type: 'trip' | 'tip' | 'bonus' | 'withdrawal' | 'adjustment';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  tripId?: string;
}

// ==========================================
// Mock Data
// ==========================================

const MOCK_OVERVIEW: EarningsOverview = {
  availableBalance: 285000,
  pendingBalance: 45000,
  todayEarnings: 78500,
  weekEarnings: 425000,
  monthEarnings: 1850000,
  totalTrips: 156,
  averagePerTrip: 11859,
  rating: 4.8,
};

const MOCK_DAILY_EARNINGS: DailyEarnings[] = [
  { date: '2024-01-20', trips: 12, earnings: 78500, tips: 8000, bonuses: 5000 },
  { date: '2024-01-19', trips: 15, earnings: 95000, tips: 12000, bonuses: 0 },
  { date: '2024-01-18', trips: 8, earnings: 52000, tips: 5000, bonuses: 10000 },
  { date: '2024-01-17', trips: 11, earnings: 71500, tips: 7500, bonuses: 0 },
  { date: '2024-01-16', trips: 14, earnings: 89000, tips: 9500, bonuses: 0 },
  { date: '2024-01-15', trips: 10, earnings: 65000, tips: 6000, bonuses: 15000 },
  { date: '2024-01-14', trips: 6, earnings: 39000, tips: 4000, bonuses: 0 },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'trip', amount: 8500, description: 'Viaje a Centro Comercial', date: '2024-01-20T15:30:00', status: 'completed', tripId: 'trip123' },
  { id: '2', type: 'tip', amount: 2000, description: 'Propina del pasajero', date: '2024-01-20T15:32:00', status: 'completed' },
  { id: '3', type: 'trip', amount: 12000, description: 'Viaje a Aeropuerto', date: '2024-01-20T14:00:00', status: 'completed', tripId: 'trip124' },
  { id: '4', type: 'bonus', amount: 5000, description: 'Bono hora pico', date: '2024-01-20T13:00:00', status: 'completed' },
  { id: '5', type: 'trip', amount: 6500, description: 'Viaje a Universidad', date: '2024-01-20T11:30:00', status: 'completed', tripId: 'trip125' },
  { id: '6', type: 'withdrawal', amount: -150000, description: 'Retiro a cuenta bancaria', date: '2024-01-19T18:00:00', status: 'completed' },
  { id: '7', type: 'trip', amount: 9500, description: 'Viaje nocturno', date: '2024-01-19T22:30:00', status: 'completed', tripId: 'trip126' },
];

const COMMISSION_RATE = 0.15; // 15% commission

// ==========================================
// Components
// ==========================================

const BalanceCard: React.FC<{
  overview: EarningsOverview;
  onWithdraw: () => void;
}> = ({ overview, onWithdraw }) => (
  <View style={styles.balanceCard}>
    <View style={styles.balanceHeader}>
      <Text style={styles.balanceLabel}>Saldo disponible</Text>
      <Text style={styles.balanceAmount}>{formatCurrency(overview.availableBalance)}</Text>
      {overview.pendingBalance > 0 && (
        <Text style={styles.pendingText}>
          + {formatCurrency(overview.pendingBalance)} pendiente
        </Text>
      )}
    </View>
    <TouchableOpacity style={styles.withdrawButton} onPress={onWithdraw}>
      <Text style={styles.withdrawButtonText}>Retirar fondos</Text>
    </TouchableOpacity>
  </View>
);

const StatsGrid: React.FC<{ overview: EarningsOverview }> = ({ overview }) => (
  <View style={styles.statsGrid}>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Hoy</Text>
      <Text style={styles.statValue}>{formatCurrency(overview.todayEarnings)}</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Esta semana</Text>
      <Text style={styles.statValue}>{formatCurrency(overview.weekEarnings)}</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Este mes</Text>
      <Text style={styles.statValue}>{formatCurrency(overview.monthEarnings)}</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Promedio/viaje</Text>
      <Text style={styles.statValue}>{formatCurrency(overview.averagePerTrip)}</Text>
    </View>
  </View>
);

const WeeklyChart: React.FC<{ data: DailyEarnings[] }> = ({ data }) => {
  const maxEarnings = Math.max(...data.map(d => d.earnings));
  const chartWidth = width - SPACING.md * 4;
  const barWidth = (chartWidth / 7) - 8;

  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { weekday: 'short' }).slice(0, 3);
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Ganancias ultimos 7 dias</Text>
      <View style={styles.chartBars}>
        {data.slice(0, 7).reverse().map((day, index) => {
          const barHeight = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0;
          const isToday = index === 6;

          return (
            <View key={day.date} style={styles.barContainer}>
              <Text style={styles.barValue}>
                {(day.earnings / 1000).toFixed(0)}k
              </Text>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    { height: `${barHeight}%` },
                    isToday && styles.barToday,
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                {formatDay(day.date)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const getTypeConfig = () => {
    switch (transaction.type) {
      case 'trip':
        return { icon: '🚗', color: COLORS.success };
      case 'tip':
        return { icon: '💝', color: COLORS.primary };
      case 'bonus':
        return { icon: '🎁', color: COLORS.warning };
      case 'withdrawal':
        return { icon: '🏦', color: COLORS.error };
      case 'adjustment':
        return { icon: '⚙️', color: COLORS.textSecondary };
      default:
        return { icon: '💰', color: COLORS.text };
    }
  };

  const config = getTypeConfig();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: config.color + '20' }]}>
        <Text style={styles.transactionEmoji}>{config.icon}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDesc}>{transaction.description}</Text>
        <Text style={styles.transactionTime}>{formatTime(transaction.date)}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        transaction.amount < 0 && styles.transactionAmountNegative,
      ]}>
        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
};

// ==========================================
// Main Component
// ==========================================

export const DriverEarningsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<EarningsOverview | null>(null);
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      // In production, fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));
      setOverview(MOCK_OVERVIEW);
      setDailyEarnings(MOCK_DAILY_EARNINGS);
      setTransactions(MOCK_TRANSACTIONS);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    if (!overview || overview.availableBalance < 50000) {
      Alert.alert(
        'Saldo insuficiente',
        'Necesitas al menos $50,000 para realizar un retiro'
      );
      return;
    }

    Alert.alert(
      'Retirar fondos',
      `Retiro de ${formatCurrency(overview.availableBalance)} a tu cuenta bancaria registrada.\n\nEl deposito se realizara en 24-48 horas habiles.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar retiro',
          onPress: () => {
            Alert.alert(
              'Retiro solicitado',
              'Tu retiro ha sido procesado. Recibiras el deposito en 24-48 horas.'
            );
            setOverview(prev => prev ? { ...prev, availableBalance: 0, pendingBalance: prev.availableBalance } : null);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando ganancias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('es-CO', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Balance Card */}
        {overview && (
          <BalanceCard overview={overview} onWithdraw={handleWithdraw} />
        )}

        {/* Stats Grid */}
        {overview && <StatsGrid overview={overview} />}

        {/* Weekly Chart */}
        <WeeklyChart data={dailyEarnings} />

        {/* Commission Info */}
        <View style={styles.commissionInfo}>
          <Text style={styles.commissionIcon}>ℹ️</Text>
          <Text style={styles.commissionText}>
            Comision CERCA: {COMMISSION_RATE * 100}% por viaje. Las ganancias mostradas ya tienen la comision descontada.
          </Text>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Movimientos recientes</Text>
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <View key={date} style={styles.transactionGroup}>
              <Text style={styles.transactionDate}>{date}</Text>
              <View style={styles.transactionsList}>
                {items.map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Consejos para ganar mas</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>⭐</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Mantén una alta calificación</Text>
              <Text style={styles.tipText}>
                Los conductores con 4.8+ reciben más viajes y propinas
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🕐</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Conduce en horas pico</Text>
              <Text style={styles.tipText}>
                7-9am y 5-8pm tienen más demanda y bonos adicionales
              </Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📍</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Conoce las zonas calientes</Text>
              <Text style={styles.tipText}>
                Centro, Universidad del Quindío y centros comerciales
              </Text>
            </View>
          </View>
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
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  balanceHeader: {
    marginBottom: SPACING.md,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + '80',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  pendingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + '80',
    marginTop: SPACING.xs,
  },
  withdrawButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  chartTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  barWrapper: {
    width: '80%',
    height: 80,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: COLORS.primary + '40',
    borderRadius: 4,
  },
  barToday: {
    backgroundColor: COLORS.primary,
  },
  barLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textTransform: 'capitalize',
  },
  barLabelToday: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  commissionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  commissionIcon: {
    marginRight: SPACING.sm,
  },
  commissionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  transactionsSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  transactionGroup: {
    marginBottom: SPACING.md,
  },
  transactionDate: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'capitalize',
  },
  transactionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionEmoji: {
    fontSize: FONT_SIZES.lg,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  transactionTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  transactionAmountNegative: {
    color: COLORS.error,
  },
  tipsSection: {
    marginBottom: SPACING.lg,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default DriverEarningsScreen;
