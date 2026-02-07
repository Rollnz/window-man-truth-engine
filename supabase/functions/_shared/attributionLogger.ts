// ═══════════════════════════════════════════════════════════════════════════
// SHARED ATTRIBUTION LOGGER
// Reusable utility for persisting events to wm_events with session FK handling
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

export interface AttributionEventParams {
  sessionId: string;
  eventName: string;
  eventCategory: string;
  pagePath: string;
  pageTitle?: string;
  eventData?: Record<string, unknown>;
  leadId?: string;
  /**
   * GOLDEN THREAD v4: Pass the Golden Thread ID (clientId from request payload).
   * 
   * CRITICAL: This value should be the visitor's canonical ID (wte-anon-id from frontend),
   * passed through sessionData.clientId in the request. This ensures:
   * - wm_sessions.anonymous_id matches leads.client_id
   * - CRM attribution chain works correctly via handle_new_lead_to_crm trigger
   * - Proper joins between sessions and leads for analytics
   * 
   * Only falls back to `edge-fn-*` format if clientId is truly unavailable.
   */
  anonymousIdFallback?: string;
}

/**
 * Logs an attribution event to wm_events with automatic session creation if needed.
 * 
 * Handles the NOT NULL constraint on session_id by:
 * 1. Checking if the session exists in wm_sessions
 * 2. Creating a minimal session record if it doesn't exist
 * 3. Inserting the event with proper FK reference
 * 
 * All errors are caught and logged - this function never throws.
 * This ensures the main user action is never blocked by analytics failures.
 */
export async function logAttributionEvent(params: AttributionEventParams): Promise<void> {
  const {
    sessionId,
    eventName,
    eventCategory,
    pagePath,
    pageTitle,
    eventData = {},
    leadId,
    anonymousIdFallback,
  } = params;

  // Skip if no sessionId provided
  if (!sessionId) {
    console.warn(`[AttributionLogger] No sessionId provided for event: ${eventName}`);
    return;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[AttributionLogger] Missing Supabase credentials');
    return;
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Step 1: Check if session exists in wm_sessions
    const { data: existingSession } = await supabaseAdmin
      .from('wm_sessions')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    // Step 2: If session doesn't exist, create a minimal record
    if (!existingSession) {
      console.log(`[AttributionLogger] Creating minimal wm_sessions record for: ${sessionId}`);
      
      const { error: sessionError } = await supabaseAdmin
        .from('wm_sessions')
        .insert({
          id: sessionId,
          anonymous_id: anonymousIdFallback || `edge-fn-${eventName}-${Date.now()}`,
          landing_page: pagePath,
          lead_id: leadId || null,
        } as Record<string, unknown>);

      if (sessionError) {
        console.error('[AttributionLogger] Failed to create wm_sessions record:', sessionError);
        // Continue anyway - the event insert may still work if session was created by concurrent request
      }
    }

    // Step 3: Insert the attribution event
    const { error: eventError } = await supabaseAdmin
      .from('wm_events')
      .insert({
        session_id: sessionId,
        event_name: eventName,
        event_category: eventCategory,
        page_path: pagePath,
        page_title: pageTitle || eventName,
        event_data: {
          ...eventData,
          lead_id: leadId || null,
          timestamp: new Date().toISOString(),
        },
      } as Record<string, unknown>);

    if (eventError) {
      console.error('[AttributionLogger] Failed to insert wm_events record:', eventError);
    } else {
      console.log(`[AttributionLogger] Event logged: ${eventName}`, {
        sessionId,
        leadId: leadId || 'anonymous',
        eventCategory,
      });
    }
  } catch (error) {
    // Fault tolerance: Log error but don't throw
    console.error('[AttributionLogger] Attribution logging failed (non-fatal):', error);
  }
}
