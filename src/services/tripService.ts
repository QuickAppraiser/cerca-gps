// ==========================================
// CERCA - Trip Service
// Handles trip creation, matching, and real-time updates
// ==========================================

import { supabase } from './supabase';
import { config } from '../config/environment';
import { Trip, Coordinates, Location } from '../types';
import { mockNearbyDrivers, mockPricing, simulateApiDelay } from './mockData';

// ==========================================
// Types
// ==========================================

export interface TripResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CreateTripData {
  passengerId: string;
  origin: Location;
  destination: Location;
  vehicleType: 'standard' | 'comfort' | 'taxi';
  rideMode: 'silent' | 'normal' | 'conversational';
  paymentMethod: 'credits' | 'cash';
  estimatedPrice: number;
  estimatedDistance: number;
  estimatedDuration: number;
  accessibilityNeeds?: string[];
}

export interface NearbyDriver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  rating: number;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  location: Coordinates;
  distance: number;
  eta: number;
}

// ==========================================
// Trip State Validation
// ==========================================

type TripStatus =
  | 'searching'
  | 'accepted'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Valid state transitions map
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  searching: ['accepted', 'cancelled'],
  accepted: ['driver_arriving', 'cancelled'],
  driver_arriving: ['driver_arrived', 'cancelled'],
  driver_arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Validates if a trip state transition is allowed
 */
const isValidTransition = (currentStatus: TripStatus, newStatus: TripStatus): boolean => {
  const validNextStates = VALID_TRANSITIONS[currentStatus] || [];
  return validNextStates.includes(newStatus);
};

/**
 * Get valid next states for a trip
 */
const getValidNextStates = (currentStatus: TripStatus): TripStatus[] => {
  return VALID_TRANSITIONS[currentStatus] || [];
};

// ==========================================
// Development Mode
// ==========================================

const DEV_MODE = config.features.enableMockData;

// Mock trip storage for dev mode
const mockTrips = new Map<string, any>();
let tripIdCounter = 1;

// ==========================================
// Trip Service
// ==========================================

export const tripService = {
  /**
   * Create a new trip request
   */
  async createTrip(data: CreateTripData): Promise<TripResult> {
    // Development mode
    if (DEV_MODE) {
      await simulateApiDelay(500, 1000);

      const tripId = `trip_${Date.now()}_${tripIdCounter++}`;
      const trip = {
        id: tripId,
        passenger_id: data.passengerId,
        origin_address: data.origin.address,
        origin_lat: data.origin.coordinates.latitude,
        origin_lng: data.origin.coordinates.longitude,
        destination_address: data.destination.address,
        destination_lat: data.destination.coordinates.latitude,
        destination_lng: data.destination.coordinates.longitude,
        vehicle_type: data.vehicleType,
        ride_mode: data.rideMode,
        payment_method: data.paymentMethod,
        estimated_price: data.estimatedPrice,
        estimated_distance: data.estimatedDistance,
        estimated_duration: data.estimatedDuration,
        status: 'searching',
        created_at: new Date().toISOString(),
      };

      mockTrips.set(tripId, trip);
      console.log('[DEV] Trip created:', tripId);

      return { success: true, data: trip };
    }

    // Production - save to Supabase
    try {
      const tripData = {
        passenger_id: data.passengerId,
        origin_address: data.origin.address,
        origin_location: `POINT(${data.origin.coordinates.longitude} ${data.origin.coordinates.latitude})`,
        destination_address: data.destination.address,
        destination_location: `POINT(${data.destination.coordinates.longitude} ${data.destination.coordinates.latitude})`,
        vehicle_type_requested: data.vehicleType,
        ride_mode: data.rideMode,
        payment_method: data.paymentMethod,
        estimated_price: data.estimatedPrice,
        estimated_distance_km: data.estimatedDistance,
        estimated_duration_minutes: data.estimatedDuration,
        accessibility_needs: data.accessibilityNeeds || [],
        status: 'searching',
      };

      const { data: trip, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single();

      if (error) {
        console.error('Create trip error:', error);
        return { success: false, error: 'Error al crear viaje' };
      }

      return { success: true, data: trip };
    } catch (err) {
      console.error('Create trip exception:', err);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Find nearby drivers for a trip
   */
  async findNearbyDrivers(
    location: Coordinates,
    vehicleType?: string,
    radiusKm: number = 5
  ): Promise<TripResult> {
    // Development mode
    if (DEV_MODE) {
      await simulateApiDelay(300, 600);

      // Filter mock drivers by vehicle type if specified
      let drivers = mockNearbyDrivers;
      if (vehicleType) {
        drivers = drivers.filter(d => d.vehicleType === vehicleType);
      }

      // Add random distance and ETA variations
      const driversWithDistance = drivers.map(d => ({
        ...d,
        distance: Math.random() * radiusKm,
        eta: Math.floor(Math.random() * 10) + 2,
      }));

      return { success: true, data: driversWithDistance };
    }

    // Production - query from Supabase
    try {
      const { data, error } = await supabase.rpc('get_nearby_drivers', {
        lat: location.latitude,
        lng: location.longitude,
        radius_km: radiusKm,
        vehicle_type: vehicleType || null,
      });

      if (error) {
        console.error('Find drivers error:', error);
        return { success: false, error: 'Error buscando conductores' };
      }

      return { success: true, data: data || [] };
    } catch (err) {
      console.error('Find drivers exception:', err);
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Notify drivers of new trip request
   */
  async notifyDrivers(tripId: string, driverIds: string[]): Promise<TripResult> {
    if (DEV_MODE) {
      console.log(`[DEV] Notifying ${driverIds.length} drivers of trip ${tripId}`);
      return { success: true };
    }

    // In production, this would send push notifications
    // For now, we'll use Supabase realtime to broadcast
    try {
      // Insert notification records
      const notifications = driverIds.map(driverId => ({
        driver_id: driverId,
        trip_id: tripId,
        type: 'trip_request',
        status: 'pending',
      }));

      // This would trigger realtime listeners on driver apps
      const { error } = await supabase
        .from('trip_notifications')
        .insert(notifications);

      if (error) {
        console.error('Notify drivers error:', error);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error notifying drivers' };
    }
  },

  /**
   * Driver accepts a trip
   */
  async acceptTrip(tripId: string, driverId: string): Promise<TripResult> {
    if (DEV_MODE) {
      await simulateApiDelay(300, 500);

      const trip = mockTrips.get(tripId);
      if (!trip) {
        return { success: false, error: 'Viaje no encontrado' };
      }

      // Pick a random mock driver
      const driver = mockNearbyDrivers[Math.floor(Math.random() * mockNearbyDrivers.length)];

      trip.status = 'accepted';
      trip.driver_id = driverId;
      trip.driver = {
        id: driver.id,
        name: driver.name,
        rating: driver.rating,
        vehicle: driver.vehicle,
        plate: driver.plate,
        location: driver.location,
        eta: driver.eta,
      };
      trip.accepted_at = new Date().toISOString();

      mockTrips.set(tripId, trip);
      console.log('[DEV] Trip accepted by driver:', driver.name);

      return { success: true, data: trip };
    }

    // Production
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          driver_id: driverId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .eq('status', 'searching') // Only if still searching
        .select(`
          *,
          driver:drivers(
            id,
            user:users(full_name, phone, rating),
            vehicle:vehicles(brand, model, color, plate_number)
          )
        `)
        .single();

      if (error) {
        console.error('Accept trip error:', error);
        return { success: false, error: 'Error al aceptar viaje' };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Driver rejects/skips a trip
   */
  async rejectTrip(tripId: string, driverId: string): Promise<TripResult> {
    if (DEV_MODE) {
      console.log(`[DEV] Driver ${driverId} rejected trip ${tripId}`);
      return { success: true };
    }

    try {
      // Just remove this driver from consideration
      const { error } = await supabase
        .from('trip_notifications')
        .update({ status: 'rejected' })
        .eq('trip_id', tripId)
        .eq('driver_id', driverId);

      return { success: !error };
    } catch (err) {
      return { success: false, error: 'Error rejecting trip' };
    }
  },

  /**
   * Update trip status with validation
   */
  async updateTripStatus(
    tripId: string,
    status: string,
    additionalData?: any
  ): Promise<TripResult> {
    const newStatus = status as TripStatus;

    if (DEV_MODE) {
      const trip = mockTrips.get(tripId);
      if (!trip) {
        return { success: false, error: 'Viaje no encontrado' };
      }

      // Validate state transition
      const currentStatus = trip.status as TripStatus;
      if (!isValidTransition(currentStatus, newStatus)) {
        console.warn(`[DEV] Invalid transition: ${currentStatus} -> ${newStatus}`);
        return {
          success: false,
          error: `Transicion de estado invalida: ${currentStatus} -> ${newStatus}. Estados validos: ${getValidNextStates(currentStatus).join(', ')}`,
        };
      }

      trip.status = status;
      Object.assign(trip, additionalData || {});
      mockTrips.set(tripId, trip);
      return { success: true, data: trip };
    }

    try {
      // First, get current trip status to validate transition
      const { data: currentTrip, error: fetchError } = await supabase
        .from('trips')
        .select('status')
        .eq('id', tripId)
        .single();

      if (fetchError || !currentTrip) {
        return { success: false, error: 'Viaje no encontrado' };
      }

      // Validate state transition
      const currentStatus = currentTrip.status as TripStatus;
      if (!isValidTransition(currentStatus, newStatus)) {
        return {
          success: false,
          error: `Transicion de estado invalida: ${currentStatus} -> ${newStatus}`,
        };
      }

      const updateData: any = { status };

      if (status === 'driver_arrived') {
        updateData.driver_arrived_at = new Date().toISOString();
      } else if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      Object.assign(updateData, additionalData || {});

      const { data, error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Error updating trip' };
    }
  },

  /**
   * Cancel a trip
   */
  async cancelTrip(tripId: string, reason?: string, cancelledBy?: string): Promise<TripResult> {
    return this.updateTripStatus(tripId, 'cancelled', {
      cancellation_reason: reason,
      cancelled_by: cancelledBy,
    });
  },

  /**
   * Complete a trip
   */
  async completeTrip(tripId: string, finalPrice: number): Promise<TripResult> {
    return this.updateTripStatus(tripId, 'completed', {
      final_price: finalPrice,
    });
  },

  /**
   * Get trip by ID
   */
  async getTrip(tripId: string): Promise<TripResult> {
    if (DEV_MODE) {
      const trip = mockTrips.get(tripId);
      return trip
        ? { success: true, data: trip }
        : { success: false, error: 'Viaje no encontrado' };
    }

    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          passenger:users!trips_passenger_id_fkey(id, full_name, phone, rating),
          driver:drivers(
            id,
            user:users(full_name, phone, rating),
            vehicle:vehicles(*)
          )
        `)
        .eq('id', tripId)
        .single();

      if (error) {
        return { success: false, error: 'Viaje no encontrado' };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Get trip history for user
   */
  async getTripHistory(
    userId: string,
    role: 'passenger' | 'driver',
    limit: number = 20
  ): Promise<TripResult> {
    if (DEV_MODE) {
      // Return mock history
      const { mockTripHistory } = require('./mockData');
      return { success: true, data: mockTripHistory.slice(0, limit) };
    }

    try {
      const column = role === 'passenger' ? 'passenger_id' : 'driver_id';

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq(column, userId)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return { success: false, error: 'Error loading history' };
    }
  },

  /**
   * Subscribe to trip updates (real-time)
   */
  subscribeToTrip(tripId: string, callback: (trip: any) => void) {
    if (DEV_MODE) {
      // Simulate finding a driver after random delay
      const findDriverDelay = Math.random() * 5000 + 3000; // 3-8 seconds

      setTimeout(() => {
        const trip = mockTrips.get(tripId);
        if (trip && trip.status === 'searching') {
          const driver = mockNearbyDrivers[Math.floor(Math.random() * mockNearbyDrivers.length)];

          trip.status = 'accepted';
          trip.driver = {
            id: driver.id,
            name: driver.name,
            rating: driver.rating,
            vehicle: driver.vehicle,
            plate: driver.plate,
            phone: '+573001234567',
            location: driver.location,
            eta: driver.eta,
          };
          trip.accepted_at = new Date().toISOString();

          mockTrips.set(tripId, trip);
          callback(trip);
        }
      }, findDriverDelay);

      return {
        unsubscribe: () => console.log('[DEV] Unsubscribed from trip updates'),
      };
    }

    // Production - use Supabase realtime
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe(),
    };
  },

  /**
   * Calculate trip price
   */
  calculatePrice(
    distanceKm: number,
    durationMinutes: number,
    vehicleType: 'standard' | 'comfort' | 'taxi' = 'standard'
  ): number {
    const pricing = mockPricing[vehicleType];
    const calculated =
      pricing.baseFare +
      distanceKm * pricing.perKm +
      durationMinutes * pricing.perMinute;

    return Math.max(Math.round(calculated / 100) * 100, pricing.minFare);
  },

  /**
   * Subscribe to pending trip requests (for drivers)
   */
  subscribeToPendingTrips(
    driverId: string,
    location: Coordinates,
    callback: (trips: any[]) => void
  ) {
    if (DEV_MODE) {
      // Simulate incoming trip requests periodically
      const interval = setInterval(() => {
        // Random chance of new trip
        if (Math.random() > 0.7) {
          const mockTrip = {
            id: `trip_${Date.now()}`,
            origin_address: 'Parque de la Vida',
            destination_address: 'Centro Comercial Portal',
            estimated_price: 8500 + Math.floor(Math.random() * 5000),
            estimated_distance: 2 + Math.random() * 5,
            payment_method: Math.random() > 0.5 ? 'credits' : 'cash',
            passenger: {
              name: 'Carlos R.',
              rating: 4.5 + Math.random() * 0.5,
            },
          };
          callback([mockTrip]);
        }
      }, 15000); // Check every 15 seconds

      return {
        unsubscribe: () => clearInterval(interval),
      };
    }

    // Production - subscribe to nearby trip requests
    const channel = supabase
      .channel('pending_trips')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trips',
          filter: `status=eq.searching`,
        },
        async (payload) => {
          // Check if trip is within range
          // This would need proper geo-filtering
          callback([payload.new]);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe(),
    };
  },

  /**
   * Subscribe to driver-specific trip requests
   */
  subscribeToDriverRequests(
    driverId: string,
    callback: (trip: any) => void
  ) {
    if (DEV_MODE) {
      // Simulate incoming trip requests periodically
      const interval = setInterval(() => {
        // Random chance of new trip (20% every 20 seconds)
        if (Math.random() > 0.8) {
          const destinations = [
            'Centro Comercial Portal del Quindio',
            'Terminal de Transporte',
            'Universidad del Quindio',
            'Hospital San Juan de Dios',
            'Aeropuerto El Eden',
          ];
          const origins = [
            'Parque de la Vida',
            'Plaza de Bolivar',
            'Barrio La Castellana',
            'Centro Armenia',
          ];

          const mockTrip = {
            id: `trip_${Date.now()}`,
            origin: {
              address: origins[Math.floor(Math.random() * origins.length)],
              coordinates: {
                latitude: 4.5339 + (Math.random() - 0.5) * 0.02,
                longitude: -75.6811 + (Math.random() - 0.5) * 0.02,
              },
            },
            destination: {
              address: destinations[Math.floor(Math.random() * destinations.length)],
              coordinates: {
                latitude: 4.5339 + (Math.random() - 0.5) * 0.03,
                longitude: -75.6811 + (Math.random() - 0.5) * 0.03,
              },
            },
            price: {
              total: 8500 + Math.floor(Math.random() * 8000),
            },
            route: {
              distance: (2 + Math.random() * 6) * 1000, // meters
              duration: 5 + Math.floor(Math.random() * 15), // minutes
            },
            paymentMethod: Math.random() > 0.5 ? 'credits' : 'cash',
            passenger: {
              id: 'passenger_mock_1',
              name: ['Carlos R.', 'Maria L.', 'Juan P.', 'Ana S.'][Math.floor(Math.random() * 4)],
              rating: 4.5 + Math.random() * 0.5,
            },
            createdAt: new Date(),
          };

          console.log('[DEV] New trip request for driver');
          callback(mockTrip);
        }
      }, 20000); // Check every 20 seconds

      return {
        unsubscribe: () => {
          clearInterval(interval);
          console.log('[DEV] Unsubscribed from driver requests');
        },
      };
    }

    // Production - subscribe to notifications for this driver
    const channel = supabase
      .channel(`driver_requests:${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_notifications',
          filter: `driver_id=eq.${driverId}`,
        },
        async (payload: any) => {
          // Fetch the full trip data
          const { data: trip } = await supabase
            .from('trips')
            .select('*')
            .eq('id', payload.new.trip_id)
            .single();

          if (trip) {
            callback(trip);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe(),
    };
  },

  /**
   * Update driver's current location
   */
  async updateDriverLocation(
    driverId: string,
    location: Coordinates
  ): Promise<TripResult> {
    if (DEV_MODE) {
      console.log('[DEV] Driver location updated:', location.latitude.toFixed(4), location.longitude.toFixed(4));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          current_location: `POINT(${location.longitude} ${location.latitude})`,
          last_location_update: new Date().toISOString(),
          is_online: true,
        })
        .eq('user_id', driverId);

      if (error) {
        console.error('Update location error:', error);
        return { success: false, error: 'Error actualizando ubicacion' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error de conexion' };
    }
  },

  /**
   * Get driver statistics
   */
  async getDriverStats(
    driverId: string,
    period: 'today' | 'week' | 'month' | 'all' = 'today'
  ): Promise<TripResult> {
    if (DEV_MODE) {
      // Return mock stats
      const mockStats = {
        today: { earnings: 125000, tripCount: 8, rating: 4.8, hoursOnline: 6 },
        week: { earnings: 650000, tripCount: 42, rating: 4.8, hoursOnline: 35 },
        month: { earnings: 2800000, tripCount: 180, rating: 4.7, hoursOnline: 145 },
        all: { earnings: 15000000, tripCount: 950, rating: 4.7, hoursOnline: 780 },
      };

      return { success: true, data: mockStats[period] };
    }

    try {
      let startDate: Date;
      const now = new Date();

      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0); // All time
      }

      const { data, error } = await supabase
        .from('trips')
        .select('final_price, rating_for_driver')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('completed_at', startDate.toISOString());

      if (error) {
        return { success: false, error: error.message };
      }

      const trips = data || [];
      const earnings = trips.reduce((sum, t) => sum + (t.final_price || 0), 0);
      const ratings = trips.filter(t => t.rating_for_driver).map(t => t.rating_for_driver);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 5.0;

      return {
        success: true,
        data: {
          earnings,
          tripCount: trips.length,
          rating: avgRating,
        },
      };
    } catch (err) {
      return { success: false, error: 'Error loading stats' };
    }
  },

  /**
   * Subscribe to trip updates (real-time) - for passengers tracking their trip
   */
  subscribeToTripUpdates(tripId: string, callback: (update: any) => void) {
    if (DEV_MODE) {
      // Simulate trip status updates
      let statusIndex = 0;
      const statuses = [
        { status: 'driver_arriving', eta: 3, driverLocation: { latitude: 14.635, longitude: -90.507 } },
        { status: 'driver_arrived', eta: 0, driverLocation: { latitude: 14.6349, longitude: -90.5069 } },
        { status: 'trip_started', eta: 15, driverLocation: { latitude: 14.636, longitude: -90.508 } },
        { status: 'trip_completed', eta: 0, driverLocation: { latitude: 14.645, longitude: -90.517 } },
      ];

      const interval = setInterval(() => {
        if (statusIndex < statuses.length) {
          console.log('[DEV] Trip update:', statuses[statusIndex].status);
          callback(statuses[statusIndex]);
          statusIndex++;
        } else {
          clearInterval(interval);
        }
      }, 8000); // Update every 8 seconds

      return () => {
        clearInterval(interval);
        console.log('[DEV] Unsubscribed from trip updates');
      };
    }

    // Production - use Supabase realtime
    const channel = supabase
      .channel(`trip_updates:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload: any) => {
          const update: any = {};
          const newData = payload.new as any;

          if (newData.status) update.status = newData.status;
          if (newData.driver_current_lat && newData.driver_current_lng) {
            update.driverLocation = {
              latitude: newData.driver_current_lat,
              longitude: newData.driver_current_lng,
            };
          }
          if (newData.eta_minutes) update.eta = newData.eta_minutes;

          callback(update);
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  },

  /**
   * Set driver online/offline status
   */
  async setDriverOnlineStatus(
    driverId: string,
    isOnline: boolean
  ): Promise<TripResult> {
    if (DEV_MODE) {
      console.log('[DEV] Driver online status:', isOnline);
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          is_online: isOnline,
          last_online_change: new Date().toISOString(),
        })
        .eq('user_id', driverId);

      return { success: !error };
    } catch (err) {
      return { success: false, error: 'Error updating status' };
    }
  },
};
