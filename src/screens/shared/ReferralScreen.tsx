// ==========================================
// CERCA - Referral Screen
// Invite friends and earn rewards
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
  RefreshControl,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils';

// ==========================================
// Types
// ==========================================

interface ReferralStats {
  referralCode: string;
  totalReferred: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  availableBalance: number;
}

interface ReferralHistory {
  id: string;
  referredName: string;
  status: 'pending' | 'completed' | 'expired';
  reward: number;
  date: string;
}

// ==========================================
// Mock Data
// ==========================================

const MOCK_STATS: ReferralStats = {
  referralCode: 'CERCA-JUAN123',
  totalReferred: 8,
  completedReferrals: 5,
  pendingReferrals: 3,
  totalEarnings: 50000,
  availableBalance: 20000,
};

const MOCK_HISTORY: ReferralHistory[] = [
  {
    id: '1',
    referredName: 'Maria G.',
    status: 'completed',
    reward: 10000,
    date: '2024-01-15',
  },
  {
    id: '2',
    referredName: 'Carlos P.',
    status: 'completed',
    reward: 10000,
    date: '2024-01-10',
  },
  {
    id: '3',
    referredName: 'Ana R.',
    status: 'pending',
    reward: 10000,
    date: '2024-01-18',
  },
  {
    id: '4',
    referredName: 'Luis M.',
    status: 'completed',
    reward: 10000,
    date: '2024-01-05',
  },
  {
    id: '5',
    referredName: 'Sofia V.',
    status: 'expired',
    reward: 10000,
    date: '2023-12-20',
  },
];

const REFERRAL_REWARD = 10000; // COP for each successful referral
const REFERRED_REWARD = 5000; // COP for the person being referred

// ==========================================
// Components
// ==========================================

const StatsCard: React.FC<{ stats: ReferralStats }> = ({ stats }) => (
  <View style={styles.statsCard}>
    <View style={styles.statsHeader}>
      <Text style={styles.statsTitle}>Tus ganancias</Text>
      <Text style={styles.statsBalance}>{formatCurrency(stats.availableBalance)}</Text>
      <Text style={styles.statsSubtitle}>Disponible para usar</Text>
    </View>
    <View style={styles.statsGrid}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats.totalReferred}</Text>
        <Text style={styles.statLabel}>Invitados</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats.completedReferrals}</Text>
        <Text style={styles.statLabel}>Completados</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{formatCurrency(stats.totalEarnings)}</Text>
        <Text style={styles.statLabel}>Total ganado</Text>
      </View>
    </View>
  </View>
);

const ReferralCodeCard: React.FC<{
  code: string;
  onShare: () => void;
  onCopy: () => void;
}> = ({ code, onShare, onCopy }) => (
  <View style={styles.codeCard}>
    <Text style={styles.codeTitle}>Tu codigo de referido</Text>
    <View style={styles.codeContainer}>
      <Text style={styles.codeText}>{code}</Text>
    </View>
    <View style={styles.codeActions}>
      <TouchableOpacity style={styles.copyButton} onPress={onCopy}>
        <Text style={styles.copyIcon}>📋</Text>
        <Text style={styles.copyText}>Copiar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Text style={styles.shareIcon}>📤</Text>
        <Text style={styles.shareText}>Compartir</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const HistoryItem: React.FC<{ item: ReferralHistory }> = ({ item }) => {
  const getStatusConfig = () => {
    switch (item.status) {
      case 'completed':
        return { color: COLORS.success, label: 'Completado', icon: '✓' };
      case 'pending':
        return { color: COLORS.warning, label: 'Pendiente', icon: '⏳' };
      case 'expired':
        return { color: COLORS.error, label: 'Expirado', icon: '✕' };
      default:
        return { color: COLORS.textSecondary, label: 'Desconocido', icon: '?' };
    }
  };

  const statusConfig = getStatusConfig();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyAvatar}>
        <Text style={styles.historyInitial}>
          {item.referredName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyName}>{item.referredName}</Text>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={[styles.historyReward, item.status !== 'completed' && styles.historyRewardInactive]}>
          {item.status === 'completed' ? '+' : ''}{formatCurrency(item.reward)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.icon} {statusConfig.label}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// Main Component
// ==========================================

export const ReferralScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      // In production, fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate user-specific referral code
      const userName = user?.name?.split(' ')[0]?.toUpperCase() || 'USER';
      const mockStats = {
        ...MOCK_STATS,
        referralCode: `CERCA-${userName}${Math.floor(Math.random() * 1000)}`,
      };

      setStats(mockStats);
      setHistory(MOCK_HISTORY);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    if (!stats) return;

    try {
      await Share.share({
        message: `Usa mi codigo ${stats.referralCode} en CERCA y obtén ${formatCurrency(REFERRED_REWARD)} de descuento en tu primer viaje! Descarga la app: https://cercaapp.co/download`,
        title: 'Invitacion a CERCA',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopy = async () => {
    if (!stats) return;

    try {
      await Clipboard.setString(stats.referralCode);
      Alert.alert('Copiado!', 'Tu codigo de referido se ha copiado al portapapeles');
    } catch (error) {
      // Fallback for web
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(stats.referralCode);
        Alert.alert('Copiado!', 'Tu codigo de referido se ha copiado');
      }
    }
  };

  const handleWithdraw = () => {
    if (!stats || stats.availableBalance < 10000) {
      Alert.alert(
        'Saldo insuficiente',
        'Necesitas al menos $10,000 para transferir a tu billetera'
      );
      return;
    }

    Alert.alert(
      'Transferir a billetera',
      `Se transferiran ${formatCurrency(stats.availableBalance)} a tu billetera CERCA`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          onPress: () => {
            Alert.alert('Transferencia exitosa', 'El saldo se ha agregado a tu billetera');
            setStats(prev => prev ? { ...prev, availableBalance: 0 } : null);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🎁</Text>
          <Text style={styles.heroTitle}>Invita amigos, gana recompensas</Text>
          <Text style={styles.heroSubtitle}>
            Gana {formatCurrency(REFERRAL_REWARD)} por cada amigo que complete su primer viaje
          </Text>
        </View>

        {/* Stats Card */}
        {stats && <StatsCard stats={stats} />}

        {/* Withdraw Button */}
        {stats && stats.availableBalance > 0 && (
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <Text style={styles.withdrawButtonText}>
              Transferir {formatCurrency(stats.availableBalance)} a mi billetera
            </Text>
          </TouchableOpacity>
        )}

        {/* Referral Code */}
        {stats && (
          <ReferralCodeCard
            code={stats.referralCode}
            onShare={handleShare}
            onCopy={handleCopy}
          />
        )}

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como funciona</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>📤</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>1. Comparte tu codigo</Text>
                <Text style={styles.stepText}>
                  Envia tu codigo a amigos y familiares
                </Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>👋</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>2. Tu amigo se registra</Text>
                <Text style={styles.stepText}>
                  Usan tu codigo al crear su cuenta
                </Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>🚗</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>3. Completan su primer viaje</Text>
                <Text style={styles.stepText}>
                  Tu amigo recibe {formatCurrency(REFERRED_REWARD)} de descuento
                </Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>💰</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>4. Tu ganas!</Text>
                <Text style={styles.stepText}>
                  Recibes {formatCurrency(REFERRAL_REWARD)} en tu cuenta
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Referral History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de referidos</Text>
          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.map(item => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>
                Aun no has referido a nadie. Comparte tu codigo para empezar!
              </Text>
            </View>
          )}
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terminos y condiciones</Text>
          <Text style={styles.termsText}>
            • El referido debe ser un usuario nuevo de CERCA{'\n'}
            • La recompensa se acredita despues de que el referido complete su primer viaje{'\n'}
            • El codigo de referido expira 30 dias despues de registrarse{'\n'}
            • CERCA se reserva el derecho de modificar el programa
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statsTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + '80',
    marginBottom: SPACING.xs,
  },
  statsBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  statsSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + '80',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white + '10',
    borderRadius: 12,
    padding: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white + '80',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.white + '30',
  },
  withdrawButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  codeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  codeTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  codeContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  copyIcon: {
    marginRight: SPACING.xs,
  },
  copyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  shareIcon: {
    marginRight: SPACING.xs,
  },
  shareText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  stepsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  stepText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.primary + '30',
    marginLeft: 23,
    marginVertical: SPACING.xs,
  },
  historyList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  historyInitial: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyReward: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  historyRewardInactive: {
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  termsSection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
  },
  termsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  termsText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default ReferralScreen;
