// ==========================================
// CERCA - Promo Codes Screen
// View and apply promotional codes
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import promoService, { PromoCode, formatPromoDiscount } from '../../services/promoService';

// ==========================================
// Components
// ==========================================

const PromoCodeCard: React.FC<{
  promo: PromoCode;
  onCopy: () => void;
}> = ({ promo, onCopy }) => {
  const isExpiringSoon = () => {
    const validUntil = new Date(promo.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

  const getTypeIcon = () => {
    switch (promo.type) {
      case 'percentage':
        return '%';
      case 'fixed':
        return '$';
      case 'free_trip':
        return '🎁';
      default:
        return '🎟️';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.promoCard}>
      <View style={styles.promoHeader}>
        <View style={styles.promoIconContainer}>
          <Text style={styles.promoIcon}>{getTypeIcon()}</Text>
        </View>
        <View style={styles.promoInfo}>
          <Text style={styles.promoDiscount}>{formatPromoDiscount(promo)}</Text>
          <Text style={styles.promoDescription}>{promo.description}</Text>
        </View>
        {isExpiringSoon() && (
          <View style={styles.expiringBadge}>
            <Text style={styles.expiringText}>Vence pronto</Text>
          </View>
        )}
      </View>

      <View style={styles.promoCodeContainer}>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>CODIGO</Text>
          <Text style={styles.codeText}>{promo.code}</Text>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={onCopy}>
          <Text style={styles.copyButtonText}>Copiar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.promoDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valido hasta:</Text>
          <Text style={styles.detailValue}>{formatDate(promo.validUntil)}</Text>
        </View>
        {promo.minTripValue && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Minimo:</Text>
            <Text style={styles.detailValue}>
              ${promo.minTripValue.toLocaleString()}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Usos restantes:</Text>
          <Text style={styles.detailValue}>
            {promo.maxUses - promo.currentUses} disponibles
          </Text>
        </View>
      </View>

      {promo.terms && (
        <Text style={styles.promoTerms}>{promo.terms}</Text>
      )}
    </View>
  );
};

// ==========================================
// Main Component
// ==========================================

export const PromoScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [promoCode, setPromoCode] = useState('');
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    if (!user?.id) return;
    try {
      const promos = await promoService.getAvailablePromoCodes(user.id);
      setAvailablePromos(promos);
    } catch (error) {
      console.error('Error loading promo codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPromoCodes();
    setRefreshing(false);
  };

  const handleApplyCode = async () => {
    if (!promoCode.trim()) {
      Alert.alert('Error', 'Ingresa un codigo promocional');
      return;
    }

    if (!user?.id) return;

    setIsApplying(true);
    try {
      // Just validate the code (actual application happens at trip confirmation)
      const result = await promoService.applyPromoCode(
        promoCode.trim(),
        user.id,
        20000, // Sample trip value for validation
        false,
        0
      );

      if (result.success) {
        Alert.alert(
          'Codigo valido!',
          `${result.promoCode?.description}\n\nEste codigo se aplicara automaticamente en tu proximo viaje.`,
          [{ text: 'Entendido' }]
        );
        setPromoCode('');
        await loadPromoCodes();
      } else {
        Alert.alert('Codigo no valido', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el codigo');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setString(code);
      Alert.alert('Copiado!', `El codigo ${code} se ha copiado al portapapeles`);
    } catch (error) {
      // Fallback for web
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(code);
        Alert.alert('Copiado!', `El codigo ${code} se ha copiado`);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando promociones...</Text>
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
        {/* Enter Code Section */}
        <View style={styles.enterCodeSection}>
          <Text style={styles.sectionTitle}>Tienes un codigo?</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="Ingresa tu codigo"
              placeholderTextColor={COLORS.textSecondary}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.applyButton,
                (!promoCode.trim() || isApplying) && styles.applyButtonDisabled,
              ]}
              onPress={handleApplyCode}
              disabled={!promoCode.trim() || isApplying}
            >
              <Text style={styles.applyButtonText}>
                {isApplying ? '...' : 'Aplicar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Promos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promociones disponibles</Text>
          {availablePromos.length > 0 ? (
            availablePromos.map(promo => (
              <PromoCodeCard
                key={promo.id}
                promo={promo}
                onCopy={() => handleCopyCode(promo.code)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyTitle}>Sin promociones disponibles</Text>
              <Text style={styles.emptyText}>
                Mantente atento a nuevas promociones. Te notificaremos cuando haya ofertas especiales!
              </Text>
            </View>
          )}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como funcionan los codigos</Text>
          <View style={styles.howItWorks}>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Ingresa el codigo</Text>
                <Text style={styles.stepText}>
                  Copia o escribe el codigo promocional
                </Text>
              </View>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Confirma tu viaje</Text>
                <Text style={styles.stepText}>
                  El descuento se aplica automaticamente
                </Text>
              </View>
            </View>
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Disfruta el ahorro!</Text>
                <Text style={styles.stepText}>
                  Paga menos por tu viaje
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms Notice */}
        <View style={styles.termsNotice}>
          <Text style={styles.termsIcon}>ℹ️</Text>
          <Text style={styles.termsText}>
            Los codigos promocionales tienen terminos y condiciones.
            Revisa los detalles de cada codigo antes de usarlo.
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
  enterCodeSection: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  codeInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 1,
  },
  applyButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  promoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  promoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  promoIcon: {
    fontSize: 24,
  },
  promoInfo: {
    flex: 1,
  },
  promoDiscount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  promoDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: 2,
  },
  expiringBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  expiringText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  codeBox: {
    flex: 1,
  },
  codeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  codeText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  copyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  promoDetails: {
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  promoTerms: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOWS.small,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  howItWorks: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: SPACING.md,
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
  termsNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  termsIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  termsText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default PromoScreen;
