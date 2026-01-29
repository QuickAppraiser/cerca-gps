// ==========================================
// CERCA - Services Barrel Export
// ==========================================

// Supabase client and legacy services
export { supabase } from './supabase';

// New service modules
export { authService } from './authService';
export { tripService } from './tripService';
export { walletService } from './walletService';
export { notificationService } from './notificationService';
export { ratingService, RATING_TAGS } from './ratingService';
export { default as promoService } from './promoService';

// Types
export type { AuthResult, UserProfile } from './authService';
export type { TripResult, CreateTripData, NearbyDriver } from './tripService';
export type { WalletResult, Transaction, RechargeData, PaymentData } from './walletService';
export type { RatingResult, RatingData, RatingStats } from './ratingService';
export type { PromoCode, UserPromo, ApplyPromoResult } from './promoService';

// Mock data (for development)
export {
  mockNearbyDrivers,
  mockPricing,
  mockPopularDestinations,
  mockTripHistory,
  mockTrafficReports,
  mockCommunityRoutes,
  simulateApiDelay,
} from './mockData';
