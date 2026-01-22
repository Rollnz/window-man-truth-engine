// ============================================
// Lead Routing Utilities
// ============================================
// Centralized helpers for canonical lead routing in admin UI.
// IMPORTANT: This is for ROUTING identity, not session identity.
// For session identity tracking, see useLeadIdentity hook.

/**
 * Lead identity fields for routing purposes.
 * wm_lead_id = wm_leads.id (canonical admin routing ID)
 * lead_id = leads.id (legacy/public ID)
 */
export interface LeadRoutingIds {
  wm_lead_id?: string | null;
  lead_id?: string | null;
}

/**
 * Generates the canonical admin lead route.
 * Prioritizes wm_lead_id (canonical) with fallback to lead_id (legacy).
 * 
 * @example
 * // Returns "/admin/leads/abc123"
 * getLeadRoute({ wm_lead_id: 'abc123', lead_id: 'xyz789' })
 * 
 * // Fallback to lead_id when wm_lead_id is missing
 * getLeadRoute({ wm_lead_id: null, lead_id: 'xyz789' })
 * // Returns "/admin/leads/xyz789"
 * 
 * // Returns null when neither ID is available
 * getLeadRoute({ wm_lead_id: null, lead_id: null })
 * // Returns null
 */
export function getLeadRoute(ids: LeadRoutingIds): string | null {
  const targetId = ids.wm_lead_id ?? ids.lead_id;
  
  if (!targetId) {
    return null;
  }
  
  return `/admin/leads/${targetId}`;
}

/**
 * Checks if a lead has a routable identity.
 * Returns true if either wm_lead_id or lead_id is present.
 */
export function hasLeadRoute(ids: LeadRoutingIds): boolean {
  return !!(ids.wm_lead_id ?? ids.lead_id);
}

/**
 * Development-time assertion for lead identity presence.
 * Logs warnings when wm_lead_id is missing but lead_id exists (indicates legacy data).
 * Does nothing in production.
 * 
 * @param obj - Object that should contain lead identity fields
 * @param context - Description of where this check is happening (for debugging)
 */
export function assertLeadIdentity(
  obj: Record<string, unknown>,
  context: string
): void {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const wmLeadId = obj.wm_lead_id;
  const leadId = obj.lead_id;

  // Case 1: Neither ID present when we expected one
  if (!wmLeadId && !leadId) {
    // This might be intentional (e.g., orphan records), so just info-level
    return;
  }

  // Case 2: Only lead_id present (legacy data path)
  if (!wmLeadId && leadId) {
    console.warn(
      `[LeadRouting] ${context}: Using fallback lead_id. Consider migrating to wm_lead_id.`,
      { lead_id: leadId }
    );
  }

  // Case 3: Both present - ideal state, no warning needed
}

/**
 * Extracts lead routing IDs from any object that may contain them.
 * Handles common field name variations.
 */
export function extractLeadIds(obj: Record<string, unknown>): LeadRoutingIds {
  return {
    wm_lead_id: (obj.wm_lead_id as string | null | undefined) ?? null,
    lead_id: (obj.lead_id as string | null | undefined) ?? null,
  };
}
