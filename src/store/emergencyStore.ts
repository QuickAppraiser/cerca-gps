// ==========================================
// CERCA - Store de Emergencias (Zustand)
// ==========================================

import { create } from 'zustand';
import {
  EmergencyAlert,
  EmergencyType,
  EmergencyStatus,
  Coordinates,
  TrafficReport,
  ReportType,
} from '../types';
import { EMERGENCY_RADIUS } from '../constants/theme';

interface EmergencyState {
  // Alerta activa del usuario
  activeAlert: EmergencyAlert | null;
  isAlertActive: boolean;

  // Alertas cercanas (para responder)
  nearbyAlerts: EmergencyAlert[];

  // Reportes viales
  activeReports: TrafficReport[];
  userReports: TrafficReport[];

  // Acciones de emergencia
  activateEmergency: (type: EmergencyType, location: Coordinates, tripId?: string) => void;
  escalateEmergency: () => void;
  resolveEmergency: (wasReal: boolean) => void;
  cancelEmergency: () => void;
  updateLocation: (location: Coordinates) => void;

  // Responder a emergencias de otros
  setNearbyAlerts: (alerts: EmergencyAlert[]) => void;
  respondToAlert: (alertId: string) => void;

  // Reportes viales
  addReport: (report: TrafficReport) => void;
  confirmReport: (reportId: string) => void;
  denyReport: (reportId: string) => void;
  setActiveReports: (reports: TrafficReport[]) => void;
  removeExpiredReports: () => void;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  activeAlert: null,
  isAlertActive: false,
  nearbyAlerts: [],
  activeReports: [],
  userReports: [],

  activateEmergency: (type, location, tripId) => {
    const alert: EmergencyAlert = {
      id: `emergency_${Date.now()}`,
      userId: '', // Se actualizará con el userId real
      tripId,
      type,
      status: 'active',
      location,
      locationHistory: [{ coordinates: location, timestamp: new Date() }],
      escalationLevel: 1, // Empieza en 10 metros
      respondersNotified: [],
      respondersConfirmed: [],
      createdAt: new Date(),
    };
    set({ activeAlert: alert, isAlertActive: true });
  },

  escalateEmergency: () => {
    const { activeAlert } = get();
    if (activeAlert && activeAlert.escalationLevel < 5) {
      set({
        activeAlert: {
          ...activeAlert,
          escalationLevel: (activeAlert.escalationLevel + 1) as 1 | 2 | 3 | 4 | 5,
        }
      });
    }
  },

  resolveEmergency: (wasReal) => {
    const { activeAlert } = get();
    if (activeAlert) {
      set({
        activeAlert: {
          ...activeAlert,
          status: wasReal ? 'resolved' : 'false_alarm',
          resolvedAt: new Date(),
        },
        isAlertActive: false,
      });
    }
  },

  cancelEmergency: () => {
    const { activeAlert } = get();
    if (activeAlert) {
      set({
        activeAlert: {
          ...activeAlert,
          status: 'cancelled',
        },
        isAlertActive: false,
      });
    }
  },

  updateLocation: (location) => {
    const { activeAlert } = get();
    if (activeAlert) {
      set({
        activeAlert: {
          ...activeAlert,
          location,
          locationHistory: [
            ...activeAlert.locationHistory,
            { coordinates: location, timestamp: new Date() }
          ],
        }
      });
    }
  },

  setNearbyAlerts: (nearbyAlerts) => set({ nearbyAlerts }),

  respondToAlert: (alertId) => {
    const { nearbyAlerts } = get();
    const alert = nearbyAlerts.find(a => a.id === alertId);
    if (alert) {
      set({
        nearbyAlerts: nearbyAlerts.map(a =>
          a.id === alertId
            ? { ...a, status: 'responding' as EmergencyStatus }
            : a
        )
      });
    }
  },

  addReport: (report) => set((state) => ({
    activeReports: [...state.activeReports, report],
    userReports: [...state.userReports, report],
  })),

  confirmReport: (reportId) => set((state) => ({
    activeReports: state.activeReports.map(r =>
      r.id === reportId
        ? { ...r, confirmations: r.confirmations + 1 }
        : r
    )
  })),

  denyReport: (reportId) => set((state) => ({
    activeReports: state.activeReports.map(r =>
      r.id === reportId
        ? { ...r, denials: r.denials + 1 }
        : r
    )
  })),

  setActiveReports: (activeReports) => set({ activeReports }),

  removeExpiredReports: () => set((state) => ({
    activeReports: state.activeReports.filter(r =>
      new Date(r.expiresAt) > new Date()
    )
  })),
}));

// Helper: Obtener radio actual de emergencia
export const getCurrentEmergencyRadius = (level: number): number => {
  return EMERGENCY_RADIUS[level - 1] || EMERGENCY_RADIUS[0];
};
