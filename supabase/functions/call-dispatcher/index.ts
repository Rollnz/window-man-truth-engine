// ═══════════════════════════════════════════════════════════════════════════
// CALL DISPATCHER EDGE FUNCTION
// Cron-triggered function that claims pending calls and dispatches to PhoneCall.bot
// Includes health check endpoint and heartbeat monitoring
// ═══════════════════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
interface ClaimedCall {
  id: string;
  call_request_id: string;
  lead_id: string | null;
  source_tool: string;
  phone_e164: string;
  agent_id: string;
  first_message: string;
  payload: Record<string, unknown> | null;
  attempt_count: number;
}

interface DispatchResult {
  picked: number;
  succeeded: number;
  failed: number;
  dead_lettered: number;
}

interface HealthStats {
  timestamp: string;
  queue_stats: {
    pending: number;
    processing: number;
    called: number;
    dead_letter: number;
  };
  outcomes_today: {
    completed: number;
    no_answer: number;
    failed: number;
    in_progress: number;
  };
}

/**
 * Mask a phone number for safe logging by revealing only the last four digits.
 *
 * @param phone - The phone number to mask; may be empty or shorter than four characters.
 * @returns `****` if `phone` is empty or has fewer than four characters, otherwise `****` followed by the last four digits of `phone`.
 */
function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return `****${phone.slice(-4)}`;
}

/**
 * Convert an error value to a string and truncate it to a maximum length for storage.
 *
 * @param error - The error or value to convert to a message string.
 * @param maxLength - Maximum allowed length of the returned string; defaults to 500.
 * @returns The error message as a string truncated to at most `maxLength` characters, with `...` appended when truncated.
 */
function truncateError(error: unknown, maxLength = 500): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length > maxLength ? message.slice(0, maxLength) + '...' : message;
}

/**
 * Constructs a flat metadata object for PhoneCall.bot from a claimed call, including an allowlisted set of payload fields.
 *
 * @param call - The claimed call to extract metadata from
 * @returns An object mapping metadata keys to `string`, `number`, or `null`. Always includes `call_request_id`, `source_tool`, and `lead_id` (which is `null` if absent). Also includes any of the allowlisted payload fields present: `email`, `first_name`, `quote_file_id`, `preferredTime`, `grade`, and `verdict`.
 */
function buildMetadata(call: ClaimedCall): Record<string, string | number | null> {
  const metadata: Record<string, string | number | null> = {
    call_request_id: call.call_request_id,
    source_tool: call.source_tool,
    lead_id: call.lead_id || null,
  };

  // Allowlist specific scalar fields from payload
  if (call.payload) {
    const allowedFields = ['email', 'first_name', 'quote_file_id', 'preferredTime', 'grade', 'verdict'];
    for (const field of allowedFields) {
      const value = call.payload[field];
      if (value !== undefined && value !== null && (typeof value === 'string' || typeof value === 'number')) {
        metadata[field] = value;
      }
    }
  }

  return metadata;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Collects current queue counts and today's call outcome counts from the database.
 *
 * Queries the pending call queue for counts by status and tallies phone call log outcomes
 * recorded since the start of the current day, returning a timestamped snapshot.
 *
 * @returns A `HealthStats` object with:
 *  - `timestamp`: ISO timestamp of when the snapshot was taken,
 *  - `queue_stats`: counts for `pending`, `processing`, `called`, and `dead_letter`,
 *  - `outcomes_today`: counts for `completed`, `no_answer`, `failed`, and `in_progress`.
 */
async function getHealthStats(supabase: AnySupabaseClient): Promise<HealthStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // Get queue stats by status
  const { data: queueData } = await supabase
    .from('pending_calls')
    .select('status');

  const queueStats = {
    pending: 0,
    processing: 0,
    called: 0,
    dead_letter: 0,
  };

  if (queueData) {
    for (const row of queueData) {
      const status = row.status as keyof typeof queueStats;
      if (status in queueStats) {
        queueStats[status]++;
      }
    }
  }

  // Get today's outcomes
  const { data: outcomesData } = await supabase
    .from('phone_call_logs')
    .select('call_status')
    .gte('created_at', todayIso);

  const outcomesToday = {
    completed: 0,
    no_answer: 0,
    failed: 0,
    in_progress: 0,
  };

  if (outcomesData) {
    for (const row of outcomesData) {
      const status = row.call_status as keyof typeof outcomesToday;
      if (status in outcomesToday) {
        outcomesToday[status]++;
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    queue_stats: queueStats,
    outcomes_today: outcomesToday,
  };
}

/**
 * Upserts the 'call-dispatcher' heartbeat row with the current timestamp and a summary of results.
 *
 * If the database update fails, the error is logged and not rethrown.
 *
 * @param result - Summary of dispatch outcomes to store in the heartbeat record
 */
async function updateHeartbeat(
  supabase: AnySupabaseClient,
  result: DispatchResult
): Promise<void> {
  try {
    await supabase
      .from('job_heartbeats')
      .upsert({
        job_name: 'call-dispatcher',
        last_run_at: new Date().toISOString(),
        last_summary: result,
      }, { onConflict: 'job_name' });
  } catch (error) {
    console.error('[Dispatcher] Failed to update heartbeat:', error);
  }
}

/**
 * Dispatches a single claimed call to the PhoneCall.bot webhook.
 *
 * @param call - The claimed call record to dispatch (contains phone, agent_id, first_message, and payload).
 * @param webhookUrl - The full webhook URL for PhoneCall.bot to receive the dispatch request.
 * @returns `true` if the webhook accepted the request and a provider call was created, `false` otherwise; `providerCallId` contains the provider's call identifier when available; `error` contains a short error message when `success` is `false`.
 */
async function dispatchCall(
  call: ClaimedCall,
  webhookUrl: string
): Promise<{ success: boolean; providerCallId: string | null; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const body = {
      agent_id: call.agent_id,
      phone: call.phone_e164,
      first_message: call.first_message,
      metadata: buildMetadata(call),
    };

    console.log(`[Dispatcher] Calling PhoneCall.bot`, {
      call_request_id: call.call_request_id,
      source_tool: call.source_tool,
      phone: maskPhone(call.phone_e164),
      attempt_count: call.attempt_count + 1,
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Dispatcher] PhoneCall.bot returned ${response.status}`, {
        call_request_id: call.call_request_id,
        status: response.status,
        error: errorText.slice(0, 200),
      });
      return { success: false, providerCallId: null, error: `HTTP ${response.status}: ${errorText}` };
    }

    // Try to parse response for provider_call_id
    let providerCallId: string | null = null;
    try {
      const responseData = await response.json();
      providerCallId = responseData?.call_id || responseData?.id || responseData?.provider_call_id || null;
    } catch {
      // Response might not be JSON, that's okay
    }

    console.log(`[Dispatcher] Successfully dispatched`, {
      call_request_id: call.call_request_id,
      provider_call_id: providerCallId,
      status: response.status,
    });

    return { success: true, providerCallId };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Dispatcher] Request timed out`, {
        call_request_id: call.call_request_id,
        source_tool: call.source_tool,
      });
      return { success: false, providerCallId: null, error: 'Request timed out after 10s' };
    }

    console.error(`[Dispatcher] Network error`, {
      call_request_id: call.call_request_id,
      error: truncateError(error, 100),
    });
    return { success: false, providerCallId: null, error: truncateError(error) };
  }
}

/**
 * Notify the system that a call request has been moved to the dead-letter queue.
 *
 * Invokes the Supabase edge function `notify-dead-letter` with the provided call request ID.
 *
 * @param callRequestId - The `call_request_id` of the dead-lettered call to notify about
 */
async function notifyDeadLetter(
  supabase: AnySupabaseClient,
  callRequestId: string
): Promise<void> {
  try {
    // Call the notify-dead-letter edge function
    const { error } = await supabase.functions.invoke('notify-dead-letter', {
      body: { call_request_id: callRequestId },
    });

    if (error) {
      console.error('[Dispatcher] Failed to notify dead letter:', error);
    } else {
      console.log('[Dispatcher] Dead letter notification sent for:', callRequestId);
    }
  } catch (error) {
    console.error('[Dispatcher] Error invoking notify-dead-letter:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookUrl = Deno.env.get('PHONECALL_BOT_WEBHOOK_URL');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Dispatcher] Missing Supabase credentials');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Check for health check request
  const url = new URL(req.url);
  if (url.searchParams.get('health') === '1') {
    console.log('[Dispatcher] Health check requested');
    const healthStats = await getHealthStats(supabase);
    return new Response(
      JSON.stringify(healthStats),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!webhookUrl) {
    console.error('[Dispatcher] Missing PHONECALL_BOT_WEBHOOK_URL');
    return new Response(
      JSON.stringify({ error: 'Webhook not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const result: DispatchResult = {
    picked: 0,
    succeeded: 0,
    failed: 0,
    dead_lettered: 0,
  };

  try {
    // Step 1: Claim pending calls atomically
    const { data: claimedCalls, error: claimError } = await supabase
      .rpc('rpc_claim_pending_calls', { batch_size: 10 });

    if (claimError) {
      console.error('[Dispatcher] Failed to claim calls:', claimError);
      return new Response(
        JSON.stringify({ error: 'Failed to claim calls', details: claimError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!claimedCalls || claimedCalls.length === 0) {
      console.log('[Dispatcher] No pending calls to process');
      // Still update heartbeat even with no calls
      await updateHeartbeat(supabase, result);
      return new Response(
        JSON.stringify({ ...result, message: 'No pending calls' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    result.picked = claimedCalls.length;
    console.log(`[Dispatcher] Claimed ${claimedCalls.length} calls for processing`);

    // Step 2: Process each claimed call
    for (const call of claimedCalls as ClaimedCall[]) {
      const dispatchResult = await dispatchCall(call, webhookUrl);

      if (dispatchResult.success) {
        // SUCCESS: Update pending_calls and insert into phone_call_logs
        result.succeeded++;

        // Update pending_calls to 'called'
        const { error: updateError } = await supabase
          .from('pending_calls')
          .update({
            status: 'called',
            provider_call_id: dispatchResult.providerCallId,
            triggered_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', call.id);

        if (updateError) {
          console.error('[Dispatcher] Failed to update pending_calls:', updateError);
        }

        // Insert into phone_call_logs
        const { error: logError } = await supabase
          .from('phone_call_logs')
          .insert({
            call_request_id: call.call_request_id,
            lead_id: call.lead_id,
            source_tool: call.source_tool,
            agent_id: call.agent_id,
            provider_call_id: dispatchResult.providerCallId,
            call_status: 'in_progress',
            triggered_at: new Date().toISOString(),
          });

        if (logError) {
          console.error('[Dispatcher] Failed to insert phone_call_logs:', logError);
        }

      } else {
        // FAILURE: Increment attempt_count and apply backoff
        const newAttemptCount = call.attempt_count + 1;
        const isDeadLetter = newAttemptCount >= 3;

        if (isDeadLetter) {
          result.dead_lettered++;
          console.warn(`[Dispatcher] Moving to dead_letter after ${newAttemptCount} attempts`, {
            call_request_id: call.call_request_id,
            source_tool: call.source_tool,
          });
        } else {
          result.failed++;
        }

        // Calculate next attempt time with exponential-ish backoff (5 min * attempt_count)
        const backoffMinutes = newAttemptCount * 5;
        const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        const { error: updateError } = await supabase
          .from('pending_calls')
          .update({
            status: isDeadLetter ? 'dead_letter' : 'pending',
            attempt_count: newAttemptCount,
            next_attempt_at: isDeadLetter ? null : nextAttemptAt.toISOString(),
            last_error: truncateError(dispatchResult.error),
            updated_at: new Date().toISOString(),
          })
          .eq('id', call.id);

        if (updateError) {
          console.error('[Dispatcher] Failed to update failed call:', updateError);
        }

        // If dead-lettered, create a log entry and notify
        if (isDeadLetter) {
          // Insert a failed log entry if one doesn't exist
          await supabase
            .from('phone_call_logs')
            .insert({
              call_request_id: call.call_request_id,
              lead_id: call.lead_id,
              source_tool: call.source_tool,
              agent_id: call.agent_id,
              call_status: 'failed',
              triggered_at: new Date().toISOString(),
              ai_notes: `Dead-lettered after ${newAttemptCount} attempts. Last error: ${truncateError(dispatchResult.error, 200)}`,
            });

          // Trigger notification (fire and forget)
          notifyDeadLetter(supabase, call.call_request_id);
        }
      }
    }

    // Update heartbeat with result
    await updateHeartbeat(supabase, result);

    console.log(`[Dispatcher] Batch complete:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Dispatcher] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: truncateError(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});