// ==========================================
// CERCA - Support/Help Screen
// FAQ, contact support, and help resources
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

// ==========================================
// Types
// ==========================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'trips' | 'payments' | 'driver' | 'safety';
}

interface ContactOption {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
}

// ==========================================
// Data
// ==========================================

const FAQ_DATA: FAQItem[] = [
  // General
  {
    id: '1',
    question: 'Como funciona CERCA?',
    answer: 'CERCA conecta pasajeros con conductores locales en Armenia. Simplemente ingresa tu destino, confirma el precio y espera a que un conductor acepte tu viaje. Puedes seguir el viaje en tiempo real y pagar con creditos o efectivo.',
    category: 'general',
  },
  {
    id: '2',
    question: 'En que ciudades esta disponible CERCA?',
    answer: 'Actualmente CERCA opera exclusivamente en Armenia, Quindio y sus alrededores. Estamos trabajando para expandirnos a otras ciudades de la region.',
    category: 'general',
  },
  // Trips
  {
    id: '3',
    question: 'Como solicito un viaje?',
    answer: '1. Abre la app y permite el acceso a tu ubicacion\n2. Toca "A donde vamos?" e ingresa tu destino\n3. Revisa el precio estimado y confirma\n4. Espera a que un conductor acepte\n5. Sigue el viaje en el mapa en tiempo real',
    category: 'trips',
  },
  {
    id: '4',
    question: 'Puedo cancelar un viaje?',
    answer: 'Si, puedes cancelar un viaje antes de que el conductor llegue. Las cancelaciones frecuentes pueden afectar tu calificacion. Si el conductor tarda mas de 5 minutos, la cancelacion es sin costo.',
    category: 'trips',
  },
  {
    id: '5',
    question: 'Que pasa si olvido algo en el vehiculo?',
    answer: 'Contacta al conductor a traves de la seccion de viajes recientes en tu historial. Si no puedes comunicarte, escribe a soporte@cercaapp.co con los detalles del viaje.',
    category: 'trips',
  },
  // Payments
  {
    id: '6',
    question: 'Como cargo creditos a mi cuenta?',
    answer: 'Ve a Perfil > Creditos > Recargar. Puedes recargar con Nequi, Daviplata, PSE o tarjeta de credito. Los creditos se agregan instantaneamente.',
    category: 'payments',
  },
  {
    id: '7',
    question: 'Puedo pagar en efectivo?',
    answer: 'Si, puedes seleccionar "Efectivo" como metodo de pago al confirmar tu viaje. Paga directamente al conductor al finalizar el viaje.',
    category: 'payments',
  },
  {
    id: '8',
    question: 'Como funcionan los tokens?',
    answer: 'Los tokens son puntos de recompensa que ganas por cada viaje, buenas calificaciones y reportes de trafico validados. Puedes canjear tokens por descuentos en tus viajes.',
    category: 'payments',
  },
  // Driver
  {
    id: '9',
    question: 'Como me registro como conductor?',
    answer: 'Ve a Perfil > "Quiero ser conductor" y completa el formulario con tu informacion personal, datos del vehiculo y documentos. La verificacion toma 24-48 horas.',
    category: 'driver',
  },
  {
    id: '10',
    question: 'Que documentos necesito para conducir?',
    answer: '- Licencia de conduccion vigente (B1 o superior)\n- Tarjeta de propiedad del vehiculo\n- SOAT vigente\n- Revision tecnico-mecanica\n- Cedula de ciudadania\n- Foto de perfil clara',
    category: 'driver',
  },
  {
    id: '11',
    question: 'Cuando recibo mis ganancias?',
    answer: 'Las ganancias se acumulan en tu billetera CERCA. Puedes solicitar retiro a tu cuenta bancaria en cualquier momento. Los retiros se procesan en 24-48 horas habiles.',
    category: 'driver',
  },
  // Safety
  {
    id: '12',
    question: 'Como funciona el boton de emergencia?',
    answer: 'El boton SOS esta disponible durante todo el viaje. Al presionarlo, se alerta automaticamente a nuestro equipo de seguridad y se puede compartir tu ubicacion con contactos de confianza.',
    category: 'safety',
  },
  {
    id: '13',
    question: 'Como reporto un problema de seguridad?',
    answer: 'Si tuviste un problema de seguridad, ve a tu historial de viajes, selecciona el viaje y toca "Reportar problema". Nuestro equipo investigara y te contactara.',
    category: 'safety',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'general', label: 'General' },
  { id: 'trips', label: 'Viajes' },
  { id: 'payments', label: 'Pagos' },
  { id: 'driver', label: 'Conductores' },
  { id: 'safety', label: 'Seguridad' },
];

// ==========================================
// Components
// ==========================================

const FAQItemComponent: React.FC<{
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ item, isExpanded, onToggle }) => (
  <TouchableOpacity
    style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={styles.faqHeader}>
      <Text style={styles.faqQuestion}>{item.question}</Text>
      <Text style={styles.faqToggle}>{isExpanded ? '−' : '+'}</Text>
    </View>
    {isExpanded && (
      <Text style={styles.faqAnswer}>{item.answer}</Text>
    )}
  </TouchableOpacity>
);

const ContactCard: React.FC<ContactOption> = ({ icon, title, subtitle, action }) => (
  <TouchableOpacity style={styles.contactCard} onPress={action} activeOpacity={0.7}>
    <Text style={styles.contactIcon}>{icon}</Text>
    <View style={styles.contactInfo}>
      <Text style={styles.contactTitle}>{title}</Text>
      <Text style={styles.contactSubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.contactArrow}>›</Text>
  </TouchableOpacity>
);

// ==========================================
// Main Component
// ==========================================

export const SupportScreen: React.FC = () => {
  const { user, activeRole } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const contactOptions: ContactOption[] = [
    {
      id: 'whatsapp',
      icon: '💬',
      title: 'WhatsApp',
      subtitle: 'Respuesta en menos de 1 hora',
      action: () => {
        const phone = '573001234567'; // Replace with real number
        const message = `Hola, necesito ayuda con CERCA. Mi ID: ${user?.id || 'N/A'}`;
        Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
      },
    },
    {
      id: 'email',
      icon: '📧',
      title: 'Correo electronico',
      subtitle: 'soporte@cercaapp.co',
      action: () => {
        const subject = `Soporte CERCA - ${activeRole === 'driver' ? 'Conductor' : 'Pasajero'}`;
        const body = `\n\n---\nID Usuario: ${user?.id || 'N/A'}\nRol: ${activeRole}`;
        Linking.openURL(`mailto:soporte@cercaapp.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      },
    },
    {
      id: 'phone',
      icon: '📞',
      title: 'Llamar a soporte',
      subtitle: 'Lun-Sab 7am-8pm',
      action: () => {
        Alert.alert(
          'Llamar a soporte',
          'Nuestro horario de atencion es de Lunes a Sabado, 7am a 8pm.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Llamar', onPress: () => Linking.openURL('tel:+576067401234') },
          ]
        );
      },
    },
  ];

  const filteredFAQ = FAQ_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en ayuda..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactanos</Text>
          {contactOptions.map(option => (
            <ContactCard key={option.id} {...option} />
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>

          {/* Category Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map(item => (
              <FAQItemComponent
                key={item.id}
                item={item}
                isExpanded={expandedFAQ === item.id}
                onToggle={() => toggleFAQ(item.id)}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No encontramos resultados para "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchLink}>Limpiar busqueda</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enlaces rapidos</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => Linking.openURL('https://cercaapp.co/terminos')}
            >
              <Text style={styles.quickLinkIcon}>📜</Text>
              <Text style={styles.quickLinkText}>Terminos y condiciones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => Linking.openURL('https://cercaapp.co/privacidad')}
            >
              <Text style={styles.quickLinkIcon}>🔒</Text>
              <Text style={styles.quickLinkText}>Politica de privacidad</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => Linking.openURL('https://cercaapp.co/tarifas')}
            >
              <Text style={styles.quickLinkIcon}>💰</Text>
              <Text style={styles.quickLinkText}>Tarifas y precios</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => Linking.openURL('https://cercaapp.co/conductores')}
            >
              <Text style={styles.quickLinkIcon}>🚗</Text>
              <Text style={styles.quickLinkText}>Guia para conductores</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>CERCA v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 CERCA Colombia</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  searchIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  clearSearch: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    padding: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  contactIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  contactArrow: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textSecondary,
  },
  categoriesScroll: {
    marginBottom: SPACING.md,
  },
  categoriesContent: {
    paddingRight: SPACING.md,
  },
  categoryChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.sm,
    ...SHADOWS.small,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  categoryTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  faqItemExpanded: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  faqToggle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  noResults: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noResultsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  clearSearchLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickLinks: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quickLinkIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.md,
  },
  quickLinkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  appCopyright: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default SupportScreen;
