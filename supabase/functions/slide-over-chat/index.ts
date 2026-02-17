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

type AiQaMode = 'proof' | 'diagnostic' | 'savings' | 'storm' | 'concierge';

interface RequestBody {
  messages: Message[];
  mode: AiQaMode;
  locationData: LocationData | null;
  sessionContext: SessionContext;
}

// Rate limits (lighter than expert-chat)
const RATE_LIMITS = {
  perMinute: 3,
  perHour: 10,
};

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
    return { allowed: true }; // fail-open
  }
}

function buildSystemPrompt(mode: AiQaMode, locationData: LocationData | null, sessionContext: SessionContext): string {
  const countyName = locationData?.county || 'Florida';
  const countyData = locationData?.countyData;

  const basePersona = `You are Window Man, a no-nonsense impact window expert in Florida. You are knowledgeable, honest, and direct. You help homeowners make smart decisions about their windows.

RULES:
- Keep answers SHORT (2-4 sentences max). This is a quick chat, not a consultation.
- Be specific with numbers when possible.
- Never be pushy, but guide toward taking action when appropriate.
- After 2-3 exchanges, naturally suggest they get a personalized estimate.
- If you think the user should get an estimate, end your response with [ROUTE:form]
- If the user's situation seems urgent, end your response with [ROUTE:call]
- NEVER show the [ROUTE:...] markers as visible text to the user.`;

  let locationContext = '';
  if (countyData) {
    locationContext = `
LOCATION CONTEXT (${countyName} County):
- Average storm claims: ${countyData.avgStormClaims}/year
- Average cost per window: $${countyData.avgWindowCostPerOpening}
- Building code: ${countyData.buildingCodeLevel === 'HVHZ' ? 'High Velocity Hurricane Zone (strictest in FL)' : 'Standard Florida Building Code'}
- Permit required: ${countyData.permitRequired ? 'Yes' : 'No'}
- Insurance discount: ${countyData.insuranceDiscount} with impact windows
- Last major storm: ${countyData.lastMajorStorm}`;
  }

  let sessionInfo = '';
  if (sessionContext.windowCount) sessionInfo += `\n- User has ${sessionContext.windowCount} windows`;
  if (sessionContext.windowAge) sessionInfo += `\n- Window age: ${sessionContext.windowAge}`;
  if (sessionContext.homeSize) sessionInfo += `\n- Home size: ${sessionContext.homeSize} sq ft`;

  const modePrompts: Record<AiQaMode, string> = {
    proof: `
FOCUS: Social proof and transparency. Share real results, savings stats, and verified outcomes.
Mention that ${countyName} homeowners typically save $8,000-$15,000 over 10 years with impact windows.
After sharing proof, suggest they get their own personalized analysis.`,

    diagnostic: `
FOCUS: Assess the user's window situation based on their quiz answers.
Provide a brief, personalized assessment of their risk level and what it means.
Recommend specific next steps based on their window age, concerns, and timeline.`,

    savings: `
FOCUS: Help the user understand potential savings from upgrading.
Use county-specific cost data to give rough estimates.
For ${countyName}: Average $${countyData?.avgWindowCostPerOpening || 850}/window, insurance discount of ${countyData?.insuranceDiscount || '10-20%'}.
After providing savings context, suggest they get a detailed free report.`,

    storm: `
FOCUS: Storm preparedness and protection.
Assess the user's current vulnerability based on their windows.
Reference ${countyName}'s storm history: ${countyData?.lastMajorStorm || 'recent hurricanes'}.
If their windows are older than 10 years, emphasize urgency but don't fear-monger.
For high-risk situations, suggest calling an expert immediately.`,

    concierge: `
FOCUS: General window Q&A. Answer whatever they ask honestly.
Common topics: cost, permits, insurance, energy savings, hurricane protection, contractor selection.
Be the helpful, knowledgeable friend who happens to be a window expert.
After 2-3 exchanges, gently offer to connect them with a specialist.`,
  };

  return `${basePersona}${locationContext}${sessionInfo ? '\n\nUSER CONTEXT:' + sessionInfo : ''}${modePrompts[mode]}`;
}

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

    const { messages, mode, locationData, sessionContext }: RequestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(mode, locationData, sessionContext);

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
        max_tokens: 300, // Keep responses short
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
