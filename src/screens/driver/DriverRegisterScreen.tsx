// ==========================================
// CERCA - Driver Registration Screen
// Multi-step registration flow for new drivers
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

// ==========================================
// Types
// ==========================================

interface DriverRegisterScreenProps {
  navigation: any;
}

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
}

interface DriverDocuments {
  licenseNumber: string;
  licenseExpiry: string;
  insuranceNumber: string;
  insuranceExpiry: string;
}

// ==========================================
// Constants
// ==========================================

const STEPS = [
  { id: 1, title: 'Informacion Personal', icon: '👤' },
  { id: 2, title: 'Vehiculo', icon: '🚗' },
  { id: 3, title: 'Documentos', icon: '📄' },
  { id: 4, title: 'Confirmacion', icon: '✅' },
];

const VEHICLE_TYPES = [
  { id: 'sedan', label: 'Sedan', icon: '🚗' },
  { id: 'suv', label: 'SUV', icon: '🚙' },
  { id: 'van', label: 'Van', icon: '🚐' },
  { id: 'pickup', label: 'Pickup', icon: '🛻' },
];

// ==========================================
// Main Component
// ==========================================

export const DriverRegisterScreen: React.FC<DriverRegisterScreenProps> = ({
  navigation,
}) => {
  const { user, setUser } = useAuthStore();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personal info
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Vehicle info
  const [vehicleType, setVehicleType] = useState('sedan');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
  });

  // Documents
  const [documents, setDocuments] = useState<DriverDocuments>({
    licenseNumber: '',
    licenseExpiry: '',
    insuranceNumber: '',
    insuranceExpiry: '',
  });

  // Terms acceptance
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ==========================================
  // Validation
  // ==========================================

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!fullName.trim()) {
          Alert.alert('Error', 'Por favor ingresa tu nombre completo');
          return false;
        }
        if (!phone.trim() || phone.length < 8) {
          Alert.alert('Error', 'Por favor ingresa un numero de telefono valido');
          return false;
        }
        return true;

      case 2:
        if (!vehicleInfo.make.trim()) {
          Alert.alert('Error', 'Por favor ingresa la marca del vehiculo');
          return false;
        }
        if (!vehicleInfo.model.trim()) {
          Alert.alert('Error', 'Por favor ingresa el modelo del vehiculo');
          return false;
        }
        if (!vehicleInfo.year.trim() || vehicleInfo.year.length !== 4) {
          Alert.alert('Error', 'Por favor ingresa el ano del vehiculo (4 digitos)');
          return false;
        }
        if (!vehicleInfo.licensePlate.trim()) {
          Alert.alert('Error', 'Por favor ingresa la placa del vehiculo');
          return false;
        }
        return true;

      case 3:
        if (!documents.licenseNumber.trim()) {
          Alert.alert('Error', 'Por favor ingresa el numero de tu licencia');
          return false;
        }
        if (!documents.licenseExpiry.trim()) {
          Alert.alert('Error', 'Por favor ingresa la fecha de vencimiento de tu licencia');
          return false;
        }
        return true;

      case 4:
        if (!acceptedTerms) {
          Alert.alert('Error', 'Debes aceptar los terminos y condiciones');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // ==========================================
  // Navigation
  // ==========================================

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // ==========================================
  // Submit Registration
  // ==========================================

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // In development mode, this will just update the mock user
      const result = await authService.updateProfile(user?.id || '', {
        name: fullName,
        phone,
        email,
        role: 'driver',
        vehicleInfo: {
          type: vehicleType,
          ...vehicleInfo,
        },
        driverDocuments: documents,
        driverStatus: 'pending_approval', // Needs admin approval
      });

      if (result.success) {
        Alert.alert(
          'Solicitud Enviada',
          'Tu solicitud para ser conductor ha sido enviada. Te notificaremos cuando sea aprobada.',
          [
            {
              text: 'Entendido',
              onPress: () => {
                // Update local user state
                if (user) {
                  setUser({
                    ...user,
                    name: fullName,
                    phone,
                    email,
                    role: 'both',
                    driverStatus: 'pending_approval',
                  });
                }
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo enviar la solicitud');
      }
    } catch (error) {
      console.error('Driver registration error:', error);
      Alert.alert('Error', 'Ocurrio un error. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Render Steps
  // ==========================================

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step.id && styles.stepCircleActive,
              currentStep === step.id && styles.stepCircleCurrent,
            ]}
          >
            {currentStep > step.id ? (
              <Text style={styles.stepCheckmark}>✓</Text>
            ) : (
              <Text style={styles.stepNumber}>{step.id}</Text>
            )}
          </View>
          {index < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step.id && styles.stepLineActive,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informacion Personal</Text>
      <Text style={styles.stepSubtitle}>
        Confirma tus datos personales
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre Completo</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Tu nombre completo"
          placeholderTextColor={COLORS.gray[400]}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Telefono</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Tu numero de telefono"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Correo Electronico (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={COLORS.gray[400]}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informacion del Vehiculo</Text>
      <Text style={styles.stepSubtitle}>
        Ingresa los datos de tu vehiculo
      </Text>

      <Text style={styles.inputLabel}>Tipo de Vehiculo</Text>
      <View style={styles.vehicleTypeGrid}>
        {VEHICLE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.vehicleTypeCard,
              vehicleType === type.id && styles.vehicleTypeCardSelected,
            ]}
            onPress={() => setVehicleType(type.id)}
          >
            <Text style={styles.vehicleTypeIcon}>{type.icon}</Text>
            <Text
              style={[
                styles.vehicleTypeLabel,
                vehicleType === type.id && styles.vehicleTypeLabelSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
          <Text style={styles.inputLabel}>Marca</Text>
          <TextInput
            style={styles.input}
            value={vehicleInfo.make}
            onChangeText={(text) =>
              setVehicleInfo({ ...vehicleInfo, make: text })
            }
            placeholder="Toyota"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Modelo</Text>
          <TextInput
            style={styles.input}
            value={vehicleInfo.model}
            onChangeText={(text) =>
              setVehicleInfo({ ...vehicleInfo, model: text })
            }
            placeholder="Corolla"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
          <Text style={styles.inputLabel}>Ano</Text>
          <TextInput
            style={styles.input}
            value={vehicleInfo.year}
            onChangeText={(text) =>
              setVehicleInfo({ ...vehicleInfo, year: text })
            }
            placeholder="2020"
            placeholderTextColor={COLORS.gray[400]}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Color</Text>
          <TextInput
            style={styles.input}
            value={vehicleInfo.color}
            onChangeText={(text) =>
              setVehicleInfo({ ...vehicleInfo, color: text })
            }
            placeholder="Blanco"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Placa</Text>
        <TextInput
          style={styles.input}
          value={vehicleInfo.licensePlate}
          onChangeText={(text) =>
            setVehicleInfo({ ...vehicleInfo, licensePlate: text.toUpperCase() })
          }
          placeholder="ABC-123"
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="characters"
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Documentos</Text>
      <Text style={styles.stepSubtitle}>
        Ingresa la informacion de tus documentos
      </Text>

      <View style={styles.documentSection}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentIcon}>🪪</Text>
          <Text style={styles.documentTitle}>Licencia de Conducir</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Numero de Licencia</Text>
          <TextInput
            style={styles.input}
            value={documents.licenseNumber}
            onChangeText={(text) =>
              setDocuments({ ...documents, licenseNumber: text })
            }
            placeholder="Numero de tu licencia"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Fecha de Vencimiento</Text>
          <TextInput
            style={styles.input}
            value={documents.licenseExpiry}
            onChangeText={(text) =>
              setDocuments({ ...documents, licenseExpiry: text })
            }
            placeholder="MM/AAAA"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>
      </View>

      <View style={styles.documentSection}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentIcon}>📋</Text>
          <Text style={styles.documentTitle}>Seguro del Vehiculo (Opcional)</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Numero de Poliza</Text>
          <TextInput
            style={styles.input}
            value={documents.insuranceNumber}
            onChangeText={(text) =>
              setDocuments({ ...documents, insuranceNumber: text })
            }
            placeholder="Numero de poliza"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Fecha de Vencimiento</Text>
          <TextInput
            style={styles.input}
            value={documents.insuranceExpiry}
            onChangeText={(text) =>
              setDocuments({ ...documents, insuranceExpiry: text })
            }
            placeholder="MM/AAAA"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>
      </View>

      <View style={styles.uploadNote}>
        <Text style={styles.uploadNoteIcon}>📸</Text>
        <Text style={styles.uploadNoteText}>
          En el futuro podras subir fotos de tus documentos para verificacion rapida
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirmar Registro</Text>
      <Text style={styles.stepSubtitle}>
        Revisa tu informacion antes de enviar
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Nombre</Text>
          <Text style={styles.summaryValue}>{fullName}</Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Telefono</Text>
          <Text style={styles.summaryValue}>{phone}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Vehiculo</Text>
          <Text style={styles.summaryValue}>
            {vehicleInfo.make} {vehicleInfo.model} {vehicleInfo.year}
          </Text>
          <Text style={styles.summarySubvalue}>
            Color: {vehicleInfo.color} | Placa: {vehicleInfo.licensePlate}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Licencia</Text>
          <Text style={styles.summaryValue}>{documents.licenseNumber}</Text>
          <Text style={styles.summarySubvalue}>
            Vence: {documents.licenseExpiry}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => setAcceptedTerms(!acceptedTerms)}
      >
        <View
          style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
        >
          {acceptedTerms && <Text style={styles.checkboxCheck}>✓</Text>}
        </View>
        <Text style={styles.termsText}>
          Acepto los{' '}
          <Text style={styles.termsLink}>Terminos y Condiciones</Text> y la{' '}
          <Text style={styles.termsLink}>Politica de Privacidad</Text> de CERCA
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Tu solicitud sera revisada en 24-48 horas. Te notificaremos cuando
          puedas comenzar a recibir viajes.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrarse como Conductor</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonPrimaryText}>
              {currentStep === STEPS.length ? 'Enviar Solicitud' : 'Continuar'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
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
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepCircleCurrent: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  stepNumber: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.gray[500],
  },
  stepCheckmark: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SPACING.xs,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  stepContent: {},
  stepTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inputRow: {
    flexDirection: 'row',
  },
  vehicleTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  vehicleTypeCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
  },
  vehicleTypeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  vehicleTypeIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  vehicleTypeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  vehicleTypeLabelSelected: {
    color: COLORS.primary,
  },
  documentSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  documentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  uploadNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: SPACING.md,
  },
  uploadNoteIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  uploadNoteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summarySection: {
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  summarySubvalue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.md,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxCheck: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.sm,
  },
  termsText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: SPACING.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonPrimaryText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
