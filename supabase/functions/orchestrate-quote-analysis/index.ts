import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { writeLedgerEvent } from '../_shared/writeLedgerEvent.ts';
import { logAttributionEvent } from '../_shared/attributionLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

interface AnalysisData {
  overallScore?: number;
  safetyScore?: number;
  scopeScore?: number;
  priceScore?: number;
  finePrintScore?: number;
  warrantyScore?: number;
  finalGrade?: string;
  pricePerOpening?: string;
  warnings?: string[];
  missingItems?: string[];
  summary?: string;
}

function buildSuccessResponse(
  quoteAnalysisId: string,
  grade: string,
  overallScore: number,
  analysis: AnalysisData,
  extra: Record<string, unknown> = {},
) {
  return {
    success: true,
    quote_analysis_id: quoteAnalysisId,
    grade,
    overall_score: overallScore,
    pillar_scores: {
      safety_code_match: analysis.safetyScore,
      install_scope_clarity: analysis.scopeScore,
      price_fairness: analysis.priceScore,
      fine_print_transparency: analysis.finePrintScore,
      warranty_value: analysis.warrantyScore,
    },
    event_type: 'application_submitted',
    pixel_value: 500,
    message: `Your quote is ${grade === 'A' || grade === 'B' ? 'solid' : 'concerning'}. WindowMan will call you in 2-3 minutes to discuss your options.`,
    ...extra,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ═══════════════════════════════════════════════════════════════════
    // FIX 1 (IDOR): Derive account_id from JWT instead of request body
    // ═══════════════════════════════════════════════════════════════════
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'UNAUTHORIZED', message: 'Missing Authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // User-scoped client for auth validation
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Verify JWT and get user identity
    const { data: { user: authedUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !authedUser) {
      return jsonResponse({ success: false, error: 'UNAUTHORIZED', message: 'Invalid or expired token' }, 401);
    }

    const userId = authedUser.id;

    // Service-role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Derive account_id from authenticated user (prevents IDOR)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, client_id, session_id')
      .eq('supabase_user_id', userId)
      .single();

    if (accountError || !account) {
      return jsonResponse({ success: false, error: 'ACCOUNT_NOT_FOUND', message: 'No account linked to this user' }, 404);
    }

    const account_id = account.id;

    // Parse request body (only quote_analysis_id needed now)
    const body = await req.json();
    const { quote_analysis_id } = body;

    if (!quote_analysis_id) {
      return jsonResponse({ success: false, error: 'VALIDATION_ERROR', message: 'Missing required field: quote_analysis_id' }, 400);
    }

    // FIX 2: Use account_id instead of lead_id for ownership check
    const { data: quoteAnalysis, error: quoteError } = await supabase
      .from('quote_analyses')
      .select('id, analysis_json, analyzed_at')
      .eq('id', quote_analysis_id)
      .eq('account_id', account_id)
      .single();

    if (quoteError || !quoteAnalysis) {
      return jsonResponse({ success: false, error: 'QUOTE_NOT_FOUND', message: 'Quote analysis not found or access denied' }, 404);
    }

    // Check if analysis_json is populated (polling paradox fix)
    if (!quoteAnalysis.analysis_json) {
      return jsonResponse({ status: 'processing', message: 'Analysis not finished. Please retry in 3 seconds.' }, 409);
    }

    const analysisData = quoteAnalysis.analysis_json as AnalysisData;

    // Validate required fields
    if (typeof analysisData.overallScore !== 'number' || !analysisData.finalGrade) {
      return jsonResponse({ success: false, error: 'INVALID_ANALYSIS', message: 'Analysis JSON missing required fields' }, 400);
    }

    const overallScore = analysisData.overallScore;
    const grade = analysisData.finalGrade;

    // IDEMPOTENCY: If already processed, return without firing pixel
    if (quoteAnalysis.analyzed_at !== null) {
      console.log('[orchestrate-quote-analysis] Already processed (idempotent return)', { account_id, quote_analysis_id, grade });
      return jsonResponse(buildSuccessResponse(quote_analysis_id, grade, overallScore, analysisData, {
        _note: 'This response was already processed. No DB update or pixel fired (idempotent).',
      }), 200);
    }

    // TOCTOU RACE: Atomic lock with .is('analyzed_at', null)
    const { data: updatedRows, error: updateError } = await supabase
      .from('quote_analyses')
      .update({ analyzed_at: new Date().toISOString() })
      .eq('id', quote_analysis_id)
      .is('analyzed_at', null)
      .select('id');

    if (updateError) {
      return jsonResponse({ success: false, error: 'UPDATE_FAILED' }, 500);
    }

    // Lost race condition — another process already handled it
    if (!updatedRows || updatedRows.length === 0) {
      console.log('[orchestrate-quote-analysis] Lost race condition, returning without pixel', { account_id, quote_analysis_id, grade });
      return jsonResponse(buildSuccessResponse(quote_analysis_id, grade, overallScore, analysisData, {
        _note: 'Another process already processed this. No pixel fired (race resolved).',
      }), 200);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Won the race — fire pixel and log events
    // ═══════════════════════════════════════════════════════════════════
    const event_id = crypto.randomUUID();
    const pixel_value = 500;

    const weakestPillars = [
      { pillar: 'safety_code_match', score: analysisData.safetyScore || 0 },
      { pillar: 'install_scope_clarity', score: analysisData.scopeScore || 0 },
      { pillar: 'price_fairness', score: analysisData.priceScore || 0 },
      { pillar: 'fine_print_transparency', score: analysisData.finePrintScore || 0 },
      { pillar: 'warranty_value', score: analysisData.warrantyScore || 0 },
    ]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(p => p.pillar);

    // Write to wm_event_log (canonical ledger) — uses service role internally
    await writeLedgerEvent({
      event_name: 'application_submitted',
      event_type: 'conversion',
      source_tool: 'quote-scanner',
      source_system: 'signup',
      ingested_by: 'orchestrate-quote-analysis',
      client_id: account.client_id || undefined,
      metadata: {
        flow: 'flow_a',
        quote_analysis_id,
        grade,
        overall_score: overallScore,
        weakest_pillars: weakestPillars,
        value: pixel_value,
        event_id,
      },
    });

    // Write to wm_events (for scoring) — uses service role internally
    if (account.session_id) {
      await logAttributionEvent({
        sessionId: account.session_id,
        eventName: 'application_submitted',
        eventCategory: 'conversion',
        pagePath: '/vault/quote-analysis',
        eventData: {
          value: pixel_value,
          source: 'signup',
          grade,
          overall_score: overallScore,
        },
        anonymousIdFallback: account.client_id || undefined,
      });
    }

    console.log('[orchestrate-quote-analysis]', { account_id, quote_analysis_id, grade, overall_score: overallScore, event_id });

    return jsonResponse({
      ...buildSuccessResponse(quote_analysis_id, grade, overallScore, analysisData),
      pixel_value,
      event_id,
      call_scheduled_in_minutes: 3,
    }, 200);

  } catch (error) {
    console.error('[orchestrate-quote-analysis] Error:', error);
    return jsonResponse({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Internal server error',
    }, 500);
  }
});
