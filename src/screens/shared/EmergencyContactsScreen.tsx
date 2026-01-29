// ==========================================
// CERCA - Emergency Contacts Screen
// Manage trusted contacts for safety alerts
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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { validatePhone, validateName, formatPhone } from '../../utils';

// ==========================================
// Types
// ==========================================

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOnTrip: boolean;
  notifyOnEmergency: boolean;
}

// ==========================================
// Mock Data
// ==========================================

const MOCK_CONTACTS: EmergencyContact[] = [
  {
    id: '1',
    name: 'Maria Garcia',
    phone: '3001234567',
    relationship: 'Madre',
    notifyOnTrip: true,
    notifyOnEmergency: true,
  },
  {
    id: '2',
    name: 'Carlos Perez',
    phone: '3109876543',
    relationship: 'Esposo',
    notifyOnTrip: false,
    notifyOnEmergency: true,
  },
];

const RELATIONSHIPS = [
  'Madre',
  'Padre',
  'Esposo/a',
  'Hermano/a',
  'Hijo/a',
  'Amigo/a',
  'Otro',
];

// ==========================================
// Components
// ==========================================

const ContactCard: React.FC<{
  contact: EmergencyContact;
  onEdit: () => void;
  onDelete: () => void;
  onToggleTrip: () => void;
  onToggleEmergency: () => void;
}> = ({ contact, onEdit, onDelete, onToggleTrip, onToggleEmergency }) => (
  <View style={styles.contactCard}>
    <View style={styles.contactHeader}>
      <View style={styles.contactAvatar}>
        <Text style={styles.contactInitial}>
          {contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactPhone}>{formatPhone(contact.phone)}</Text>
        <Text style={styles.contactRelation}>{contact.relationship}</Text>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>

    <View style={styles.contactSettings}>
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onToggleTrip}
        activeOpacity={0.7}
      >
        <View style={styles.settingInfo}>
          <Text style={styles.settingIcon}>🚗</Text>
          <Text style={styles.settingText}>Notificar al iniciar viaje</Text>
        </View>
        <View style={[styles.toggle, contact.notifyOnTrip && styles.toggleActive]}>
          <View style={[styles.toggleKnob, contact.notifyOnTrip && styles.toggleKnobActive]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={onToggleEmergency}
        activeOpacity={0.7}
      >
        <View style={styles.settingInfo}>
          <Text style={styles.settingIcon}>🆘</Text>
          <Text style={styles.settingText}>Notificar en emergencia</Text>
        </View>
        <View style={[styles.toggle, contact.notifyOnEmergency && styles.toggleActive]}>
          <View style={[styles.toggleKnob, contact.notifyOnEmergency && styles.toggleKnobActive]} />
        </View>
      </TouchableOpacity>
    </View>
  </View>
);

const AddEditModal: React.FC<{
  visible: boolean;
  contact: EmergencyContact | null;
  onClose: () => void;
  onSave: (contact: Omit<EmergencyContact, 'id'>) => void;
}> = ({ visible, contact, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notifyOnTrip, setNotifyOnTrip] = useState(true);
  const [notifyOnEmergency, setNotifyOnEmergency] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone);
      setRelationship(contact.relationship);
      setNotifyOnTrip(contact.notifyOnTrip);
      setNotifyOnEmergency(contact.notifyOnEmergency);
    } else {
      setName('');
      setPhone('');
      setRelationship('');
      setNotifyOnTrip(true);
      setNotifyOnEmergency(true);
    }
    setErrors({});
  }, [contact, visible]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const nameResult = validateName(name);
    if (!nameResult.isValid) {
      newErrors.name = nameResult.error || 'Nombre invalido';
    }

    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) {
      newErrors.phone = phoneResult.error || 'Telefono invalido';
    }

    if (!relationship) {
      newErrors.relationship = 'Selecciona una relacion';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      relationship,
      notifyOnTrip,
      notifyOnEmergency,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {contact ? 'Editar contacto' : 'Nuevo contacto'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Maria Garcia"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numero de telefono</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej: 300 123 4567"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Relationship Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Relacion</Text>
              <View style={styles.relationshipGrid}>
                {RELATIONSHIPS.map(rel => (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.relationshipChip,
                      relationship === rel && styles.relationshipChipActive,
                    ]}
                    onPress={() => setRelationship(rel)}
                  >
                    <Text
                      style={[
                        styles.relationshipText,
                        relationship === rel && styles.relationshipTextActive,
                      ]}
                    >
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.relationship && (
                <Text style={styles.errorText}>{errors.relationship}</Text>
              )}
            </View>

            {/* Notification Preferences */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notificaciones</Text>
              <View style={styles.preferencesCard}>
                <TouchableOpacity
                  style={styles.preferenceRow}
                  onPress={() => setNotifyOnTrip(!notifyOnTrip)}
                >
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceIcon}>🚗</Text>
                    <View>
                      <Text style={styles.preferenceTitle}>Al iniciar viaje</Text>
                      <Text style={styles.preferenceDesc}>
                        Recibe un mensaje cuando inicies un viaje
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, notifyOnTrip && styles.toggleActive]}>
                    <View style={[styles.toggleKnob, notifyOnTrip && styles.toggleKnobActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.preferenceRow, styles.preferenceRowLast]}
                  onPress={() => setNotifyOnEmergency(!notifyOnEmergency)}
                >
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceIcon}>🆘</Text>
                    <View>
                      <Text style={styles.preferenceTitle}>En emergencia</Text>
                      <Text style={styles.preferenceDesc}>
                        Recibe alerta si activas el boton SOS
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.toggle, notifyOnEmergency && styles.toggleActive]}>
                    <View style={[styles.toggleKnob, notifyOnEmergency && styles.toggleKnobActive]} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ==========================================
// Main Component
// ==========================================

export const EmergencyContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      // In production, fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));
      setContacts(MOCK_CONTACTS);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = () => {
    if (contacts.length >= 5) {
      Alert.alert(
        'Limite alcanzado',
        'Puedes agregar maximo 5 contactos de emergencia.'
      );
      return;
    }
    setEditingContact(null);
    setModalVisible(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setModalVisible(true);
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Eliminar contacto',
      `Estas seguro de eliminar a ${contact.name} de tus contactos de emergencia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setContacts(prev => prev.filter(c => c.id !== contact.id));
          },
        },
      ]
    );
  };

  const handleSaveContact = (contactData: Omit<EmergencyContact, 'id'>) => {
    if (editingContact) {
      // Update existing
      setContacts(prev =>
        prev.map(c =>
          c.id === editingContact.id ? { ...contactData, id: c.id } : c
        )
      );
    } else {
      // Add new
      const newContact: EmergencyContact = {
        ...contactData,
        id: Date.now().toString(),
      };
      setContacts(prev => [...prev, newContact]);
    }
    setModalVisible(false);
  };

  const toggleNotifyOnTrip = (contactId: string) => {
    setContacts(prev =>
      prev.map(c =>
        c.id === contactId ? { ...c, notifyOnTrip: !c.notifyOnTrip } : c
      )
    );
  };

  const toggleNotifyOnEmergency = (contactId: string) => {
    setContacts(prev =>
      prev.map(c =>
        c.id === contactId ? { ...c, notifyOnEmergency: !c.notifyOnEmergency } : c
      )
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando contactos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🛡️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Tu seguridad es nuestra prioridad</Text>
            <Text style={styles.infoText}>
              Estos contactos seran notificados automaticamente en caso de emergencia
              o cuando inicies un viaje (si lo activas).
            </Text>
          </View>
        </View>

        {/* Contacts List */}
        {contacts.length > 0 ? (
          <View style={styles.contactsList}>
            {contacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={() => handleEditContact(contact)}
                onDelete={() => handleDeleteContact(contact)}
                onToggleTrip={() => toggleNotifyOnTrip(contact.id)}
                onToggleEmergency={() => toggleNotifyOnEmergency(contact.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Sin contactos de emergencia</Text>
            <Text style={styles.emptyText}>
              Agrega personas de confianza que seran notificadas en caso de emergencia
            </Text>
          </View>
        )}

        {/* Add Contact Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddContact}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Agregar contacto</Text>
        </TouchableOpacity>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Consejos de seguridad</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              Agrega al menos 2 contactos de emergencia para mayor seguridad.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>
              Asegurate de que tus contactos tengan sus telefonos activos.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🔔</Text>
            <Text style={styles.tipText}>
              Informa a tus contactos que los has agregado como emergencia.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <AddEditModal
        visible={modalVisible}
        contact={editingContact}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveContact}
      />
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  contactsList: {
    marginBottom: SPACING.md,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactInitial: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  contactRelation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SPACING.xs,
  },
  actionIcon: {
    fontSize: FONT_SIZES.lg,
  },
  contactSettings: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
  },
  settingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  addButtonIcon: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    marginRight: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  tipsSection: {
    marginBottom: SPACING.lg,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  tipIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.md,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalCancel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalSave: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modalBody: {
    flex: 1,
    padding: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  relationshipChip: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  relationshipChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  relationshipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  relationshipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  preferencesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  preferenceRowLast: {
    borderBottomWidth: 0,
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  preferenceIcon: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.md,
  },
  preferenceTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  preferenceDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

export default EmergencyContactsScreen;
