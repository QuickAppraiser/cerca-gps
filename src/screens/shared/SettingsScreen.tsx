// ==========================================
// CERCA - Settings Screen
// App settings and preferences
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

// ==========================================
// Types
// ==========================================

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

// ==========================================
// Setting Item Component
// ==========================================

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  hasToggle,
  toggleValue,
  onToggle,
  onPress,
  danger,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={hasToggle || !onPress}
  >
    <View style={styles.settingIcon}>
      <Text style={styles.settingIconText}>{icon}</Text>
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {hasToggle ? (
      <Switch
        value={toggleValue}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    ) : value ? (
      <Text style={styles.settingValue}>{value}</Text>
    ) : (
      <Text style={styles.settingChevron}>›</Text>
    )}
  </TouchableOpacity>
);

// ==========================================
// Main Component
// ==========================================

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const { user, logout } = useAuthStore();

  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [tripAlerts, setTripAlerts] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // ==========================================
  // Handlers
  // ==========================================

  const handleLogout = () => {
    Alert.alert('Cerrar Sesion', 'Estas seguro que deseas cerrar sesion?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Cerrar Sesion',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta accion es irreversible. Se eliminaran todos tus datos, historial de viajes y creditos. Estas seguro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmar Eliminacion',
              'Para confirmar, tu cuenta sera eliminada permanentemente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar Permanentemente',
                  style: 'destructive',
                  onPress: () => {
                    // In production, this would call the delete account API
                    Alert.alert(
                      'Solicitud Enviada',
                      'Tu solicitud de eliminacion ha sido recibida. Procesaremos tu solicitud en 24-48 horas.'
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:soporte@cerca.app?subject=Soporte%20CERCA');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://cerca.app/terminos');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://cerca.app/privacidad');
  };

  const handleRateApp = () => {
    Alert.alert('Calificar App', 'Te llevara a la tienda de aplicaciones.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Calificar', onPress: () => {} },
    ]);
  };

  // ==========================================
  // Render
  // ==========================================

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
        <Text style={styles.headerTitle}>Configuracion</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="👤"
              title="Informacion Personal"
              subtitle="Nombre, telefono, correo"
              onPress={() => navigation.navigate('Profile')}
            />
            <SettingItem
              icon="🔒"
              title="Seguridad"
              subtitle="Contrasena, verificacion"
              onPress={() =>
                Alert.alert('Seguridad', 'Proximamente: opciones de seguridad')
              }
            />
            <SettingItem
              icon="💳"
              title="Metodos de Pago"
              subtitle="Tarjetas guardadas"
              onPress={() => navigation.navigate('Credits')}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔔"
              title="Notificaciones Push"
              subtitle="Recibir alertas en tu dispositivo"
              hasToggle
              toggleValue={pushNotifications}
              onToggle={setPushNotifications}
            />
            <SettingItem
              icon="🚗"
              title="Alertas de Viaje"
              subtitle="Actualizaciones de conductores"
              hasToggle
              toggleValue={tripAlerts}
              onToggle={setTripAlerts}
            />
            <SettingItem
              icon="📧"
              title="Correos Promocionales"
              subtitle="Ofertas y descuentos"
              hasToggle
              toggleValue={promotionalEmails}
              onToggle={setPromotionalEmails}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📍"
              title="Compartir Ubicacion"
              subtitle="Durante viajes activos"
              hasToggle
              toggleValue={locationSharing}
              onToggle={setLocationSharing}
            />
            <SettingItem
              icon="📋"
              title="Terminos de Servicio"
              onPress={handleOpenTerms}
            />
            <SettingItem
              icon="🛡️"
              title="Politica de Privacidad"
              onPress={handleOpenPrivacy}
            />
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🌙"
              title="Modo Oscuro"
              subtitle="Cambiar tema de la app"
              hasToggle
              toggleValue={darkMode}
              onToggle={setDarkMode}
            />
            <SettingItem
              icon="🌐"
              title="Idioma"
              value="Espanol"
              onPress={() =>
                Alert.alert('Idioma', 'Proximamente: seleccion de idioma')
              }
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="❓"
              title="Centro de Ayuda"
              onPress={() =>
                Alert.alert('Ayuda', 'Proximamente: centro de ayuda')
              }
            />
            <SettingItem
              icon="💬"
              title="Contactar Soporte"
              onPress={handleContactSupport}
            />
            <SettingItem
              icon="⭐"
              title="Calificar la App"
              onPress={handleRateApp}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="ℹ️"
              title="Version de la App"
              value="1.0.0"
            />
            <SettingItem
              icon="📜"
              title="Licencias"
              onPress={() =>
                Alert.alert('Licencias', 'Proximamente: licencias de software')
              }
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Zona de Peligro
          </Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🚪"
              title="Cerrar Sesion"
              onPress={handleLogout}
              danger
            />
            <SettingItem
              icon="🗑️"
              title="Eliminar Cuenta"
              subtitle="Esta accion es irreversible"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CERCA v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Hecho con amor en Guatemala 🇬🇹
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  dangerTitle: {
    color: COLORS.error,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingTitleDanger: {
    color: COLORS.error,
  },
  settingSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  settingChevron: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.gray[400],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  footerSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
});
