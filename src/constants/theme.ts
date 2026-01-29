// ==========================================
// CERCA - Tema y Constantes de Diseño
// ==========================================

export const COLORS = {
  // Colores principales de CERCA
  primary: '#2D6A4F',      // Verde confianza
  primaryLight: '#40916C',
  primaryDark: '#1B4332',

  secondary: '#FF6B35',    // Naranja energía/comunidad
  secondaryLight: '#FF8C5A',
  secondaryDark: '#E55A2B',

  // Estados
  success: '#2D6A4F',
  warning: '#F4A261',
  error: '#E63946',
  info: '#457B9D',

  // Emergencia
  emergency: '#E63946',
  emergencyLight: '#FF6B6B',

  // Neutros
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F8F9FA',
    100: '#F1F3F5',
    200: '#E9ECEF',
    300: '#DEE2E6',
    400: '#CED4DA',
    500: '#ADB5BD',
    600: '#6C757D',
    700: '#495057',
    800: '#343A40',
    900: '#212529',
  },

  // Fondos
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F5',

  // Texto
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textDisabled: '#ADB5BD',
  textOnPrimary: '#FFFFFF',

  // Mapa
  mapRoute: '#2D6A4F',
  mapOrigin: '#2D6A4F',
  mapDestination: '#E63946',
  mapTraffic: '#F4A261',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 40,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Constantes de Armenia, Quindío
export const ARMENIA_CONFIG = {
  // Centro de la ciudad (usado como fallback cuando no hay GPS)
  center: {
    latitude: 4.5339,
    longitude: -75.6811,
  },
  initialRegion: {
    latitude: 4.5339,
    longitude: -75.6811,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  bounds: {
    north: 4.58,
    south: 4.48,
    east: -75.62,
    west: -75.74,
  },
};

// Radio de búsqueda para emergencias (metros)
export const EMERGENCY_RADIUS = [10, 50, 100, 300, 500];

// Configuración de viajes
export const TRIP_CONFIG = {
  baseFare: 4500,           // Tarifa base COP
  perKmRate: 1200,          // Por kilómetro
  perMinuteRate: 200,       // Por minuto
  minimumFare: 5000,        // Mínimo
  cancellationWindow: 120,  // Segundos para cancelar sin penalidad
  driverArrivalBonus: 180,  // Segundos de espera gratis
  commissionRate: 0.12,     // 12% comisión CERCA
};

// Tokens
export const TOKEN_CONFIG = {
  perTrip: 10,
  per5StarRating: 5,
  perValidReport: 15,
  perEmergencyHelp: 50,
  discountConversion: 100, // 100 tokens = 1000 COP descuento
};
