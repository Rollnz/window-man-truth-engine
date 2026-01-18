// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER PHONE CALL - ENQUEUE ONLY
// Enqueues calls to pending_calls table with 2-minute delay for dispatcher
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid source tools that have call_agents configured
type SourceTool = 'quote-scanner' | 'beat-your-quote' | 'consultation-booking' | 'fair-price-quiz';

interface RequestBody {
  phone: string;
  name?: string;
  email?: string;
  leadId?: string;
  sourceTool: SourceTool;
  context?: Record<string, unknown>;
}

// Normalize phone to E.164 format (basic normalization)
function normalizePhone(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with +, keep it
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If 10 digits, assume US and add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Otherwise just add + if not present
  return `+${cleaned}`;
}

// Compute SHA-256 hash of phone for idempotency
async function hashPhone(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phone);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mask phone for logging
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return `****${phone.slice(-4)}`;
}

// Interpolate template variables
function interpolateTemplate(template: string, firstName?: string): string {
  if (!firstName || firstName.trim() === '') {
    // Remove the name placeholder and clean up
    return template
      .replace(/\{first_name\},?\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return template.replace(/\{first_name\}/gi, firstName);
}

// Build allowlisted payload for storage
function buildPayload(context?: Record<string, unknown>, email?: string, firstName?: string): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  
  // Add safe scalar fields
  if (email) payload.email = email;
  if (firstName) payload.first_name = firstName;
  
  if (context) {
    // Allowlist specific fields from context
    const allowedFields = ['quote_file_id', 'quoteFileId', 'preferredTime', 'notes', 'grade', 'verdict', 'originalSourceTool'];
    for (const field of allowedFields) {
      if (context[field] !== undefined && context[field] !== null) {
        const value = context[field];
        // Only include scalar values
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          payload[field] = value;
        }
      }
    }
  }
  
  return payload;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[TriggerPhoneCall] Missing Supabase credentials');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body: RequestBody = await req.json();
    const { phone, name, email, leadId, sourceTool, context } = body;

    // Validate required fields
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sourceTool) {
      return new Response(
        JSON.stringify({ error: 'Source tool is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone to E.164
    const phoneE164 = normalizePhone(phone);
    const phoneHash = await hashPhone(phoneE164);
    const firstName = name?.split(' ')[0] || '';

    console.log('[TriggerPhoneCall] Processing request', {
      phone: maskPhone(phoneE164),
      sourceTool,
      leadId: leadId || 'anonymous',
    });

    // Lookup call_agents for this source_tool
    const { data: agent, error: agentError } = await supabase
      .from('call_agents')
      .select('id, agent_id, first_message_template')
      .eq('source_tool', sourceTool)
      .eq('enabled', true)
      .single();

    if (agentError || !agent) {
      console.error('[TriggerPhoneCall] No enabled agent found for source_tool:', sourceTool, agentError);
      return new Response(
        JSON.stringify({ error: 'Call agent not configured for this tool' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Render first_message from template
    const firstMessage = interpolateTemplate(agent.first_message_template, firstName);

    // Calculate scheduled_for (2 minutes from now)
    const scheduledFor = new Date(Date.now() + 2 * 60 * 1000);

    // Build payload
    const payload = buildPayload(context, email, firstName);

    // Insert into pending_calls
    const { data: insertedCall, error: insertError } = await supabase
      .from('pending_calls')
      .insert({
        lead_id: leadId || null,
        source_tool: sourceTool,
        phone_e164: phoneE164,
        phone_hash: phoneHash,
        agent_id: agent.id,
        first_message: firstMessage,
        payload,
        scheduled_for: scheduledFor.toISOString(),
        next_attempt_at: new Date().toISOString(),
        status: 'pending',
      })
      .select('call_request_id, scheduled_for')
      .single();

    // Handle duplicate (unique constraint violation)
    if (insertError) {
      // Check if it's a unique constraint violation (code 23505)
      if (insertError.code === '23505') {
        console.log('[TriggerPhoneCall] Duplicate call request detected', {
          phone: maskPhone(phoneE164),
          sourceTool,
        });
        return new Response(
          JSON.stringify({ 
            queued: true, 
            duplicate: true,
            message: 'Call already scheduled for this phone and tool'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('[TriggerPhoneCall] Failed to insert pending_call:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to schedule call' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TriggerPhoneCall] Call enqueued successfully', {
      call_request_id: insertedCall.call_request_id,
      scheduled_for: insertedCall.scheduled_for,
      phone: maskPhone(phoneE164),
      sourceTool,
    });

    return new Response(
      JSON.stringify({
        queued: true,
        duplicate: false,
        call_request_id: insertedCall.call_request_id,
        scheduled_for: insertedCall.scheduled_for,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TriggerPhoneCall] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
