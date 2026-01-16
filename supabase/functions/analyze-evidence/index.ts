import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentStatus {
  id: string;
  title: string;
  hasCheckbox: boolean;
  hasFile: boolean;
  whatItProves: string;
  whyClaimsFail: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
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

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);
    // ===== END AUTHENTICATION CHECK =====

    const { documents, sessionId, leadId } = await req.json() as { 
      documents: DocumentStatus[];
      sessionId?: string;
      leadId?: string;
    };
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing evidence for ${documents.length} documents (user: ${userId})`);

    // Build prompt for AI
    const docSummary = documents.map(doc => 
      `- ${doc.title}: ${doc.hasFile ? 'UPLOADED' : doc.hasCheckbox ? 'CHECKED (no file)' : 'MISSING'}`
    ).join('\n');

    const systemPrompt = `You are an insurance claim readiness analyst. Analyze the user's document preparation for a window damage insurance claim.

Your task:
1. Assess overall claim readiness (0-100%)
2. Evaluate each document's status
3. Provide specific, actionable recommendations

Be direct and authoritative. Use insurance industry terminology. Focus on preventing claim denials.`;

    const userPrompt = `Analyze this homeowner's claim documentation status:

${docSummary}

Document details:
${documents.map(doc => `
${doc.title}:
- What it proves: ${doc.whatItProves}
- Why claims fail without it: ${doc.whyClaimsFail}
- Current status: ${doc.hasFile ? 'File uploaded' : doc.hasCheckbox ? 'Marked complete (no file uploaded)' : 'Not completed'}
`).join('\n')}

Respond with a JSON object containing:
{
  "overallScore": number (0-100),
  "status": "critical" | "warning" | "ready",
  "summary": "Brief 1-2 sentence assessment",
  "documentStatus": [
    {
      "docId": "document-id",
      "status": "complete" | "missing" | "weak",
      "recommendation": "Specific action for this document"
    }
  ],
  "nextSteps": ["Priority action 1", "Priority action 2", "Priority action 3"]
}

Use "weak" status for documents that are checked but have no file uploaded.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('AI_MODEL_VERSION') || 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    console.log('Analysis complete:', result.overallScore, '% readiness');

    // Log attribution event (non-blocking)
    if (sessionId) {
      logAttributionEvent({
        sessionId,
        eventName: 'evidence_analyzed',
        eventCategory: 'ai_tool',
        pagePath: '/claim-survival',
        pageTitle: 'Claim Survival Vault',
        eventData: {
          overall_score: result.overallScore,
          status: result.status,
          documents_analyzed: documents.length,
          documents_complete: documents.filter(d => d.hasFile).length,
          user_id: userId,
        },
        leadId,
        anonymousIdFallback: `evidence-${userId}`,
      }).catch((err) => console.error('[analyze-evidence] Attribution logging failed:', err));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('analyze-evidence error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
