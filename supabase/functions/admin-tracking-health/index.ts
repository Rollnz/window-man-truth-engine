import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingHealthResponse {
  systemStatus: 'healthy' | 'degraded' | 'critical';
  statusReason: string;
  emqScore: {
    overall: number;
    breakdown: {
      email: number;
      phone: number;
      firstName: number;
      lastName: number;
      fbp: number;
      fbc: number;
    };
    trend: 'up' | 'down' | 'stable';
    previousScore: number;
    totalEvents: number;
  };
  fixQueue: {
    pendingCount: number;
    deadLetterCount: number;
    resolvedToday: number;
    oldestPending: string | null;
    byDestination: Record<string, number>;
  };
  diagnostics: {
    orphanEvents: number;
    duplicateEvents: number;
    conversionIntegrity: {
      ok: number;
      missing: number;
    };
    errorRate: number;
    totalEvents: number;
  };
  costImpact: {
    lostAttributedRevenue: number;
    potentialRecovery: number;
  };
}

const EMQ_WEIGHTS = {
  email: 3.0,
  phone: 2.5,
  fbp: 1.5,
  fbc: 1.0,
  firstName: 0.5,
  lastName: 0.5,
};

const TOTAL_WEIGHT = Object.values(EMQ_WEIGHTS).reduce((a, b) => a + b, 0);

function calculateEMQ(breakdown: Record<string, number>): number {
  const score = Object.entries(EMQ_WEIGHTS).reduce((sum, [field, weight]) => {
    const fieldValue = breakdown[field] ?? 0;
    return sum + (fieldValue / 100) * weight;
  }, 0);
  return Math.round((score / TOTAL_WEIGHT) * 100) / 10; // Scale to 0-10 with 1 decimal
}

function determineStatus(
  emqScore: number,
  errorRate: number,
  pendingCount: number,
  orphanRate: number
): { status: 'healthy' | 'degraded' | 'critical'; reason: string } {
  // Critical conditions
  if (emqScore < 7) {
    return { status: 'critical', reason: `EMQ Score critically low (${emqScore}/10)` };
  }
  if (errorRate > 5) {
    return { status: 'critical', reason: `Error rate critically high (${errorRate.toFixed(1)}%)` };
  }
  if (pendingCount > 50) {
    return { status: 'critical', reason: `${pendingCount} failed events pending retry` };
  }

  // Degraded conditions
  if (emqScore < 8.5) {
    return { status: 'degraded', reason: `EMQ Score below target (${emqScore}/10)` };
  }
  if (errorRate > 2) {
    return { status: 'degraded', reason: `Elevated error rate (${errorRate.toFixed(1)}%)` };
  }
  if (pendingCount > 10) {
    return { status: 'degraded', reason: `${pendingCount} failed events need attention` };
  }
  if (orphanRate > 5) {
    return { status: 'degraded', reason: `${orphanRate.toFixed(1)}% orphan events detected` };
  }

  return { status: 'healthy', reason: 'All systems operational' };
}

function calculateCostImpact(pendingCount: number, avgConversionValue = 75) {
  const estimatedConversionRate = 0.15;
  const lostAttributedRevenue = pendingCount * avgConversionValue * estimatedConversionRate;
  return {
    lostAttributedRevenue: Math.round(lostAttributedRevenue),
    potentialRecovery: Math.round(lostAttributedRevenue * 0.8),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse query params
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Build date filter for queries
    const dateFilter = startDate && endDate 
      ? { start: startDate, end: endDate }
      : { 
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        };

    // Previous period for trend calculation
    const periodLength = new Date(dateFilter.end).getTime() - new Date(dateFilter.start).getTime();
    const previousStart = new Date(new Date(dateFilter.start).getTime() - periodLength).toISOString();
    const previousEnd = dateFilter.start;

    console.log('[admin-tracking-health] Date range:', dateFilter);

    // 1. EMQ Score - Current Period
    const { data: currentEmqData, error: emqError } = await supabase
      .from('wm_event_log')
      .select('email_sha256, phone_sha256, user_data, fbp, fbc')
      .gte('event_time', dateFilter.start)
      .lte('event_time', dateFilter.end)
      .limit(5000);

    if (emqError) {
      console.error('[admin-tracking-health] EMQ query error:', emqError);
    }

    const currentEvents = currentEmqData || [];
    const totalEvents = currentEvents.length;

    // Calculate field presence percentages
    const breakdown = {
      email: totalEvents > 0 ? (currentEvents.filter(e => e.email_sha256).length / totalEvents) * 100 : 0,
      phone: totalEvents > 0 ? (currentEvents.filter(e => e.phone_sha256).length / totalEvents) * 100 : 0,
      fbp: totalEvents > 0 ? (currentEvents.filter(e => e.fbp).length / totalEvents) * 100 : 0,
      fbc: totalEvents > 0 ? (currentEvents.filter(e => e.fbc).length / totalEvents) * 100 : 0,
      firstName: totalEvents > 0 ? (currentEvents.filter(e => {
        const ud = e.user_data as Record<string, unknown> | null;
        return ud?.fn || ud?.firstName;
      }).length / totalEvents) * 100 : 0,
      lastName: totalEvents > 0 ? (currentEvents.filter(e => {
        const ud = e.user_data as Record<string, unknown> | null;
        return ud?.ln || ud?.lastName;
      }).length / totalEvents) * 100 : 0,
    };

    const currentEMQ = calculateEMQ(breakdown);

    // 2. EMQ Score - Previous Period (for trend)
    const { data: previousEmqData } = await supabase
      .from('wm_event_log')
      .select('email_sha256, phone_sha256, user_data, fbp, fbc')
      .gte('event_time', previousStart)
      .lt('event_time', previousEnd)
      .limit(5000);

    const previousEvents = previousEmqData || [];
    const prevTotal = previousEvents.length;
    
    const prevBreakdown = {
      email: prevTotal > 0 ? (previousEvents.filter(e => e.email_sha256).length / prevTotal) * 100 : 0,
      phone: prevTotal > 0 ? (previousEvents.filter(e => e.phone_sha256).length / prevTotal) * 100 : 0,
      fbp: prevTotal > 0 ? (previousEvents.filter(e => e.fbp).length / prevTotal) * 100 : 0,
      fbc: prevTotal > 0 ? (previousEvents.filter(e => e.fbc).length / prevTotal) * 100 : 0,
      firstName: 0,
      lastName: 0,
    };
    const previousEMQ = calculateEMQ(prevBreakdown);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (currentEMQ > previousEMQ + 0.3) trend = 'up';
    else if (currentEMQ < previousEMQ - 0.3) trend = 'down';

    // 3. Fix Queue Stats
    const { data: fixQueueData, error: fixQueueError } = await supabase
      .from('tracking_failed_events')
      .select('status, destination, created_at')
      .order('created_at', { ascending: true });

    if (fixQueueError) {
      console.error('[admin-tracking-health] Fix queue error:', fixQueueError);
    }

    const failedEvents = fixQueueData || [];
    const pendingEvents = failedEvents.filter(e => e.status === 'pending' || e.status === 'retrying');
    const deadLetterEvents = failedEvents.filter(e => e.status === 'dead_letter');
    
    const today = new Date().toISOString().split('T')[0];
    const resolvedToday = failedEvents.filter(e => 
      e.status === 'resolved' && e.created_at.startsWith(today)
    ).length;

    const byDestination: Record<string, number> = {};
    pendingEvents.forEach(e => {
      byDestination[e.destination] = (byDestination[e.destination] || 0) + 1;
    });

    const oldestPending = pendingEvents.length > 0 ? pendingEvents[0].created_at : null;

    // 4. Diagnostics - Orphan Events
    const { data: orphanData } = await supabase
      .from('v_event_log_orphans')
      .select('*')
      .limit(1);

    // Since the view might not exist or be empty, handle gracefully
    const orphanCount = (orphanData as Array<{ orphan_count?: number }> | null)?.[0]?.orphan_count ?? 0;

    // 5. Diagnostics - Duplicate Events  
    const { data: duplicateData } = await supabase
      .from('v_duplicate_event_ids')
      .select('duplicate_count')
      .limit(100);

    const duplicateEvents = (duplicateData || []).reduce((sum, d) => sum + (d.duplicate_count || 0), 0);

    // 6. Diagnostics - Conversion Integrity
    const { data: integrityData } = await supabase
      .from('v_conversion_integrity_check')
      .select('integrity_status')
      .limit(1000);

    const integrityResults = integrityData || [];
    const integrityOk = integrityResults.filter(r => r.integrity_status === 'ok').length;
    const integrityMissing = integrityResults.filter(r => r.integrity_status !== 'ok').length;

    // 7. Error Rate - Check fallback conversions vs total conversions
    const { count: fallbackCount } = await supabase
      .from('wm_event_log')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', 'cv_fallback')
      .gte('event_time', dateFilter.start)
      .lte('event_time', dateFilter.end);

    const { count: conversionCount } = await supabase
      .from('wm_event_log')
      .select('*', { count: 'exact', head: true })
      .like('event_name', 'cv_%')
      .gte('event_time', dateFilter.start)
      .lte('event_time', dateFilter.end);

    const errorRate = conversionCount && conversionCount > 0 
      ? ((fallbackCount || 0) / conversionCount) * 100 
      : 0;

    // Calculate orphan rate
    const orphanRate = totalEvents > 0 ? (orphanCount / totalEvents) * 100 : 0;

    // Determine system status
    const { status: systemStatus, reason: statusReason } = determineStatus(
      currentEMQ,
      errorRate,
      pendingEvents.length,
      orphanRate
    );

    // Calculate cost impact
    const costImpact = calculateCostImpact(pendingEvents.length);

    const response: TrackingHealthResponse = {
      systemStatus,
      statusReason,
      emqScore: {
        overall: currentEMQ,
        breakdown: {
          email: Math.round(breakdown.email * 10) / 10,
          phone: Math.round(breakdown.phone * 10) / 10,
          firstName: Math.round(breakdown.firstName * 10) / 10,
          lastName: Math.round(breakdown.lastName * 10) / 10,
          fbp: Math.round(breakdown.fbp * 10) / 10,
          fbc: Math.round(breakdown.fbc * 10) / 10,
        },
        trend,
        previousScore: previousEMQ,
        totalEvents,
      },
      fixQueue: {
        pendingCount: pendingEvents.length,
        deadLetterCount: deadLetterEvents.length,
        resolvedToday,
        oldestPending,
        byDestination,
      },
      diagnostics: {
        orphanEvents: orphanCount,
        duplicateEvents,
        conversionIntegrity: {
          ok: integrityOk,
          missing: integrityMissing,
        },
        errorRate: Math.round(errorRate * 10) / 10,
        totalEvents,
      },
      costImpact,
    };

    console.log('[admin-tracking-health] Response:', {
      systemStatus,
      emqScore: currentEMQ,
      pendingCount: pendingEvents.length,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[admin-tracking-health] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
