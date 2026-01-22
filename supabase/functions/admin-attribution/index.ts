// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ATTRIBUTION DATA EDGE FUNCTION (Command Center v2)
// Secure endpoint for fetching wm_events data with lead enrichment
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

    const { data: events, count: totalCount, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Events query error:', eventsError);
      throw new Error('Failed to fetch events');
    }

    // Get unique session IDs to fetch related wm_leads data
    const sessionIds = [...new Set((events || []).map(e => e.session_id))];
    
    // Fetch wm_leads data for these sessions (LEFT JOIN equivalent)
    // Returns both wm_lead_id (canonical) and lead_id (public) for routing
    let leadsMap: Record<string, {
      wm_lead_id: string;  // Canonical admin ID (wm_leads.id)
      lead_id: string | null;  // Public lead reference (leads.id)
      first_name: string | null;
      last_name: string | null;
      email: string;
      phone: string | null;
      engagement_score: number | null;
      lead_quality: string | null;
    }> = {};

    if (sessionIds.length > 0) {
      const { data: leadsData, error: leadsError } = await supabaseAdmin
        .from('wm_leads')
        .select('id, lead_id, original_session_id, first_name, last_name, email, phone, engagement_score, lead_quality')
        .in('original_session_id', sessionIds);
      
      if (leadsError) {
        console.error('[admin-attribution] Leads query error:', leadsError);
        throw new Error('Failed to fetch leads data');
      }
      
      if (leadsData) {
        for (const lead of leadsData) {
          if (lead.original_session_id) {
            leadsMap[lead.original_session_id] = {
              wm_lead_id: lead.id,  // Canonical admin routing ID
              lead_id: lead.lead_id,  // Public leads.id reference
              first_name: lead.first_name,
              last_name: lead.last_name,
              email: lead.email,
              phone: lead.phone,
              engagement_score: lead.engagement_score,
              lead_quality: lead.lead_quality,
            };
          }
        }
      }
    }

    // Fetch wm_sessions for UTM data
    let sessionsMap: Record<string, {
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
    }> = {};

    if (sessionIds.length > 0) {
      const { data: sessionsData, error: sessionsError } = await supabaseAdmin
        .from('wm_sessions')
        .select('id, utm_source, utm_medium, utm_campaign')
        .in('id', sessionIds);
      
      if (sessionsError) {
        console.error('[admin-attribution] Sessions query error:', sessionsError);
        throw new Error('Failed to fetch sessions data');
      }
      
      if (sessionsData) {
        for (const session of sessionsData) {
          sessionsMap[session.id] = {
            utm_source: session.utm_source,
            utm_medium: session.utm_medium,
            utm_campaign: session.utm_campaign,
          };
        }
      }
    }

    // Enrich events with lead and session data
    // Always include both wm_lead_id (canonical) and lead_id (public) for routing
    const enrichedEvents = (events || []).map(event => {
      const leadInfo = leadsMap[event.session_id] || null;
      const sessionInfo = sessionsMap[event.session_id] || null;
      
      return {
        ...event,
        // === CANONICAL ID FIELDS FOR ROUTING ===
        wm_lead_id: leadInfo?.wm_lead_id || null,  // Use for /admin/leads/:id routing
        lead_id: leadInfo?.lead_id || null,  // Public leads.id reference
        // Lead info (from wm_leads)
        lead_first_name: leadInfo?.first_name || null,
        lead_last_name: leadInfo?.last_name || null,
        lead_email: leadInfo?.email || null,
        lead_phone: leadInfo?.phone || null,
        engagement_score: leadInfo?.engagement_score || null,
        lead_quality: leadInfo?.lead_quality || null,
        // Session UTM info (from wm_sessions)
        utm_source: sessionInfo?.utm_source || null,
        utm_medium: sessionInfo?.utm_medium || null,
        utm_campaign: sessionInfo?.utm_campaign || null,
      };
    });

    const { data: eventTypes } = await supabaseAdmin.from('wm_events').select('event_name').order('event_name');
    const uniqueEventTypes = [...new Set(eventTypes?.map(e => e.event_name) || [])];

    return new Response(JSON.stringify({
      summary, 
      events: enrichedEvents, 
      eventTypes: uniqueEventTypes,
      totalCount: totalCount || 0, 
      hasMore: (offset + pageSize) < (totalCount || 0), 
      funnel,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('admin-attribution error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
