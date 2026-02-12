import DOMPurify from 'dompurify';

const CSRF_STORAGE_KEY = 'wm-csrf-token';

/**
 * Sanitize user-provided text to neutralize HTML/script payloads.
 *
 * We intentionally allow no HTML tags in lead form inputs.
 */
export function sanitizeUserInput(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Recursively sanitizes string values in an object/array payload.
 * Non-string primitives are returned as-is.
 */
export function sanitizePayload<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeUserInput(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item)) as T;
  }

  if (value && typeof value === 'object') {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sanitizePayload(item),
    ]);

    return Object.fromEntries(sanitizedEntries) as T;
  }

  return value;
}

/**
 * Generate a stable CSRF token for this browser session.
 *
 * The token is sent in both request header + body (double submit pattern).
 */
export function getCsrfToken(): string {
  const existingToken = sessionStorage.getItem(CSRF_STORAGE_KEY);
  if (existingToken) {
    return existingToken;
  }

  const token = crypto.randomUUID();
  sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  return token;
}

/**
 * Promise timeout helper for network/edge function calls.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Request timed out. Please try again.',
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
