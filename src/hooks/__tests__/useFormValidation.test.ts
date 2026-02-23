import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, validateEmail, validatePhone } from '../useFormValidation';

// ═══════════════════════════════════════════════════════════════════════════
// formatPhoneNumber
// ═══════════════════════════════════════════════════════════════════════════

describe('formatPhoneNumber', () => {
  it('returns empty string for empty input', () => {
    expect(formatPhoneNumber('')).toBe('');
  });

  it('formats partial input with 1-3 digits', () => {
    expect(formatPhoneNumber('5')).toBe('(5');
    expect(formatPhoneNumber('555')).toBe('(555');
  });

  it('formats partial input with 4-6 digits', () => {
    expect(formatPhoneNumber('5551')).toBe('(555) 1');
    expect(formatPhoneNumber('555123')).toBe('(555) 123');
  });

  it('formats full 10-digit number', () => {
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
  });

  it('strips non-digit characters before formatting', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// validateEmail
// ═══════════════════════════════════════════════════════════════════════════

describe('validateEmail', () => {
  it('returns true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('first.last+tag@domain.co')).toBe(true);
  });

  it('returns false for invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('notanemail')).toBe(false);
    expect(validateEmail('missing@tld')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// validatePhone
// ═══════════════════════════════════════════════════════════════════════════

describe('validatePhone', () => {
  it('returns true for a valid 10-digit US phone number', () => {
    expect(validatePhone('5551234567')).toBe(true);
    expect(validatePhone('(555) 123-4567')).toBe(true);
  });

  it('returns false for numbers with fewer or more than 10 digits', () => {
    expect(validatePhone('')).toBe(false);
    expect(validatePhone('555123')).toBe(false);
    expect(validatePhone('55512345678')).toBe(false);
  });
});
