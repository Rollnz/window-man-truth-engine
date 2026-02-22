import { describe, it, expect } from 'vitest';
import { isUnauthorizedError } from '../authErrorHandler';

describe('isUnauthorizedError', () => {
  // --- Direct status property ---
  describe('Direct Status detection', () => {
    it('returns true for an object with status === 401', () => {
      expect(isUnauthorizedError({ status: 401 })).toBe(true);
    });

    it('returns false for an object with status === 403', () => {
      expect(isUnauthorizedError({ status: 403 })).toBe(false);
    });

    it('returns false for an object with status === 500', () => {
      expect(isUnauthorizedError({ status: 500 })).toBe(false);
    });

    it('returns false for an object with status === 200', () => {
      expect(isUnauthorizedError({ status: 200 })).toBe(false);
    });
  });

  // --- Supabase FunctionsHttpError (context.status) ---
  describe('Supabase context detection', () => {
    it('returns true for a FunctionsHttpError with context.status === 401', () => {
      const functionsHttpError = {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 401 },
      };
      expect(isUnauthorizedError(functionsHttpError)).toBe(true);
    });

    it('returns false for a FunctionsHttpError with context.status === 403', () => {
      const functionsHttpError = {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 403 },
      };
      expect(isUnauthorizedError(functionsHttpError)).toBe(false);
    });

    it('returns false for a FunctionsHttpError with context.status === 500', () => {
      const functionsHttpError = {
        message: 'Edge Function returned a non-2xx status code',
        context: { status: 500 },
      };
      expect(isUnauthorizedError(functionsHttpError)).toBe(false);
    });

    it('returns false when context exists but has no status property', () => {
      expect(isUnauthorizedError({ context: { body: 'something' } })).toBe(false);
    });
  });

  // --- String / Error message fallback ---
  describe('String fallback detection', () => {
    it('returns true for a generic Error with "401" in message', () => {
      expect(isUnauthorizedError(new Error('Request failed with status 401'))).toBe(true);
    });

    it('returns true for a generic Error with "Unauthorized" in message', () => {
      expect(isUnauthorizedError(new Error('Unauthorized'))).toBe(true);
    });

    it('returns true for a generic Error with "Auth session missing" in message', () => {
      expect(isUnauthorizedError(new Error('Auth session missing'))).toBe(true);
    });

    it('returns true for a generic Error with "JWT expired" in message', () => {
      expect(isUnauthorizedError(new Error('JWT expired'))).toBe(true);
    });

    it('returns true for a generic Error with "invalid claim: missing sub claim"', () => {
      expect(isUnauthorizedError(new Error('invalid claim: missing sub claim'))).toBe(true);
    });

    it('returns false for a generic Error with unrelated message', () => {
      expect(isUnauthorizedError(new Error('Network error'))).toBe(false);
    });

    it('returns false for a generic Error with "403 Forbidden"', () => {
      expect(isUnauthorizedError(new Error('403 Forbidden'))).toBe(false);
    });
  });

  // --- Edge cases / no false positives ---
  describe('Edge cases', () => {
    it('returns false for null', () => {
      expect(isUnauthorizedError(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isUnauthorizedError(undefined)).toBe(false);
    });

    it('returns false for an empty object', () => {
      expect(isUnauthorizedError({})).toBe(false);
    });

    it('returns false for a plain string', () => {
      expect(isUnauthorizedError('Unauthorized')).toBe(false);
    });

    it('returns false for a number', () => {
      expect(isUnauthorizedError(401)).toBe(false);
    });
  });
});
