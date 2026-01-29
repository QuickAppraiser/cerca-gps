// ==========================================
// CERCA - Pantalla de Creditos
// With real wallet service integration
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { walletService, Transaction } from '../../services/walletService';
import { formatCurrency, validateCreditAmount } from '../../utils/validation';
import { config } from '../../config/environment';

type CreditsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

const PAYMENT_METHODS = [
  { id: 'nequi', name: 'Nequi', icon: '💜', available: true },
  { id: 'daviplata', name: 'Daviplata', icon: '🔴', available: true },
  { id: 'pse', name: 'PSE', icon: '🏦', available: true },
  { id: 'credit_card', name: 'Tarjeta de Credito', icon: '💳', available: false },
];

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ navigation }) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountError, setAmountError] = useState<string | null>(null);

  const { user, updateCredits } = useAuthStore();

  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  // Load balance and transactions on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoadingBalance(true);
    setIsLoadingTransactions(true);

    // Load balance
    const balanceResult = await walletService.getBalance(user.id);
    if (balanceResult.success) {
      setBalance(balanceResult.data.balance);
      // Sync with auth store
      updateCredits(balanceResult.data.balance - (user.credits || 0));
    }
    setIsLoadingBalance(false);

    // Load transactions
    const txResult = await walletService.getTransactions(user.id, 5);
    if (txResult.success) {
      setTransactions(txResult.data);
    }
    setIsLoadingTransactions(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user?.id]);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomAmount(cleaned);
    setSelectedAmount(null);
    setAmountError(null);

    // Validate amount
    if (cleaned) {
      const validation = validateCreditAmount(parseInt(cleaned));
      if (!validation.isValid) {
        setAmountError(validation.error || null);
      }
    }
  };

  const handleRecharge = async () => {
    // Validate amount
    const validation = validateCreditAmount(finalAmount);
    if (!validation.isValid) {
      Alert.alert('Monto invalido', validation.error || 'El monto no es valido');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Metodo de pago', 'Selecciona un metodo de pago');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesion');
      return;
    }

    setIsLoading(true);

    try {
      const result = await walletService.recharge({
        userId: user.id,
        amount: finalAmount,
        paymentMethod: selectedPaymentMethod as any,
      });

      if (result.success) {
        // Update local state
        setBalance(result.data.newBalance);

        // Update auth store
        updateCredits(finalAmount);

        // Reload transactions
        const txResult = await walletService.getTransactions(user.id, 5);
        if (txResult.success) {
          setTransactions(txResult.data);
        }

        Alert.alert(
          'Recarga exitosa!',
          `Se han agregado ${formatCurrency(finalAmount)} a tu cuenta CERCA`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo procesar la recarga');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexion. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTransactionDate = (date: Date) => {
    const now = new Date();
    const txDate = new Date(date);
    const diffMs = now.getTime() - txDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Hace unos minutos';
    } else if (diffHours < 24) {
      return `Hoy, ${txDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 2) {
      return `Ayer, ${txDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `Hace ${Math.floor(diffDays)} dias`;
    } else {
      return txDate.toLocaleDateString('es-CO');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'recharge':
        return '💰';
      case 'trip_payment':
        return '🚗';
      case 'trip_earning':
        return '💵';
      case 'bonus':
        return '🎁';
      case 'refund':
        return '↩️';
      case 'withdrawal':
        return '🏧';
      default:
        return '📝';
    }
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
        <Text style={styles.headerTitle}>Creditos CERCA</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dev Mode Banner */}
        {config.isDevelopment && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>
              Modo desarrollo - Pagos simulados
            </Text>
          </View>
        )}

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Tu saldo actual</Text>
          {isLoadingBalance ? (
            <ActivityIndicator color={COLORS.white} style={styles.balanceLoader} />
          ) : (
            <Text style={styles.balanceAmount}>
              {formatCurrency(balance)}
            </Text>
          )}
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceInfoText}>
              Usa tus creditos para pagar viajes sin efectivo
            </Text>
          </View>
        </Card>

        {/* Quick Amounts */}
        <Text style={styles.sectionTitle}>Selecciona un monto</Text>
        <View style={styles.quickAmounts}>
          {QUICK_AMOUNTS.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.quickAmountButton,
                selectedAmount === amount && styles.quickAmountSelected,
              ]}
              onPress={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
                setAmountError(null);
              }}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  selectedAmount === amount && styles.quickAmountTextSelected,
                ]}
              >
                {formatCurrency(amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <View style={styles.customAmountContainer}>
          <Text style={styles.customAmountLabel}>O ingresa otro monto</Text>
          <View style={[
            styles.customAmountInputContainer,
            amountError && styles.customAmountInputError,
          ]}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.customAmountInput}
              placeholder="0"
              placeholderTextColor={COLORS.gray[400]}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={handleAmountChange}
            />
            <Text style={styles.currencySuffix}>COP</Text>
          </View>
          {amountError ? (
            <Text style={styles.errorText}>{amountError}</Text>
          ) : (
            <Text style={styles.minAmount}>Monto minimo: $5,000 - Maximo: $500,000</Text>
          )}
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Metodo de pago</Text>
        <View style={styles.paymentMethods}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === method.id && styles.paymentMethodSelected,
                !method.available && styles.paymentMethodDisabled,
              ]}
              onPress={() => method.available && setSelectedPaymentMethod(method.id)}
              disabled={!method.available}
            >
              <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
              <Text
                style={[
                  styles.paymentMethodName,
                  !method.available && styles.paymentMethodNameDisabled,
                ]}
              >
                {method.name}
              </Text>
              {!method.available && (
                <Text style={styles.comingSoon}>Proximamente</Text>
              )}
              {selectedPaymentMethod === method.id && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Ultimas transacciones</Text>
        <Card variant="outlined" style={styles.transactionsCard}>
          {isLoadingTransactions ? (
            <View style={styles.transactionsLoader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.noTransactions}>
              <Text style={styles.noTransactionsText}>
                Aun no tienes transacciones
              </Text>
            </View>
          ) : (
            <>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionItem}>
                  <Text style={styles.transactionIcon}>
                    {getTransactionIcon(tx.type)}
                  </Text>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>{tx.description}</Text>
                    <Text style={styles.transactionDate}>
                      {formatTransactionDate(tx.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      tx.amount > 0 ? styles.transactionPositive : styles.transactionNegative,
                    ]}
                  >
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('TransactionHistory')}
              >
                <Text style={styles.viewAllText}>Ver todo el historial</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>

        {/* Benefits */}
        <Card style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Beneficios de usar creditos</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💸</Text>
            <Text style={styles.benefitText}>Sin necesidad de efectivo</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Pagos mas rapidos</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎁</Text>
            <Text style={styles.benefitText}>Bonos exclusivos en recargas</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Recharge Button */}
      {finalAmount > 0 && !amountError && (
        <View style={styles.rechargeContainer}>
          <View style={styles.rechargeInfo}>
            <Text style={styles.rechargeLabel}>Total a recargar</Text>
            <Text style={styles.rechargeAmount}>
              {formatCurrency(finalAmount)}
            </Text>
          </View>
          <Button
            title={isLoading ? 'Procesando...' : 'Recargar ahora'}
            onPress={handleRecharge}
            loading={isLoading}
            disabled={!selectedPaymentMethod}
            fullWidth
            size="lg"
          />
        </View>
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
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  devBanner: {
    backgroundColor: COLORS.warning,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  devBannerText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
  },
  balanceLoader: {
    marginVertical: SPACING.md,
  },
  balanceAmount: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.white,
    marginVertical: SPACING.xs,
  },
  balanceInfo: {
    marginTop: SPACING.sm,
  },
  balanceInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  quickAmountSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  quickAmountText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  quickAmountTextSelected: {
    color: COLORS.primary,
  },
  customAmountContainer: {
    marginBottom: SPACING.lg,
  },
  customAmountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.md,
  },
  customAmountInputError: {
    borderColor: COLORS.error,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  customAmountInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  currencySuffix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  minAmount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  paymentMethods: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  paymentMethodDisabled: {
    opacity: 0.5,
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  paymentMethodNameDisabled: {
    color: COLORS.textSecondary,
  },
  comingSoon: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  checkMark: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  transactionsCard: {
    marginBottom: SPACING.lg,
    padding: 0,
    overflow: 'hidden',
  },
  transactionsLoader: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noTransactions: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noTransactionsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  transactionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  transactionPositive: {
    color: COLORS.success,
  },
  transactionNegative: {
    color: COLORS.error,
  },
  viewAllButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  benefitsCard: {
    backgroundColor: COLORS.primaryLight + '15',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING.xl,
  },
  benefitsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  benefitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  rechargeContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  rechargeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  rechargeLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  rechargeAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
