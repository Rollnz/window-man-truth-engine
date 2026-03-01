import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';
import { writeLedgerEvent } from '../_shared/writeLedgerEvent.ts';
import { attributionLogger } from '../_shared/attributionLogger.ts';

interface OrchestrateRequest {
  account_id: string;
  quote_analysis_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as OrchestrateRequest;
    const { account_id, quote_analysis_id } = body;

    if (!account_id || !quote_analysis_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Missing required fields: account_id, quote_analysis_id',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Get account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('client_id, session_id')
      .eq('id', account_id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ success: false, error: 'ACCOUNT_NOT_FOUND' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // ✅ IDOR SECURITY: Verify ownership with .eq('lead_id', account_id)
    // Don't let users query quote_analyses they don't own
    const { data: quoteAnalysis, error: quoteError } = await supabase
      .from('quote_analyses')
      .select('id, analysis_json, analyzed_at')
      .eq('id', quote_analysis_id)
      .eq('lead_id', account_id)  // CRITICAL: Enforce ownership
      .single();

    if (quoteError || !quoteAnalysis) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'QUOTE_NOT_FOUND',
          message: 'Quote analysis not found or access denied'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fail Hard - Check if analysis_json is populated
    // ✅ POLLING PARADOX FIX: No analysis_result required in request body
    if (!quoteAnalysis.analysis_json) {
      return new Response(
        JSON.stringify({
          status: 'processing',
          message: 'Analysis not finished. Please retry in 3 seconds.',
        }),
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // ✅ IDEMPOTENCY: If analyzed_at is already set, this endpoint was called before
    // Return success WITHOUT updating DB or firing pixel again (prevent double-firing)
    if (quoteAnalysis.analyzed_at !== null) {
      // Analysis already processed. Parse and return, but skip DB update and pixel.
      const analysisData = quoteAnalysis.analysis_json as {
        overallScore?: number;
        safetyScore?: number;
        scopeScore?: number;
        priceScore?: number;
        finePrintScore?: number;
        warrantyScore?: number;
        finalGrade?: string;  // ✅ SIMPLIFIED: Grade from quote-scanner
        pricePerOpening?: string;
        warnings?: string[];
        missingItems?: string[];
        summary?: string;
      };

      // Validate required fields
      if (typeof analysisData.overallScore !== 'number' || !analysisData.finalGrade) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'INVALID_ANALYSIS',
            message: 'Analysis JSON missing required fields',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const grade = analysisData.finalGrade;  // ✅ SIMPLIFIED: Read from quote-scanner

      console.log('[orchestrate-quote-analysis] Already processed (idempotent return)', { 
        account_id, 
        quote_analysis_id, 
        grade
      });

      return new Response(
        JSON.stringify({
          success: true,
          quote_analysis_id,
          grade,
          overall_score: analysisData.overallScore,
          pillar_scores: {
            safety_code_match: analysisData.safetyScore,
            install_scope_clarity: analysisData.scopeScore,
            price_fairness: analysisData.priceScore,
            fine_print_transparency: analysisData.finePrintScore,
            warranty_value: analysisData.warrantyScore,
          },
          event_type: 'application_submitted',
          pixel_value: 500,
          message: `Your quote is ${grade === 'A' || grade === 'B' ? 'solid' : 'concerning'}. WindowMan will call you in 2-3 minutes to discuss your options.`,
          _note: 'This response was already processed. No DB update or pixel fired (idempotent).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse analysis_json from database (not from request body)
    // ✅ SIMPLIFIED: No calculateGrade() function needed anymore
    const analysisData = quoteAnalysis.analysis_json as {
      overallScore?: number;
      safetyScore?: number;
      scopeScore?: number;
      priceScore?: number;
      finePrintScore?: number;
      warrantyScore?: number;
      finalGrade?: string;  // ✅ SIMPLIFIED: Grade from quote-scanner
      pricePerOpening?: string;
      warnings?: string[];
      missingItems?: string[];
      summary?: string;
    };

    // Validate that analysis_json has required fields
    if (typeof analysisData.overallScore !== 'number' || !analysisData.finalGrade) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_ANALYSIS',
          message: 'Analysis JSON missing required fields',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const overallScore = analysisData.overallScore;
    const grade = analysisData.finalGrade;  // ✅ SIMPLIFIED: Read from quote-scanner

    // ✅ TOCTOU RACE: Use atomic lock with .is('analyzed_at', null)
    // This ensures the update only succeeds if analyzed_at is still NULL
    // If another process already updated it, this returns empty array
    const { data: updatedRows, error: updateError } = await supabase
      .from('quote_analyses')
      .update({
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', quote_analysis_id)
      .is('analyzed_at', null)  // ATOMIC LOCK: Only update if analyzed_at is NULL
      .select('id');

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'UPDATE_FAILED' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // ✅ TOCTOU RACE: Check if another process beat us to the update
    // If updatedRows is empty, it means analyzed_at was already set (race condition lost)
    if (!updatedRows || updatedRows.length === 0) {
      // Another process already marked this as analyzed and fired the pixel
      // Return success but without firing pixel (idempotent race resolution)
      console.log('[orchestrate-quote-analysis] Lost race condition, returning without pixel', { 
        account_id, 
        quote_analysis_id, 
        grade
      });

      return new Response(
        JSON.stringify({
          success: true,
          quote_analysis_id,
          grade,
          overall_score: overallScore,
          pillar_scores: {
            safety_code_match: analysisData.safetyScore,
            install_scope_clarity: analysisData.scopeScore,
            price_fairness: analysisData.priceScore,
            fine_print_transparency: analysisData.finePrintScore,
            warranty_value: analysisData.warrantyScore,
          },
          event_type: 'application_submitted',
          pixel_value: 500,
          message: `Your quote is ${grade === 'A' || grade === 'B' ? 'solid' : 'concerning'}. WindowMan will call you in 2-3 minutes to discuss your options.`,
          _note: 'Another process already processed this. No pixel fired (race resolved).',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // ✅ ONLY fire pixel if we won the race (updatedRows has the record we just updated)
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

    // Write to wm_event_log (canonical ledger)
    await writeLedgerEvent({
      event_id,
      event_name: 'application_submitted',
      account_id,
      client_id: account.client_id || undefined,
      value: pixel_value,
      source: 'signup',
      context: {
        flow: 'flow_a',
        quote_analysis_id,
        grade,
        overall_score: overallScore,
        weakest_pillars: weakestPillars,
      },
    });

    // Write to wm_events (for scoring)
    await attributionLogger({
      event_name: 'application_submitted',
      client_id: account.client_id || undefined,
      session_id: account.session_id || undefined,
      value: pixel_value,
      source: 'signup',
    });

    console.log('[orchestrate-quote-analysis]', { 
      account_id, 
      quote_analysis_id, 
      grade, 
      overall_score: overallScore, 
      event_id 
    });

    return new Response(
      JSON.stringify({
        success: true,
        quote_analysis_id,
        grade,
        overall_score: overallScore,
        pillar_scores: {
          safety_code_match: analysisData.safetyScore,
          install_scope_clarity: analysisData.scopeScore,
          price_fairness: analysisData.priceScore,
          fine_print_transparency: analysisData.finePrintScore,
          warranty_value: analysisData.warrantyScore,
        },
        event_type: 'application_submitted',
        pixel_value,
        event_id,
        call_scheduled_in_minutes: 3,
        message: `Your quote is ${grade === 'A' || grade === 'B' ? 'solid' : 'concerning'}. WindowMan will call you in 2-3 minutes to discuss your options.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('[orchestrate-quote-analysis] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
