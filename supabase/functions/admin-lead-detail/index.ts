import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveWmLeadId, isValidUUID } from "../_shared/leadId.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Database-driven admin check via user_roles table
async function hasAdminRole(supabase: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin-lead-detail] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// ===== Structured error response helper =====
function errorResponse(status: number, code: string, message: string, details?: Record<string, unknown>) {
  return new Response(JSON.stringify({ 
    ok: false, 
    code, 
    error: message,
    details: details || null,
    timestamp: new Date().toISOString(),
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ===== Hard-fail helper for DB queries =====
function assertNoError(error: unknown, context: string): asserts error is null {
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[admin-lead-detail] HARD-FAIL in ${context}:`, msg);
    throw new Error(`Database query failed in ${context}: ${msg}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(401, 'unauthorized', 'Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse(401, 'invalid_token', 'Invalid or expired token');
    }

    // Check admin role in database
    const isAdmin = await hasAdminRole(supabase, user.id);
    if (!isAdmin) {
      return errorResponse(403, 'forbidden', 'Access denied - admin only');
    }

    const url = new URL(req.url);
    const inputId = url.searchParams.get('id');

    // UUID format validation
    if (inputId && !isValidUUID(inputId)) {
      return errorResponse(400, 'invalid_uuid', 'Lead ID must be a valid UUID');
    }

    if (!inputId) {
      return errorResponse(400, 'missing_id', 'Lead ID required');
    }

    // Handle different methods
    if (req.method === 'GET') {
      // ===== DUAL-ID RESOLUTION =====
      // Accepts either wm_leads.id (canonical) or leads.id (via wm_leads.lead_id)
      const resolution = await resolveWmLeadId(supabase, inputId);

      if (!resolution.found || !resolution.lead) {
        return errorResponse(404, 'not_found', 'Lead not found', {
          searched_id: inputId,
          searched_columns: ['wm_leads.id', 'wm_leads.lead_id'],
        });
      }

      const lead = resolution.lead;
      const leadId = resolution.wm_lead_id!; // Canonical wm_leads.id for child queries

      // Log resolution path for debugging (no PII)
      console.log(`[admin-lead-detail] Lead resolved: id=${leadId} via=${resolution.resolved_via}`);


      // Fetch events for this lead's session - HARD FAIL
      let events: unknown[] = [];
      if (lead.original_session_id) {
        const { data: eventData, error: eventError } = await supabase
          .from('wm_events')
          .select('*')
          .eq('session_id', lead.original_session_id)
          .order('created_at', { ascending: true });

        assertNoError(eventError, 'wm_events.select(session_id)');
        events = eventData || [];
      }

      // Also get events linked to lead_id via session
      if (lead.lead_id) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('wm_sessions')
          .select('id')
          .eq('lead_id', lead.lead_id);

        assertNoError(sessionError, 'wm_sessions.select(lead_id)');

        if (sessionData && sessionData.length > 0) {
          const sessionIds = sessionData.map(s => s.id);
          const { data: additionalEvents, error: addEventsError } = await supabase
            .from('wm_events')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true });

          assertNoError(addEventsError, 'wm_events.select(session_ids)');

          if (additionalEvents) {
            // Merge and dedupe by id
            const existingIds = new Set((events as { id: string }[]).map(e => e.id));
            for (const event of additionalEvents) {
              if (!existingIds.has(event.id)) {
                events.push(event);
              }
            }
            // Re-sort by created_at
            events.sort((a: unknown, b: unknown) => 
              new Date((a as { created_at: string }).created_at).getTime() - 
              new Date((b as { created_at: string }).created_at).getTime()
            );
          }
        }
      }

      // Fetch quote files - HARD FAIL
      let files: unknown[] = [];
      if (lead.lead_id) {
        const { data: fileData, error: fileError } = await supabase
          .from('quote_files')
          .select('*')
          .eq('lead_id', lead.lead_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        assertNoError(fileError, 'quote_files.select');
        files = fileData || [];
      }

      // Fetch notes - HARD FAIL
      const { data: notes, error: notesError } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      assertNoError(notesError, 'lead_notes.select');

      // Fetch session UTM data - HARD FAIL
      let sessionData: unknown = null;
      if (lead.original_session_id) {
        const { data, error: sessionFetchError } = await supabase
          .from('wm_sessions')
          .select('*')
          .eq('id', lead.original_session_id)
          .maybeSingle();
        
        assertNoError(sessionFetchError, 'wm_sessions.select(original_session_id)');
        sessionData = data;
      }

      // Fetch phone call logs and pending calls - HARD FAIL
      let calls: unknown[] = [];
      let pendingCalls: unknown[] = [];

      if (lead.lead_id) {
        // Phone call logs (completed/failed calls)
        const { data: callData, error: callError } = await supabase
          .from('phone_call_logs')
          .select('*')
          .eq('lead_id', lead.lead_id)
          .order('triggered_at', { ascending: false })
          .limit(20);

        assertNoError(callError, 'phone_call_logs.select');
        calls = callData || [];

        // Pending calls (queued/in-progress)
        const { data: pendingData, error: pendingError } = await supabase
          .from('pending_calls')
          .select('*')
          .eq('lead_id', lead.lead_id)
          .order('created_at', { ascending: false });

        assertNoError(pendingError, 'pending_calls.select');
        pendingCalls = pendingData || [];
      }

      // Fetch opportunities for this wm_lead - HARD FAIL
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('wm_lead_id', leadId)
        .order('created_at', { ascending: false });

      assertNoError(oppError, 'opportunities.select');

      // Fetch deals for this wm_lead - HARD FAIL
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('wm_lead_id', leadId)
        .order('close_date', { ascending: false });

      assertNoError(dealsError, 'deals.select');

      // Calculate financial summary
      const dealsArr = deals || [];
      const wonDeals = dealsArr.filter((d: { outcome: string }) => d.outcome === 'won');
      const lostDeals = dealsArr.filter((d: { outcome: string }) => d.outcome === 'lost');
      const totalRevenue = wonDeals.reduce((sum: number, d: { gross_revenue: string }) => 
        sum + (parseFloat(d.gross_revenue) || 0), 0);
      const totalProfit = wonDeals.reduce((sum: number, d: { net_profit: string }) => 
        sum + (parseFloat(d.net_profit) || 0), 0);
      const totalForecast = (opportunities || []).reduce((sum: number, o: { expected_value: string; probability: number }) => {
        return sum + (parseFloat(o.expected_value) || 0) * (o.probability || 0) / 100;
      }, 0);
      const latestCloseDate = wonDeals.length > 0 
        ? wonDeals.reduce((latest: string | null, d: { close_date: string | null }) => {
            if (!d.close_date) return latest;
            return !latest || d.close_date > latest ? d.close_date : latest;
          }, null as string | null)
        : null;

      const financialSummary = {
        totalRevenue,
        totalProfit,
        wonCount: wonDeals.length,
        lostCount: lostDeals.length,
        totalForecast,
        latestCloseDate,
      };

      // Extract AI pre-analysis from the best quote file
      // Priority: completed > pending > failed > none (most recent within each tier)
      let aiPreAnalysis = null;
      if (files?.length) {
        const typedFiles = files as any[];
        const statusPriority: Record<string, number> = { completed: 4, pending: 3, failed: 2, none: 1 };
        
        const bestFile = typedFiles.reduce((best: any, f: any) => {
          const fStatus = f?.ai_pre_analysis?.status || 'none';
          const bestStatus = best?.ai_pre_analysis?.status || 'none';
          const fPri = statusPriority[fStatus] || 0;
          const bestPri = statusPriority[bestStatus] || 0;
          return fPri > bestPri ? f : best;
        }, typedFiles[0]);

        if (bestFile) {
          const status = bestFile.ai_pre_analysis?.status || 'none';
          aiPreAnalysis = {
            ...(bestFile.ai_pre_analysis || { status: 'none', result: null, reason: null }),
            status,
            quote_file_id: bestFile.id,
          };
        }
      }

      return new Response(JSON.stringify({
        ok: true,
        // === CANONICAL ID FIELDS ===
        wm_lead_id: resolution.wm_lead_id,
        lead_id: resolution.lead_id,
        resolved_via: resolution.resolved_via,
        // Include canonical_path when resolved via fallback (for URL normalization)
        ...(resolution.resolved_via === 'fallback' && {
          canonical: {
            wm_lead_id: resolution.wm_lead_id,
            canonical_path: resolution.canonical_path,
          },
        }),
        // === LEAD DATA ===
        lead,
        events,
        files,
        notes: notes || [],
        session: sessionData,
        calls,
        pendingCalls,
        opportunities: opportunities || [],
        deals: deals || [],
        financialSummary,
        aiPreAnalysis,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // ===== DUAL-ID RESOLUTION FOR POST =====
      const resolution = await resolveWmLeadId(supabase, inputId);

      if (!resolution.found) {
        return errorResponse(404, 'not_found', 'Lead not found', {
          searched_id: inputId,
          searched_columns: ['wm_leads.id', 'wm_leads.lead_id'],
        });
      }

      const leadId = resolution.wm_lead_id!; // Canonical wm_leads.id for all operations

      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return errorResponse(400, 'invalid_json', 'Request body must be valid JSON');
      }
      
      const { action } = body;

      if (action === 'add_note') {
        const { content } = body;
        if (!content || typeof content !== 'string' || !content.trim()) {
          return errorResponse(400, 'missing_content', 'Note content required');
        }

        const { data: note, error: noteError } = await supabase
          .from('lead_notes')
          .insert({
            lead_id: leadId,
            content: (content as string).trim(),
            admin_email: user.email,
          })
          .select()
          .single();

        assertNoError(noteError, 'lead_notes.insert');

        return new Response(JSON.stringify({ ok: true, success: true, note }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_status') {
        const { status } = body;
        const validStatuses = ['new', 'qualifying', 'mql', 'qualified', 'appointment_set', 'sat', 'closed_won', 'closed_lost', 'dead'];
        
        if (!validStatuses.includes(status as string)) {
          return errorResponse(400, 'invalid_status', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
        
        // Set closed_at for terminal statuses
        if (status === 'closed_won' || status === 'closed_lost' || status === 'dead') {
          updateData.closed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('wm_leads')
          .update(updateData)
          .eq('id', leadId);

        assertNoError(updateError, 'wm_leads.update(status)');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_social_url') {
        const { verified_social_url } = body;

        const { error: updateError } = await supabase
          .from('wm_leads')
          .update({ 
            verified_social_url, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', leadId);

        assertNoError(updateError, 'wm_leads.update(social_url)');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // UPDATE SOCIAL PROFILE (per-platform Facebook/Instagram)
      // =====================
      if (action === 'update_social_profile') {
        const { platform, url: rawUrl } = body;

        // Validate platform
        if (platform !== 'facebook' && platform !== 'instagram') {
          return errorResponse(400, 'invalid_platform', 'Platform must be facebook or instagram');
        }

        const column = platform === 'facebook' ? 'social_facebook_url' : 'social_instagram_url';

        // Handle clear (null)
        if (rawUrl === null || rawUrl === undefined || (typeof rawUrl === 'string' && !rawUrl.trim())) {
          const { error: updateError } = await supabase
            .from('wm_leads')
            .update({ [column]: null, updated_at: new Date().toISOString() })
            .eq('id', leadId);

          assertNoError(updateError, `wm_leads.update(${column}_clear)`);

          return new Response(JSON.stringify({ ok: true, success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate URL
        if (typeof rawUrl !== 'string') {
          return errorResponse(400, 'invalid_social_url', 'URL must be a string or null');
        }

        let urlStr = rawUrl.trim();
        if (!/^https?:\/\//i.test(urlStr)) {
          urlStr = `https://${urlStr}`;
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(urlStr);
        } catch {
          return errorResponse(400, 'invalid_social_url', 'Invalid URL format');
        }

        if (parsedUrl.protocol !== 'https:') {
          return errorResponse(400, 'invalid_social_url', 'URL must use https');
        }

        const host = parsedUrl.hostname.replace(/^www\./i, '').toLowerCase();
        const fbHosts = new Set(['facebook.com', 'm.facebook.com']);
        const igHosts = new Set(['instagram.com']);

        if (platform === 'facebook' && !fbHosts.has(host)) {
          return errorResponse(400, 'invalid_social_url', 'Facebook URL must be on facebook.com or m.facebook.com');
        }
        if (platform === 'instagram' && !igHosts.has(host)) {
          return errorResponse(400, 'invalid_social_url', 'Instagram URL must be on instagram.com');
        }

        // Strip query params and hash for clean storage
        parsedUrl.search = '';
        parsedUrl.hash = '';
        const cleanUrl = parsedUrl.toString();

        const { error: updateError } = await supabase
          .from('wm_leads')
          .update({ [column]: cleanUrl, updated_at: new Date().toISOString() })
          .eq('id', leadId);

        assertNoError(updateError, `wm_leads.update(${column})`);

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_lead') {
        const { updates } = body;
        const allowedFields = ['first_name', 'last_name', 'phone', 'city', 'notes', 'estimated_deal_value', 'actual_deal_value', 'assigned_to'];
        
        const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        for (const [key, value] of Object.entries(updates as Record<string, unknown>)) {
          if (allowedFields.includes(key)) {
            safeUpdates[key] = value;
          }
        }

        const { error: updateError } = await supabase
          .from('wm_leads')
          .update(safeUpdates)
          .eq('id', leadId);

        assertNoError(updateError, 'wm_leads.update(lead)');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // FORCE FAIL ANALYSIS (client-side timeout sync)
      // =====================
      if (action === 'force_fail_analysis') {
        const { quoteFileId, reason } = body;
        if (!quoteFileId) {
          return errorResponse(400, 'missing_quote_file_id', 'quoteFileId is required');
        }

        // Only overwrite if still stuck in 'pending'
        const { error: failError } = await supabase
          .from('quote_files')
          .update({
            ai_pre_analysis: {
              status: 'failed',
              result: null,
              reason: reason || 'Client-side timeout',
              started_at: null,
              completed_at: new Date().toISOString(),
              model: null,
            },
          })
          .eq('id', quoteFileId)
          .eq('ai_pre_analysis->>status', 'pending');

        if (failError) {
          console.error('[admin-lead-detail] force_fail_analysis error:', failError.message);
        }

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // OPPORTUNITY CRUD
      // =====================

      if (action === 'create_opportunity') {
        const { stage, expected_value, probability, assigned_to, notes: oppNotes } = body;
        
        const { data: opportunity, error: oppError } = await supabase
          .from('opportunities')
          .insert({
            wm_lead_id: leadId,
            stage: stage || 'new',
            expected_value: expected_value || 0,
            probability: probability ?? 10,
            assigned_to: assigned_to || null,
            notes: oppNotes || null,
          })
          .select()
          .single();

        assertNoError(oppError, 'opportunities.insert');

        return new Response(JSON.stringify({ ok: true, success: true, opportunity }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_opportunity') {
        const { opportunity_id, stage, expected_value, probability, assigned_to, notes: oppNotes } = body;
        
        if (!opportunity_id) {
          return errorResponse(400, 'missing_opportunity_id', 'Opportunity ID required');
        }

        // Verify this opportunity belongs to the lead
        const { data: existing, error: existingError } = await supabase
          .from('opportunities')
          .select('wm_lead_id')
          .eq('id', opportunity_id)
          .single();

        assertNoError(existingError, 'opportunities.select(verify)');

        if (!existing || existing.wm_lead_id !== leadId) {
          return errorResponse(404, 'opportunity_not_found', 'Opportunity not found for this lead');
        }

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (stage !== undefined) updates.stage = stage;
        if (expected_value !== undefined) updates.expected_value = expected_value;
        if (probability !== undefined) updates.probability = probability;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;
        if (oppNotes !== undefined) updates.notes = oppNotes;

        const { error: updateError } = await supabase
          .from('opportunities')
          .update(updates)
          .eq('id', opportunity_id);

        assertNoError(updateError, 'opportunities.update');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete_opportunity') {
        const { opportunity_id } = body;
        
        if (!opportunity_id) {
          return errorResponse(400, 'missing_opportunity_id', 'Opportunity ID required');
        }

        // Verify this opportunity belongs to the lead
        const { data: existing, error: existingError } = await supabase
          .from('opportunities')
          .select('wm_lead_id')
          .eq('id', opportunity_id)
          .single();

        assertNoError(existingError, 'opportunities.select(verify_delete)');

        if (!existing || existing.wm_lead_id !== leadId) {
          return errorResponse(404, 'opportunity_not_found', 'Opportunity not found for this lead');
        }

        const { error: deleteError } = await supabase
          .from('opportunities')
          .delete()
          .eq('id', opportunity_id);

        assertNoError(deleteError, 'opportunities.delete');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // DEAL CRUD
      // =====================

      if (action === 'create_deal') {
        const { 
          opportunity_id, outcome, close_date, gross_revenue, 
          cogs, labor_cost, commissions, other_cost, 
          payment_status, invoice_id 
        } = body;
        
        // Note: net_profit is a generated column, so we don't insert it
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .insert({
            wm_lead_id: leadId,
            opportunity_id: opportunity_id || null,
            outcome: outcome || 'won',
            close_date: close_date || null,
            gross_revenue: gross_revenue || 0,
            cogs: cogs || 0,
            labor_cost: labor_cost || 0,
            commissions: commissions || 0,
            other_cost: other_cost || 0,
            payment_status: payment_status || 'unpaid',
            invoice_id: invoice_id || null,
          })
          .select()
          .single();

        assertNoError(dealError, 'deals.insert');

        return new Response(JSON.stringify({ ok: true, success: true, deal }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_deal') {
        const { 
          deal_id, opportunity_id, outcome, close_date, gross_revenue, 
          cogs, labor_cost, commissions, other_cost, 
          payment_status, invoice_id 
        } = body;
        
        if (!deal_id) {
          return errorResponse(400, 'missing_deal_id', 'Deal ID required');
        }

        // Verify this deal belongs to the lead
        const { data: existing, error: existingError } = await supabase
          .from('deals')
          .select('wm_lead_id')
          .eq('id', deal_id)
          .single();

        assertNoError(existingError, 'deals.select(verify)');

        if (!existing || existing.wm_lead_id !== leadId) {
          return errorResponse(404, 'deal_not_found', 'Deal not found for this lead');
        }

        // Note: net_profit is a generated column, so we don't update it
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (opportunity_id !== undefined) updates.opportunity_id = opportunity_id;
        if (outcome !== undefined) updates.outcome = outcome;
        if (close_date !== undefined) updates.close_date = close_date;
        if (gross_revenue !== undefined) updates.gross_revenue = gross_revenue;
        if (cogs !== undefined) updates.cogs = cogs;
        if (labor_cost !== undefined) updates.labor_cost = labor_cost;
        if (commissions !== undefined) updates.commissions = commissions;
        if (other_cost !== undefined) updates.other_cost = other_cost;
        if (payment_status !== undefined) updates.payment_status = payment_status;
        if (invoice_id !== undefined) updates.invoice_id = invoice_id;

        const { error: updateError } = await supabase
          .from('deals')
          .update(updates)
          .eq('id', deal_id);

        assertNoError(updateError, 'deals.update');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete_deal') {
        const { deal_id } = body;
        
        if (!deal_id) {
          return errorResponse(400, 'missing_deal_id', 'Deal ID required');
        }

        // Verify this deal belongs to the lead
        const { data: existing, error: existingError } = await supabase
          .from('deals')
          .select('wm_lead_id')
          .eq('id', deal_id)
          .single();

        assertNoError(existingError, 'deals.select(verify_delete)');

        if (!existing || existing.wm_lead_id !== leadId) {
          return errorResponse(404, 'deal_not_found', 'Deal not found for this lead');
        }

        const { error: deleteError } = await supabase
          .from('deals')
          .delete()
          .eq('id', deal_id);

        assertNoError(deleteError, 'deals.delete');

        return new Response(JSON.stringify({ ok: true, success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // CHECK FOR FINANCIAL RECORDS (for delete protection)
      // =====================

      if (action === 'check_has_financials') {
        const { data: opportunities, error: oppError } = await supabase
          .from('opportunities')
          .select('id')
          .eq('wm_lead_id', leadId)
          .limit(1);

        assertNoError(oppError, 'opportunities.select(check_financials)');

        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('id')
          .eq('wm_lead_id', leadId)
          .limit(1);

        assertNoError(dealsError, 'deals.select(check_financials)');

        const hasFinancials = (opportunities && opportunities.length > 0) || (deals && deals.length > 0);

        return new Response(JSON.stringify({ ok: true, success: true, hasFinancials }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return errorResponse(400, 'unknown_action', `Unknown action: ${action}`);
    }

    return errorResponse(405, 'method_not_allowed', 'Method not allowed');

  } catch (error: unknown) {
    console.error('[admin-lead-detail] FATAL ERROR:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(500, 'internal_error', message, {
      type: error instanceof Error ? error.name : 'UnknownError',
    });
  }
});
