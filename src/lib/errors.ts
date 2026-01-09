/**
 * Custom error classes for AI request handling
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends Error {
  isAnonymous: boolean;
  
  constructor(message: string, isAnonymous: boolean = true) {
    super(message);
    this.name = 'RateLimitError';
    this.isAnonymous = isAnonymous;
  }
}

export class ServiceError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Check if an error is a timeout-related error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.message.includes('abort');
  }
  return false;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Get a user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again.';
  }
  if (error instanceof RateLimitError) {
    return error.isAnonymous 
      ? 'Rate limit reached. Create an account for more requests.'
      : 'Rate limit exceeded. Please wait a moment and try again.';
  }
  if (error instanceof NetworkError) {
    return 'Network connection failed. Please check your internet.';
  }
  if (error instanceof ServiceError) {
    return error.statusCode === 503 
      ? 'Service temporarily unavailable. Please try again.'
      : error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}
