// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ATTRIBUTION DATA EDGE FUNCTION
// Secure endpoint for fetching wm_events data (requires admin role)
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAILS = [
  'admin@windowman.com',
  'support@windowman.com',
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
].map(e => e.toLowerCase());

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userEmail = claimsData.claims.email as string;
    if (!ADMIN_EMAILS.includes(userEmail?.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const eventFilter = url.searchParams.get('event_name');
    const leadIdFilter = url.searchParams.get('lead_id');
    const sessionIdFilter = url.searchParams.get('session_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    const pageSize = Math.min(Math.max(1, parseInt(url.searchParams.get('page_size') || '50')), 100);

    // Funnel calculation
    let funnel = { traffic: 0, engagement: 0, leadGen: 0, conversion: 0 };
    if (!leadIdFilter && !sessionIdFilter) {
      let baseQuery = supabaseAdmin.from('wm_events').select('session_id, event_name, event_category');
      if (startDate) baseQuery = baseQuery.gte('created_at', startDate);
      if (endDate) baseQuery = baseQuery.lte('created_at', endDate);
      const { data: allEvents } = await baseQuery;
      
      if (allEvents) {
        const sessions = new Set(allEvents.map(e => e.session_id));
        const engaged = new Set(allEvents.filter(e => e.event_category === 'tool' || e.event_category === 'vault').map(e => e.session_id));
        const leads = new Set(allEvents.filter(e => e.event_name === 'lead_captured').map(e => e.session_id));
        const conversions = new Set(allEvents.filter(e => e.event_name === 'consultation_booked').map(e => e.session_id));
        funnel = { traffic: sessions.size, engagement: engaged.size, leadGen: leads.size, conversion: conversions.size };
      }
    }

    // Summary stats
    let summary = { totalLeads: 0, totalEmails: 0, totalAiInteractions: 0 };
    if (!leadIdFilter && !sessionIdFilter) {
      const { count: leadsCount } = await supabaseAdmin.from('leads').select('*', { count: 'exact', head: true });
      let eventsQuery = supabaseAdmin.from('wm_events').select('event_name');
      if (startDate) eventsQuery = eventsQuery.gte('created_at', startDate);
      if (endDate) eventsQuery = eventsQuery.lte('created_at', endDate);
      const { data: eventCounts } = await eventsQuery;
      
      summary = {
        totalLeads: leadsCount || 0,
        totalEmails: eventCounts?.filter(e => e.event_name === 'vault_email_sent').length || 0,
        totalAiInteractions: eventCounts?.filter(e => ['expert_chat_session', 'roleplay_chat_turn', 'quote_scanned', 'quote_generated', 'evidence_analyzed'].includes(e.event_name)).length || 0,
      };
    }

    // Paginated events query
    let eventsQuery = supabaseAdmin.from('wm_events')
      .select('id, event_name, event_category, event_data, page_path, created_at, session_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (eventFilter) eventsQuery = eventsQuery.eq('event_name', eventFilter);
    if (leadIdFilter) eventsQuery = eventsQuery.eq('event_data->>lead_id', leadIdFilter);
    if (sessionIdFilter) eventsQuery = eventsQuery.eq('session_id', sessionIdFilter);
    if (startDate) eventsQuery = eventsQuery.gte('created_at', startDate);
    if (endDate) eventsQuery = eventsQuery.lte('created_at', endDate);

    const { data: events, count: totalCount } = await eventsQuery;

    const { data: eventTypes } = await supabaseAdmin.from('wm_events').select('event_name').order('event_name');
    const uniqueEventTypes = [...new Set(eventTypes?.map(e => e.event_name) || [])];

    return new Response(JSON.stringify({
      summary, events: events || [], eventTypes: uniqueEventTypes,
      totalCount: totalCount || 0, hasMore: (offset + pageSize) < (totalCount || 0), funnel,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('admin-attribution error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
