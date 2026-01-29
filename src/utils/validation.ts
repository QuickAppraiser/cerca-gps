// ==========================================
// CERCA - Input Validation Utilities
// Provides validation functions for user inputs
// ==========================================

// ==========================================
// Validation Result Type
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ==========================================
// Phone Number Validation
// ==========================================

export const validatePhone = (phone: string): ValidationResult => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Colombian phone numbers
  // Mobile: 10 digits starting with 3 (e.g., 3001234567)
  // With country code: 12 digits starting with 57 (e.g., 573001234567)

  if (!cleaned) {
    return { isValid: false, error: 'El número de teléfono es requerido' };
  }

  // Check if it starts with country code
  if (cleaned.startsWith('57')) {
    if (cleaned.length !== 12) {
      return { isValid: false, error: 'El número debe tener 10 dígitos' };
    }
    if (!cleaned.substring(2).startsWith('3')) {
      return { isValid: false, error: 'El número móvil debe empezar con 3' };
    }
    return { isValid: true };
  }

  // Without country code
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'El número debe tener 10 dígitos' };
  }

  if (!cleaned.startsWith('3')) {
    return { isValid: false, error: 'El número móvil debe empezar con 3' };
  }

  return { isValid: true };
};

// ==========================================
// OTP Code Validation
// ==========================================

export const validateOTP = (code: string): ValidationResult => {
  const cleaned = code.replace(/\D/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'El código es requerido' };
  }

  if (cleaned.length !== 6) {
    return { isValid: false, error: 'El código debe tener 6 dígitos' };
  }

  return { isValid: true };
};

// ==========================================
// Email Validation
// ==========================================

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'El correo electrónico es requerido' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Ingresa un correo electrónico válido' };
  }

  return { isValid: true };
};

// ==========================================
// Name Validation
// ==========================================

export const validateName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'El nombre es requerido' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'El nombre es demasiado largo' };
  }

  // Only allow letters, spaces, and common name characters
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'El nombre contiene caracteres no válidos' };
  }

  return { isValid: true };
};

// ==========================================
// License Plate Validation (Colombia)
// ==========================================

export const validatePlate = (plate: string): ValidationResult => {
  if (!plate || !plate.trim()) {
    return { isValid: false, error: 'La placa es requerida' };
  }

  const cleaned = plate.trim().toUpperCase().replace(/\s/g, '');

  // Colombian plates: 3 letters + 3 numbers (e.g., ABC123)
  // Or motorcycle: 3 letters + 2 numbers + 1 letter (e.g., ABC12D)
  const carPlateRegex = /^[A-Z]{3}[0-9]{3}$/;
  const motoPlateRegex = /^[A-Z]{3}[0-9]{2}[A-Z]$/;

  if (!carPlateRegex.test(cleaned) && !motoPlateRegex.test(cleaned)) {
    return { isValid: false, error: 'Formato de placa inválido (ej: ABC123)' };
  }

  return { isValid: true };
};

// ==========================================
// Credit Amount Validation
// ==========================================

export const validateCreditAmount = (amount: number | string): ValidationResult => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Ingresa un monto válido' };
  }

  if (numAmount < 5000) {
    return { isValid: false, error: 'El monto mínimo es $5,000' };
  }

  if (numAmount > 500000) {
    return { isValid: false, error: 'El monto máximo es $500,000' };
  }

  return { isValid: true };
};

// ==========================================
// Address Validation
// ==========================================

export const validateAddress = (address: string): ValidationResult => {
  if (!address || !address.trim()) {
    return { isValid: false, error: 'La dirección es requerida' };
  }

  const trimmed = address.trim();

  if (trimmed.length < 5) {
    return { isValid: false, error: 'La dirección es muy corta' };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: 'La dirección es muy larga' };
  }

  return { isValid: true };
};

// ==========================================
// Rating Validation
// ==========================================

export const validateRating = (rating: number): ValidationResult => {
  if (!rating || rating < 1 || rating > 5) {
    return { isValid: false, error: 'Selecciona una calificación del 1 al 5' };
  }

  if (!Number.isInteger(rating)) {
    return { isValid: false, error: 'La calificación debe ser un número entero' };
  }

  return { isValid: true };
};

// ==========================================
// Comment Validation
// ==========================================

export const validateComment = (comment: string, required: boolean = false): ValidationResult => {
  if (!comment || !comment.trim()) {
    if (required) {
      return { isValid: false, error: 'El comentario es requerido' };
    }
    return { isValid: true };
  }

  const trimmed = comment.trim();

  if (trimmed.length < 10 && required) {
    return { isValid: false, error: 'El comentario debe tener al menos 10 caracteres' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: 'El comentario es muy largo (máximo 500 caracteres)' };
  }

  return { isValid: true };
};

// ==========================================
// Coordinates Validation
// ==========================================

export const validateCoordinates = (lat: number, lng: number): ValidationResult => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { isValid: false, error: 'Coordenadas inválidas' };
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, error: 'Latitud fuera de rango' };
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: 'Longitud fuera de rango' };
  }

  return { isValid: true };
};

// ==========================================
// Form Validation Helper
// ==========================================

export interface FormField {
  value: any;
  validator: (value: any) => ValidationResult;
  fieldName: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

export const validateForm = (fields: FormField[]): FormValidationResult => {
  const errors: Record<string, string> = {};
  let firstError: string | undefined;

  for (const field of fields) {
    const result = field.validator(field.value);
    if (!result.isValid && result.error) {
      errors[field.fieldName] = result.error;
      if (!firstError) {
        firstError = result.error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
};

// ==========================================
// Phone Formatting Helper
// ==========================================

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  // Format as: 300 123 4567
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  // With country code: +57 300 123 4567
  if (cleaned.length === 12 && cleaned.startsWith('57')) {
    return `+57 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  return phone;
};

// ==========================================
// Currency Formatting Helper
// ==========================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ==========================================
// Vehicle Year Validation
// ==========================================

export const validateVehicleYear = (year: string | number): ValidationResult => {
  const numYear = typeof year === 'string' ? parseInt(year, 10) : year;
  const currentYear = new Date().getFullYear();

  if (isNaN(numYear)) {
    return { isValid: false, error: 'Ingresa un ano valido' };
  }

  if (numYear < 1990) {
    return { isValid: false, error: 'El vehiculo debe ser de 1990 o posterior' };
  }

  if (numYear > currentYear + 1) {
    return { isValid: false, error: 'El ano no puede ser futuro' };
  }

  return { isValid: true };
};

// ==========================================
// License Number Validation
// ==========================================

export const validateLicenseNumber = (license: string): ValidationResult => {
  if (!license || !license.trim()) {
    return { isValid: false, error: 'El numero de licencia es requerido' };
  }

  const cleaned = license.trim();

  if (cleaned.length < 6) {
    return { isValid: false, error: 'El numero de licencia es muy corto' };
  }

  if (cleaned.length > 20) {
    return { isValid: false, error: 'El numero de licencia es muy largo' };
  }

  return { isValid: true };
};

// ==========================================
// Expiry Date Validation (MM/YYYY format)
// ==========================================

export const validateExpiryDate = (expiry: string): ValidationResult => {
  if (!expiry || !expiry.trim()) {
    return { isValid: false, error: 'La fecha de vencimiento es requerida' };
  }

  // Accept formats: MM/YYYY, MM/YY, MMYYYY, MMYY
  const cleaned = expiry.replace(/[^0-9]/g, '');

  let month: number;
  let year: number;

  if (cleaned.length === 4) {
    // MMYY format
    month = parseInt(cleaned.substring(0, 2), 10);
    year = 2000 + parseInt(cleaned.substring(2, 4), 10);
  } else if (cleaned.length === 6) {
    // MMYYYY format
    month = parseInt(cleaned.substring(0, 2), 10);
    year = parseInt(cleaned.substring(2, 6), 10);
  } else {
    return { isValid: false, error: 'Formato invalido. Usa MM/AAAA' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Mes invalido' };
  }

  const currentDate = new Date();
  const expiryDate = new Date(year, month - 1);

  if (expiryDate < currentDate) {
    return { isValid: false, error: 'El documento esta vencido' };
  }

  return { isValid: true };
};

// ==========================================
// Distance Formatting Helper
// ==========================================

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// ==========================================
// Duration Formatting Helper
// ==========================================

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};
