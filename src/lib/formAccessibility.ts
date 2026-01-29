/**
 * Focus management utilities for modals and forms
 * 
 * Helps ensure proper keyboard navigation in dialogs and forms
 * by providing explicit tabindex management and focus helpers.
 */

/**
 * Standard autocomplete values for common form fields
 * Use these to ensure consistent browser autofill behavior
 */
export const autocompleteValues = {
  firstName: 'given-name',
  lastName: 'family-name',
  fullName: 'name',
  email: 'email',
  phone: 'tel',
  streetAddress: 'street-address',
  city: 'address-level2',
  state: 'address-level1',
  zip: 'postal-code',
  country: 'country-name',
  creditCardNumber: 'cc-number',
  creditCardExp: 'cc-exp',
  creditCardCvc: 'cc-csc',
} as const;

/**
 * Mobile-specific input attributes for email fields
 * Disables auto-capitalization and auto-correct to prevent common submission errors
 */
export const emailInputProps = {
  type: 'email' as const,
  autoComplete: autocompleteValues.email,
  autoCapitalize: 'off' as const,
  autoCorrect: 'off' as const,
  spellCheck: false as const,
  inputMode: 'email' as const,
};

/**
 * Mobile-specific input attributes for phone fields
 */
export const phoneInputProps = {
  type: 'tel' as const,
  autoComplete: autocompleteValues.phone,
  inputMode: 'tel' as const,
};

/**
 * Ensures an element is focusable and in the tab order
 * Use this to fix elements that should be focusable but aren't
 */
export function ensureFocusable(element: HTMLElement | null): void {
  if (!element) return;
  
  // If element doesn't have a tabIndex, make it focusable
  if (element.tabIndex < 0) {
    element.tabIndex = 0;
  }
}

/**
 * Focus the first focusable element within a container
 * Useful for modals that need to trap focus
 */
export function focusFirstFocusable(container: HTMLElement | null): void {
  if (!container) return;
  
  const focusableSelector = [
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
  firstFocusable?.focus();
}

/**
 * Get all focusable elements within a container
 * Ordered by tabindex and document order
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelector = [
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
}

/**
 * Create a focus trap within a container
 * Returns cleanup function to remove the trap
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}
