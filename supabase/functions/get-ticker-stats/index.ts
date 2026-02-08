import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// MARKETING INFLATION CONFIGURATION
// Adjust these values as organic volume grows
// ============================================================
const START_DATE = new Date("2024-02-12");
const DAILY_INFLATION_RATE = 5; // Simulated uploads per day historically
const TODAY_OFFSET_MIN = 3;
const TODAY_OFFSET_MAX = 7;

/**
 * Seeded random number generator for consistent "today" offset
 * Same date = same number (no flickering on refresh)
 */
function seededRandom(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const random = (Math.abs(hash) % 1000) / 1000;
  return Math.floor(random * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query 1: Total count (all time)
    const { count: realTotal, error: totalError } = await supabase
      .from("quote_analyses")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("[get-ticker-stats] Total count error:", totalError);
      throw totalError;
    }

    // Query 2: Today's count (since midnight UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: realToday, error: todayError } = await supabase
      .from("quote_analyses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    if (todayError) {
      console.error("[get-ticker-stats] Today count error:", todayError);
      throw todayError;
    }

    // Calculate Marketing Inflation
    const now = new Date();
    const daysPassed = Math.floor(
      (now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)
    );

    const inflationTotal = daysPassed * DAILY_INFLATION_RATE;

    // Seeded random for today's offset (consistent per day)
    const todayString = now.toISOString().split("T")[0];
    const todayOffset = seededRandom(
      todayString,
      TODAY_OFFSET_MIN,
      TODAY_OFFSET_MAX
    );

    // Hybrid output
    const hybridTotal = (realTotal || 0) + inflationTotal;
    const hybridToday = (realToday || 0) + todayOffset;

    console.log("[get-ticker-stats] Hybrid stats:", {
      real_total: realTotal,
      real_today: realToday,
      inflation_total: inflationTotal,
      today_offset: todayOffset,
      hybrid_total: hybridTotal,
      hybrid_today: hybridToday,
    });

    return new Response(
      JSON.stringify({
        total: hybridTotal,
        today: hybridToday,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[get-ticker-stats] Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch ticker stats" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
