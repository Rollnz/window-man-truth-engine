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

// Admin email whitelist - same pattern as existing admin dashboard
const ADMIN_EMAILS = [
  'admin@windowman.com',
  'support@windowman.com',
  'vansiclenp@gmail.com',
  'mongoloyd@protonmail.com',
];

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION & AUTHORIZATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = claimsData.claims.email as string;
    
    // Check admin whitelist
    if (!ADMIN_EMAILS.includes(userEmail?.toLowerCase())) {
      console.warn(`Unauthorized admin access attempt: ${userEmail}`);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin access granted: ${userEmail}`);
    // ===== END AUTHORIZATION =====

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse query params
    const url = new URL(req.url);
    const eventFilter = url.searchParams.get('event_name') || null;
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    // Fetch summary stats
    const { data: summaryData, error: summaryError } = await supabaseAdmin
      .rpc('get_attribution_summary');

    // If RPC doesn't exist, calculate manually
    let summary = { totalLeads: 0, totalEmails: 0, totalAiInteractions: 0 };
    
    if (summaryError) {
      console.log('RPC not available, calculating summary manually');
      
      // Count leads
      const { count: leadsCount } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true });
      
      // Count events by category
      const { data: eventCounts } = await supabaseAdmin
        .from('wm_events')
        .select('event_name');
      
      const emailCount = eventCounts?.filter(e => e.event_name === 'vault_email_sent').length || 0;
      const aiCount = eventCounts?.filter(e => 
        ['expert_chat_session', 'roleplay_chat_turn', 'roleplay_game_completed', 
         'quote_scanned', 'quote_generated', 'evidence_analyzed'].includes(e.event_name)
      ).length || 0;
      
      summary = {
        totalLeads: leadsCount || 0,
        totalEmails: emailCount,
        totalAiInteractions: aiCount,
      };
    } else {
      summary = summaryData;
    }

    // Fetch recent events with optional filter
    let eventsQuery = supabaseAdmin
      .from('wm_events')
      .select('id, event_name, event_category, event_data, page_path, created_at, session_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventFilter) {
      eventsQuery = eventsQuery.eq('event_name', eventFilter);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
      throw new Error('Failed to fetch events');
    }

    // Get distinct event names for filter dropdown
    const { data: eventTypes } = await supabaseAdmin
      .from('wm_events')
      .select('event_name')
      .order('event_name');

    const uniqueEventTypes = [...new Set(eventTypes?.map(e => e.event_name) || [])];

    return new Response(
      JSON.stringify({
        summary,
        events: events || [],
        eventTypes: uniqueEventTypes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('admin-attribution error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
