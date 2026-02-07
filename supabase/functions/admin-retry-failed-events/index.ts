/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Admin Retry Failed Events - Self-healing tracking pipeline
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Re-processes failed conversion events from tracking_failed_events table.
 * Implements exponential backoff and moves to dead_letter after max retries.
 * 
 * Endpoints:
 *   POST /admin-retry-failed-events - Retry all pending events
 *   POST /admin-retry-failed-events?event_id=xxx - Retry single event
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAdminRequest, corsHeaders, successResponse, errorResponse } from "../_shared/adminAuth.ts";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const MAX_RETRIES = 5;
const BATCH_SIZE = 50; // Process 50 events per invocation

// Exponential backoff intervals (minutes)
function calculateNextRetry(retryCount: number): Date {
  const delayMinutes = Math.pow(2, retryCount) * 5; // 5, 10, 20, 40, 80 min
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

// ═══════════════════════════════════════════════════════════════════════════
// Destination Handlers
// ═══════════════════════════════════════════════════════════════════════════

interface FailedEvent {
  id: string;
  event_id: string;
  event_name: string;
  destination: string;
  event_payload: Record<string, unknown>;
  user_data: Record<string, unknown> | null;
  retry_count: number;
  error_message: string;
  http_status: number | null;
}

async function retryMetaCAPI(event: FailedEvent): Promise<{ success: boolean; error?: string }> {
  // Meta CAPI retry logic
  // In production, this would call the actual Meta Conversions API
  console.log(`[retry] Meta CAPI event: ${event.event_name}`);
  
  // For now, log and mark as attempted
  // Real implementation would use Facebook Business SDK
  return { success: false, error: 'Meta CAPI retry not yet implemented' };
}

async function retryGoogleEC(event: FailedEvent): Promise<{ success: boolean; error?: string }> {
  // Google Enhanced Conversions retry logic
  console.log(`[retry] Google EC event: ${event.event_name}`);
  
  // Real implementation would use Google Ads API
  return { success: false, error: 'Google EC retry not yet implemented' };
}

async function retryGTMServer(event: FailedEvent): Promise<{ success: boolean; error?: string }> {
  // GTM Server-side retry logic
  console.log(`[retry] GTM Server event: ${event.event_name}`);
  
  const gtmEndpoint = 'https://lunaa.itswindowman.com/data';
  
  try {
    const response = await fetch(gtmEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event.event_payload),
    });

    if (response.ok) {
      return { success: true };
    }
    
    const responseText = await response.text();
    return { 
      success: false, 
      error: `GTM Server returned ${response.status}: ${responseText.slice(0, 200)}` 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function retrySupabase(event: FailedEvent, supabase: any): Promise<{ success: boolean; error?: string }> {
  // Supabase event log retry logic
  console.log(`[retry] Supabase event: ${event.event_name}`);
  
  try {
    // Attempt to re-insert into wm_event_log using service role
    const { error } = await supabase
      .from('wm_event_log')
      .insert(event.event_payload);

    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function retryToDestination(event: FailedEvent, supabase: any): Promise<{ success: boolean; error?: string }> {
  switch (event.destination) {
    case 'meta_capi':
      return retryMetaCAPI(event);
    case 'google_ec':
      return retryGoogleEC(event);
    case 'gtm_server':
      return retryGTMServer(event);
    case 'supabase':
      return retrySupabase(event, supabase);
    default:
      return { success: false, error: `Unknown destination: ${event.destination}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate admin auth
  const validation = await validateAdminRequest(req);
  if (!validation.ok) {
    return validation.response;
  }

  const { supabaseAdmin, email } = validation;
  console.log(`[admin-retry-failed-events] Admin: ${email}`);

  try {
    // Parse request params
    const url = new URL(req.url);
    const singleEventId = url.searchParams.get('event_id');
    
    let query = supabaseAdmin
      .from('tracking_failed_events')
      .select('*')
      .in('status', ['pending', 'retrying'])
      .lte('next_retry_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    // If single event ID provided, filter to just that
    if (singleEventId) {
      query = supabaseAdmin
        .from('tracking_failed_events')
        .select('*')
        .eq('id', singleEventId);
    }

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      console.error('[admin-retry-failed-events] Fetch error:', fetchError);
      return errorResponse(500, 'fetch_failed', 'Failed to fetch pending events');
    }

    if (!events || events.length === 0) {
      return successResponse({ 
        message: 'No events to retry',
        processed: 0,
        resolved: 0,
        failed: 0,
        deadLettered: 0,
      });
    }

    console.log(`[admin-retry-failed-events] Processing ${events.length} events`);

    // Process results
    const results = {
      processed: 0,
      resolved: 0,
      failed: 0,
      deadLettered: 0,
      errors: [] as string[],
    };

    // Process events sequentially to avoid rate limits
    for (const event of events) {
      results.processed++;
      
      const retryResult = await retryToDestination(event as FailedEvent, supabaseAdmin);

      if (retryResult.success) {
        // Mark as resolved
        await supabaseAdmin
          .from('tracking_failed_events')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', event.id);
        
        results.resolved++;
        console.log(`[admin-retry-failed-events] Resolved: ${event.event_name}`);
      } else {
        // Check if max retries exceeded
        const newRetryCount = event.retry_count + 1;
        
        if (newRetryCount >= MAX_RETRIES) {
          // Move to dead letter
          await supabaseAdmin
            .from('tracking_failed_events')
            .update({
              status: 'dead_letter',
              retry_count: newRetryCount,
              error_message: retryResult.error || 'Max retries exceeded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', event.id);
          
          results.deadLettered++;
          console.log(`[admin-retry-failed-events] Dead letter: ${event.event_name}`);
        } else {
          // Schedule next retry with exponential backoff
          const nextRetry = calculateNextRetry(newRetryCount);
          
          await supabaseAdmin
            .from('tracking_failed_events')
            .update({
              status: 'retrying',
              retry_count: newRetryCount,
              next_retry_at: nextRetry.toISOString(),
              error_message: retryResult.error || 'Retry failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', event.id);
          
          results.failed++;
          results.errors.push(`${event.event_name}: ${retryResult.error}`);
        }
      }
    }

    console.log(`[admin-retry-failed-events] Complete:`, results);

    return successResponse({
      message: `Processed ${results.processed} events`,
      ...results,
    });

  } catch (error) {
    console.error('[admin-retry-failed-events] Error:', error);
    return errorResponse(
      500, 
      'internal_error', 
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
