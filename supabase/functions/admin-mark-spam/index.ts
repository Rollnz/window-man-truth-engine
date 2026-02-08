/**
 * Admin Mark Spam Edge Function
 * "Spam Kill Switch" - Marks leads as spam and optionally blocks IPs
 */

import { validateAdminRequest, corsHeaders, successResponse, errorResponse } from "../_shared/adminAuth.ts";

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
    const { supabaseAdmin, userId, email: adminEmail } = validation;

    // Parse request body
    const body: { lead_ids: string[]; block_ip?: boolean } = await req.json();
    const { lead_ids, block_ip } = body;

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return errorResponse(400, 'invalid_request', 'lead_ids array required');
    }

    console.log(`[admin-mark-spam] Marking ${lead_ids.length} leads as spam by ${adminEmail}`);

    // Get IP hashes before updating (for potential blocking)
    let ipsToBlock: string[] = [];
    if (block_ip) {
      const { data: leadsWithIps } = await supabaseAdmin
        .from('leads')
        .select('ip_hash')
        .in('id', lead_ids)
        .not('ip_hash', 'is', null);

      ipsToBlock = [...new Set((leadsWithIps || []).map(l => l.ip_hash).filter(Boolean))];
    }

    // Update leads to spam status
    const { error: updateError, count } = await supabaseAdmin
      .from('leads')
      .update({
        lead_status: 'spam',
        updated_at: new Date().toISOString(),
      })
      .in('id', lead_ids);

    if (updateError) {
      console.error('[admin-mark-spam] Update error:', updateError);
      return errorResponse(500, 'update_error', updateError.message);
    }

    // Block IPs if requested
    let ipsBlocked = 0;
    if (block_ip && ipsToBlock.length > 0) {
      for (const ipHash of ipsToBlock) {
        const { error: blockError } = await supabaseAdmin
          .from('blocked_traffic')
          .insert({
            ip_hash: ipHash,
            reason: 'spam',
            blocked_by: userId,
          });

        if (!blockError) {
          ipsBlocked++;
        } else {
          console.warn(`[admin-mark-spam] Failed to block IP ${ipHash}:`, blockError.message);
        }
      }
    }

    // Log the action
    for (const leadId of lead_ids) {
      await supabaseAdmin.from('lead_activities').insert({
        lead_id: leadId,
        event_id: crypto.randomUUID(),
        session_id: 'admin-mark-spam',
        client_id: 'admin-mark-spam',
        event_name: 'marked_as_spam',
        score_delta: 0,
        payload: {
          marked_by: adminEmail,
          marked_at: new Date().toISOString(),
          ip_blocked: block_ip && ipsBlocked > 0,
        },
      });
    }

    console.log(`[admin-mark-spam] Marked ${count || lead_ids.length} leads as spam, blocked ${ipsBlocked} IPs`);

    return successResponse({
      marked: count || lead_ids.length,
      ipsBlocked,
    });

  } catch (error) {
    console.error('[admin-mark-spam] Error:', error);
    return errorResponse(500, 'internal_error', error instanceof Error ? error.message : 'Unknown error');
  }
});
