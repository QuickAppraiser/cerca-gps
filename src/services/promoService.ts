// ==========================================
// CERCA - Promo Code Service
// Manage promotional codes and discounts
// ==========================================

import { supabase } from './supabase';
import { isDevelopment } from '../config';

// ==========================================
// Types
// ==========================================

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_trip';
  value: number; // percentage (0-100) or fixed amount in COP
  maxDiscount?: number; // Max discount for percentage codes
  minTripValue?: number; // Minimum trip value to apply
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  maxUsesPerUser: number;
  isActive: boolean;
  description: string;
  terms?: string;
  applicableTo: 'all' | 'new_users' | 'returning_users';
}

export interface UserPromo {
  id: string;
  promoCodeId: string;
  userId: string;
  usedAt?: string;
  tripId?: string;
  discountAmount: number;
}

export interface ApplyPromoResult {
  success: boolean;
  discount: number;
  message: string;
  promoCode?: PromoCode;
}

// ==========================================
// Mock Data
// ==========================================

const MOCK_PROMO_CODES: PromoCode[] = [
  {
    id: '1',
    code: 'BIENVENIDO',
    type: 'percentage',
    value: 50,
    maxDiscount: 10000,
    minTripValue: 5000,
    validFrom: '2024-01-01',
    validUntil: '2025-12-31',
    maxUses: 10000,
    currentUses: 5432,
    maxUsesPerUser: 1,
    isActive: true,
    description: '50% de descuento en tu primer viaje',
    terms: 'Valido solo para nuevos usuarios. Descuento maximo $10,000.',
    applicableTo: 'new_users',
  },
  {
    id: '2',
    code: 'CERCA2024',
    type: 'fixed',
    value: 5000,
    minTripValue: 10000,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    maxUses: 5000,
    currentUses: 2100,
    maxUsesPerUser: 3,
    isActive: true,
    description: '$5,000 de descuento en tus proximos viajes',
    terms: 'Minimo de viaje $10,000. Maximo 3 usos por usuario.',
    applicableTo: 'all',
  },
  {
    id: '3',
    code: 'VIAJELIBRE',
    type: 'free_trip',
    value: 15000,
    validFrom: '2024-06-01',
    validUntil: '2024-06-30',
    maxUses: 100,
    currentUses: 98,
    maxUsesPerUser: 1,
    isActive: true,
    description: 'Viaje gratis hasta $15,000',
    terms: 'Codigo limitado. Viajes mayores a $15,000 pagan la diferencia.',
    applicableTo: 'all',
  },
  {
    id: '4',
    code: 'VOLVISTE',
    type: 'percentage',
    value: 30,
    maxDiscount: 8000,
    minTripValue: 8000,
    validFrom: '2024-01-01',
    validUntil: '2025-12-31',
    maxUses: 2000,
    currentUses: 450,
    maxUsesPerUser: 1,
    isActive: true,
    description: '30% de descuento por volver a usar CERCA',
    terms: 'Para usuarios que no han viajado en 30 dias.',
    applicableTo: 'returning_users',
  },
];

const userPromoUsage: Map<string, UserPromo[]> = new Map();

// ==========================================
// Service Functions
// ==========================================

/**
 * Validate and get promo code details
 */
export const getPromoCode = async (code: string): Promise<PromoCode | null> => {
  if (isDevelopment) {
    const promo = MOCK_PROMO_CODES.find(
      p => p.code.toUpperCase() === code.toUpperCase()
    );
    return promo || null;
  }

  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error) return null;
    return data;
  } catch (error) {
    console.error('Error getting promo code:', error);
    return null;
  }
};

/**
 * Get available promo codes for a user
 */
export const getAvailablePromoCodes = async (userId: string): Promise<PromoCode[]> => {
  if (isDevelopment) {
    // Return active promo codes that user hasn't fully used
    return MOCK_PROMO_CODES.filter(p => {
      const userUsage = userPromoUsage.get(userId)?.filter(u => u.promoCodeId === p.id) || [];
      return p.isActive && userUsage.length < p.maxUsesPerUser;
    });
  }

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', now)
      .gte('valid_until', now);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting available promo codes:', error);
    return [];
  }
};

/**
 * Check if user can use a promo code
 */
export const canUsePromoCode = async (
  userId: string,
  promoCode: PromoCode,
  tripValue: number,
  isNewUser: boolean = false,
  daysSinceLastTrip: number = 0
): Promise<{ canUse: boolean; reason?: string }> => {
  // Check if code is active
  if (!promoCode.isActive) {
    return { canUse: false, reason: 'Este codigo ya no esta activo' };
  }

  // Check validity dates
  const now = new Date();
  const validFrom = new Date(promoCode.validFrom);
  const validUntil = new Date(promoCode.validUntil);

  if (now < validFrom) {
    return { canUse: false, reason: 'Este codigo aun no esta disponible' };
  }

  if (now > validUntil) {
    return { canUse: false, reason: 'Este codigo ha expirado' };
  }

  // Check max uses
  if (promoCode.currentUses >= promoCode.maxUses) {
    return { canUse: false, reason: 'Este codigo ha alcanzado su limite de usos' };
  }

  // Check min trip value
  if (promoCode.minTripValue && tripValue < promoCode.minTripValue) {
    return {
      canUse: false,
      reason: `El viaje debe ser minimo $${promoCode.minTripValue.toLocaleString()}`
    };
  }

  // Check user eligibility
  if (promoCode.applicableTo === 'new_users' && !isNewUser) {
    return { canUse: false, reason: 'Este codigo es solo para nuevos usuarios' };
  }

  if (promoCode.applicableTo === 'returning_users' && daysSinceLastTrip < 30) {
    return { canUse: false, reason: 'Este codigo es para usuarios que no han viajado en 30 dias' };
  }

  // Check user usage limit
  if (isDevelopment) {
    const userUsage = userPromoUsage.get(userId)?.filter(u => u.promoCodeId === promoCode.id) || [];
    if (userUsage.length >= promoCode.maxUsesPerUser) {
      return { canUse: false, reason: 'Ya has usado este codigo el maximo permitido' };
    }
  } else {
    const { count, error } = await supabase
      .from('user_promo_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('promo_code_id', promoCode.id);

    if (!error && count !== null && count >= promoCode.maxUsesPerUser) {
      return { canUse: false, reason: 'Ya has usado este codigo el maximo permitido' };
    }
  }

  return { canUse: true };
};

/**
 * Calculate discount amount
 */
export const calculateDiscount = (promoCode: PromoCode, tripValue: number): number => {
  let discount = 0;

  switch (promoCode.type) {
    case 'percentage':
      discount = Math.round((tripValue * promoCode.value) / 100);
      if (promoCode.maxDiscount) {
        discount = Math.min(discount, promoCode.maxDiscount);
      }
      break;

    case 'fixed':
      discount = promoCode.value;
      break;

    case 'free_trip':
      discount = Math.min(tripValue, promoCode.value);
      break;
  }

  // Discount cannot exceed trip value
  return Math.min(discount, tripValue);
};

/**
 * Apply promo code to a trip
 */
export const applyPromoCode = async (
  code: string,
  userId: string,
  tripValue: number,
  isNewUser: boolean = false,
  daysSinceLastTrip: number = 0
): Promise<ApplyPromoResult> => {
  // Get promo code
  const promoCode = await getPromoCode(code);

  if (!promoCode) {
    return {
      success: false,
      discount: 0,
      message: 'Codigo promocional no valido',
    };
  }

  // Check if user can use it
  const { canUse, reason } = await canUsePromoCode(
    userId,
    promoCode,
    tripValue,
    isNewUser,
    daysSinceLastTrip
  );

  if (!canUse) {
    return {
      success: false,
      discount: 0,
      message: reason || 'No puedes usar este codigo',
    };
  }

  // Calculate discount
  const discount = calculateDiscount(promoCode, tripValue);

  return {
    success: true,
    discount,
    message: `Descuento de $${discount.toLocaleString()} aplicado!`,
    promoCode,
  };
};

/**
 * Record promo code usage after trip completion
 */
export const recordPromoUsage = async (
  userId: string,
  promoCodeId: string,
  tripId: string,
  discountAmount: number
): Promise<boolean> => {
  if (isDevelopment) {
    const usage: UserPromo = {
      id: Date.now().toString(),
      promoCodeId,
      userId,
      usedAt: new Date().toISOString(),
      tripId,
      discountAmount,
    };

    const existing = userPromoUsage.get(userId) || [];
    userPromoUsage.set(userId, [...existing, usage]);

    // Update promo code usage count
    const promo = MOCK_PROMO_CODES.find(p => p.id === promoCodeId);
    if (promo) {
      promo.currentUses += 1;
    }

    return true;
  }

  try {
    const { error } = await supabase
      .from('user_promo_usage')
      .insert({
        user_id: userId,
        promo_code_id: promoCodeId,
        trip_id: tripId,
        discount_amount: discountAmount,
        used_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Increment usage count
    await supabase.rpc('increment_promo_usage', { promo_id: promoCodeId });

    return true;
  } catch (error) {
    console.error('Error recording promo usage:', error);
    return false;
  }
};

/**
 * Get user's promo code usage history
 */
export const getUserPromoHistory = async (userId: string): Promise<UserPromo[]> => {
  if (isDevelopment) {
    return userPromoUsage.get(userId) || [];
  }

  try {
    const { data, error } = await supabase
      .from('user_promo_usage')
      .select('*')
      .eq('user_id', userId)
      .order('used_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user promo history:', error);
    return [];
  }
};

/**
 * Format discount display
 */
export const formatPromoDiscount = (promo: PromoCode): string => {
  switch (promo.type) {
    case 'percentage':
      if (promo.maxDiscount) {
        return `${promo.value}% (max $${promo.maxDiscount.toLocaleString()})`;
      }
      return `${promo.value}%`;

    case 'fixed':
      return `$${promo.value.toLocaleString()}`;

    case 'free_trip':
      return `Gratis hasta $${promo.value.toLocaleString()}`;

    default:
      return '';
  }
};

export default {
  getPromoCode,
  getAvailablePromoCodes,
  canUsePromoCode,
  calculateDiscount,
  applyPromoCode,
  recordPromoUsage,
  getUserPromoHistory,
  formatPromoDiscount,
};
