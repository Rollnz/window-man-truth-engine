// ============================================
// useLeadIdentity Hook
// ============================================
// Centralized "Golden Thread" identity management.
// This is a thin wrapper around useSessionData that provides
// dedicated access to the leadId for attribution tracking,
// plus the isVerifiedLead check for identity-aware gating.

import { useCallback, useEffect, useMemo } from 'react';
import { useSessionData } from './useSessionData';
import { getLeadAnchor, isLeadVerified, setLeadVerified } from '@/lib/leadAnchor';

/** Contact fields required for full verification */
export type ContactField = 'firstName' | 'email' | 'phone';

export interface LeadIdentity {
  /** The current lead ID (if captured) */
  leadId: string | undefined;
  /** Whether a lead identity exists */
  hasIdentity: boolean;
  /** Whether the lead is fully verified (anchor + PII completeness) */
  isVerifiedLead: boolean;
  /** Whether the lead has partial identity (some PII but not all) */
  isPartialLead: boolean;
  /** List of contact fields still missing for full verification */
  missingFields: ContactField[];
  /** Update the lead ID (triggers React state update across app) */
  setLeadId: (id: string) => void;
  /** Clear the lead identity */
  clearIdentity: () => void;
}

/**
 * Provides centralized access to the Golden Thread lead identity.
 * 
 * Usage:
 * ```tsx
 * const { leadId, hasIdentity, isVerifiedLead, setLeadId } = useLeadIdentity();
 * 
 * // After a successful lead capture:
 * setLeadId(response.leadId);
 * 
 * // Check if user is a verified lead (gate bypass):
 * if (isVerifiedLead) {
 *   // Skip lead capture modal, go straight to analysis
 * }
 * ```
 */
export function useLeadIdentity(): LeadIdentity {
  const { sessionData, updateField } = useSessionData();

  // Memoize the lead ID extraction
  const leadId = useMemo(() => sessionData.leadId, [sessionData.leadId]);

  // Check if we have an identity
  const hasIdentity = useMemo(() => !!leadId, [leadId]);

  // Read anchor + verified status once for stable references across memo/effect
  const leadAnchor = getLeadAnchor();
  const leadVerifiedFlag = isLeadVerified();

  // Compute which contact fields are missing
  // lastName is intentionally excluded — many forms only require first name
  const missingFields = useMemo(() => {
    const missing: ContactField[] = [];
    if (!sessionData.firstName) missing.push('firstName');
    if (!sessionData.email) missing.push('email');
    if (!sessionData.phone) missing.push('phone');
    return missing;
  }, [sessionData.firstName, sessionData.email, sessionData.phone]);

  // Identity-aware gating: true when leadAnchor exists AND core PII is complete,
  // OR when the persisted verified flag is set (survives sessionData clearing)
  const isVerifiedLead = useMemo(() => {
    const hasAnchor = !!leadAnchor;
    const piiComplete = hasAnchor && missingFields.length === 0;
    return piiComplete || leadVerifiedFlag;
  }, [leadAnchor, leadVerifiedFlag, missingFields]);

  // Persist verified flag when PII becomes complete
  useEffect(() => {
    if (leadAnchor && missingFields.length === 0) {
      setLeadVerified(true);
    }
  }, [leadAnchor, missingFields]);

  // Partial lead: has a stable identifier but not fully verified
  const isPartialLead = useMemo(() => {
    const hasStableIdentity = hasIdentity || !!leadAnchor || !!leadId;
    return hasStableIdentity && !isVerifiedLead;
  }, [hasIdentity, leadAnchor, leadId, isVerifiedLead]);

  // Set the lead ID - this triggers a React state update via useSessionData
  const setLeadId = useCallback((id: string) => {
    if (id && typeof id === 'string') {
      updateField('leadId', id);
    }
  }, [updateField]);

  // Clear the identity (useful for logout/reset scenarios)
  const clearIdentity = useCallback(() => {
    updateField('leadId', undefined);
  }, [updateField]);

  return {
    leadId,
    hasIdentity,
    isVerifiedLead,
    isPartialLead,
    missingFields,
    setLeadId,
    clearIdentity,
  };
}
