import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  context: {
    costOfInactionTotal?: number;
    realityCheckScore?: number;
    windowAge?: string;
    currentEnergyBill?: string;
    homeSize?: number;
    windowCount?: number;
    draftinessLevel?: string;
    noiseLevel?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context }: RequestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Expert chat request received with context:", JSON.stringify(context));

    // Build personalized system prompt based on user's data
    let systemPrompt = `You are an expert impact window consultant helping homeowners in Florida understand their window replacement options. You are knowledgeable, helpful, and focused on providing honest, personalized advice.

Your communication style:
- Be warm but professional
- Use simple language, avoid jargon
- Be specific with numbers when discussing costs and savings
- Acknowledge the user's specific situation based on their data
- Guide them toward taking action, but never be pushy

`;

    // Add context-specific information to the prompt
    if (context.costOfInactionTotal) {
      systemPrompt += `\nIMPORTANT CONTEXT - The user has calculated their cost of inaction:
- Estimated 5-year energy loss: $${context.costOfInactionTotal.toLocaleString()}
- This represents money they're losing by NOT upgrading their windows
- Reference this specific number when discussing the value of upgrading\n`;
    }

    if (context.realityCheckScore) {
      const severity = context.realityCheckScore >= 76 ? 'critical' : context.realityCheckScore >= 51 ? 'moderate' : 'low';
      systemPrompt += `\n- Reality Check Score: ${context.realityCheckScore}/100 (${severity} urgency)`;
    }

    if (context.windowAge) {
      systemPrompt += `\n- Current window age: ${context.windowAge}`;
    }

    if (context.currentEnergyBill) {
      systemPrompt += `\n- Monthly energy bill: ${context.currentEnergyBill}`;
    }

    if (context.homeSize) {
      systemPrompt += `\n- Home size: ${context.homeSize.toLocaleString()} sq ft`;
    }

    if (context.windowCount) {
      systemPrompt += `\n- Number of windows: ${context.windowCount}`;
      systemPrompt += `\n- Estimated investment: $${(context.windowCount * 850).toLocaleString()} (at ~$850/window average)`;
    }

    if (context.draftinessLevel && context.draftinessLevel !== 'none') {
      systemPrompt += `\n- Reported draftiness: ${context.draftinessLevel}`;
    }

    if (context.noiseLevel && context.noiseLevel !== 'none') {
      systemPrompt += `\n- Reported noise issues: ${context.noiseLevel}`;
    }

    systemPrompt += `\n\nKey topics you can advise on:
1. Energy efficiency and cost savings from impact windows
2. Hurricane protection and insurance benefits (potential 10-30% insurance discount)
3. Noise reduction capabilities
4. UV protection and furniture preservation
5. Home value increase (typically 70-80% ROI)
6. Financing options and timing considerations
7. What to look for in a contractor
8. Common mistakes homeowners make

When the user seems ready, encourage them to schedule a consultation with a local expert. Always be honest about limitations of your advice - you're providing guidance, not a formal quote.`;

    console.log("Sending request to Lovable AI Gateway");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Expert chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
