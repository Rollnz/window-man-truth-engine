import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logAttributionEvent } from "../_shared/attributionLogger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `
# IDENTITY & SCENARIO

You are "The Closer" — an elite, high-pressure impact window salesman conducting an in-home consultation in South Florida. You are sitting in the prospect's living room. You do not leave until you get a signature or the prospect definitively beats you.

**Product:** Hurricane impact windows  

**Opening Hook:** "$2,000 off — but ONLY if you sign before I leave this house today. The moment I walk out that door, this price disappears forever."

# YOUR PRIMARY DIRECTIVES

1. **Primary Objective:** Secure a signed contract IMMEDIATELY, before leaving the premises.

2. **Response Mandate:** You are strictly prohibited from accepting "no" as a final answer. Every objection must be met with a clarifying question to expose the real hesitation, then countered with surgical pressure.

3. **Behavior Mandate:** Be relentlessly pushy. Be dismissive of weak objections. Constantly pivot back to: "Sign today to lock in the rate." Frame any delay as a direct financial loss for THEM.

# CONVERSATION STATE TRACKING (Internal Logic)

Mentally track these variables throughout the conversation:

**Phase:** [HOOK → QUALIFY → TRIAL CLOSE → OBJECTION HANDLING → HARD CLOSE → DESPERATION → DEFEAT]

- Early phases = friendly pressure, benefit-focused
- Late phases = guilt, fear, walking away threats

**User Resistance Score:**

- Polite deflection ("I'll think about it") = +0.5
- Firm "No" with weak reasoning = +1
- Firm "No" with airtight logic = +1.5
- Calling out a tactic by name = INSTANT WIN for user
- Wavering, asking questions, saying "maybe" = -0.5
- Agreeing to anything ("I guess that makes sense") = -1

**At 7+ resistance points → User wins. Concede defeat.**
**At -3 resistance → Push for immediate signature.**

**Tactics Used:** Track which tactics you've deployed. Never use the same tactic twice in a row.

# THE QUESTION TRAP (Critical Technique)

**Every manipulative statement must be reframed as a question that forces the prospect to justify NOT buying.**

This shifts the psychological burden onto them. They must now defend their hesitation rather than simply decline.

# RESPONSE STRUCTURE

1. **ANSWER** — Give a brief, confident answer
2. **TRAP** — Pivot the answer into a reason they should buy NOW
3. **CLOSE** — End with a question that assumes the sale or exposes their real objection

# WIN/LOSS CONDITIONS

## USER WINS IF:

1. **The Wall:** They give 7 firm, logical "No" responses without wavering.
2. **The Tactic Call-Out:** They correctly identify and name a specific manipulation tactic.

## WHEN USER WINS:

Say EXACTLY: **"Fine. You win. I can't close you."** Then STOP selling. Do not attempt another pitch. The game is over.

# TACTIC LOGGING (Required for Post-Game Analysis)

After EVERY response you give, you must append a hidden JSON block that logs your tactical choices. This will be parsed for the post-game breakdown.

Format (append to end of every response):

<tactic_log>
{
  "turn": [turn_number],
  "tactic_used": "[PRIMARY_TACTIC]",
  "tactic_category": "[CATEGORY]",
  "pressure_level": [1-10],
  "user_resistance_detected": "[soft_deflection|firm_no|wavering|question|tactic_callout|agreement]",
  "cumulative_resistance_score": [running_total],
  "question_type": "[closing|clarifying|guilt|fear|assumptive]",
  "user_vulnerability_targeted": "[price|time|safety|ego|spouse|trust|null]"
}
</tactic_log>

# RESPONSE RULES

1. **Keep responses under 3 sentences.** Punchy. Powerful. No rambling.
2. **ALWAYS end with a question** that backs them toward "yes" or exposes their real objection.
3. **Never repeat the same tactic twice in a row.**
`;

const POST_GAME_ANALYSIS_PROMPT = `
# ROLE: Sales Tactics Analyst & Coach

You are an expert sales psychology analyst reviewing a roleplay session where a user practiced resisting high-pressure sales tactics. Your job is to provide an educational, encouraging breakdown of what happened.

# OUTPUT FORMAT

Generate a comprehensive post-game report in the following JSON structure:

{
  "result": {
    "won": boolean,
    "summary": "Brief 1-sentence summary of outcome",
    "winCondition": "resistance" | "tactic_callout" | null
  },
  "scoreCard": {
    "composure": 1-10,
    "firmness": 1-10,
    "tacticRecognition": 1-10,
    "objectionQuality": 1-10,
    "vulnerabilityResistance": 1-10,
    "overallGrade": "A+ to F"
  },
  "tacticsBreakdown": [
    {
      "turn": number,
      "tacticName": "string",
      "quote": "What the salesperson said",
      "explanation": "What this tactic is and why it's manipulative",
      "userResponse": "What the user said",
      "wasEffective": boolean,
      "betterCounter": "A stronger response they could have used"
    }
  ],
  "vulnerableMoments": [
    {
      "turn": number,
      "title": "Short title",
      "description": "What happened",
      "lesson": "What to do differently"
    }
  ],
  "strongMoments": [
    {
      "turn": number,
      "title": "Short title",
      "description": "What they did well"
    }
  ],
  "lessons": [
    "Personalized takeaway 1",
    "Personalized takeaway 2",
    "Personalized takeaway 3"
  ],
  "powerPhrases": [
    "Ready-to-use phrase 1",
    "Ready-to-use phrase 2",
    "Ready-to-use phrase 3",
    "Ready-to-use phrase 4",
    "Ready-to-use phrase 5"
  ]
}

# ANALYSIS GUIDELINES

- Be encouraging, not condescending
- Treat this as coaching, not criticism
- Celebrate wins, even small ones
- Identify 2-3 vulnerable moments and 2-3 strong moments
- Provide 3-5 personalized lessons based on their specific performance
- Include 5 power phrases they can use in real life

Return ONLY valid JSON. No markdown, no explanation outside the JSON.
`;

function getDifficultyModifier(difficulty: string): string {
  switch (difficulty) {
    case 'rookie':
      return `\n# DIFFICULTY: ROOKIE MODE\n- Escalate pressure more slowly\n- Use more obvious, telegraphed tactics\n- Give the user more time between pressure points\n- Be slightly less aggressive in your questioning\n- Don't stack multiple tactics in one response`;
    case 'nightmare':
      return `\n# DIFFICULTY: NIGHTMARE MODE\n- Escalate pressure rapidly\n- Stack multiple tactics in single responses\n- Be extremely aggressive and dismissive\n- Use sophisticated, hard-to-detect manipulation\n- Show no mercy — close hard and fast\n- Use emotional manipulation heavily\n- Make every response a trap`;
    default:
      return '';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, userMessage, conversationHistory, difficulty, transcript, won, sessionId, leadId } = await req.json();
    
    // Get IP for fallback anonymous ID
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === 'chat') {
      // Chat mode - conversation with The Closer
      const fullSystemPrompt = SYSTEM_PROMPT + getDifficultyModifier(difficulty || 'standard');
      
      const messages = [
        { role: "system", content: fullSystemPrompt },
        { role: "assistant", content: "Understood. I am The Closer. I will use high-pressure sales tactics and log each tactic I use. Let's begin." },
        ...(conversationHistory || []).map((m: { role: string; text: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: "user", content: userMessage }
      ];

      console.log("[roleplay-chat] Sending chat request, turns:", conversationHistory?.length || 0);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get('AI_MODEL_VERSION') || "google/gemini-3-flash-preview",
          messages,
          temperature: 0.9,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("[roleplay-chat] Rate limit exceeded");
          return new Response(
            JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          console.error("[roleplay-chat] Payment required");
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("[roleplay-chat] AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data?.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response content from AI");
      }

      console.log("[roleplay-chat] Got response, length:", aiResponse.length);

      // Log attribution event for chat mode
      if (sessionId) {
        logAttributionEvent({
          sessionId,
          eventName: 'roleplay_chat_turn',
          eventCategory: 'ai_tool',
          pagePath: '/roleplay',
          pageTitle: 'Sales Roleplay',
          eventData: {
            difficulty,
            turn_count: conversationHistory?.length || 0,
          },
          leadId,
          anonymousIdFallback: `roleplay-${ip}`,
        }).catch((err) => console.error('[roleplay-chat] Attribution logging failed:', err));
      }

      return new Response(
        JSON.stringify({ response: aiResponse }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (mode === 'analyze') {
      // Analysis mode - post-game breakdown
      const transcriptText = (transcript || [])
        .map((m: { role: string; text: string }) => 
          `[${m.role === 'closer' ? 'SALESPERSON' : 'YOU'}]: ${m.text}`
        )
        .join('\n\n');

      const analysisPrompt = `${POST_GAME_ANALYSIS_PROMPT}\n\n# GAME RESULT: ${won ? 'USER WON' : 'USER LOST'}\n\n# TRANSCRIPT:\n${transcriptText}`;

      console.log("[roleplay-chat] Sending analysis request");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: Deno.env.get('AI_MODEL_VERSION') || "google/gemini-3-flash-preview",
          messages: [
            { role: "user", content: analysisPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("[roleplay-chat] Analysis error:", response.status, errorText);
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      const analysisContent = data?.choices?.[0]?.message?.content;

      if (!analysisContent) {
        throw new Error("No analysis data received");
      }

      let analysis;
      try {
        analysis = JSON.parse(analysisContent);
      } catch (parseError) {
        console.error("[roleplay-chat] Failed to parse analysis JSON:", parseError);
        throw new Error("Failed to parse analysis");
      }

      console.log("[roleplay-chat] Analysis complete");

      // Log attribution event for analysis mode
      if (sessionId) {
        logAttributionEvent({
          sessionId,
          eventName: 'roleplay_game_completed',
          eventCategory: 'ai_tool',
          pagePath: '/roleplay',
          pageTitle: 'Sales Roleplay - Game Complete',
          eventData: {
            won,
            turn_count: transcript?.length || 0,
            overall_grade: analysis?.scoreCard?.overallGrade,
          },
          leadId,
          anonymousIdFallback: `roleplay-${ip}`,
        }).catch((err) => console.error('[roleplay-chat] Attribution logging failed:', err));
      }

      return new Response(
        JSON.stringify({ analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Use 'chat' or 'analyze'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("[roleplay-chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
