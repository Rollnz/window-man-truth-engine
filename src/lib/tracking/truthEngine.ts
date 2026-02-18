/**
 * TruthEngine — Debug & Cross-Module Window API
 *
 * ARCHITECTURE NOTE: This file exists specifically to break the circular
 * ES module dependency between gtm.ts and wmTracking.ts.
 *
 * Dependency graph (no cycles):
 *
 *   gtm.ts           ← wmTracking.ts (one-way, safe)
 *   truthEngine.ts   → gtm.ts          (top-level orchestrator)
 *   truthEngine.ts   → wmTracking.ts   (top-level orchestrator)
 *
 * Previously installTruthEngine() lived in gtm.ts, which forced gtm.ts to
 * import wmTracking.ts, creating the A→B→A cycle.
 *
 * USAGE: Only import this file from app entry points (e.g. main.tsx).
 *        Never import from gtm.ts or wmTracking.ts.
 */

import {
  buildEnhancedUserData,
  normalizeEmail,
  safeHash,
  sha256,
  hashPhone,
  generateEventId,
  isAlreadyHashed,
  getFbp,
  getFbc,
  trackEvent,
  trackLeadCapture,
} from '../gtm';
import { normalizeToE164 } from '../phoneFormat';
import {
  wmLead,
  wmQualifiedLead,
  wmScannerUpload,
  wmAppointmentBooked,
  wmSold,
  wmRetarget,
  wmInternal,
} from '../wmTracking';

export interface TruthEngine {
  // Utilities
  buildEnhancedUserData: typeof buildEnhancedUserData;
  normalizeEmail: typeof normalizeEmail;
  normalizeToE164: typeof normalizeToE164;
  safeHash: typeof safeHash;
  sha256: typeof sha256;
  hashPhone: typeof hashPhone;
  generateEventId: typeof generateEventId;
  isAlreadyHashed: typeof isAlreadyHashed;
  getFbp: typeof getFbp;
  getFbc: typeof getFbc;
  // Canonical wmTracking functions
  wmLead: typeof wmLead;
  wmQualifiedLead: typeof wmQualifiedLead;
  wmScannerUpload: typeof wmScannerUpload;
  wmAppointmentBooked: typeof wmAppointmentBooked;
  wmSold: typeof wmSold;
  wmRetarget: typeof wmRetarget;
  wmInternal: typeof wmInternal;
  // General tracking
  trackEvent: typeof trackEvent;
  trackLeadCapture: typeof trackLeadCapture;
}

declare global {
  interface Window {
    truthEngine?: TruthEngine;
  }
}

/**
 * Install the Truth Engine on window for debugging and cross-module access.
 *
 * MERGE-SAFE: Does not overwrite existing properties.
 * Call this from app entry point (main.tsx) — not from gtm.ts or wmTracking.ts.
 */
export function installTruthEngine(): void {
  if (typeof window === 'undefined') return;

  window.truthEngine = {
    ...window.truthEngine,
    // Utilities
    buildEnhancedUserData,
    normalizeEmail,
    normalizeToE164,
    safeHash,
    sha256,
    hashPhone,
    generateEventId,
    isAlreadyHashed,
    getFbp,
    getFbc,
    // Canonical wmTracking functions
    wmLead,
    wmQualifiedLead,
    wmScannerUpload,
    wmAppointmentBooked,
    wmSold,
    wmRetarget,
    wmInternal,
    // General tracking
    trackEvent,
    trackLeadCapture,
  };

  if (import.meta.env.DEV) {
    console.log('[TruthEngine] Installed on window.truthEngine', {
      methods: Object.keys(window.truthEngine!),
    });
  }
}
