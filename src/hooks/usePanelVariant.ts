import { useState } from 'react';

export type PanelVariant = 'A' | 'B' | 'C' | 'D' | 'E';

const STORAGE_KEY = 'wte-panel-variant';
const URL_PARAM = 'panel_variant';
const VALID_VARIANTS: PanelVariant[] = ['A', 'B', 'C', 'D', 'E'];

const VARIANT_NAMES: Record<PanelVariant, string> = {
  A: 'Evidence Vault',
  B: '30-Second Diagnostic',
  C: 'Insider Report',
  D: 'Storm Shield',
  E: 'Window Man Concierge',
};

function isValidVariant(value: string): value is PanelVariant {
  return VALID_VARIANTS.includes(value as PanelVariant);
}

function assignVariant(): { variant: PanelVariant; method: 'url_param' | 'persisted' | 'random' } {
  if (typeof window === 'undefined') {
    return { variant: 'A', method: 'random' };
  }

  // 1. Check URL param override (for QA/testing)
  const params = new URLSearchParams(window.location.search);
  const urlVariant = params.get(URL_PARAM)?.toUpperCase();
  if (urlVariant && isValidVariant(urlVariant)) {
    try {
      localStorage.setItem(STORAGE_KEY, urlVariant);
    } catch { /* ignore */ }
    return { variant: urlVariant, method: 'url_param' };
  }

  // 2. Check localStorage for persisted assignment
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidVariant(stored)) {
      return { variant: stored, method: 'persisted' };
    }
  } catch { /* ignore */ }

  // 3. Random assignment (equal 20% buckets)
  const randomIndex = Math.floor(Math.random() * VALID_VARIANTS.length);
  const variant = VALID_VARIANTS[randomIndex];
  try {
    localStorage.setItem(STORAGE_KEY, variant);
  } catch { /* ignore */ }

  return { variant, method: 'random' };
}

/**
 * usePanelVariant - A/B test variant assignment for the slide-over panel.
 *
 * Priority: URL param ?panel_variant=X > localStorage > random (20% each).
 * Persisted in localStorage for consistent user experience.
 */
export function usePanelVariant() {
  const [assignment] = useState(() => assignVariant());

  return {
    variant: assignment.variant,
    variantName: VARIANT_NAMES[assignment.variant],
    isOverridden: assignment.method === 'url_param',
    assignmentMethod: assignment.method,
  };
}
