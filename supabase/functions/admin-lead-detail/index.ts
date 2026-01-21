import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin whitelist (case-insensitive)
const ADMIN_EMAILS = ['vansiclenp@gmail.com', 'mongoloyd@protonmail.com'];

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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const leadId = url.searchParams.get('id');

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Lead ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle different methods
    if (req.method === 'GET') {
      // Fetch lead with all related data
      const { data: lead, error: leadError } = await supabase
        .from('wm_leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();

      if (leadError) throw leadError;
      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch events for this lead's session
      let events: any[] = [];
      if (lead.original_session_id) {
        const { data: eventData, error: eventError } = await supabase
          .from('wm_events')
          .select('*')
          .eq('session_id', lead.original_session_id)
          .order('created_at', { ascending: true });

        if (!eventError && eventData) {
          events = eventData;
        }
      }

      // Also get events linked to lead_id via session
      if (lead.lead_id) {
        const { data: sessionData } = await supabase
          .from('wm_sessions')
          .select('id')
          .eq('lead_id', lead.lead_id);

        if (sessionData && sessionData.length > 0) {
          const sessionIds = sessionData.map(s => s.id);
          const { data: additionalEvents } = await supabase
            .from('wm_events')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: true });

          if (additionalEvents) {
            // Merge and dedupe by id
            const existingIds = new Set(events.map(e => e.id));
            for (const event of additionalEvents) {
              if (!existingIds.has(event.id)) {
                events.push(event);
              }
            }
            // Re-sort by created_at
            events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
        }
      }

      // Fetch quote files
      let files: any[] = [];
      if (lead.lead_id) {
        const { data: fileData } = await supabase
          .from('quote_files')
          .select('*')
          .eq('lead_id', lead.lead_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (fileData) {
          files = fileData;
        }
      }

      // Fetch notes
      const { data: notes } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      // Fetch session UTM data
      let sessionData: any = null;
      if (lead.original_session_id) {
        const { data } = await supabase
          .from('wm_sessions')
          .select('*')
          .eq('id', lead.original_session_id)
          .maybeSingle();
        sessionData = data;
      }

      // Fetch phone call logs and pending calls
      let calls: any[] = [];
      let pendingCalls: any[] = [];

      if (lead.lead_id) {
        // Phone call logs (completed/failed calls)
        const { data: callData } = await supabase
          .from('phone_call_logs')
          .select('*')
          .eq('lead_id', lead.lead_id)
          .order('triggered_at', { ascending: false })
          .limit(20);

        if (callData) calls = callData;

        // Pending calls (queued/in-progress)
        const { data: pendingData } = await supabase
          .from('pending_calls')
          .select('*')
          .eq('lead_id', lead.lead_id)
          .order('created_at', { ascending: false });

        if (pendingData) pendingCalls = pendingData;
      }

      // Fetch opportunities for this wm_lead
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('wm_lead_id', leadId)
        .order('created_at', { ascending: false });

      // Fetch deals for this wm_lead
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .eq('wm_lead_id', leadId)
        .order('close_date', { ascending: false });

      // Calculate financial summary
      const wonDeals = (deals || []).filter(d => d.outcome === 'won');
      const lostDeals = (deals || []).filter(d => d.outcome === 'lost');
      const totalRevenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.gross_revenue) || 0), 0);
      const totalProfit = wonDeals.reduce((sum, d) => sum + (parseFloat(d.net_profit) || 0), 0);
      const totalForecast = (opportunities || []).reduce((sum, o) => {
        return sum + (parseFloat(o.expected_value) || 0) * (o.probability || 0) / 100;
      }, 0);
      const latestCloseDate = wonDeals.length > 0 
        ? wonDeals.reduce((latest, d) => {
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

      return new Response(JSON.stringify({
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
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action } = body;

      if (action === 'add_note') {
        const { content } = body;
        if (!content || !content.trim()) {
          return new Response(JSON.stringify({ error: 'Note content required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: note, error: noteError } = await supabase
          .from('lead_notes')
          .insert({
            lead_id: leadId,
            content: content.trim(),
            admin_email: user.email,
          })
          .select()
          .single();

        if (noteError) throw noteError;

        return new Response(JSON.stringify({ success: true, note }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_status') {
        const { status } = body;
        const validStatuses = ['new', 'qualifying', 'mql', 'appointment_set', 'sat', 'closed_won', 'closed_lost', 'dead'];
        
        if (!validStatuses.includes(status)) {
          return new Response(JSON.stringify({ error: 'Invalid status' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updateData: any = { status, updated_at: new Date().toISOString() };
        
        // Set closed_at for terminal statuses
        if (status === 'closed_won' || status === 'closed_lost' || status === 'dead') {
          updateData.closed_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('wm_leads')
          .update(updateData)
          .eq('id', leadId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
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

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_lead') {
        const { updates } = body;
        const allowedFields = ['first_name', 'last_name', 'phone', 'city', 'notes', 'estimated_deal_value', 'actual_deal_value', 'assigned_to'];
        
        const safeUpdates: any = { updated_at: new Date().toISOString() };
        for (const [key, value] of Object.entries(updates)) {
          if (allowedFields.includes(key)) {
            safeUpdates[key] = value;
          }
        }

        const { error: updateError } = await supabase
          .from('wm_leads')
          .update(safeUpdates)
          .eq('id', leadId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // OPPORTUNITY CRUD
      // =====================

      if (action === 'create_opportunity') {
        const { stage, expected_value, probability, assigned_to, notes } = body;
        
        const { data: opportunity, error: oppError } = await supabase
          .from('opportunities')
          .insert({
            wm_lead_id: leadId,
            stage: stage || 'new',
            expected_value: expected_value || 0,
            probability: probability ?? 10,
            assigned_to: assigned_to || null,
            notes: notes || null,
          })
          .select()
          .single();

        if (oppError) throw oppError;

        return new Response(JSON.stringify({ success: true, opportunity }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'update_opportunity') {
        const { opportunity_id, stage, expected_value, probability, assigned_to, notes } = body;
        
        if (!opportunity_id) {
          return new Response(JSON.stringify({ error: 'Opportunity ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify this opportunity belongs to the lead
        const { data: existing } = await supabase
          .from('opportunities')
          .select('wm_lead_id')
          .eq('id', opportunity_id)
          .single();

        if (!existing || existing.wm_lead_id !== leadId) {
          return new Response(JSON.stringify({ error: 'Opportunity not found for this lead' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updates: any = { updated_at: new Date().toISOString() };
        if (stage !== undefined) updates.stage = stage;
        if (expected_value !== undefined) updates.expected_value = expected_value;
        if (probability !== undefined) updates.probability = probability;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;
        if (notes !== undefined) updates.notes = notes;

        const { error: updateError } = await supabase
          .from('opportunities')
          .update(updates)
          .eq('id', opportunity_id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete_opportunity') {
        const { opportunity_id } = body;
        
        if (!opportunity_id) {
          return new Response(JSON.stringify({ error: 'Opportunity ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify this opportunity belongs to the lead
        const { data: existing } = await supabase
          .from('opportunities')
          .select('wm_lead_id')
          .eq('id', opportunity_id)
          .single();

        if (!existing || existing.wm_lead_id !== leadId) {
          return new Response(JSON.stringify({ error: 'Opportunity not found for this lead' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: deleteError } = await supabase
          .from('opportunities')
          .delete()
          .eq('id', opportunity_id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
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

        if (dealError) throw dealError;

        return new Response(JSON.stringify({ success: true, deal }), {
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
          return new Response(JSON.stringify({ error: 'Deal ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify this deal belongs to the lead
        const { data: existing } = await supabase
          .from('deals')
          .select('wm_lead_id')
          .eq('id', deal_id)
          .single();

        if (!existing || existing.wm_lead_id !== leadId) {
          return new Response(JSON.stringify({ error: 'Deal not found for this lead' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Note: net_profit is a generated column, so we don't update it
        const updates: any = { updated_at: new Date().toISOString() };
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

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete_deal') {
        const { deal_id } = body;
        
        if (!deal_id) {
          return new Response(JSON.stringify({ error: 'Deal ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify this deal belongs to the lead
        const { data: existing } = await supabase
          .from('deals')
          .select('wm_lead_id')
          .eq('id', deal_id)
          .single();

        if (!existing || existing.wm_lead_id !== leadId) {
          return new Response(JSON.stringify({ error: 'Deal not found for this lead' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: deleteError } = await supabase
          .from('deals')
          .delete()
          .eq('id', deal_id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // =====================
      // CHECK FOR FINANCIAL RECORDS (for delete protection)
      // =====================

      if (action === 'check_has_financials') {
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('id')
          .eq('wm_lead_id', leadId)
          .limit(1);

        const { data: deals } = await supabase
          .from('deals')
          .select('id')
          .eq('wm_lead_id', leadId)
          .limit(1);

        const hasFinancials = (opportunities && opportunities.length > 0) || (deals && deals.length > 0);

        return new Response(JSON.stringify({ success: true, hasFinancials }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Unknown action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in admin-lead-detail:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
