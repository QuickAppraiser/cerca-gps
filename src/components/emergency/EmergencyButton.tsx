// ==========================================
// CERCA - Botón de Emergencia Principal
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, EMERGENCY_RADIUS } from '../../constants/theme';
import { useEmergencyStore, getCurrentEmergencyRadius } from '../../store/emergencyStore';
import { EmergencyType } from '../../types';

interface EmergencyButtonProps {
  currentLocation?: { latitude: number; longitude: number };
  tripId?: string;
}

const EMERGENCY_TYPES: { type: EmergencyType; label: string; icon: string }[] = [
  { type: 'assault', label: 'Asalto', icon: '🚨' },
  { type: 'accident', label: 'Accidente', icon: '💥' },
  { type: 'medical', label: 'Emergencia Médica', icon: '🏥' },
  { type: 'harassment', label: 'Acoso', icon: '⚠️' },
  { type: 'vehicle_issue', label: 'Problema Vehículo', icon: '🚗' },
  { type: 'other', label: 'Otra Emergencia', icon: '❗' },
];

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({
  currentLocation,
  tripId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showActiveAlert, setShowActiveAlert] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const escalationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    activeAlert,
    isAlertActive,
    activateEmergency,
    escalateEmergency,
    cancelEmergency,
    resolveEmergency,
  } = useEmergencyStore();

  // Animación de pulso cuando hay alerta activa
  useEffect(() => {
    if (isAlertActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Escalamiento automático cada 30 segundos
      escalationTimer.current = setInterval(() => {
        escalateEmergency();
      }, 30000);

      return () => {
        pulse.stop();
        if (escalationTimer.current) {
          clearInterval(escalationTimer.current);
        }
      };
    }
  }, [isAlertActive]);

  const handleEmergencyPress = () => {
    if (isAlertActive) {
      setShowActiveAlert(true);
    } else {
      Vibration.vibrate(100);
      setShowModal(true);
    }
  };

  const handleEmergencyTypeSelect = (type: EmergencyType) => {
    if (!currentLocation) {
      Alert.alert(
        'Ubicación requerida',
        'No podemos detectar tu ubicación. Por favor activa el GPS.',
        [{ text: 'OK' }]
      );
      return;
    }

    Vibration.vibrate([100, 100, 100]);
    activateEmergency(type, currentLocation, tripId);
    setShowModal(false);
    setShowActiveAlert(true);
  };

  const handleCall123 = () => {
    Alert.alert(
      '⚠️ Advertencia Legal',
      'Las llamadas falsas a servicios de emergencia son un delito. ¿Confirmas que esta es una emergencia real?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, es real',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:123'),
        },
      ]
    );
  };

  const handleCancelAlert = () => {
    Alert.alert(
      'Cancelar Alerta',
      '¿Estás seguro de que deseas cancelar la alerta de emergencia?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          onPress: () => {
            cancelEmergency();
            setShowActiveAlert(false);
          },
        },
      ]
    );
  };

  const handleResolveAlert = (wasReal: boolean) => {
    resolveEmergency(wasReal);
    setShowActiveAlert(false);
    if (wasReal) {
      Alert.alert(
        '¡Nos alegra que estés bien!',
        'Gracias por usar CERCA. Tu reporte ayuda a mantener segura a la comunidad.'
      );
    }
  };

  return (
    <>
      {/* Botón principal de emergencia */}
      <Animated.View
        style={[
          styles.buttonContainer,
          { transform: [{ scale: isAlertActive ? pulseAnim : 1 }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            isAlertActive && styles.buttonActive,
          ]}
          onPress={handleEmergencyPress}
          onLongPress={() => {
            Vibration.vibrate(500);
            setShowModal(true);
          }}
          delayLongPress={500}
        >
          <Text style={styles.buttonText}>
            {isAlertActive ? '🆘' : 'SOS'}
          </Text>
          {isAlertActive && activeAlert && (
            <Text style={styles.radiusText}>
              {getCurrentEmergencyRadius(activeAlert.escalationLevel)}m
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de selección de tipo de emergencia */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Qué tipo de emergencia?</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona para alertar a la comunidad CERCA
            </Text>

            <View style={styles.emergencyGrid}>
              {EMERGENCY_TYPES.map(({ type, label, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={styles.emergencyTypeButton}
                  onPress={() => handleEmergencyTypeSelect(type)}
                >
                  <Text style={styles.emergencyIcon}>{icon}</Text>
                  <Text style={styles.emergencyLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de alerta activa */}
      <Modal
        visible={showActiveAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActiveAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.activeAlertContent]}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>🆘</Text>
              <Text style={styles.alertTitle}>ALERTA ACTIVA</Text>
            </View>

            {activeAlert && (
              <>
                <Text style={styles.alertInfo}>
                  Radio de búsqueda: {getCurrentEmergencyRadius(activeAlert.escalationLevel)} metros
                </Text>
                <Text style={styles.alertInfo}>
                  Usuarios notificados: {activeAlert.respondersNotified.length}
                </Text>
                <Text style={styles.alertInfo}>
                  Respondiendo: {activeAlert.respondersConfirmed.length}
                </Text>

                <View style={styles.escalationIndicator}>
                  {EMERGENCY_RADIUS.map((radius, index) => (
                    <View
                      key={radius}
                      style={[
                        styles.escalationDot,
                        index < activeAlert.escalationLevel && styles.escalationDotActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.call123Button}
              onPress={handleCall123}
            >
              <Text style={styles.call123Text}>📞 Llamar al 123</Text>
            </TouchableOpacity>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => handleResolveAlert(true)}
              >
                <Text style={styles.resolveButtonText}>Ya estoy bien</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelAlertButton}
                onPress={handleCancelAlert}
              >
                <Text style={styles.cancelAlertButtonText}>Cancelar alerta</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={() => setShowActiveAlert(false)}
            >
              <Text style={styles.minimizeText}>Minimizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.emergency,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonActive: {
    backgroundColor: COLORS.emergencyLight,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  radiusText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.emergency,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  emergencyTypeButton: {
    width: '48%',
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  emergencyIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  emergencyLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  activeAlertContent: {
    borderColor: COLORS.emergency,
    borderWidth: 2,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  alertTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.emergency,
  },
  alertInfo: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  escalationIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  escalationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray[300],
  },
  escalationDotActive: {
    backgroundColor: COLORS.emergency,
  },
  call123Button: {
    backgroundColor: COLORS.emergency,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  call123Text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  alertActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  resolveButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  cancelAlertButton: {
    flex: 1,
    backgroundColor: COLORS.gray[200],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  cancelAlertButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  minimizeButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  minimizeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
});
