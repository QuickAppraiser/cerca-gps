// ==========================================
// CERCA - Tokens Screen
// View and manage CERCA tokens/points
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING, TOKEN_CONFIG } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/common/Card';

// ==========================================
// Types
// ==========================================

interface TokensScreenProps {
  navigation: any;
}

interface TokenActivity {
  id: string;
  type: 'earned' | 'redeemed';
  amount: number;
  description: string;
  date: Date;
}

// ==========================================
// Mock Data
// ==========================================

const MOCK_TOKEN_HISTORY: TokenActivity[] = [
  { id: '1', type: 'earned', amount: 10, description: 'Viaje completado', date: new Date() },
  { id: '2', type: 'earned', amount: 5, description: 'Calificacion 5 estrellas', date: new Date(Date.now() - 86400000) },
  { id: '3', type: 'redeemed', amount: -50, description: 'Descuento en viaje', date: new Date(Date.now() - 172800000) },
  { id: '4', type: 'earned', amount: 15, description: 'Reporte de trafico validado', date: new Date(Date.now() - 259200000) },
  { id: '5', type: 'earned', amount: 10, description: 'Viaje completado', date: new Date(Date.now() - 345600000) },
];

const REWARDS = [
  { id: 'discount_5', tokens: 50, value: 'Q5 descuento', icon: '🎫' },
  { id: 'discount_10', tokens: 100, value: 'Q10 descuento', icon: '🎟️' },
  { id: 'free_ride', tokens: 250, value: 'Viaje gratis (hasta Q25)', icon: '🚗' },
  { id: 'priority', tokens: 150, value: 'Prioridad por 1 hora', icon: '⚡' },
];

// ==========================================
// Main Component
// ==========================================

export const TokensScreen: React.FC<TokensScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [tokenBalance, setTokenBalance] = useState(user?.tokens || 125);
  const [tokenHistory, setTokenHistory] = useState<TokenActivity[]>(MOCK_TOKEN_HISTORY);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleRedeemReward = (reward: typeof REWARDS[0]) => {
    if (tokenBalance >= reward.tokens) {
      setTokenBalance(prev => prev - reward.tokens);
      setTokenHistory(prev => [
        {
          id: `redeem_${Date.now()}`,
          type: 'redeemed',
          amount: -reward.tokens,
          description: `Canjeado: ${reward.value}`,
          date: new Date(),
        },
        ...prev,
      ]);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} dias`;
    return date.toLocaleDateString('es-GT');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tokens CERCA</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Tu Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.tokenIcon}>🪙</Text>
            <Text style={styles.balanceValue}>{tokenBalance}</Text>
            <Text style={styles.balanceUnit}>tokens</Text>
          </View>
          <Text style={styles.balanceEquivalent}>
            = Q{((tokenBalance / TOKEN_CONFIG.discountConversion) * 10).toFixed(2)} en descuentos
          </Text>
        </Card>

        {/* How to Earn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como ganar tokens</Text>
          <View style={styles.earnGrid}>
            <View style={styles.earnItem}>
              <Text style={styles.earnIcon}>🚗</Text>
              <Text style={styles.earnAmount}>+{TOKEN_CONFIG.perTrip}</Text>
              <Text style={styles.earnLabel}>Por viaje</Text>
            </View>
            <View style={styles.earnItem}>
              <Text style={styles.earnIcon}>⭐</Text>
              <Text style={styles.earnAmount}>+{TOKEN_CONFIG.per5StarRating}</Text>
              <Text style={styles.earnLabel}>5 estrellas</Text>
            </View>
            <View style={styles.earnItem}>
              <Text style={styles.earnIcon}>📍</Text>
              <Text style={styles.earnAmount}>+{TOKEN_CONFIG.perValidReport}</Text>
              <Text style={styles.earnLabel}>Reporte valido</Text>
            </View>
            <View style={styles.earnItem}>
              <Text style={styles.earnIcon}>🆘</Text>
              <Text style={styles.earnAmount}>+{TOKEN_CONFIG.perEmergencyHelp}</Text>
              <Text style={styles.earnLabel}>Ayuda emergencia</Text>
            </View>
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Canjear recompensas</Text>
          {REWARDS.map((reward) => {
            const canRedeem = tokenBalance >= reward.tokens;
            return (
              <TouchableOpacity
                key={reward.id}
                style={[styles.rewardCard, !canRedeem && styles.rewardCardDisabled]}
                onPress={() => canRedeem && handleRedeemReward(reward)}
                disabled={!canRedeem}
              >
                <Text style={styles.rewardIcon}>{reward.icon}</Text>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardValue}>{reward.value}</Text>
                  <Text style={styles.rewardCost}>{reward.tokens} tokens</Text>
                </View>
                <View style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}>
                  <Text style={[styles.redeemButtonText, !canRedeem && styles.redeemButtonTextDisabled]}>
                    {canRedeem ? 'Canjear' : 'Insuficiente'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial</Text>
          <Card style={styles.historyCard}>
            {tokenHistory.map((activity, index) => (
              <View
                key={activity.id}
                style={[
                  styles.historyItem,
                  index < tokenHistory.length - 1 && styles.historyItemBorder,
                ]}
              >
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDescription}>{activity.description}</Text>
                  <Text style={styles.historyDate}>{formatDate(activity.date)}</Text>
                </View>
                <Text
                  style={[
                    styles.historyAmount,
                    activity.type === 'earned' ? styles.earned : styles.redeemed,
                  ]}
                >
                  {activity.amount > 0 ? '+' : ''}{activity.amount}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Los tokens CERCA no tienen valor monetario y no pueden ser transferidos.
            Solo pueden canjearse por descuentos y beneficios dentro de la app.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: SPACING.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tokenIcon: {
    fontSize: 40,
    marginRight: SPACING.sm,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  balanceUnit: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    opacity: 0.8,
    marginLeft: SPACING.sm,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  balanceEquivalent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.7,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  earnItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  earnIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  earnAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  earnLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rewardCost: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  redeemButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
  },
  redeemButtonTextDisabled: {
    color: COLORS.gray[500],
  },
  historyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  historyLeft: {
    flex: 1,
  },
  historyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  earned: {
    color: COLORS.success,
  },
  redeemed: {
    color: COLORS.error,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
