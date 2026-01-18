// ==========================================
// CERCA - Configuración de Supabase
// ==========================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Variables de entorno - Configurar en app.config.js o .env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Adapter para SecureStore (almacenamiento seguro en el dispositivo)
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      console.error('Error saving to SecureStore');
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      console.error('Error removing from SecureStore');
    }
  },
};

// Cliente de Supabase (usando any para flexibilidad durante desarrollo)
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ==========================================
// Funciones de Autenticación
// ==========================================

export const authService = {
  // Enviar código OTP al teléfono
  async sendOTP(phone: string) {
    const formattedPhone = phone.startsWith('+57') ? phone : `+57${phone}`;
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    return { data, error };
  },

  // Verificar código OTP
  async verifyOTP(phone: string, token: string) {
    const formattedPhone = phone.startsWith('+57') ? phone : `+57${phone}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token,
      type: 'sms',
    });
    return { data, error };
  },

  // Obtener sesión actual
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Escuchar cambios de autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ==========================================
// Funciones de Usuarios
// ==========================================

export const userService = {
  // Obtener perfil del usuario
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Crear o actualizar perfil
  async upsertProfile(profile: any) {
    const { data, error } = await supabase
      .from('users')
      .upsert(profile)
      .select()
      .single();
    return { data, error };
  },

  // Actualizar créditos
  async updateCredits(userId: string, amount: number) {
    const { data, error } = await supabase.rpc('update_user_credits', {
      user_id: userId,
      amount,
    });
    return { data, error };
  },

  // Actualizar tokens
  async updateTokens(userId: string, amount: number) {
    const { data, error } = await supabase.rpc('update_user_tokens', {
      user_id: userId,
      amount,
    });
    return { data, error };
  },
};

// ==========================================
// Funciones de Conductores
// ==========================================

export const driverService = {
  // Obtener perfil de conductor
  async getDriverProfile(userId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        vehicle:vehicles(*),
        documents:driver_documents(*)
      `)
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  // Actualizar ubicación del conductor
  async updateLocation(driverId: string, latitude: number, longitude: number) {
    const { error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: driverId,
        location: `POINT(${longitude} ${latitude})`,
        updated_at: new Date().toISOString(),
      });
    return { error };
  },

  // Obtener conductores cercanos
  async getNearbyDrivers(latitude: number, longitude: number, radiusKm: number = 5) {
    const { data, error } = await supabase.rpc('get_nearby_drivers', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
    });
    return { data, error };
  },

  // Cambiar estado online/offline
  async setOnlineStatus(driverId: string, isOnline: boolean) {
    const { error } = await supabase
      .from('drivers')
      .update({ is_online: isOnline })
      .eq('id', driverId);
    return { error };
  },
};

// ==========================================
// Funciones de Viajes
// ==========================================

export const tripService = {
  // Crear solicitud de viaje
  async createTrip(tripData: any) {
    const { data, error } = await supabase
      .from('trips')
      .insert(tripData)
      .select()
      .single();
    return { data, error };
  },

  // Obtener viaje por ID
  async getTrip(tripId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        passenger:users!trips_passenger_id_fkey(*),
        driver:drivers(*, user:users(*), vehicle:vehicles(*))
      `)
      .eq('id', tripId)
      .single();
    return { data, error };
  },

  // Actualizar estado del viaje
  async updateTripStatus(tripId: string, status: string, additionalData?: any) {
    const { data, error } = await supabase
      .from('trips')
      .update({ status, ...additionalData })
      .eq('id', tripId)
      .select()
      .single();
    return { data, error };
  },

  // Conductor acepta viaje
  async acceptTrip(tripId: string, driverId: string) {
    const { data, error } = await supabase
      .from('trips')
      .update({
        driver_id: driverId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .eq('status', 'searching')
      .select()
      .single();
    return { data, error };
  },

  // Historial de viajes
  async getTripHistory(userId: string, role: 'passenger' | 'driver', limit: number = 20) {
    const column = role === 'passenger' ? 'passenger_id' : 'driver_id';
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq(column, userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  // Suscribirse a actualizaciones del viaje en tiempo real
  subscribeToTrip(tripId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        callback
      )
      .subscribe();
  },
};

// ==========================================
// Funciones de Rutas Comunitarias
// ==========================================

export const communityRouteService = {
  // Obtener rutas disponibles
  async getAvailableRoutes(latitude?: number, longitude?: number) {
    let query = supabase
      .from('community_routes')
      .select(`
        *,
        driver:drivers(*, user:users(*))
      `)
      .eq('is_active', true);

    // TODO: Filtrar por ubicación si se proporciona
    const { data, error } = await query;
    return { data, error };
  },

  // Crear ruta comunitaria
  async createRoute(routeData: any) {
    const { data, error } = await supabase
      .from('community_routes')
      .insert(routeData)
      .select()
      .single();
    return { data, error };
  },

  // Reservar cupo
  async reserveSeat(reservationData: any) {
    const { data, error } = await supabase
      .from('route_reservations')
      .insert(reservationData)
      .select()
      .single();

    if (!error) {
      // Actualizar cupos disponibles
      await supabase.rpc('decrement_available_seats', {
        route_id: reservationData.route_id,
        seats: reservationData.seats_reserved,
      });
    }

    return { data, error };
  },
};

// ==========================================
// Funciones de Reportes Viales
// ==========================================

export const trafficReportService = {
  // Obtener reportes activos
  async getActiveReports(latitude: number, longitude: number, radiusKm: number = 10) {
    const { data, error } = await supabase.rpc('get_nearby_reports', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
    });
    return { data, error };
  },

  // Crear reporte
  async createReport(reportData: any) {
    const { data, error } = await supabase
      .from('traffic_reports')
      .insert(reportData)
      .select()
      .single();
    return { data, error };
  },

  // Confirmar reporte
  async confirmReport(reportId: string, userId: string) {
    const { error } = await supabase.rpc('confirm_report', {
      report_id: reportId,
      user_id: userId,
    });
    return { error };
  },

  // Denegar reporte
  async denyReport(reportId: string, userId: string) {
    const { error } = await supabase.rpc('deny_report', {
      report_id: reportId,
      user_id: userId,
    });
    return { error };
  },
};

// ==========================================
// Funciones de Emergencias
// ==========================================

export const emergencyService = {
  // Crear alerta de emergencia
  async createAlert(alertData: any) {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert(alertData)
      .select()
      .single();
    return { data, error };
  },

  // Actualizar alerta
  async updateAlert(alertId: string, updateData: any) {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single();
    return { data, error };
  },

  // Obtener alertas cercanas
  async getNearbyAlerts(latitude: number, longitude: number, radiusMeters: number) {
    const { data, error } = await supabase.rpc('get_nearby_alerts', {
      lat: latitude,
      lng: longitude,
      radius_m: radiusMeters,
    });
    return { data, error };
  },

  // Responder a alerta
  async respondToAlert(alertId: string, responderId: string) {
    const { error } = await supabase.rpc('respond_to_alert', {
      alert_id: alertId,
      responder_id: responderId,
    });
    return { error };
  },

  // Suscribirse a alertas cercanas en tiempo real
  subscribeToNearbyAlerts(latitude: number, longitude: number, callback: (payload: any) => void) {
    return supabase
      .channel('emergency_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_alerts',
        },
        callback
      )
      .subscribe();
  },
};

// ==========================================
// Funciones de Calificaciones
// ==========================================

export const ratingService = {
  // Calificar viaje
  async rateTrip(ratingData: {
    tripId: string;
    raterId: string;
    ratedId: string;
    score: number;
    comment?: string;
    tags?: string[];
    raterRole: 'passenger' | 'driver';
  }) {
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        trip_id: ratingData.tripId,
        rater_id: ratingData.raterId,
        rated_id: ratingData.ratedId,
        score: ratingData.score,
        comment: ratingData.comment,
        tags: ratingData.tags,
        rater_role: ratingData.raterRole,
      })
      .select()
      .single();

    if (!error) {
      // Actualizar promedio de rating del usuario calificado
      await supabase.rpc('update_user_rating', {
        user_id: ratingData.ratedId,
      });
    }

    return { data, error };
  },

  // Obtener calificaciones de usuario
  async getUserRatings(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('rated_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },
};
