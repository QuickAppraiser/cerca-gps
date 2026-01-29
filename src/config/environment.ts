// ==========================================
// CERCA - Environment Configuration
// Validates and exports environment variables
// ==========================================

import { Platform } from 'react-native';

// ==========================================
// Environment Types
// ==========================================

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isWeb: boolean;
  isMobile: boolean;

  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;

  // Google Maps (optional for development)
  googleMapsApiKey: string | null;

  // App Settings
  appName: string;
  appVersion: string;
  supportEmail: string;
  emergencyPhone: string;

  // Feature Flags
  features: {
    enableMockData: boolean;
    enableDevTools: boolean;
    enableAnalytics: boolean;
    enablePushNotifications: boolean;
    enableCommunityRoutes: boolean;
    enableEmergencyButton: boolean;
  };

  // API Settings
  api: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

// ==========================================
// Default Values for Development
// ==========================================

const DEFAULTS = {
  SUPABASE_URL: 'https://demo.supabase.co',
  SUPABASE_ANON_KEY: 'demo-anon-key',
  GOOGLE_MAPS_API_KEY: null,
  APP_NAME: 'CERCA',
  APP_VERSION: '1.0.0',
  SUPPORT_EMAIL: 'soporte@cerca.app',
  EMERGENCY_PHONE: '123',
};

// ==========================================
// Environment Detection
// ==========================================

const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV;

  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
};

// ==========================================
// Environment Variable Getters
// ==========================================

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Try EXPO_PUBLIC_ prefix first (Expo standard)
  const expoValue = process.env[`EXPO_PUBLIC_${key}`];
  if (expoValue) return expoValue;

  // Try without prefix
  const directValue = process.env[key];
  if (directValue) return directValue;

  return defaultValue;
};

// ==========================================
// Build Configuration
// ==========================================

const buildConfig = (): AppConfig => {
  const environment = getEnvironment();
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';
  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  // Get Supabase config
  const supabaseUrl = getEnvVar('SUPABASE_URL', DEFAULTS.SUPABASE_URL);
  const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', DEFAULTS.SUPABASE_ANON_KEY);

  // Get Google Maps config (optional)
  const googleMapsApiKey = getEnvVar('GOOGLE_MAPS_API_KEY') || null;

  // Feature flags based on environment
  const features = {
    // Enable mock data when no real Supabase is configured
    enableMockData: isDevelopment || supabaseUrl === DEFAULTS.SUPABASE_URL,
    enableDevTools: isDevelopment,
    enableAnalytics: isProduction,
    enablePushNotifications: isMobile && isProduction,
    enableCommunityRoutes: true,
    enableEmergencyButton: true,
  };

  return {
    environment,
    isDevelopment,
    isProduction,
    isWeb,
    isMobile,

    supabaseUrl,
    supabaseAnonKey,
    googleMapsApiKey,

    appName: DEFAULTS.APP_NAME,
    appVersion: DEFAULTS.APP_VERSION,
    supportEmail: DEFAULTS.SUPPORT_EMAIL,
    emergencyPhone: DEFAULTS.EMERGENCY_PHONE,

    features,

    api: {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    },
  };
};

// ==========================================
// Export Configuration
// ==========================================

export const config = buildConfig();

// ==========================================
// Validation on App Start
// ==========================================

export const validateConfig = (): { isValid: boolean; warnings: string[]; errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check Supabase configuration
  if (config.supabaseUrl === DEFAULTS.SUPABASE_URL) {
    warnings.push('Using demo Supabase URL. Configure EXPO_PUBLIC_SUPABASE_URL for production.');
  }

  if (config.supabaseAnonKey === DEFAULTS.SUPABASE_ANON_KEY) {
    warnings.push('Using demo Supabase key. Configure EXPO_PUBLIC_SUPABASE_ANON_KEY for production.');
  }

  // Check Google Maps for mobile
  if (config.isMobile && !config.googleMapsApiKey) {
    warnings.push('Google Maps API key not configured. Maps may not work on mobile devices.');
  }

  // In production, certain things are required
  if (config.isProduction) {
    if (config.supabaseUrl === DEFAULTS.SUPABASE_URL) {
      errors.push('Production requires a valid Supabase URL.');
    }
    if (config.supabaseAnonKey === DEFAULTS.SUPABASE_ANON_KEY) {
      errors.push('Production requires a valid Supabase Anon Key.');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

// ==========================================
// Log Configuration (Development Only)
// ==========================================

export const logConfig = (): void => {
  if (!config.isDevelopment) return;

  console.log('==========================================');
  console.log('CERCA - Configuration');
  console.log('==========================================');
  console.log(`Environment: ${config.environment}`);
  console.log(`Platform: ${Platform.OS}`);
  console.log(`Mock Data: ${config.features.enableMockData ? 'Enabled' : 'Disabled'}`);
  console.log(`Supabase: ${config.supabaseUrl.substring(0, 30)}...`);
  console.log(`Google Maps: ${config.googleMapsApiKey ? 'Configured' : 'Not configured'}`);
  console.log('==========================================');

  const validation = validateConfig();
  if (validation.warnings.length > 0) {
    console.log('Warnings:');
    validation.warnings.forEach(w => console.log(`  - ${w}`));
  }
  if (validation.errors.length > 0) {
    console.log('Errors:');
    validation.errors.forEach(e => console.log(`  - ${e}`));
  }
};
