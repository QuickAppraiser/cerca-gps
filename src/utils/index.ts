// ==========================================
// CERCA - Utils Barrel Export
// ==========================================

export {
  validatePhone,
  validateOTP,
  validateEmail,
  validateName,
  validatePlate,
  validateCreditAmount,
  validateAddress,
  validateRating,
  validateComment,
  validateCoordinates,
  validateVehicleYear,
  validateLicenseNumber,
  validateExpiryDate,
  validateForm,
  formatPhone,
  formatCurrency,
  formatDistance,
  formatDuration,
} from './validation';

export type { ValidationResult, FormField, FormValidationResult } from './validation';

// ==========================================
// Error Handling Utilities
// ==========================================

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: 'Error de conexion. Verifica tu internet.',
  [ERROR_CODES.AUTH_ERROR]: 'Sesion expirada. Por favor inicia sesion de nuevo.',
  [ERROR_CODES.NOT_FOUND]: 'No se encontro el recurso solicitado.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Los datos ingresados no son validos.',
  [ERROR_CODES.PERMISSION_DENIED]: 'No tienes permiso para realizar esta accion.',
  [ERROR_CODES.RATE_LIMITED]: 'Demasiados intentos. Espera un momento.',
  [ERROR_CODES.SERVER_ERROR]: 'Error en el servidor. Intenta mas tarde.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Ocurrio un error inesperado.',
};

/**
 * Parse error from various sources into ServiceError
 */
export const parseError = (error: any): ServiceError => {
  // Handle network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      details: error,
    };
  }

  // Handle Supabase auth errors
  if (error?.status === 401 || error?.message?.includes('auth')) {
    return {
      code: ERROR_CODES.AUTH_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.AUTH_ERROR],
      details: error,
    };
  }

  // Handle not found
  if (error?.status === 404 || error?.code === 'PGRST116') {
    return {
      code: ERROR_CODES.NOT_FOUND,
      message: ERROR_MESSAGES[ERROR_CODES.NOT_FOUND],
      details: error,
    };
  }

  // Handle rate limiting
  if (error?.status === 429) {
    return {
      code: ERROR_CODES.RATE_LIMITED,
      message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
      details: error,
    };
  }

  // Handle server errors
  if (error?.status >= 500) {
    return {
      code: ERROR_CODES.SERVER_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
      details: error,
    };
  }

  // Default to unknown error
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error?.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: error,
  };
};

/**
 * Safe async wrapper with error handling
 */
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  defaultValue?: T
): Promise<{ data: T | undefined; error: ServiceError | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    console.error('safeAsync error:', err);
    return { data: defaultValue, error: parseError(err) };
  }
};

/**
 * Retry async operation with exponential backoff
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};
