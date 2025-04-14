/**
 * Error handling utility for consistent error management across the application
 */
import { goto } from '$app/navigation';

// Error types for categorizing different errors
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

// Standard error structure
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  originalError?: any;
}

/**
 * Creates a standardized error object
 */
export function createError(
  type: ErrorType,
  message: string,
  code?: string,
  details?: Record<string, any>,
  originalError?: any
): AppError {
  return {
    type,
    message,
    code,
    details,
    originalError
  };
}

/**
 * Handles errors based on their type
 */
export function handleError(error: AppError): void {
  console.error('Error occurred:', error);

  // Handle specific error types
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      // Redirect to login page for authentication errors
      goto('/login');
      break;
    
    case ErrorType.AUTHORIZATION:
      // Could redirect to a permissions/access denied page
      break;
      
    case ErrorType.VALIDATION:
      // For validation errors, typically handled in the UI
      break;
      
    case ErrorType.SERVER:
    case ErrorType.NETWORK:
    case ErrorType.UNKNOWN:
    default:
      // For other types of errors, could show a global error notification
      break;
  }
}

/**
 * Attempts to determine the error type from a caught error
 */
export function determineErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;
  
  // If it's already an AppError, use its type
  if (error.type && Object.values(ErrorType).includes(error.type)) {
    return error.type;
  }
  
  // Supabase authentication errors
  if (error.status === 401 || error.message?.includes('authentication')) {
    return ErrorType.AUTHENTICATION;
  }
  
  // Permission errors
  if (error.status === 403 || error.message?.includes('permission')) {
    return ErrorType.AUTHORIZATION;
  }
  
  // Validation errors
  if (error.status === 400 || error.message?.includes('validation')) {
    return ErrorType.VALIDATION;
  }
  
  // Server errors
  if (error.status >= 500 || error.message?.includes('server')) {
    return ErrorType.SERVER;
  }
  
  // Network errors
  if (error.message?.includes('network') || error.message?.includes('connection')) {
    return ErrorType.NETWORK;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Process an error and create a standardized AppError
 */
export function processError(error: any): AppError {
  // If it's already an AppError, return it
  if (error.type && Object.values(ErrorType).includes(error.type)) {
    return error as AppError;
  }
  
  const errorType = determineErrorType(error);
  const message = error.message || 'An unexpected error occurred';
  const code = error.code || error.status?.toString() || undefined;
  
  return createError(errorType, message, code, undefined, error);
}

/**
 * Safely execute an async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: AppError) => void
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const error = processError(err);
    
    if (errorHandler) {
      errorHandler(error);
    } else {
      handleError(error);
    }
    
    return { data: null, error };
  }
}