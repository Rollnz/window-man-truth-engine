import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionData {
  // Core fields
  homeSize?: number;
  windowCount?: number;
  windowAge?: string;
  windowAgeYears?: number;
  homeType?: string;
  zipCode?: string;
  currentEnergyBill?: string;
  currentEnergyBillAmount?: number;
  draftinessLevel?: string;
  noiseLevel?: string;

  // Contact info
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  notes?: string;
  city?: string;
  state?: string;

  // AI context
  sourceTool?: string;
  insuranceCarrier?: string;
  urgencyLevel?: string;
  emotionalState?: string;
  specificDetail?: string;
  projectType?: string;

  // Tool results
  realityCheckScore?: number;
  costOfInactionTotal?: number;
  quizScore?: number;
  quizVulnerability?: string;
  quizAttempted?: boolean;
  comparisonViewed?: boolean;
  riskDiagnosticCompleted?: boolean;
  stormRiskScore?: number;
  securityRiskScore?: number;
  insuranceRiskScore?: number;
  warrantyRiskScore?: number;
  overallProtectionScore?: number;
  fastWinCompleted?: boolean;
  fastWinResult?: string;
  fastWinPainPoint?: string;
  fastWinOrientation?: string;
  fastWinBudgetPriority?: string;
  evidenceLockerViewed?: boolean;
  caseStudiesViewed?: string[];
  lastCaseViewed?: string;
  intelLibraryViewed?: boolean;
  unlockedResources?: string[];
  claimVaultViewed?: boolean;
  claimVaultProgress?: Record<string, boolean>;
  claimVaultFiles?: Record<string, string>;
  claimVaultSessionId?: string;
  emergencyModeUsed?: boolean;
  claimAnalysisResult?: unknown;
  quoteAnalysisResult?: unknown;
  quoteDraftEmail?: string | null;
  quotePhoneScript?: string | null;
  fairPriceQuizResults?: unknown;

  // Vault sync
  vaultSyncPending?: boolean;
  vaultSyncEmail?: string;
  vaultSyncSource?: string;

  // Tracking
  leadId?: string;
  consultationRequested?: boolean;
  lastVisit?: string;
  toolsCompleted?: string[];

  // Allow other fields
  [key: string]: unknown;
}

/**
 * Safe Deep Merge - Existing DB data wins over empty incoming data
 * 
 * Rules:
 * 1. Empty incoming never overwrites existing
 * 2. Existing empty/null → use incoming
 * 3. Both have values (arrays) → merge unique items
 * 4. Both have values (objects) → recursive merge
 * 5. Default: existing wins (conservative)
 */
function safeDeepMerge(
  existing: Record<string, unknown> | null,
  incoming: Record<string, unknown> | null
): Record<string, unknown> {
  // If no incoming data, return existing unchanged
  if (!incoming || Object.keys(incoming).length === 0) {
    console.log('[sync-session] No incoming data, returning existing');
    return existing || {};
  }

  // If no existing data, use incoming (first sync)
  if (!existing || Object.keys(existing).length === 0) {
    console.log('[sync-session] No existing data, using incoming');
    return incoming;
  }

  console.log('[sync-session] Merging existing with incoming');
  const merged: Record<string, unknown> = { ...existing };
  const fieldsUpdated: string[] = [];

  for (const key of Object.keys(incoming)) {
    const incomingValue = incoming[key];
    const existingValue = existing[key];

    // RULE 1: Empty incoming never overwrites existing
    if (incomingValue === null || incomingValue === undefined || incomingValue === '') {
      continue; // Keep existing
    }

    // RULE 2: Existing empty/null → use incoming
    if (existingValue === null || existingValue === undefined || existingValue === '') {
      merged[key] = incomingValue;
      fieldsUpdated.push(key);
      continue;
    }

    // RULE 3: lastVisit - use most recent timestamp
    if (key === 'lastVisit') {
      try {
        const incomingTime = new Date(incomingValue as string).getTime();
        const existingTime = new Date(existingValue as string).getTime();
        if (incomingTime > existingTime) {
          merged[key] = incomingValue;
          fieldsUpdated.push(key);
        }
      } catch {
        // Keep existing on parse error
      }
      continue;
    }

    // RULE 4: Arrays - merge unique values (toolsCompleted, caseStudiesViewed, etc.)
    if (Array.isArray(existingValue) && Array.isArray(incomingValue)) {
      const mergedArray = [...new Set([...existingValue, ...incomingValue])];
      if (mergedArray.length > existingValue.length) {
        merged[key] = mergedArray;
        fieldsUpdated.push(key);
      }
      continue;
    }

    // RULE 5: Nested objects - recursive merge
    if (
      typeof existingValue === 'object' &&
      typeof incomingValue === 'object' &&
      existingValue !== null &&
      incomingValue !== null &&
      !Array.isArray(existingValue) &&
      !Array.isArray(incomingValue)
    ) {
      const mergedNested = safeDeepMerge(
        existingValue as Record<string, unknown>,
        incomingValue as Record<string, unknown>
      );
      // Check if anything actually changed
      if (JSON.stringify(mergedNested) !== JSON.stringify(existingValue)) {
        merged[key] = mergedNested;
        fieldsUpdated.push(key);
      }
      continue;
    }

    // DEFAULT: existing wins (conservative) - no change to merged[key]
  }

  console.log('[sync-session] Fields updated:', fieldsUpdated);
  return merged;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[sync-session] Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[sync-session] Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[sync-session] User authenticated:', user.id);

    // Parse request body
    const { sessionData, syncReason } = await req.json() as {
      sessionData: SessionData;
      syncReason: string;
    };

    console.log('[sync-session] Sync reason:', syncReason);
    console.log('[sync-session] Incoming data keys:', Object.keys(sessionData || {}));

    // Check if incoming data is meaningful
    if (!sessionData || Object.keys(sessionData).length === 0) {
      console.log('[sync-session] No data to sync');
      return new Response(
        JSON.stringify({ 
          success: true, 
          merged: false, 
          reason: 'incoming_empty' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing profile session_data
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('session_data')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[sync-session] Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingData = (profile?.session_data as Record<string, unknown>) || {};
    console.log('[sync-session] Existing data keys:', Object.keys(existingData));

    // Perform safe deep merge
    const mergedData = safeDeepMerge(existingData, sessionData);

    // Check if anything actually changed
    const hasChanges = JSON.stringify(mergedData) !== JSON.stringify(existingData);
    if (!hasChanges) {
      console.log('[sync-session] No changes after merge');
      return new Response(
        JSON.stringify({ 
          success: true, 
          merged: false, 
          reason: 'no_changes' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile with merged data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        session_data: mergedData,
        session_sync_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[sync-session] Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[sync-session] Sync successful');
    return new Response(
      JSON.stringify({
        success: true,
        merged: true,
        syncedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-session] Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
