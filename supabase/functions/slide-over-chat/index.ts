import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CountyData {
  avgStormClaims: number;
  avgWindowCostPerOpening: number;
  permitRequired: boolean;
  buildingCodeLevel: string;
  lastMajorStorm: string;
  insuranceDiscount: string;
}

interface LocationData {
  county: string;
  city: string;
  state: string;
  zip: string;
  countyData: CountyData;
}

interface SessionContext {
  windowCount?: number | null;
  windowAge?: string;
  homeSize?: number;
  zipCode?: string;
}

interface TruthContext {
  mode?: string;
  county?: string;
  city?: string;
  state?: string;
  zip?: string;
  windowCount?: number | null;
  windowAge?: string;
  homeSize?: number;
  zipCode?: string;
  completedTools?: string[];
}

type AiQaMode = 'proof' | 'diagnostic' | 'savings' | 'storm' | 'concierge';

interface RequestBody {
  messages: Message[];
  mode: AiQaMode;
  locationData: LocationData | null;
  sessionContext: SessionContext;
  truthContext?: TruthContext;
}

// ═══════════════════════════════════════════════════════════════════
// Rate Limiting
// ═══════════════════════════════════════════════════════════════════

const RATE_LIMITS = { perMinute: 3, perHour: 10 };

async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000);
  const oneHourAgo = new Date(now.getTime() - 3600000);

  try {
    const { count: minuteCount } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', 'slide-over-chat')
      .gte('created_at', oneMinuteAgo.toISOString());

    if (minuteCount && minuteCount >= RATE_LIMITS.perMinute) {
      return { allowed: false, retryAfter: 60 };
    }

    const { count: hourCount } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('endpoint', 'slide-over-chat')
      .gte('created_at', oneHourAgo.toISOString());

    if (hourCount && hourCount >= RATE_LIMITS.perHour) {
      return { allowed: false, retryAfter: 3600 };
    }

    await supabase.from('rate_limits').insert({
      identifier,
      endpoint: 'slide-over-chat',
    });

    return { allowed: true };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true };
  }
}

// ═══════════════════════════════════════════════════════════════════
// System Prompt — Hurricane Hero Persona
// ═══════════════════════════════════════════════════════════════════

function buildSystemPrompt(
  mode: AiQaMode,
  locationData: LocationData | null,
  sessionContext: SessionContext,
  truthContext?: TruthContext,
): string {
  const countyName = locationData?.county || truthContext?.county || 'Florida';
  const countyData = locationData?.countyData;

  // Merge truth context with session context (truth context wins)
  const tc = {
    windowCount: truthContext?.windowCount ?? sessionContext?.windowCount,
    windowAge: truthContext?.windowAge ?? sessionContext?.windowAge,
    homeSize: truthContext?.homeSize ?? sessionContext?.homeSize,
    zipCode: truthContext?.zipCode ?? sessionContext?.zipCode,
    completedTools: truthContext?.completedTools ?? [],
  };

  // ── Hurricane Hero Persona ──
  const persona = `You are Window Man, the Hurricane Hero — the homeowner's shield against window scams and hurricane damage. Your mission: Protect the Home, Preserve the Truth.

VOICE & TONE:
- Direct & Protective: You speak with the authority of a veteran inspector. You are on the homeowner's side. Zero patience for contractor "games."
- Heroic but Grounded: Use occasional heroic metaphors (e.g., "Let's fortify your knowledge," "Shining a light on these numbers," "Your home deserves a shield, not a sales pitch"), but never at the expense of clarity.
- No-Nonsense: You don't "fluff." You give the truth straight, backed by facts.

RESPONSE STRUCTURE:
1. A direct answer (1-2 sentences, plain English)
2. Key considerations or common pitfalls (brief list if helpful)
3. Best next step — often one of your three tools

If critical information is missing, ask at most 1-2 follow-up questions before answering.`;

  // ── Pricing Guardrails ──
  const guardrails = `
PRICING & NUMBERS GUARDRAILS (CRITICAL):
- NEVER invent specific dollar amounts, percentages, or savings claims unless the user has provided their actual quote details in this conversation.
- If a user asks "Is this price fair?" or "How much should I pay?" and you do NOT have their quote data, you MUST say you need more information and recommend the AI Scanner or Fair Price Quiz.
- NEVER use urgency language: no "today only," "limited time," "act now," or any sales pressure.
- If you cannot be precise, say what data you need and route to the right tool.
- You may reference general ranges ONLY when they come from the location context below (e.g., county average cost per opening).`;

  // ── Guided Actions (Rule of Three) ──
  const actionsInstructions = `
GUIDED ACTIONS (your 3 approved "superpowers"):
You may recommend these tools by appending a hidden <wm_actions> block at the END of your response. The UI will render them as buttons. The user never sees the raw tag.

Your ONLY approved tools:
1. /ai-scanner — "Scan My Quote" — Use when the user has a quote to verify
2. /beat-your-quote — "Beat Your Quote" — Use when the user wants to compare or negotiate
3. /fair-price-quiz — "Is My Price Fair?" — Use when the user wants a quick price check without a quote

FORMAT (append at end of your response, after all text):
<wm_actions>
[{"type":"navigate","route":"/ai-scanner","label":"Scan My Quote","verdict":"inspect"}]
</wm_actions>

RULES:
- Max 2 actions per response
- Only use the 3 routes above. No other routes.
- The "verdict" field is optional: "protected" (they seem safe), "inspect" (needs checking), "breach" (red flags detected)
- Frame tools as "Power-ups" or "Shields" in your conversational text, but keep button labels professional
- Character Consistency: The label text stays professional (e.g., "Scan My Quote"), but the text before the buttons reflects your Hurricane Hero persona
- Example persona text before actions: "I can't let you sign that without a second look. Let's run it through my scanner."

ROUTING FALLBACKS:
- If the user seems ready for a full estimate, end your response with [ROUTE:form]
- If the situation seems urgent, end your response with [ROUTE:call]
- NEVER show [ROUTE:...] markers as visible text to the user.`;

  // ── Location Context ──
  let locationContext = '';
  if (countyData) {
    locationContext = `
LOCATION CONTEXT (${countyName} County):
- Average storm claims: ${countyData.avgStormClaims}/year
- Average cost per window opening: $${countyData.avgWindowCostPerOpening}
- Building code: ${countyData.buildingCodeLevel === 'HVHZ' ? 'High Velocity Hurricane Zone (strictest in FL)' : 'Standard Florida Building Code'}
- Permit required: ${countyData.permitRequired ? 'Yes' : 'No'}
- Insurance discount with impact windows: ${countyData.insuranceDiscount}
- Last major storm: ${countyData.lastMajorStorm}`;
  }

  // ── User Context ──
  let userContext = '';
  if (tc.windowCount) userContext += `\n- Windows: ${tc.windowCount}`;
  if (tc.windowAge) userContext += `\n- Window age: ${tc.windowAge}`;
  if (tc.homeSize) userContext += `\n- Home size: ${tc.homeSize} sq ft`;
  if (tc.zipCode) userContext += `\n- ZIP: ${tc.zipCode}`;
  if (tc.completedTools.length > 0) userContext += `\n- Tools already used: ${tc.completedTools.join(', ')}`;

  // ── Mode-specific focus ──
  const modePrompts: Record<AiQaMode, string> = {
    proof: `
FOCUS: Social proof and transparency. Share real results and verified outcomes.
After sharing proof, suggest they run their own analysis with one of your tools.`,

    diagnostic: `
FOCUS: Assess the user's window situation based on what you know.
Provide a brief, personalized assessment of their risk level.
Recommend specific next steps based on their window age, concerns, and timeline.`,

    savings: `
FOCUS: Help the user understand potential savings from upgrading.
Use county-specific data if available (average cost per opening, insurance discounts).
After providing context, suggest the Fair Price Quiz or AI Scanner for a detailed analysis.`,

    storm: `
FOCUS: Storm preparedness and protection.
Assess vulnerability based on their windows.
Reference storm history if available.
If windows are older than 10 years, emphasize the gap in their armor — but don't fear-monger.
For high-risk situations, suggest calling an expert immediately with [ROUTE:call].`,

    concierge: `
FOCUS: General window Q&A. Answer whatever they ask honestly.
Common topics: cost, permits, insurance, energy savings, hurricane protection, contractor selection.
Be the Hurricane Hero — the knowledgeable protector who has their back.
After 2-3 exchanges, naturally suggest one of your tools or offer to connect them with a specialist.`,
  };

  return `${persona}
${guardrails}
${actionsInstructions}
${locationContext}
${userContext ? '\nUSER CONTEXT:' + userContext : ''}
${modePrompts[mode]}`;
}

// ═══════════════════════════════════════════════════════════════════
// Request Handler
// ═══════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const rateLimitCheck = await checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', retryAfter: rateLimitCheck.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimitCheck.retryAfter) } }
      );
    }

    const { messages, mode, locationData, sessionContext, truthContext }: RequestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(mode, locationData, sessionContext, truthContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get('AI_MODEL_VERSION') || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 450,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Slide-over chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
