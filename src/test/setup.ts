import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID and crypto.subtle for SHA-256 hashing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
    subtle: {
      digest: async (_algo: string, data: ArrayBuffer) => {
        // Consistent mock hash - returns 32-byte buffer producing 64-char hex string
        const bytes = new Uint8Array(32);
        const input = new TextDecoder().decode(data);
        for (let i = 0; i < 32; i++) {
          bytes[i] = (input.charCodeAt(i % input.length) + i) % 256;
        }
        return bytes.buffer;
      },
    },
  },
});

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-key',
    },
  },
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
