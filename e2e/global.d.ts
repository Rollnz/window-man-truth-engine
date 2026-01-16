/**
 * Global type declarations for E2E tests
 */
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export {};
