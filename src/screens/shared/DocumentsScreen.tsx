// ==========================================
// CERCA - Documents Screen
// Driver document management and verification
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { Document } from '../../types';

// ==========================================
// Types
// ==========================================

interface DocumentItem {
  id: string;
  type: 'license' | 'vehicle_registration' | 'soat' | 'tecnomecanica' | 'id_card' | 'profile_photo';
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'not_uploaded';
  expiryDate?: string;
  uploadedAt?: string;
  rejectionReason?: string;
  required: boolean;
}

// ==========================================
// Mock Data
// ==========================================

const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    type: 'license',
    name: 'Licencia de Conduccion',
    description: 'Licencia vigente categoria B1 o superior',
    status: 'approved',
    expiryDate: '2026-08-15',
    uploadedAt: '2024-01-10',
    required: true,
  },
  {
    id: '2',
    type: 'vehicle_registration',
    name: 'Tarjeta de Propiedad',
    description: 'Documento del vehiculo a tu nombre o autorizado',
    status: 'approved',
    uploadedAt: '2024-01-10',
    required: true,
  },
  {
    id: '3',
    type: 'soat',
    name: 'SOAT',
    description: 'Seguro obligatorio de accidentes de transito',
    status: 'pending',
    expiryDate: '2025-03-20',
    uploadedAt: '2024-12-15',
    required: true,
  },
  {
    id: '4',
    type: 'tecnomecanica',
    name: 'Revision Tecnico-Mecanica',
    description: 'Certificado de revision tecnica vigente',
    status: 'expired',
    expiryDate: '2024-11-30',
    uploadedAt: '2023-11-25',
    required: true,
  },
  {
    id: '5',
    type: 'id_card',
    name: 'Cedula de Ciudadania',
    description: 'Documento de identidad por ambos lados',
    status: 'approved',
    uploadedAt: '2024-01-10',
    required: true,
  },
  {
    id: '6',
    type: 'profile_photo',
    name: 'Foto de Perfil',
    description: 'Foto reciente, rostro visible, fondo claro',
    status: 'rejected',
    uploadedAt: '2024-01-10',
    rejectionReason: 'La foto esta borrosa. Por favor sube una foto mas clara.',
    required: true,
  },
];

// ==========================================
// Helper Functions
// ==========================================

const getStatusConfig = (status: DocumentItem['status']) => {
  switch (status) {
    case 'approved':
      return { color: COLORS.success, icon: '✓', label: 'Aprobado' };
    case 'pending':
      return { color: COLORS.warning, icon: '⏳', label: 'En revision' };
    case 'rejected':
      return { color: COLORS.error, icon: '✗', label: 'Rechazado' };
    case 'expired':
      return { color: COLORS.error, icon: '!', label: 'Vencido' };
    case 'not_uploaded':
      return { color: COLORS.textSecondary, icon: '↑', label: 'Sin subir' };
    default:
      return { color: COLORS.textSecondary, icon: '?', label: 'Desconocido' };
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isExpiringSoon = (expiryDate?: string) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
};

// ==========================================
// Components
// ==========================================

const DocumentCard: React.FC<{
  document: DocumentItem;
  onUpload: () => void;
  onView: () => void;
}> = ({ document, onUpload, onView }) => {
  const statusConfig = getStatusConfig(document.status);
  const expiringSoon = isExpiringSoon(document.expiryDate);

  return (
    <TouchableOpacity
      style={[
        styles.documentCard,
        document.status === 'rejected' && styles.documentCardRejected,
        document.status === 'expired' && styles.documentCardExpired,
      ]}
      onPress={document.status === 'not_uploaded' ? onUpload : onView}
      activeOpacity={0.7}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <View style={styles.documentTitleRow}>
            <Text style={styles.documentName}>{document.name}</Text>
            {document.required && (
              <Text style={styles.requiredBadge}>Requerido</Text>
            )}
          </View>
          <Text style={styles.documentDescription}>{document.description}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
          <Text style={[styles.statusIcon, { color: statusConfig.color }]}>
            {statusConfig.icon}
          </Text>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Expiry warning */}
      {expiringSoon && document.status === 'approved' && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Vence el {formatDate(document.expiryDate)} - Actualiza pronto
          </Text>
        </View>
      )}

      {/* Rejection reason */}
      {document.status === 'rejected' && document.rejectionReason && (
        <View style={styles.rejectionBanner}>
          <Text style={styles.rejectionTitle}>Razon del rechazo:</Text>
          <Text style={styles.rejectionText}>{document.rejectionReason}</Text>
        </View>
      )}

      {/* Document dates */}
      {document.uploadedAt && (
        <View style={styles.documentDates}>
          <Text style={styles.dateText}>
            Subido: {formatDate(document.uploadedAt)}
          </Text>
          {document.expiryDate && (
            <Text style={[
              styles.dateText,
              document.status === 'expired' && styles.expiredText,
            ]}>
              Vence: {formatDate(document.expiryDate)}
            </Text>
          )}
        </View>
      )}

      {/* Action button */}
      <View style={styles.documentActions}>
        {document.status === 'not_uploaded' ? (
          <TouchableOpacity style={styles.uploadButton} onPress={onUpload}>
            <Text style={styles.uploadButtonText}>Subir documento</Text>
          </TouchableOpacity>
        ) : document.status === 'rejected' || document.status === 'expired' ? (
          <TouchableOpacity style={styles.reuploadButton} onPress={onUpload}>
            <Text style={styles.reuploadButtonText}>Actualizar documento</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.viewButton} onPress={onView}>
            <Text style={styles.viewButtonText}>Ver documento</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const VerificationProgress: React.FC<{ documents: DocumentItem[] }> = ({ documents }) => {
  const approved = documents.filter(d => d.status === 'approved').length;
  const total = documents.filter(d => d.required).length;
  const progress = total > 0 ? (approved / total) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Estado de verificacion</Text>
        <Text style={styles.progressCount}>{approved}/{total} documentos</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      {progress === 100 ? (
        <Text style={styles.progressComplete}>
          ✓ Todos los documentos estan aprobados
        </Text>
      ) : (
        <Text style={styles.progressPending}>
          Completa tus documentos para empezar a conducir
        </Text>
      )}
    </View>
  );
};

// ==========================================
// Main Component
// ==========================================

export const DocumentsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      // In production, fetch from API
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      setDocuments(MOCK_DOCUMENTS);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'No se pudieron cargar los documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleUpload = (document: DocumentItem) => {
    // In production, this would open document picker and upload
    Alert.alert(
      'Subir ' + document.name,
      'Selecciona una imagen o PDF del documento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Camara', onPress: () => simulateUpload(document) },
        { text: 'Galeria', onPress: () => simulateUpload(document) },
      ]
    );
  };

  const simulateUpload = async (document: DocumentItem) => {
    // Simulate upload
    Alert.alert(
      'Documento enviado',
      `Tu ${document.name} ha sido enviado para revision. Te notificaremos cuando sea aprobado.`,
      [{ text: 'OK' }]
    );

    // Update local state to show pending
    setDocuments(prev =>
      prev.map(d =>
        d.id === document.id
          ? { ...d, status: 'pending' as const, uploadedAt: new Date().toISOString() }
          : d
      )
    );
  };

  const handleView = (document: DocumentItem) => {
    Alert.alert(
      document.name,
      `Estado: ${getStatusConfig(document.status).label}\n` +
      (document.uploadedAt ? `Subido: ${formatDate(document.uploadedAt)}\n` : '') +
      (document.expiryDate ? `Vence: ${formatDate(document.expiryDate)}` : ''),
      [
        { text: 'Cerrar' },
        { text: 'Actualizar', onPress: () => handleUpload(document) },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando documentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;
  const expiredCount = documents.filter(d => d.status === 'expired').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Progress Overview */}
        <VerificationProgress documents={documents} />

        {/* Alerts */}
        {(rejectedCount > 0 || expiredCount > 0) && (
          <View style={styles.alertsContainer}>
            {rejectedCount > 0 && (
              <View style={styles.alertBox}>
                <Text style={styles.alertIcon}>✗</Text>
                <Text style={styles.alertText}>
                  {rejectedCount} documento(s) rechazado(s) - Actualiza para continuar
                </Text>
              </View>
            )}
            {expiredCount > 0 && (
              <View style={[styles.alertBox, styles.alertBoxExpired]}>
                <Text style={styles.alertIcon}>!</Text>
                <Text style={styles.alertText}>
                  {expiredCount} documento(s) vencido(s) - Renueva lo antes posible
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Documents List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Documentos</Text>
          {documents.map(doc => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onUpload={() => handleUpload(doc)}
              onView={() => handleView(doc)}
            />
          ))}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Necesitas ayuda?</Text>
          <Text style={styles.helpText}>
            Si tienes problemas con tus documentos, contacta a soporte
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => Alert.alert('Soporte', 'Escribe a soporte@cercaapp.co')}
          >
            <Text style={styles.helpButtonText}>Contactar soporte</Text>
          </TouchableOpacity>
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
  },
  progressContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressComplete: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  progressPending: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  alertsContainer: {
    marginBottom: SPACING.md,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  alertBoxExpired: {
    backgroundColor: COLORS.warning + '15',
  },
  alertIcon: {
    fontSize: FONT_SIZES.lg,
    marginRight: SPACING.sm,
  },
  alertText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  documentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  documentCardRejected: {
    borderWidth: 1,
    borderColor: COLORS.error + '50',
  },
  documentCardExpired: {
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  documentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  documentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  requiredBadge: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  documentDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.xs,
  },
  statusLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  warningIcon: {
    marginRight: SPACING.xs,
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
  },
  rejectionBanner: {
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  rejectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  rejectionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  documentDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  expiredText: {
    color: COLORS.error,
  },
  documentActions: {
    marginTop: SPACING.md,
  },
  uploadButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  reuploadButton: {
    backgroundColor: COLORS.error + '15',
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  reuploadButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  viewButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  helpTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  helpButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  helpButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default DocumentsScreen;
