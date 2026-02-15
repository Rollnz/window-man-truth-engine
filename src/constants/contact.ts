/**
 * Centralized contact information.
 * Single source of truth for phone numbers displayed across the site.
 */
export const CONTACT = {
  /** E.164 format for tel: links and tracking */
  PHONE_E164: '+15614685571',
  /** Display format for UI */
  PHONE_DISPLAY: '(561) 468-5571',
  /** Human-readable for screen readers */
  PHONE_ARIA: 'Call Window Man at 561-468-5571',
} as const;
