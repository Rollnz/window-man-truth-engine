/**
 * writeLedgerEvent - Canonical helper for writing events to wm_event_log
 * 
 * This helper ensures consistent event logging across all Edge Functions.
 * Uses service role to bypass RLS.
 * 
 * CRITICAL: Includes explicit logging for debugging.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface LedgerEventParams {
  event_name: string;
  event_type?: string;
  source_tool: string;
  source_system: string;
  ingested_by: string;
  client_id?: string | null;
  lead_id?: string | null;
  session_id?: string | null;
  page_path?: string;
  metadata?: Record<string, unknown>;
}

export interface LedgerEventResult {
  success: boolean;
  event_id?: string;
  error?: string;
}

/**
 * Write an event to the canonical wm_event_log table.
 * 
 * Uses service role client to bypass RLS.
 * Never throws - returns success/failure result.
 * Logs extensively for debugging.
 */
export async function writeLedgerEvent(params: LedgerEventParams): Promise<LedgerEventResult> {
  const {
    event_name,
    event_type = 'signal',
    source_tool,
    source_system,
    ingested_by,
    client_id,
    lead_id,
    session_id,
    page_path,
    metadata = {},
  } = params;

  // Generate unique event ID
  const event_id = crypto.randomUUID();

  console.log(`[writeLedgerEvent] Attempting wm_event_log insert`, {
    event_id,
    event_name,
    event_type,
    source_tool,
    source_system,
    ingested_by,
    client_id: client_id || '(none)',
    lead_id: lead_id || '(none)',
    session_id: session_id || '(none)',
    page_path: page_path || '(none)',
    metadata_keys: Object.keys(metadata),
  });

  try {
    // Create service role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      const error = 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY';
      console.error(`[writeLedgerEvent] ERROR: ${error}`);
      return { success: false, error };
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Build the row
    const row = {
      event_id,
      event_name,
      event_type,
      event_time: new Date().toISOString(),
      source_tool,
      source_system,
      ingested_by,
      client_id: client_id || null,
      lead_id: lead_id || null,
      session_id: session_id || null,
      page_path: page_path || null,
      metadata,
    };

    console.log(`[writeLedgerEvent] Inserting row:`, JSON.stringify(row, null, 2));

    // Insert into wm_event_log
    const { data, error } = await supabaseAdmin
      .from('wm_event_log')
      .insert(row)
      .select('event_id')
      .single();

    if (error) {
      console.error(`[writeLedgerEvent] INSERT ERROR:`, {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return { success: false, event_id, error: error.message };
    }

    console.log(`[writeLedgerEvent] SUCCESS: Inserted event_id=${data?.event_id || event_id}`);
    return { success: true, event_id: data?.event_id || event_id };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[writeLedgerEvent] EXCEPTION:`, errorMessage);
    return { success: false, event_id, error: errorMessage };
  }
}
