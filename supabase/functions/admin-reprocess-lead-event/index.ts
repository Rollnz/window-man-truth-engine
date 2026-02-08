/**
 * Admin Reprocess Lead Event Edge Function
 * "Ghost Lead Resurrector" - Re-creates lead records from orphaned event data
 */

import { validateAdminRequest, corsHeaders, successResponse, errorResponse } from "../_shared/adminAuth.ts";

interface OrphanedEvent {
  event_id: string;
  event_name: string;
  session_id: string;
  event_data: Record<string, unknown>;
  client_id: string;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'method_not_allowed', 'POST required');
  }

  try {
    // Validate admin access
    const validation = await validateAdminRequest(req);
    if (!validation.ok) {
      return validation.response;
    }
    const { supabaseAdmin, email: adminEmail } = validation;

    // Parse request body
    let body: { event_ids?: string[]; reprocess_all?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { event_ids, reprocess_all } = body;

    // Fetch orphaned events
    let query = supabaseAdmin
      .from('analytics_orphaned_events')
      .select('event_id, event_name, session_id, event_data, client_id, created_at');

    if (!reprocess_all && event_ids && event_ids.length > 0) {
      query = query.in('event_id', event_ids);
    }

    const { data: orphans, error: orphansError } = await query.limit(50);

    if (orphansError) {
      console.error('[admin-reprocess-lead-event] Query error:', orphansError);
      return errorResponse(500, 'query_error', orphansError.message);
    }

    if (!orphans || orphans.length === 0) {
      return successResponse({ recovered: 0, message: 'No orphaned events found' });
    }

    console.log(`[admin-reprocess-lead-event] Found ${orphans.length} orphaned events to process`);

    let recoveredCount = 0;
    const errors: string[] = [];

    for (const orphan of orphans as OrphanedEvent[]) {
      try {
        // Extract form data from event_data
        const eventData = orphan.event_data || {};
        const email = eventData.email as string;
        const name = eventData.name as string;
        const phone = eventData.phone as string;
        const firstName = eventData.firstName as string || eventData.first_name as string;
        const lastName = eventData.lastName as string || eventData.last_name as string;

        if (!email) {
          errors.push(`Event ${orphan.event_id}: No email in event_data`);
          continue;
        }

        // Check if lead already exists by email
        const { data: existingLead } = await supabaseAdmin
          .from('leads')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingLead) {
          // Link the existing lead to the session
          await supabaseAdmin
            .from('leads')
            .update({
              client_id: orphan.client_id,
              original_session_id: orphan.session_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLead.id);

          recoveredCount++;
          continue;
        }

        // Create new lead from event data
        const { error: insertError } = await supabaseAdmin
          .from('leads')
          .insert({
            email,
            name: name || null,
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
            client_id: orphan.client_id,
            original_session_id: orphan.session_id,
            source_tool: eventData.source_tool as string || 'recovered',
            source_form: 'ghost_lead_recovery',
            lead_status: 'curious',
            created_at: orphan.created_at,
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          errors.push(`Event ${orphan.event_id}: ${insertError.message}`);
          console.error(`[admin-reprocess-lead-event] Insert failed:`, insertError);
        } else {
          recoveredCount++;

          // Log the recovery
          console.log(`[admin-reprocess-lead-event] Recovered lead: ${email} from event ${orphan.event_id}`);
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Event ${orphan.event_id}: ${msg}`);
      }
    }

    console.log(`[admin-reprocess-lead-event] Recovered ${recoveredCount}/${orphans.length} leads by ${adminEmail}`);

    return successResponse({
      recovered: recoveredCount,
      attempted: orphans.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[admin-reprocess-lead-event] Error:', error);
    return errorResponse(500, 'internal_error', error instanceof Error ? error.message : 'Unknown error');
  }
});
