import { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Storage keys
// ═══════════════════════════════════════════════════════════════════════════

const LEAD_ID_KEY = 'wm_prequote_v2_lead_id';
const GLOBAL_COMPLETED_KEY = 'wm_prequote_v2_global_completed';
const LEGACY_COMPLETED_KEY = 'wm_prequote_v2_completed'; // Old single key — to be cleaned up

function ctaKey(ctaSource: string): string {
  return `wm_prequote_v2_completed_${ctaSource}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Safe sessionStorage helpers (all reads synchronous, all writes in callbacks)
// ═══════════════════════════════════════════════════════════════════════════

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Non-critical — incognito / iframe
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Non-critical
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export interface UseLeadSuppressionResult {
  /** True if ANY V2 lead form was completed (or Step 1 persisted a leadId) */
  hasGlobalLead: boolean;
  /** True if THIS specific ctaSource was completed through to the result screen */
  hasCompletedCta: boolean;
  /** The persisted lead ID from sessionStorage, or null */
  storedLeadId: string | null;
  /** Call when the user explicitly closes the result screen */
  markCompleted: () => void;
}

export function useLeadSuppression(ctaSource: string): UseLeadSuppressionResult {
  // Defensive fallback for missing ctaSource
  const resolvedCta = ctaSource || 'unknown';
  if (!ctaSource && process.env.NODE_ENV === 'development') {
    console.warn('[useLeadSuppression] ctaSource is falsy — falling back to "unknown"');
  }

  // All reads are synchronous (safe in render)
  const storedLeadId = safeGet(LEAD_ID_KEY);
  const globalCompleted = safeGet(GLOBAL_COMPLETED_KEY) === '1';
  const ctaCompleted = safeGet(ctaKey(resolvedCta)) === '1';

  // hasGlobalLead is broad: leadId exists OR global flag set (critique C)
  const hasGlobalLead = !!storedLeadId || globalCompleted;
  const hasCompletedCta = ctaCompleted;

  // Legacy cleanup — runs once, in an effect (not during render)
  useEffect(() => {
    if (safeGet(LEGACY_COMPLETED_KEY)) {
      safeRemove(LEGACY_COMPLETED_KEY);
    }
  }, []);

  // markCompleted — only called from callbacks, never during render
  const markCompleted = () => {
    safeSet(GLOBAL_COMPLETED_KEY, '1');
    safeSet(ctaKey(resolvedCta), '1');
  };

  return {
    hasGlobalLead,
    hasCompletedCta,
    storedLeadId,
    markCompleted,
  };
}
