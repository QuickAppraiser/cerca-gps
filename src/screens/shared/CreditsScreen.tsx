// ==========================================
// CERCA - Pantalla de Créditos
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

type CreditsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

const PAYMENT_METHODS = [
  { id: 'nequi', name: 'Nequi', icon: '💜', available: true },
  { id: 'daviplata', name: 'Daviplata', icon: '🔴', available: true },
  { id: 'pse', name: 'PSE', icon: '🏦', available: true },
  { id: 'credit_card', name: 'Tarjeta de Crédito', icon: '💳', available: false },
];

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ navigation }) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, updateCredits } = useAuthStore();

  const finalAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);

  const handleRecharge = () => {
    if (!finalAmount || finalAmount < 5000) {
      Alert.alert('Monto inválido', 'El monto mínimo de recarga es $5,000 COP');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Método de pago', 'Selecciona un método de pago');
      return;
    }

    setIsLoading(true);

    // Simular proceso de pago
    setTimeout(() => {
      setIsLoading(false);
      updateCredits(finalAmount);
      Alert.alert(
        '¡Recarga exitosa!',
        `Se han agregado $${finalAmount.toLocaleString()} COP a tu cuenta CERCA`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 2000);
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
        <Text style={styles.headerTitle}>Créditos CERCA</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saldo actual */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Tu saldo actual</Text>
          <Text style={styles.balanceAmount}>
            ${(user?.credits || 0).toLocaleString()} COP
          </Text>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceInfoText}>
              Usa tus créditos para pagar viajes sin efectivo
            </Text>
          </View>
        </Card>

        {/* Montos rápidos */}
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
              }}
            >
              <Text
                style={[
                  styles.quickAmountText,
                  selectedAmount === amount && styles.quickAmountTextSelected,
                ]}
              >
                ${amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Monto personalizado */}
        <View style={styles.customAmountContainer}>
          <Text style={styles.customAmountLabel}>O ingresa otro monto</Text>
          <View style={styles.customAmountInputContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.customAmountInput}
              placeholder="0"
              placeholderTextColor={COLORS.gray[400]}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text.replace(/[^0-9]/g, ''));
                setSelectedAmount(null);
              }}
            />
            <Text style={styles.currencySuffix}>COP</Text>
          </View>
          <Text style={styles.minAmount}>Monto mínimo: $5,000 COP</Text>
        </View>

        {/* Métodos de pago */}
        <Text style={styles.sectionTitle}>Método de pago</Text>
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
                <Text style={styles.comingSoon}>Próximamente</Text>
              )}
              {selectedPaymentMethod === method.id && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Historial de transacciones */}
        <Text style={styles.sectionTitle}>Últimas transacciones</Text>
        <Card variant="outlined" style={styles.transactionsCard}>
          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>Viaje a Terminal</Text>
              <Text style={styles.transactionDate}>Hoy, 2:30 PM</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.transactionNegative]}>
              -$8,500
            </Text>
          </View>
          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>Recarga Nequi</Text>
              <Text style={styles.transactionDate}>Ayer, 10:00 AM</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.transactionPositive]}>
              +$50,000
            </Text>
          </View>
          <View style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>Viaje a Centro</Text>
              <Text style={styles.transactionDate}>Hace 2 días</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.transactionNegative]}>
              -$6,200
            </Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver todo el historial</Text>
          </TouchableOpacity>
        </Card>

        {/* Beneficios */}
        <Card style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Beneficios de usar créditos</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>💸</Text>
            <Text style={styles.benefitText}>Sin necesidad de efectivo</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Pagos más rápidos</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎁</Text>
            <Text style={styles.benefitText}>Bonos exclusivos en recargas</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Botón de recarga */}
      {finalAmount > 0 && (
        <View style={styles.rechargeContainer}>
          <View style={styles.rechargeInfo}>
            <Text style={styles.rechargeLabel}>Total a recargar</Text>
            <Text style={styles.rechargeAmount}>
              ${finalAmount.toLocaleString()} COP
            </Text>
          </View>
          <Button
            title={isLoading ? 'Procesando...' : 'Recargar ahora'}
            onPress={handleRecharge}
            loading={isLoading}
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
  balanceCard: {
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    opacity: 0.8,
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
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
