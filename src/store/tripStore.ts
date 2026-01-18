// ==========================================
// CERCA - Store de Viajes (Zustand)
// ==========================================

import { create } from 'zustand';
import {
  Trip,
  Location,
  TripStatus,
  Coordinates,
  PaymentMethod,
  AccessibilityOption,
} from '../types';

interface TripState {
  // Estado del viaje actual
  currentTrip: Trip | null;

  // Estado de búsqueda/creación de viaje
  origin: Location | null;
  destination: Location | null;
  selectedPaymentMethod: PaymentMethod;
  accessibilityNeeds: AccessibilityOption[];
  rideMode: 'silent' | 'normal' | 'conversational';

  // Estado del conductor (si es conductor)
  isOnline: boolean;
  driverLocation: Coordinates | null;
  pendingTripRequests: Trip[];

  // Historial
  tripHistory: Trip[];

  // Acciones pasajero
  setOrigin: (origin: Location | null) => void;
  setDestination: (destination: Location | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAccessibilityNeeds: (needs: AccessibilityOption[]) => void;
  setRideMode: (mode: 'silent' | 'normal' | 'conversational') => void;
  setCurrentTrip: (trip: Trip | null) => void;
  updateTripStatus: (status: TripStatus) => void;
  clearTripSetup: () => void;

  // Acciones conductor
  setOnline: (isOnline: boolean) => void;
  setDriverLocation: (location: Coordinates | null) => void;
  addPendingRequest: (trip: Trip) => void;
  removePendingRequest: (tripId: string) => void;

  // Historial
  addToHistory: (trip: Trip) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  origin: null,
  destination: null,
  selectedPaymentMethod: 'credits',
  accessibilityNeeds: [],
  rideMode: 'normal',
  isOnline: false,
  driverLocation: null,
  pendingTripRequests: [],
  tripHistory: [],

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setPaymentMethod: (selectedPaymentMethod) => set({ selectedPaymentMethod }),
  setAccessibilityNeeds: (accessibilityNeeds) => set({ accessibilityNeeds }),
  setRideMode: (rideMode) => set({ rideMode }),

  setCurrentTrip: (currentTrip) => set({ currentTrip }),

  updateTripStatus: (status) => {
    const { currentTrip } = get();
    if (currentTrip) {
      set({
        currentTrip: {
          ...currentTrip,
          status,
          ...(status === 'completed' ? { completedAt: new Date() } : {}),
          ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
        }
      });
    }
  },

  clearTripSetup: () => set({
    origin: null,
    destination: null,
    accessibilityNeeds: [],
    rideMode: 'normal',
  }),

  setOnline: (isOnline) => set({ isOnline }),
  setDriverLocation: (driverLocation) => set({ driverLocation }),

  addPendingRequest: (trip) => set((state) => ({
    pendingTripRequests: [...state.pendingTripRequests, trip]
  })),

  removePendingRequest: (tripId) => set((state) => ({
    pendingTripRequests: state.pendingTripRequests.filter(t => t.id !== tripId)
  })),

  addToHistory: (trip) => set((state) => ({
    tripHistory: [trip, ...state.tripHistory]
  })),
}));
