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

      return new Response(JSON.stringify({
        lead,
        events,
        files,
        notes: notes || [],
        session: sessionData,
        calls,
        pendingCalls,
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
