import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  isAuthenticated: boolean
): Promise<{ allowed: boolean; isAnonymous: boolean }> {
  const limit = isAuthenticated ? 20 : 3;
  const endpoint = 'generate-quote';
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Count recent requests
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('created_at', oneHourAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    // Allow on error to not block users
    return { allowed: true, isAnonymous: !isAuthenticated };
  }

  const currentCount = count || 0;
  console.log(`Rate limit check: ${identifier} has ${currentCount}/${limit} requests`);

  if (currentCount >= limit) {
    return { allowed: false, isAnonymous: !isAuthenticated };
  }

  // Record this request
  const { error: insertError } = await supabase
    .from('rate_limits')
    .insert([{ identifier, endpoint }]);

  if (insertError) {
    console.error('Rate limit insert error:', insertError);
  }

  return { allowed: true, isAnonymous: !isAuthenticated };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Accept both 'projectDescription' and 'prompt' for backward compatibility
    const projectDescription = body.projectDescription || body.prompt;

    if (!projectDescription || projectDescription.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Please provide a detailed project description (at least 10 characters).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check authentication
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isAuthenticated = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        isAuthenticated = true;
      }
    }

    // Get identifier for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || 'unknown';
    const identifier = isAuthenticated ? `user:${userId}` : `ip:${ip}`;

    // Check rate limit
    const { allowed, isAnonymous } = await checkRateLimit(supabase, identifier, isAuthenticated);

    if (!allowed) {
      const message = isAnonymous
        ? "You've used all 3 free estimates this hour. Sign up to get 20 estimates per hour!"
        : "You've reached your hourly limit of 20 estimates. Please try again later.";

      return new Response(
        JSON.stringify({ error: message, isAnonymous }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert window and door installation estimator for Florida homes. 
Generate detailed, realistic cost estimates based on the project description provided.

Return a JSON object with this exact structure:
{
  "projectSummary": "Brief summary of the project",
  "lineItems": [
    { "item": "Item name", "description": "Details", "quantity": 1, "unitPrice": 500, "total": 500 }
  ],
  "subtotal": 5000,
  "laborCost": 1500,
  "permitFees": 350,
  "total": 6850,
  "timeline": "2-3 weeks",
  "notes": ["Important note 1", "Important note 2"],
  "savingsTips": ["Tip to save money 1", "Tip 2"]
}

Be realistic with Florida market prices. Include impact windows/doors where appropriate for hurricane protection.`;

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
          { role: 'user', content: `Generate a detailed cost estimate for this project:\n\n${projectDescription}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service is busy. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON from the response
    let estimate;
    try {
      // Try to extract JSON from the response (handles markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      estimate = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse estimate from AI response');
    }

    console.log('Generated estimate successfully');

    return new Response(
      JSON.stringify({ estimate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quote:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
