// ==========================================
// CERCA - Pantalla de Login
// With real Supabase Auth integration
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { validatePhone, validateOTP, formatPhone } from '../../utils/validation';
import { config } from '../../config/environment';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const { setUser } = useAuthStore();

  const handlePhoneChange = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned);
    setPhoneError(null);
  };

  const handleSendCode = async () => {
    // Validate phone
    const validation = validatePhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Número inválido');
      return;
    }

    setIsLoading(true);
    setPhoneError(null);

    try {
      const result = await authService.sendOTP(phone);

      if (result.success) {
        setIsCodeSent(true);

        // In dev mode, show the code
        if (config.isDevelopment && result.data?.devCode) {
          setDevCode(result.data.devCode);
        }

        Alert.alert(
          'Código enviado',
          `Se envió un código de verificación al ${formatPhone(phone)}`
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar el código');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    // Validate OTP
    const validation = validateOTP(verificationCode);
    if (!validation.isValid) {
      setCodeError(validation.error || 'Código inválido');
      return;
    }

    setIsLoading(true);
    setCodeError(null);

    try {
      const result = await authService.verifyOTP(phone, verificationCode);

      if (result.success && result.data) {
        // Map the response to our User type
        const userData = result.data.user || result.data.profile;

        if (userData) {
          // Convert profile to User format if needed
          const user = {
            id: userData.id,
            phone: userData.phone || `+57${phone}`,
            firstName: userData.firstName || userData.full_name?.split(' ')[0] || 'Usuario',
            lastName: userData.lastName || userData.full_name?.split(' ').slice(1).join(' ') || 'CERCA',
            role: userData.role || 'passenger',
            rating: userData.rating || 5.0,
            totalTrips: userData.totalTrips || userData.total_trips || 0,
            tokens: userData.tokens || 100,
            credits: userData.credits || 50000,
            isPremium: userData.isPremium || false,
            isVerified: userData.isVerified || userData.is_verified || true,
            createdAt: userData.createdAt || new Date(),
            emergencyContacts: userData.emergencyContacts || [],
            preferences: userData.preferences || {
              rideMode: 'normal',
              preferredVehicleTypes: ['standard'],
              accessibilityNeeds: [],
              language: 'es',
              notifications: {
                tripUpdates: true,
                promotions: true,
                communityAlerts: true,
                documentReminders: true,
              },
            },
            reputation: userData.reputation || {
              overall: 100,
              asPassenger: 100,
              asDriver: 0,
              reliability: 100,
              communityHelp: 0,
              reportAccuracy: 0,
            },
          };

          setUser(user);
          // Navigation handled by AppNavigator based on auth state
        }
      } else {
        setCodeError(result.error || 'Código incorrecto');
        Alert.alert('Error', result.error || 'Código incorrecto');
      }
    } catch (error) {
      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setVerificationCode('');
    setCodeError(null);
    setDevCode(null);
    handleSendCode();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo y nombre */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>CERCA</Text>
            </View>
            <Text style={styles.tagline}>
              La movilidad, la ayuda y la comunidad, siempre cerca.
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.title}>
              {isCodeSent ? 'Verifica tu número' : 'Ingresa tu número'}
            </Text>

            {!isCodeSent ? (
              <>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+57</Text>
                  </View>
                  <View style={styles.phoneInputWrapper}>
                    <Input
                      placeholder="300 123 4567"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      maxLength={10}
                      error={phoneError || undefined}
                    />
                  </View>
                </View>

                <Button
                  title="Enviar código"
                  onPress={handleSendCode}
                  loading={isLoading}
                  disabled={phone.length < 10}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Text style={styles.phoneDisplay}>+57 {formatPhone(phone)}</Text>

                {/* Dev mode hint */}
                {config.isDevelopment && devCode && (
                  <View style={styles.devHint}>
                    <Text style={styles.devHintText}>
                      🔧 Código de prueba: {devCode}
                    </Text>
                  </View>
                )}

                <Input
                  label="Código de verificación"
                  placeholder="123456"
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={(text) => {
                    setVerificationCode(text.replace(/\D/g, ''));
                    setCodeError(null);
                  }}
                  maxLength={6}
                  error={codeError || undefined}
                />

                <Button
                  title="Verificar"
                  onPress={handleVerifyCode}
                  loading={isLoading}
                  disabled={verificationCode.length < 6}
                  fullWidth
                />

                <View style={styles.codeActions}>
                  <TouchableOpacity onPress={handleResend}>
                    <Text style={styles.resendText}>Reenviar código</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => {
                    setIsCodeSent(false);
                    setVerificationCode('');
                    setCodeError(null);
                    setDevCode(null);
                  }}>
                    <Text style={styles.changeText}>Cambiar número</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Registro como conductor */}
          <View style={styles.driverSection}>
            <Text style={styles.driverText}>¿Quieres ser conductor CERCA?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverRegister')}>
              <Text style={styles.driverLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>

          {/* Términos */}
          <Text style={styles.terms}>
            Al continuar, aceptas nuestros{' '}
            <Text style={styles.termsLink}>Términos de Servicio</Text> y{' '}
            <Text style={styles.termsLink}>Política de Privacidad</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  countryCode: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md + 4,
    borderRadius: 8,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  countryCodeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneDisplay: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  devHint: {
    backgroundColor: COLORS.info + '20',
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  devHintText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
    textAlign: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
  },
  changeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  driverSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  driverText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  driverLink: {
    color: COLORS.secondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  terms: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 'auto',
  },
  termsLink: {
    color: COLORS.primary,
  },
});
