// ==========================================
// CERCA - Mock Data System
// Comprehensive test data for development and testing
// ==========================================

import { ARMENIA_CONFIG } from '../constants/theme';

// ==========================================
// Mock Users
// ==========================================

export const mockUsers = {
  passenger: {
    id: 'user-001',
    phone: '+573001234567',
    fullName: 'Carlos Ramírez',
    email: 'carlos@example.com',
    avatar: null,
    role: 'passenger' as const,
    credits: 45000,
    tokens: 150,
    rating: 4.8,
    totalTrips: 23,
    isVerified: true,
    createdAt: '2024-06-15T10:00:00Z',
    preferences: {
      defaultPaymentMethod: 'credits',
      preferredVehicleType: 'standard',
      rideMode: 'normal',
      notifications: true,
    },
  },
  driver: {
    id: 'user-002',
    phone: '+573009876543',
    fullName: 'María González',
    email: 'maria@example.com',
    avatar: null,
    role: 'driver' as const,
    credits: 125000,
    tokens: 450,
    rating: 4.9,
    totalTrips: 156,
    isVerified: true,
    createdAt: '2024-01-10T10:00:00Z',
  },
};

export const mockDriver = {
  id: 'driver-001',
  userId: 'user-002',
  isOnline: true,
  isAvailable: true,
  acceptanceRate: 0.92,
  completionRate: 0.98,
  totalEarnings: 2450000,
  todayEarnings: 85000,
  vehicle: {
    id: 'vehicle-001',
    type: 'standard',
    brand: 'Chevrolet',
    model: 'Spark GT',
    year: 2022,
    color: 'Blanco',
    plate: 'ABC123',
    capacity: 4,
    hasAirConditioning: true,
    hasAccessibility: false,
  },
  documents: {
    license: { status: 'verified', expiresAt: '2026-06-15' },
    soat: { status: 'verified', expiresAt: '2025-08-20' },
    techReview: { status: 'verified', expiresAt: '2025-11-30' },
  },
  location: {
    latitude: ARMENIA_CONFIG.center.latitude + 0.005,
    longitude: ARMENIA_CONFIG.center.longitude - 0.003,
  },
};

// ==========================================
// Mock Drivers for Map
// ==========================================

export const mockNearbyDrivers = [
  {
    id: 'driver-001',
    name: 'María G.',
    rating: 4.9,
    vehicleType: 'standard',
    vehicle: 'Spark GT Blanco',
    plate: 'ABC123',
    eta: 3,
    location: {
      latitude: ARMENIA_CONFIG.center.latitude + 0.003,
      longitude: ARMENIA_CONFIG.center.longitude - 0.002,
    },
  },
  {
    id: 'driver-002',
    name: 'Juan P.',
    rating: 4.7,
    vehicleType: 'comfort',
    vehicle: 'Onix Negro',
    plate: 'XYZ789',
    eta: 5,
    location: {
      latitude: ARMENIA_CONFIG.center.latitude - 0.004,
      longitude: ARMENIA_CONFIG.center.longitude + 0.003,
    },
  },
  {
    id: 'driver-003',
    name: 'Pedro M.',
    rating: 4.8,
    vehicleType: 'taxi',
    vehicle: 'Taxi Amarillo',
    plate: 'TAX456',
    eta: 2,
    location: {
      latitude: ARMENIA_CONFIG.center.latitude + 0.001,
      longitude: ARMENIA_CONFIG.center.longitude + 0.004,
    },
  },
  {
    id: 'driver-004',
    name: 'Ana L.',
    rating: 4.6,
    vehicleType: 'standard',
    vehicle: 'Picanto Rojo',
    plate: 'DEF321',
    eta: 7,
    location: {
      latitude: ARMENIA_CONFIG.center.latitude - 0.002,
      longitude: ARMENIA_CONFIG.center.longitude - 0.005,
    },
  },
];

// ==========================================
// Mock Popular Destinations in Armenia
// ==========================================

export const mockPopularDestinations = [
  {
    id: 'dest-001',
    name: 'Centro Comercial Portal del Quindío',
    address: 'Av. Bolívar #12-34, Armenia',
    coordinates: {
      latitude: 4.5402,
      longitude: -75.6752,
    },
    icon: '🛒',
    category: 'shopping',
  },
  {
    id: 'dest-002',
    name: 'Parque de la Vida',
    address: 'Carrera 19 #10-30, Armenia',
    coordinates: {
      latitude: 4.5356,
      longitude: -75.6789,
    },
    icon: '🌳',
    category: 'park',
  },
  {
    id: 'dest-003',
    name: 'Terminal de Transporte',
    address: 'Calle 35 #20-68, Armenia',
    coordinates: {
      latitude: 4.5289,
      longitude: -75.6923,
    },
    icon: '🚌',
    category: 'transport',
  },
  {
    id: 'dest-004',
    name: 'Universidad del Quindío',
    address: 'Carrera 15 #12N, Armenia',
    coordinates: {
      latitude: 4.5508,
      longitude: -75.6645,
    },
    icon: '🎓',
    category: 'education',
  },
  {
    id: 'dest-005',
    name: 'Hospital San Juan de Dios',
    address: 'Calle 17 #14-45, Armenia',
    coordinates: {
      latitude: 4.5375,
      longitude: -75.6712,
    },
    icon: '🏥',
    category: 'health',
  },
  {
    id: 'dest-006',
    name: 'Plaza de Bolívar',
    address: 'Centro, Armenia',
    coordinates: {
      latitude: 4.5339,
      longitude: -75.6811,
    },
    icon: '⛲',
    category: 'landmark',
  },
  {
    id: 'dest-007',
    name: 'Aeropuerto El Edén',
    address: 'La Tebaida, Quindío',
    coordinates: {
      latitude: 4.4528,
      longitude: -75.7678,
    },
    icon: '✈️',
    category: 'transport',
  },
  {
    id: 'dest-008',
    name: 'SENA Regional Quindío',
    address: 'Calle 16 #14-51, Armenia',
    coordinates: {
      latitude: 4.5398,
      longitude: -75.6734,
    },
    icon: '📚',
    category: 'education',
  },
];

// ==========================================
// Mock Trip History
// ==========================================

export const mockTripHistory = [
  {
    id: 'trip-001',
    origin: { address: 'Parque de la Vida', coordinates: { latitude: 4.5356, longitude: -75.6789 } },
    destination: { address: 'Centro Comercial Portal', coordinates: { latitude: 4.5402, longitude: -75.6752 } },
    status: 'completed',
    vehicleType: 'standard',
    price: 8500,
    distance: 2.3,
    duration: 12,
    driverName: 'María G.',
    driverRating: 4.9,
    createdAt: '2025-01-20T14:30:00Z',
    completedAt: '2025-01-20T14:42:00Z',
    rating: 5,
  },
  {
    id: 'trip-002',
    origin: { address: 'Mi Casa', coordinates: { latitude: 4.5320, longitude: -75.6850 } },
    destination: { address: 'Universidad del Quindío', coordinates: { latitude: 4.5508, longitude: -75.6645 } },
    status: 'completed',
    vehicleType: 'comfort',
    price: 12000,
    distance: 3.8,
    duration: 18,
    driverName: 'Juan P.',
    driverRating: 4.7,
    createdAt: '2025-01-18T08:00:00Z',
    completedAt: '2025-01-18T08:18:00Z',
    rating: 4,
  },
  {
    id: 'trip-003',
    origin: { address: 'Terminal de Transporte', coordinates: { latitude: 4.5289, longitude: -75.6923 } },
    destination: { address: 'Plaza de Bolívar', coordinates: { latitude: 4.5339, longitude: -75.6811 } },
    status: 'completed',
    vehicleType: 'taxi',
    price: 7000,
    distance: 1.5,
    duration: 8,
    driverName: 'Pedro M.',
    driverRating: 4.8,
    createdAt: '2025-01-15T16:45:00Z',
    completedAt: '2025-01-15T16:53:00Z',
    rating: 5,
  },
];

// ==========================================
// Mock Traffic Reports
// ==========================================

export const mockTrafficReports = [
  {
    id: 'report-001',
    type: 'traffic',
    title: 'Tráfico pesado',
    description: 'Congestión vehicular por hora pico',
    location: {
      latitude: 4.5380,
      longitude: -75.6780,
    },
    address: 'Av. Bolívar con Calle 21',
    confirmations: 12,
    denials: 2,
    reportedBy: 'Usuario Anónimo',
    createdAt: '2025-01-25T07:30:00Z',
    expiresAt: '2025-01-25T10:30:00Z',
    isActive: true,
  },
  {
    id: 'report-002',
    type: 'accident',
    title: 'Accidente menor',
    description: 'Colisión entre dos vehículos, carril derecho bloqueado',
    location: {
      latitude: 4.5420,
      longitude: -75.6720,
    },
    address: 'Carrera 14 con Calle 18',
    confirmations: 8,
    denials: 0,
    reportedBy: 'María G.',
    createdAt: '2025-01-25T08:15:00Z',
    expiresAt: '2025-01-25T11:15:00Z',
    isActive: true,
  },
  {
    id: 'report-003',
    type: 'police',
    title: 'Control policial',
    description: 'Retén de tránsito, revisión de documentos',
    location: {
      latitude: 4.5300,
      longitude: -75.6850,
    },
    address: 'Entrada norte de Armenia',
    confirmations: 15,
    denials: 1,
    reportedBy: 'Juan P.',
    createdAt: '2025-01-25T06:00:00Z',
    expiresAt: '2025-01-25T12:00:00Z',
    isActive: true,
  },
  {
    id: 'report-004',
    type: 'roadwork',
    title: 'Obras en la vía',
    description: 'Reparación de alcantarillado, un carril cerrado',
    location: {
      latitude: 4.5360,
      longitude: -75.6900,
    },
    address: 'Calle 26 con Carrera 19',
    confirmations: 20,
    denials: 0,
    reportedBy: 'Pedro M.',
    createdAt: '2025-01-24T08:00:00Z',
    expiresAt: '2025-01-26T18:00:00Z',
    isActive: true,
  },
];

// ==========================================
// Mock Community Routes
// ==========================================

export const mockCommunityRoutes = [
  {
    id: 'route-001',
    name: 'Armenia → Universidad',
    description: 'Ruta diaria hacia la Universidad del Quindío',
    driver: {
      name: 'Ana L.',
      rating: 4.6,
      vehicle: 'Picanto Rojo',
    },
    origin: {
      address: 'Centro de Armenia',
      coordinates: { latitude: 4.5339, longitude: -75.6811 },
    },
    destination: {
      address: 'Universidad del Quindío',
      coordinates: { latitude: 4.5508, longitude: -75.6645 },
    },
    waypoints: [
      { address: 'Parque de la Vida', coordinates: { latitude: 4.5356, longitude: -75.6789 } },
    ],
    schedule: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      departureTime: '06:30',
      returnTime: '18:00',
    },
    pricePerSeat: 3000,
    availableSeats: 3,
    totalSeats: 4,
    isActive: true,
  },
  {
    id: 'route-002',
    name: 'Circasia → Armenia',
    description: 'Transporte desde Circasia al centro',
    driver: {
      name: 'Carlos R.',
      rating: 4.8,
      vehicle: 'Aveo Gris',
    },
    origin: {
      address: 'Parque Principal Circasia',
      coordinates: { latitude: 4.6186, longitude: -75.6378 },
    },
    destination: {
      address: 'Terminal de Armenia',
      coordinates: { latitude: 4.5289, longitude: -75.6923 },
    },
    waypoints: [],
    schedule: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      departureTime: '05:30',
      returnTime: '19:00',
    },
    pricePerSeat: 5000,
    availableSeats: 2,
    totalSeats: 4,
    isActive: true,
  },
  {
    id: 'route-003',
    name: 'Armenia → Salento (Fin de semana)',
    description: 'Ruta turística los fines de semana',
    driver: {
      name: 'Diego M.',
      rating: 4.9,
      vehicle: 'Duster Blanca',
    },
    origin: {
      address: 'Centro Comercial Portal',
      coordinates: { latitude: 4.5402, longitude: -75.6752 },
    },
    destination: {
      address: 'Plaza de Salento',
      coordinates: { latitude: 4.6374, longitude: -75.5708 },
    },
    waypoints: [
      { address: 'Valle del Cocora', coordinates: { latitude: 4.6389, longitude: -75.4875 } },
    ],
    schedule: {
      days: ['saturday', 'sunday'],
      departureTime: '08:00',
      returnTime: '17:00',
    },
    pricePerSeat: 15000,
    availableSeats: 4,
    totalSeats: 5,
    isActive: true,
  },
];

// ==========================================
// Mock Pricing Data
// ==========================================

export const mockPricing = {
  standard: {
    baseFare: 3500,
    perKm: 1200,
    perMinute: 150,
    minFare: 5000,
  },
  comfort: {
    baseFare: 5000,
    perKm: 1500,
    perMinute: 200,
    minFare: 7000,
  },
  taxi: {
    baseFare: 4500,
    perKm: 1400,
    perMinute: 180,
    minFare: 6000,
  },
};

// ==========================================
// Calculate Trip Price
// ==========================================

export const calculateTripPrice = (
  distanceKm: number,
  durationMinutes: number,
  vehicleType: 'standard' | 'comfort' | 'taxi' = 'standard'
): number => {
  const pricing = mockPricing[vehicleType];
  const calculated = pricing.baseFare + (distanceKm * pricing.perKm) + (durationMinutes * pricing.perMinute);
  return Math.max(calculated, pricing.minFare);
};

// ==========================================
// Generate Random Location Near Armenia
// ==========================================

export const generateRandomLocation = (radiusKm: number = 5) => {
  const radiusDegrees = radiusKm / 111; // Approximate conversion
  const randomLat = ARMENIA_CONFIG.center.latitude + (Math.random() - 0.5) * 2 * radiusDegrees;
  const randomLng = ARMENIA_CONFIG.center.longitude + (Math.random() - 0.5) * 2 * radiusDegrees;
  return {
    latitude: randomLat,
    longitude: randomLng,
  };
};

// ==========================================
// Mock API Delay Simulator
// ==========================================

export const simulateApiDelay = (minMs: number = 200, maxMs: number = 800): Promise<void> => {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// ==========================================
// Mock Error Simulator (for testing error handling)
// ==========================================

export const simulateRandomError = (errorRate: number = 0.1): void => {
  if (Math.random() < errorRate) {
    throw new Error('Error simulado para pruebas');
  }
};
