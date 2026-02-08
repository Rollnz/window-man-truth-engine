/**
 * Admin Fix Attribution Edge Function
 * "Attribution Time Machine" - Heals leads with missing UTMs from their session history
 */

import { validateAdminRequest, corsHeaders, successResponse, errorResponse } from "../_shared/adminAuth.ts";

interface AttributionGap {
  lead_id: string;
  email: string;
  first_touch_utm_source: string;
  first_touch_utm_medium: string;
  first_touch_utm_campaign: string;
  first_touch_landing_page: string;
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
    let body: { lead_ids?: string[]; heal_all?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { lead_ids, heal_all } = body;

    // Fetch attribution gaps
    let query = supabaseAdmin
      .from('analytics_attribution_gaps')
      .select('lead_id, email, first_touch_utm_source, first_touch_utm_medium, first_touch_utm_campaign, first_touch_landing_page');

    if (!heal_all && lead_ids && lead_ids.length > 0) {
      query = query.in('lead_id', lead_ids);
    }

    const { data: gaps, error: gapsError } = await query.limit(100);

    if (gapsError) {
      console.error('[admin-fix-attribution] Query error:', gapsError);
      return errorResponse(500, 'query_error', gapsError.message);
    }

    if (!gaps || gaps.length === 0) {
      return successResponse({ healed: 0, message: 'No attribution gaps found' });
    }

    console.log(`[admin-fix-attribution] Found ${gaps.length} leads to heal`);

    let healedCount = 0;
    const errors: string[] = [];

    // Update each lead with first-touch attribution
    for (const gap of gaps as AttributionGap[]) {
      const { error: updateError } = await supabaseAdmin
        .from('leads')
        .update({
          utm_source: gap.first_touch_utm_source,
          utm_medium: gap.first_touch_utm_medium,
          utm_campaign: gap.first_touch_utm_campaign,
          landing_page: gap.first_touch_landing_page,
          updated_at: new Date().toISOString(),
        })
        .eq('id', gap.lead_id);

      if (updateError) {
        errors.push(`Lead ${gap.lead_id}: ${updateError.message}`);
        console.error(`[admin-fix-attribution] Update failed for ${gap.lead_id}:`, updateError);
      } else {
        healedCount++;

        // Log the healing action to lead_activities
        await supabaseAdmin.from('lead_activities').insert({
          lead_id: gap.lead_id,
          event_id: crypto.randomUUID(),
          session_id: 'admin-fix-attribution',
          client_id: 'admin-fix-attribution',
          event_name: 'attribution_healed',
          score_delta: 0,
          payload: {
            healed_by: adminEmail,
            healed_at: new Date().toISOString(),
            utm_source: gap.first_touch_utm_source,
            utm_medium: gap.first_touch_utm_medium,
            utm_campaign: gap.first_touch_utm_campaign,
          },
        });
      }
    }

    console.log(`[admin-fix-attribution] Healed ${healedCount}/${gaps.length} leads`);

    return successResponse({
      healed: healedCount,
      attempted: gaps.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[admin-fix-attribution] Error:', error);
    return errorResponse(500, 'internal_error', error instanceof Error ? error.message : 'Unknown error');
  }
});
