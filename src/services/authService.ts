// ==========================================
// CERCA - Authentication Service
// Handles real Supabase auth with development fallback
// ==========================================

import { supabase } from './supabase';
import { config } from '../config/environment';
import { User } from '../types';

// ==========================================
// Types
// ==========================================

export interface AuthResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'passenger' | 'driver' | 'both';
  credits: number;
  tokens: number;
  rating: number;
  total_trips: number;
  is_verified: boolean;
  is_active: boolean;
  preferences: any;
  reputation: any;
  created_at: string;
}

// ==========================================
// Development Mode Mock
// ==========================================

const DEV_MODE = config.features.enableMockData;
let mockVerificationCode = '';

const generateMockCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createMockUser = (phone: string): User => ({
  id: `user_${Date.now()}`,
  phone: phone.startsWith('+57') ? phone : `+57${phone}`,
  firstName: 'Usuario',
  lastName: 'CERCA',
  role: 'passenger',
  rating: 5.0,
  totalTrips: 0,
  tokens: 100,
  credits: 50000, // Start with 50k credits for testing
  isPremium: false,
  isVerified: true,
  createdAt: new Date(),
  emergencyContacts: [],
  preferences: {
    rideMode: 'normal',
    preferredVehicleTypes: ['standard'],
    accessibilityNeeds: [],
    language: 'es',
    notifications: {
      tripUpdates: true,
      promotions: true,
      communityAlerts: true,
      documentReminders: true,
    },
  },
  reputation: {
    overall: 100,
    asPassenger: 100,
    asDriver: 0,
    reliability: 100,
    communityHelp: 0,
    reportAccuracy: 0,
  },
});

// ==========================================
// Auth Service
// ==========================================

export const authService = {
  /**
   * Send OTP verification code to phone number
   */
  async sendOTP(phone: string): Promise<AuthResult> {
    const formattedPhone = phone.startsWith('+57') ? phone : `+57${phone}`;

    // Development mode - generate fake code
    if (DEV_MODE) {
      mockVerificationCode = generateMockCode();
      console.log(`[DEV] Verification code for ${formattedPhone}: ${mockVerificationCode}`);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        data: { phone: formattedPhone, devCode: mockVerificationCode },
      };
    }

    // Production - use Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error('Supabase OTP error:', error);
        return {
          success: false,
          error: error.message || 'Error al enviar código',
        };
      }

      return { success: true, data };
    } catch (err: any) {
      console.error('Send OTP error:', err);
      return {
        success: false,
        error: 'Error de conexión. Intenta de nuevo.',
      };
    }
  },

  /**
   * Verify OTP code and authenticate user
   */
  async verifyOTP(phone: string, code: string): Promise<AuthResult> {
    const formattedPhone = phone.startsWith('+57') ? phone : `+57${phone}`;

    // Development mode - accept mock code or any 6-digit code
    if (DEV_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Accept the generated code or any 6-digit number in dev
      if (code === mockVerificationCode || code.length === 6) {
        const user = createMockUser(formattedPhone);
        return {
          success: true,
          data: { user, session: { access_token: 'dev_token' } },
        };
      }

      return {
        success: false,
        error: 'Código incorrecto',
      };
    }

    // Production - verify with Supabase
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms',
      });

      if (error) {
        console.error('Supabase verify error:', error);
        return {
          success: false,
          error: error.message || 'Código incorrecto',
        };
      }

      // Get or create user profile
      if (data.user) {
        const profile = await this.getOrCreateProfile(data.user.id, formattedPhone);
        return {
          success: true,
          data: { ...data, profile },
        };
      }

      return { success: true, data };
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      return {
        success: false,
        error: 'Error de conexión. Intenta de nuevo.',
      };
    }
  },

  /**
   * Get existing profile or create new one
   */
  async getOrCreateProfile(userId: string, phone: string): Promise<UserProfile | null> {
    if (DEV_MODE) {
      return null; // Dev mode uses mock user
    }

    try {
      // Try to get existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (existing) {
        return existing as UserProfile;
      }

      // Create new profile
      const newProfile = {
        id: userId,
        phone,
        full_name: null,
        email: null,
        avatar_url: null,
        role: 'passenger',
        credits: 0,
        tokens: 50, // Welcome bonus
        rating: 5.0,
        total_trips: 0,
        is_verified: false,
        is_active: true,
        preferences: {
          rideMode: 'normal',
          language: 'es',
          notifications: {
            tripUpdates: true,
            promotions: true,
            communityAlerts: true,
          },
        },
        reputation: {
          overall: 100,
          asPassenger: 100,
          asDriver: 0,
        },
      };

      const { data: created, error: createError } = await supabase
        .from('users')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Create profile error:', createError);
        return null;
      }

      return created as UserProfile;
    } catch (err) {
      console.error('Get/create profile error:', err);
      return null;
    }
  },

  /**
   * Get current session
   */
  async getSession(): Promise<AuthResult> {
    if (DEV_MODE) {
      return { success: false, data: null };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: session };
    } catch (err) {
      return { success: false, error: 'Error getting session' };
    }
  },

  /**
   * Sign out user
   */
  async signOut(): Promise<AuthResult> {
    if (DEV_MODE) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error signing out' };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<AuthResult> {
    if (DEV_MODE) {
      return { success: true, data: updates };
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Error updating profile' };
    }
  },

  /**
   * Add credits to user account
   */
  async addCredits(userId: string, amount: number, method: string): Promise<AuthResult> {
    if (DEV_MODE) {
      return { success: true, data: { newBalance: amount } };
    }

    try {
      // Create transaction record
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount,
        type: 'topup',
        payment_method: method,
        status: 'completed',
      });

      // Update user credits using RPC
      const { data, error } = await supabase.rpc('update_user_credits', {
        user_id: userId,
        amount,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: 'Error adding credits' };
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (DEV_MODE) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  },
};
