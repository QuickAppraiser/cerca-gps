// ==========================================
// CERCA - Pantalla de Reportes Viales
// ==========================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { COLORS, SPACING, FONT_SIZES, ARMENIA_CONFIG } from '../../constants/theme';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useAuthStore } from '../../store/authStore';
import { TrafficReport, ReportType, Coordinates } from '../../types';

const { width } = Dimensions.get('window');

type TrafficReportsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const REPORT_TYPES: { type: ReportType; label: string; icon: string; duration: number }[] = [
  { type: 'checkpoint', label: 'Retén', icon: '🚔', duration: 120 },
  { type: 'accident', label: 'Accidente', icon: '💥', duration: 60 },
  { type: 'traffic', label: 'Trancón', icon: '🚗', duration: 45 },
  { type: 'roadClosed', label: 'Vía cerrada', icon: '🚧', duration: 180 },
  { type: 'roadDamage', label: 'Daño en vía', icon: '🕳️', duration: 1440 },
  { type: 'police', label: 'Policía', icon: '👮', duration: 60 },
  { type: 'hazard', label: 'Peligro', icon: '⚠️', duration: 30 },
];

// Mock de reportes activos en Armenia
const MOCK_REPORTS: TrafficReport[] = [
  {
    id: 'report_1',
    userId: 'user_1',
    type: 'checkpoint',
    location: { latitude: 4.5380, longitude: -75.6750 },
    description: 'Retén de la policía en la Av. Bolívar',
    confirmations: 12,
    denials: 1,
    credibilityScore: 0.92,
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 20 * 60 * 1000),
  },
  {
    id: 'report_2',
    userId: 'user_2',
    type: 'traffic',
    location: { latitude: 4.5320, longitude: -75.6820 },
    description: 'Trancón por obras en la calle 21',
    confirmations: 8,
    denials: 2,
    credibilityScore: 0.8,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'report_3',
    userId: 'user_3',
    type: 'accident',
    location: { latitude: 4.5450, longitude: -75.6680 },
    description: 'Accidente menor, un carril bloqueado',
    confirmations: 5,
    denials: 0,
    credibilityScore: 1.0,
    isActive: true,
    expiresAt: new Date(Date.now() + 45 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
];

export const TrafficReportsScreen: React.FC<TrafficReportsScreenProps> = ({
  navigation,
}) => {
  const mapRef = useRef<MapView>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [reports, setReports] = useState<TrafficReport[]>(MOCK_REPORTS);

  const { user } = useAuthStore();
  const { addReport, confirmReport, denyReport } = useEmergencyStore();

  const handleCreateReport = () => {
    if (!selectedReportType) return;

    // En producción, obtener ubicación real
    const mockLocation: Coordinates = {
      latitude: 4.5339 + (Math.random() - 0.5) * 0.02,
      longitude: -75.6811 + (Math.random() - 0.5) * 0.02,
    };

    const reportType = REPORT_TYPES.find(r => r.type === selectedReportType);
    const newReport: TrafficReport = {
      id: `report_${Date.now()}`,
      userId: user?.id || '',
      type: selectedReportType,
      location: mockLocation,
      confirmations: 0,
      denials: 0,
      credibilityScore: user?.reputation?.reportAccuracy || 0.5,
      isActive: true,
      expiresAt: new Date(Date.now() + (reportType?.duration || 60) * 60 * 1000),
      createdAt: new Date(),
    };

    setReports([newReport, ...reports]);
    addReport(newReport);
    setShowReportModal(false);
    setSelectedReportType(null);

    Alert.alert(
      '¡Reporte enviado!',
      'Gracias por ayudar a la comunidad CERCA. Tu reporte será visible para otros usuarios.',
      [{ text: 'OK' }]
    );
  };

  const handleConfirmReport = (reportId: string) => {
    setReports(reports.map(r =>
      r.id === reportId ? { ...r, confirmations: r.confirmations + 1 } : r
    ));
    confirmReport(reportId);
  };

  const handleDenyReport = (reportId: string) => {
    setReports(reports.map(r =>
      r.id === reportId ? { ...r, denials: r.denials + 1 } : r
    ));
    denyReport(reportId);
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h`;
  };

  const getReportIcon = (type: ReportType) => {
    return REPORT_TYPES.find(r => r.type === type)?.icon || '📍';
  };

  const renderReportItem = ({ item }: { item: TrafficReport }) => (
    <Card style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportIcon}>{getReportIcon(item.type)}</Text>
        <View style={styles.reportInfo}>
          <Text style={styles.reportType}>
            {REPORT_TYPES.find(r => r.type === item.type)?.label}
          </Text>
          <Text style={styles.reportTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        <View style={styles.credibilityBadge}>
          <Text style={styles.credibilityText}>
            {Math.round(item.credibilityScore * 100)}%
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.reportDescription}>{item.description}</Text>
      )}

      <View style={styles.reportActions}>
        <View style={styles.confirmations}>
          <Text style={styles.confirmationCount}>
            👍 {item.confirmations}
          </Text>
          <Text style={styles.confirmationCount}>
            👎 {item.denials}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleConfirmReport(item.id)}
          >
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyReport(item.id)}
          >
            <Text style={styles.denyButtonText}>No está</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes Viales</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={viewMode === 'map' ? styles.toggleTextActive : styles.toggleText}>
              🗺️
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={viewMode === 'list' ? styles.toggleTextActive : styles.toggleText}>
              📋
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Contenido */}
      {viewMode === 'map' ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={ARMENIA_CONFIG.initialRegion}
          showsUserLocation
        >
          {reports.map((report) => (
            <Marker
              key={report.id}
              coordinate={report.location}
              title={REPORT_TYPES.find(r => r.type === report.type)?.label}
              description={report.description || getTimeAgo(report.createdAt)}
            >
              <View style={styles.mapMarker}>
                <Text style={styles.mapMarkerIcon}>{getReportIcon(report.type)}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Botón de nuevo reporte */}
      <TouchableOpacity
        style={styles.newReportButton}
        onPress={() => setShowReportModal(true)}
      >
        <Text style={styles.newReportButtonText}>+ Nuevo Reporte</Text>
      </TouchableOpacity>

      {/* Modal de nuevo reporte */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Reporte Vial</Text>
            <Text style={styles.modalSubtitle}>
              ¿Qué quieres reportar?
            </Text>

            <View style={styles.reportTypesGrid}>
              {REPORT_TYPES.map(({ type, label, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reportTypeButton,
                    selectedReportType === type && styles.reportTypeSelected,
                  ]}
                  onPress={() => setSelectedReportType(type)}
                >
                  <Text style={styles.reportTypeIcon}>{icon}</Text>
                  <Text
                    style={[
                      styles.reportTypeLabel,
                      selectedReportType === type && styles.reportTypeLabelSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Reportar"
                onPress={handleCreateReport}
                disabled={!selectedReportType}
                fullWidth
              />
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setShowReportModal(false);
                  setSelectedReportType(null);
                }}
              >
                <Text style={styles.cancelModalText}>Cancelar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reputationNote}>
              📊 Tu reputación actual de reportes: {Math.round((user?.reputation?.reportAccuracy || 0.5) * 100)}%
            </Text>
          </View>
        </View>
      </Modal>
    </View>
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
    zIndex: 10,
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    fontSize: 16,
  },
  toggleTextActive: {
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  mapMarker: {
    backgroundColor: COLORS.white,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  mapMarkerIcon: {
    fontSize: 20,
  },
  listContent: {
    padding: SPACING.md,
  },
  reportCard: {
    marginBottom: SPACING.md,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reportIcon: {
    fontSize: 28,
    marginRight: SPACING.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportType: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  reportTime: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  credibilityBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  credibilityText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.sm,
  },
  confirmations: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  confirmationCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.success + '20',
  },
  confirmButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
    fontWeight: '500',
  },
  denyButton: {
    backgroundColor: COLORS.gray[100],
  },
  denyButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  newReportButton: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  newReportButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  reportTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  reportTypeButton: {
    width: '31%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  reportTypeSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  reportTypeIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  reportTypeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  reportTypeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalActions: {
    marginBottom: SPACING.md,
  },
  cancelModalButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  cancelModalText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  reputationNote: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.sm,
    borderRadius: 8,
  },
});
