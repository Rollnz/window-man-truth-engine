/**
 * score-event Edge Function
 * 
 * Truth Engine Scoring Ledger v2 - Secure, server-side scoring
 * 
 * Features:
 * - Server-side point mapping (clients cannot specify points)
 * - Whitelisted event types only
 * - Ownership validation (anti-cheat)
 * - Idempotency via event_id unique constraint
 * - Threshold transition detection (fire GTM events exactly once)
 * - Anonymous + authenticated identity support
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Whitelisted event types
const ALLOWED_EVENT_TYPES = ['QUOTE_UPLOADED', 'LEAD_CAPTURED'] as const;
type EventType = typeof ALLOWED_EVENT_TYPES[number];

// Points mapping (server-side only - matches DB function)
const POINTS_MAP: Record<EventType, number> = {
  QUOTE_UPLOADED: 50,
  LEAD_CAPTURED: 100,
};

// Thresholds for GTM events
const HIGH_INTENT_THRESHOLD = 100;
const QUALIFIED_THRESHOLD = 150;

interface ScoreEventRequest {
  event_type: string;
  source_entity_type: string;
  source_entity_id: string;
  event_id: string;
  anon_id?: string;
}

interface ScoreEventResponse {
  ok: boolean;
  inserted: boolean;
  total_score: number;
  level_label: string;
  high_intent_reached_now: boolean;
  qualified_reached_now: boolean;
  error?: string;
}

function scoreToLevel(score: number): string {
  if (score >= 150) return 'Qualified';
  if (score >= 100) return 'High Intent';
  if (score >= 50) return 'Warming Up';
  return 'Just Starting';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: ScoreEventRequest = await req.json();
    const { event_type, source_entity_type, source_entity_id, event_id, anon_id } = body;

    // Validate required fields
    if (!event_type || !source_entity_type || !source_entity_id || !event_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate event_type against whitelist
    if (!ALLOWED_EVENT_TYPES.includes(event_type as EventType)) {
      console.warn(`[score-event] Rejected unknown event_type: ${event_type}`);
      return new Response(
        JSON.stringify({ ok: false, error: `Invalid event_type: ${event_type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get points from server-side mapping
    const points = POINTS_MAP[event_type as EventType];
    if (!points) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for ledger writes
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Extract user identity from JWT if present
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    // Require at least one identity
    if (!userId && !anon_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'No identity provided (userId or anon_id required)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ownership validation: verify the source entity exists and belongs to this identity
    const ownershipValid = await validateOwnership(
      supabase as any,
      source_entity_type,
      source_entity_id,
      userId,
      anon_id
    );

    if (!ownershipValid) {
      console.warn(`[score-event] Ownership validation failed for ${source_entity_type}:${source_entity_id}`);
      return new Response(
        JSON.stringify({ ok: false, error: 'Entity ownership validation failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get previous score before insert (for threshold detection)
    const previousScore = await getCurrentScore(supabase as any, userId, anon_id);

    // Attempt idempotent insert
    const { data: insertData, error: insertError } = await supabase
      .from('wte_score_events')
      .insert({
        user_id: userId,
        anon_id: anon_id || null,
        event_type,
        source_entity_type,
        source_entity_id,
        points,
        event_id,
      })
      .select('id')
      .maybeSingle();

    // Check for unique constraint violation (idempotent - already inserted)
    const inserted = !insertError && insertData !== null;
    
    if (insertError && insertError.code !== '23505') {
      // Real error (not duplicate key)
      console.error('[score-event] Insert error:', insertError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate new total score
    const newScore = await getCurrentScore(supabase as any, userId, anon_id);
    const levelLabel = scoreToLevel(newScore);

    // Detect threshold transitions (only fire when crossing)
    const highIntentReachedNow = inserted && 
      previousScore < HIGH_INTENT_THRESHOLD && 
      newScore >= HIGH_INTENT_THRESHOLD;
    
    const qualifiedReachedNow = inserted && 
      previousScore < QUALIFIED_THRESHOLD && 
      newScore >= QUALIFIED_THRESHOLD;

    // Update profile score if authenticated
    if (userId) {
      await updateProfileScore(supabase as any, userId, newScore, highIntentReachedNow, qualifiedReachedNow);
    }

    const response: ScoreEventResponse = {
      ok: true,
      inserted,
      total_score: newScore,
      level_label: levelLabel,
      high_intent_reached_now: highIntentReachedNow,
      qualified_reached_now: qualifiedReachedNow,
    };

    console.log(`[score-event] ${inserted ? 'Awarded' : 'Deduplicated'} ${event_type}: score=${newScore}, level=${levelLabel}`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[score-event] Error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Validate that the source entity exists and belongs to this identity
 */
async function validateOwnership(
  supabase: any,
  entityType: string,
  entityId: string,
  userId: string | null,
  anonId: string | null | undefined
): Promise<boolean> {
  try {
    if (entityType === 'quote') {
      // Quote scans may use scanAttemptId (client-generated UUID) instead of DB record
      // For these ephemeral scans, we validate via anon_id ownership only
      // The idempotency is still enforced by event_id uniqueness
      const { data, error } = await supabase
        .from('quote_files')
        .select('id, session_id, lead_id')
        .eq('id', entityId)
        .maybeSingle();

      // If quote not in DB, allow if we have a valid anon_id (ephemeral scan)
      if (error || !data) {
        // Ephemeral quote scan - allow if anon_id present
        return !!anonId || !!userId;
      }

      // For quotes, we validate via session_id (which maps to anon_id)
      // or via lead_id if the user is authenticated
      if (anonId && data.session_id === anonId) {
        return true;
      }
      
      // If authenticated, check if user owns the linked lead
      if (userId && data.lead_id) {
        const { data: lead } = await supabase
          .from('leads')
          .select('user_id')
          .eq('id', data.lead_id)
          .maybeSingle();
        
        if (lead?.user_id === userId) {
          return true;
        }
      }

      // Allow if session matches (quote_files uses session_id as anon identity)
      return !!anonId && data.session_id === anonId;
    }

    if (entityType === 'lead') {
      // Check leads table
      const { data, error } = await supabase
        .from('leads')
        .select('id, user_id, client_id')
        .eq('id', entityId)
        .maybeSingle();

      if (error || !data) {
        console.log(`[score-event] Lead not found: ${entityId}`);
        return false;
      }

      // Validate ownership
      if (userId && data.user_id === userId) {
        return true;
      }
      
      // For anonymous users, check client_id matches anon_id
      if (anonId && data.client_id === anonId) {
        return true;
      }

      // Allow if this lead was just created (no user_id yet) and client matches
      if (!data.user_id && anonId && data.client_id === anonId) {
        return true;
      }

      return false;
    }

    // Unknown entity type - reject
    console.warn(`[score-event] Unknown entity type: ${entityType}`);
    return false;

  } catch (error) {
    console.error('[score-event] Ownership validation error:', error);
    return false;
  }
}

/**
 * Get current total score for an identity
 */
async function getCurrentScore(
  supabase: any,
  userId: string | null,
  anonId: string | null | undefined
): Promise<number> {
  let query = supabase
    .from('wte_score_events')
    .select('points');

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonId) {
    query = query.eq('anon_id', anonId);
  } else {
    return 0;
  }

  const { data, error } = await query;
  
  if (error || !data) {
    return 0;
  }

  return data.reduce((sum: number, row: { points?: number }) => sum + (row.points || 0), 0);
}

/**
 * Update profile with new score and threshold timestamps
 */
async function updateProfileScore(
  supabase: any,
  userId: string,
  totalScore: number,
  highIntentReached: boolean,
  qualifiedReached: boolean
): Promise<void> {
  const updates: Record<string, unknown> = {
    total_score: totalScore,
    updated_at: new Date().toISOString(),
  };

  if (highIntentReached) {
    updates.high_intent_reached_at = new Date().toISOString();
  }

  if (qualifiedReached) {
    updates.qualified_reached_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);

  if (error) {
    console.error('[score-event] Profile update error:', error);
  }
}
