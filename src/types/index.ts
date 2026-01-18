// ==========================================
// CERCA - Tipos principales del sistema
// ==========================================

// === USUARIOS ===
export type UserRole = 'passenger' | 'driver' | 'both';

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePhoto?: string;
  rating: number;
  totalTrips: number;
  tokens: number;
  credits: number;
  isPremium: boolean;
  isVerified: boolean;
  createdAt: Date;
  emergencyContacts: EmergencyContact[];
  preferences: UserPreferences;
  reputation: ReputationScore;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface UserPreferences {
  rideMode: 'silent' | 'normal' | 'conversational';
  preferredVehicleTypes: VehicleType[];
  accessibilityNeeds: AccessibilityOption[];
  language: 'es' | 'en';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  tripUpdates: boolean;
  promotions: boolean;
  communityAlerts: boolean;
  documentReminders: boolean;
}

// === CONDUCTORES ===
export interface Driver extends User {
  vehicle: Vehicle;
  documents: DriverDocuments;
  isOnline: boolean;
  currentLocation?: Coordinates;
  acceptanceRate: number;
  cancellationRate: number;
  communityRoutes: CommunityRoute[];
  earnings: DriverEarnings;
  blockedUsers: string[];
  favoritePassengers: string[];
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  photos: string[];
  accessibility: AccessibilityOption[];
  capacity: number;
}

export type VehicleType = 'sedan' | 'suv' | 'van' | 'motorcycle' | 'taxi';

export type AccessibilityOption =
  | 'wheelchair'
  | 'reducedMobility'
  | 'elderly'
  | 'specialSpace'
  | 'petFriendly';

export interface DriverDocuments {
  license: Document;
  soat: Document;
  techReview: Document; // Revisión técnico-mecánica
  propertyCard: Document; // Tarjeta de propiedad
  idCard: Document;
  criminalRecord: Document;
}

export interface Document {
  id: string;
  type: string;
  fileUrl: string;
  expirationDate?: Date;
  isVerified: boolean;
  verifiedAt?: Date;
  uploadedAt: Date;
}

export interface DriverEarnings {
  today: number;
  week: number;
  month: number;
  total: number;
  pendingWithdrawal: number;
}

// === VIAJES ===
export type TripStatus =
  | 'searching'      // Buscando conductor
  | 'accepted'       // Conductor aceptó
  | 'arriving'       // Conductor en camino
  | 'waiting'        // Conductor esperando en punto
  | 'inProgress'     // Viaje en curso
  | 'completed'      // Finalizado
  | 'cancelled';     // Cancelado

export interface Trip {
  id: string;
  passengerId: string;
  driverId?: string;
  origin: Location;
  destination: Location;
  route?: RouteInfo;
  status: TripStatus;
  requestedAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: 'passenger' | 'driver' | 'system';
  cancellationReason?: string;
  price: TripPrice;
  paymentMethod: PaymentMethod;
  passengerRating?: Rating;
  driverRating?: Rating;
  rideMode: 'silent' | 'normal' | 'conversational';
  isAccessibilityTrip: boolean;
  accessibilityNeeds: AccessibilityOption[];
}

export interface Location {
  coordinates: Coordinates;
  address: string;
  name?: string;
  placeId?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteInfo {
  distance: number; // en metros
  duration: number; // en segundos
  polyline: string;
}

export interface TripPrice {
  base: number;
  distance: number;
  time: number;
  surge?: number;
  discount?: number;
  tokens?: number;
  total: number;
  currency: 'COP';
}

export type PaymentMethod = 'credits' | 'cash';

export interface Rating {
  score: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  tags?: string[];
  createdAt: Date;
}

// === RUTAS COMUNITARIAS ===
export interface CommunityRoute {
  id: string;
  driverId: string;
  name: string;
  description?: string;
  origin: Location;
  destination: Location;
  waypoints: Location[];
  schedule: RouteSchedule[];
  pricePerSeat: number;
  availableSeats: number;
  totalSeats: number;
  isActive: boolean;
  reservations: RouteReservation[];
  createdAt: Date;
}

export interface RouteSchedule {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo
  departureTime: string; // "07:30"
  isActive: boolean;
}

export interface RouteReservation {
  id: string;
  passengerId: string;
  routeId: string;
  scheduleIndex: number;
  pickupPoint: Location;
  seatsReserved: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

// === SISTEMA DE EMERGENCIA (BOTÓN CERCA) ===
export type EmergencyType =
  | 'accident'
  | 'assault'
  | 'medical'
  | 'vehicle_issue'
  | 'harassment'
  | 'other';

export type EmergencyStatus =
  | 'active'
  | 'responding'
  | 'resolved'
  | 'false_alarm'
  | 'cancelled';

export interface EmergencyAlert {
  id: string;
  userId: string;
  tripId?: string;
  type: EmergencyType;
  status: EmergencyStatus;
  location: Coordinates;
  locationHistory: TimestampedLocation[];
  escalationLevel: 1 | 2 | 3 | 4 | 5; // 10m, 50m, 100m, 300m, 500m
  respondersNotified: string[];
  respondersConfirmed: string[];
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: EmergencyResolution;
}

export interface TimestampedLocation {
  coordinates: Coordinates;
  timestamp: Date;
}

export interface EmergencyResolution {
  wasReal: boolean;
  resolvedBy: string;
  notes?: string;
  respondersValidation: ResponderValidation[];
}

export interface ResponderValidation {
  responderId: string;
  confirmedReal: boolean;
  notes?: string;
}

// === REPORTES VIALES ===
export type ReportType =
  | 'checkpoint'     // Retén
  | 'accident'
  | 'traffic'        // Trancón
  | 'roadClosed'
  | 'roadDamage'     // Daño en la vía
  | 'police'
  | 'hazard';        // Peligro general

export interface TrafficReport {
  id: string;
  userId: string;
  type: ReportType;
  location: Coordinates;
  description?: string;
  photos?: string[];
  confirmations: number;
  denials: number;
  credibilityScore: number;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

// === SISTEMA DE REPUTACIÓN Y TOKENS ===
export interface ReputationScore {
  overall: number; // 0-100
  asPassenger: number;
  asDriver: number;
  reliability: number;
  communityHelp: number;
  reportAccuracy: number;
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TokenTransactionType;
  description: string;
  createdAt: Date;
}

export type TokenTransactionType =
  | 'earned_trip'
  | 'earned_rating'
  | 'earned_report'
  | 'earned_help'
  | 'spent_discount'
  | 'spent_priority'
  | 'penalty';

// === CRÉDITOS Y PAGOS ===
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'topup' | 'trip_payment' | 'refund' | 'commission';
  description: string;
  paymentMethod?: string;
  externalReference?: string;
  createdAt: Date;
}

// === PENALIZACIONES ===
export interface Penalty {
  id: string;
  userId: string;
  type: 'cancellation' | 'false_report' | 'false_emergency' | 'bad_behavior';
  severity: 'warning' | 'minor' | 'major' | 'suspension';
  description: string;
  tokensDeducted?: number;
  suspensionUntil?: Date;
  createdAt: Date;
  appealedAt?: Date;
  appealStatus?: 'pending' | 'accepted' | 'rejected';
}

// === PICO Y PLACA ===
export interface PicoYPlacaRule {
  city: string;
  dayOfWeek: number;
  plates: string[]; // últimos dígitos
  startTime: string;
  endTime: string;
  vehicleTypes: VehicleType[];
}

// === NOTIFICACIONES ===
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'trip_update'
  | 'emergency'
  | 'traffic_report'
  | 'document_expiry'
  | 'payment'
  | 'promotion'
  | 'community';
