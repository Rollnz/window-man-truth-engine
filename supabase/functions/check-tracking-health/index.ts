/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Check Tracking Health - Real-time monitoring and alerting
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Monitors EMQ score, failed event queue, and error rates.
 * Logs alerts to tracking_health_alerts when thresholds are breached.
 * 
 * Can be triggered:
 *   - Manually by admin
 *   - Via cron job (recommended: every 15 minutes)
 *   - Via external monitoring webhook
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  EMQ_CRITICAL: 4.0,           // Score below 4.0 triggers critical alert
  EMQ_WARNING: 7.0,            // Score below 7.0 triggers warning
  FAILED_EVENTS_CRITICAL: 10,  // More than 10 pending events = critical
  FAILED_EVENTS_WARNING: 5,    // More than 5 pending events = warning
  ERROR_RATE_CRITICAL: 5,      // Error rate > 5% = critical
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════
// EMQ Score Calculation (mirrors admin-tracking-health logic)
// ═══════════════════════════════════════════════════════════════════════════

interface EMQBreakdown {
  email: number;
  phone: number;
  firstName: number;
  lastName: number;
  fbp: number;
  fbc: number;
}

async function calculateEMQScore(supabase: any): Promise<{ score: number; breakdown: EMQBreakdown; totalEvents: number }> {
  // Get recent conversion events (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: events, error } = await supabase
    .from('wm_event_log')
    .select('email_sha256, phone_sha256, user_data, fbp, fbc')
    .eq('event_type', 'conversion')
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(1000);

  if (error || !events || events.length === 0) {
    return { 
      score: 10.0, 
      breakdown: { email: 100, phone: 0, firstName: 0, lastName: 0, fbp: 0, fbc: 0 },
      totalEvents: 0 
    };
  }

  const totalEvents = events.length;
  let emailCount = 0;
  let phoneCount = 0;
  let firstNameCount = 0;
  let lastNameCount = 0;
  let fbpCount = 0;
  let fbcCount = 0;

  for (const event of events) {
    if (event.email_sha256) emailCount++;
    if (event.phone_sha256) phoneCount++;
    if (event.fbp) fbpCount++;
    if (event.fbc) fbcCount++;
    
    // Check user_data for names
    const userData = event.user_data as Record<string, unknown> | null;
    if (userData) {
      if (userData.fn || userData.first_name) firstNameCount++;
      if (userData.ln || userData.last_name) lastNameCount++;
    }
  }

  // Calculate percentages
  const breakdown: EMQBreakdown = {
    email: Math.round((emailCount / totalEvents) * 100),
    phone: Math.round((phoneCount / totalEvents) * 100),
    firstName: Math.round((firstNameCount / totalEvents) * 100),
    lastName: Math.round((lastNameCount / totalEvents) * 100),
    fbp: Math.round((fbpCount / totalEvents) * 100),
    fbc: Math.round((fbcCount / totalEvents) * 100),
  };

  // Calculate weighted score (0-10 scale)
  // Weights: email=40%, phone=25%, names=15%, fbp/fbc=20%
  const score = (
    (breakdown.email * 0.4) +
    (breakdown.phone * 0.25) +
    ((breakdown.firstName + breakdown.lastName) / 2 * 0.15) +
    ((breakdown.fbp + breakdown.fbc) / 2 * 0.2)
  ) / 10;

  return { score: Math.round(score * 10) / 10, breakdown, totalEvents };
}

// ═══════════════════════════════════════════════════════════════════════════
// Health Check Logic
// ═══════════════════════════════════════════════════════════════════════════

interface Alert {
  type: 'emq_critical' | 'failed_events_critical' | 'error_rate_critical';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
}

async function checkHealth(supabase: any): Promise<{ alerts: Alert[]; metrics: Record<string, unknown> }> {
  const alerts: Alert[] = [];
  
  // Check EMQ Score
  const { score: emqScore, breakdown, totalEvents } = await calculateEMQScore(supabase);
  
  if (emqScore < THRESHOLDS.EMQ_CRITICAL) {
    alerts.push({
      type: 'emq_critical',
      severity: 'critical',
      message: `EMQ Score dropped to ${emqScore}/10 (threshold: ${THRESHOLDS.EMQ_CRITICAL}). Low data quality affecting ad platform matching.`,
      value: emqScore,
      threshold: THRESHOLDS.EMQ_CRITICAL,
    });
  } else if (emqScore < THRESHOLDS.EMQ_WARNING) {
    console.log(`[check-tracking-health] EMQ Warning: ${emqScore}/10 (below ${THRESHOLDS.EMQ_WARNING})`);
  }

  // Check Failed Events Queue
  const { count: pendingCount, error: countError } = await supabase
    .from('tracking_failed_events')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'retrying']);

  if (!countError && pendingCount !== null && pendingCount > THRESHOLDS.FAILED_EVENTS_CRITICAL) {
    alerts.push({
      type: 'failed_events_critical',
      severity: 'critical',
      message: `${pendingCount} failed events in queue (threshold: ${THRESHOLDS.FAILED_EVENTS_CRITICAL}). Events not reaching ad platforms.`,
      value: pendingCount,
      threshold: THRESHOLDS.FAILED_EVENTS_CRITICAL,
    });
  }

  // Check Dead Letter count
  const { count: deadLetterCount } = await supabase
    .from('tracking_failed_events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'dead_letter');

  // Calculate error rate (failed / total in last 24h)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { count: totalRecentEvents } = await supabase
    .from('wm_event_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  const { count: failedRecentEvents } = await supabase
    .from('tracking_failed_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo.toISOString());

  const errorRate = totalRecentEvents && totalRecentEvents > 0
    ? ((failedRecentEvents || 0) / totalRecentEvents) * 100
    : 0;

  if (errorRate > THRESHOLDS.ERROR_RATE_CRITICAL) {
    alerts.push({
      type: 'error_rate_critical',
      severity: 'critical',
      message: `Error rate at ${errorRate.toFixed(1)}% (threshold: ${THRESHOLDS.ERROR_RATE_CRITICAL}%). System reliability degraded.`,
      value: errorRate,
      threshold: THRESHOLDS.ERROR_RATE_CRITICAL,
    });
  }

  return {
    alerts,
    metrics: {
      emqScore,
      emqBreakdown: breakdown,
      totalEvents,
      pendingCount: pendingCount || 0,
      deadLetterCount: deadLetterCount || 0,
      errorRate: Math.round(errorRate * 10) / 10,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Alert Storage (with deduplication)
// ═══════════════════════════════════════════════════════════════════════════

async function storeAlerts(supabase: any, alerts: Alert[]): Promise<number> {
  let alertsCreated = 0;

  for (const alert of alerts) {
    // Check if unresolved alert of same type exists
    const { data: existing } = await supabase
      .from('tracking_health_alerts')
      .select('id')
      .eq('alert_type', alert.type)
      .is('resolved_at', null)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error } = await supabase.from('tracking_health_alerts').insert({
        alert_type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metric_value: alert.value,
        threshold: alert.threshold,
      });

      if (!error) {
        alertsCreated++;
        console.log(`[check-tracking-health] ALERT CREATED: ${alert.message}`);
      } else {
        console.error(`[check-tracking-health] Failed to create alert:`, error);
      }
    } else {
      console.log(`[check-tracking-health] Alert already exists for ${alert.type}, skipping`);
    }
  }

  return alertsCreated;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('[check-tracking-health] Starting health check...');

  try {
    // Run health checks
    const { alerts, metrics } = await checkHealth(supabase);

    // Store any new alerts
    const alertsCreated = await storeAlerts(supabase, alerts);

    // Auto-resolve alerts if conditions improved
    if (metrics.emqScore >= THRESHOLDS.EMQ_CRITICAL) {
      await supabase
        .from('tracking_health_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('alert_type', 'emq_critical')
        .is('resolved_at', null);
    }

    if ((metrics.pendingCount as number) <= THRESHOLDS.FAILED_EVENTS_CRITICAL) {
      await supabase
        .from('tracking_health_alerts')
        .update({ resolved_at: new Date().toISOString() })
        .eq('alert_type', 'failed_events_critical')
        .is('resolved_at', null);
    }

    console.log('[check-tracking-health] Complete:', { metrics, alertsCreated });

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp: new Date().toISOString(),
        metrics,
        alertsCreated,
        activeAlerts: alerts.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[check-tracking-health] Error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
