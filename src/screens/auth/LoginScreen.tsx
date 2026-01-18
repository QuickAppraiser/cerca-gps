// ==========================================
// CERCA - Pantalla de Login
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

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useAuthStore();

  const handleSendCode = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido');
      return;
    }

    setIsLoading(true);
    // TODO: Integrar con Supabase Auth
    // Simulamos envío de código
    setTimeout(() => {
      setIsLoading(false);
      setIsCodeSent(true);
      Alert.alert('Código enviado', `Se envió un código de verificación al ${phone}`);
    }, 1500);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length < 4) {
      Alert.alert('Error', 'Por favor ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    // TODO: Verificar código con Supabase
    // Por ahora simulamos login exitoso
    setTimeout(() => {
      setIsLoading(false);
      // Usuario de prueba
      setUser({
        id: 'test_user_1',
        phone,
        firstName: 'Usuario',
        lastName: 'CERCA',
        role: 'passenger',
        rating: 5.0,
        totalTrips: 0,
        tokens: 100,
        credits: 0,
        isPremium: false,
        isVerified: true,
        createdAt: new Date(),
        emergencyContacts: [],
        preferences: {
          rideMode: 'normal',
          preferredVehicleTypes: [],
          accessibilityNeeds: [],
          language: 'es',
          notifications: {
            tripUpdates: true,
            promotions: true,
            communityAlerts: true,
            documentReminders: true,
          },
        },
        reputation: {
          overall: 100,
          asPassenger: 100,
          asDriver: 0,
          reliability: 100,
          communityHelp: 0,
          reportAccuracy: 0,
        },
      });
    }, 1500);
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
                <Input
                  label="Número de celular"
                  placeholder="300 123 4567"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />

                <Button
                  title="Enviar código"
                  onPress={handleSendCode}
                  loading={isLoading}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Text style={styles.phoneDisplay}>+57 {phone}</Text>

                <Input
                  label="Código de verificación"
                  placeholder="1234"
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  maxLength={6}
                />

                <Button
                  title="Verificar"
                  onPress={handleVerifyCode}
                  loading={isLoading}
                  fullWidth
                />

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => setIsCodeSent(false)}
                >
                  <Text style={styles.resendText}>Cambiar número</Text>
                </TouchableOpacity>
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
  phoneDisplay: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  resendButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.primary,
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
