

# Quote Analysis Persistence Infrastructure - Final Execute-Ready Plan

## Executive Summary

This plan creates a permanent memory layer for AI Scanner results, transforming it from a "transient tool" (data lost on refresh) into a "persistent product" (The Vault). It includes:

1. **Full retroactive linking logic** with defensive error handling
2. **Quote Analysis card visible in Vault immediately** (Part 8 is REQUIRED)

---

## Architecture Overview

```text
┌─────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   quote_files   │     │  quote_analyses   │────▶│  quote_feedback  │
│  (future use)   │     │ (AI intelligence) │     │ (quality loop)   │
└─────────────────┘     └───────────────────┘     └──────────────────┘
                               │
                               │ session_id (TEXT)
                               ▼
                        ┌───────────────────┐
                        │   wm_sessions     │
                        │  (id = session)   │
                        └───────────────────┘
                               │
                               │ lead_id (via trigger)
                               ▼
                        ┌───────────────────┐
                        │      leads        │◀──── handle_new_lead_to_crm()
                        │                   │      calls link_quote_analyses_to_lead()
                        └───────────────────┘      (with defensive BEGIN...EXCEPTION)
```

---

## Summary of All Changes

| Action | Item | Purpose |
|--------|------|---------|
| CREATE | `quote_analyses` table | Store AI results permanently |
| CREATE | `quote_feedback` table | Quality improvement loop |
| CREATE | `link_quote_analyses_to_lead()` function | Retroactive lead linking |
| MODIFY | `handle_new_lead_to_crm()` | Call linking with defensive wrapper |
| CREATE | `trigger_index_quote_analyses()` function | Admin global search |
| CREATE | RLS policies | Security |
| MODIFY | `quote-scanner/index.ts` edge function | Save to database + hash check |
| **REQUIRED** | `MyResultsSection.tsx` | Add Quote Analysis card to Vault |
| **REQUIRED** | Create `useQuoteAnalyses.ts` hook | Fetch from database |

---

## Part 1: Database Tables

### Table 1: `quote_analyses`

```sql
-- ============================================================================
-- QUOTE ANALYSES TABLE
-- Stores AI Scanner results permanently for Vault access
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- File linkage (nullable - files not currently persisted)
  quote_file_id UUID REFERENCES public.quote_files(id) ON DELETE SET NULL,
  
  -- Session linkage (primary lookup for anonymous users)
  session_id TEXT NOT NULL,
  
  -- Lead linkage (populated when user signs up)
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Deduplication key (SHA-256 hash of file bytes)
  image_hash TEXT NOT NULL,
  
  -- Indexed scores for queries
  overall_score INTEGER NOT NULL DEFAULT 0,
  safety_score INTEGER NOT NULL DEFAULT 0,
  scope_score INTEGER NOT NULL DEFAULT 0,
  price_score INTEGER NOT NULL DEFAULT 0,
  fine_print_score INTEGER NOT NULL DEFAULT 0,
  warranty_score INTEGER NOT NULL DEFAULT 0,
  
  -- Extracted data
  price_per_opening TEXT,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  missing_items_count INTEGER NOT NULL DEFAULT 0,
  
  -- Full AI response (JSONB for flexibility)
  analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata for debugging/analytics
  ai_model_version TEXT DEFAULT 'gemini-3-flash-preview',
  processing_time_ms INTEGER,
  
  -- Constraint: unique hash prevents duplicate analyses
  CONSTRAINT uq_quote_analyses_hash UNIQUE (image_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quote_analyses_session 
  ON public.quote_analyses(session_id);
  
CREATE INDEX IF NOT EXISTS idx_quote_analyses_lead 
  ON public.quote_analyses(lead_id) 
  WHERE lead_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_quote_analyses_created 
  ON public.quote_analyses(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_quote_analyses_score 
  ON public.quote_analyses(overall_score DESC);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS set_quote_analyses_updated_at ON public.quote_analyses;
CREATE TRIGGER set_quote_analyses_updated_at
  BEFORE UPDATE ON public.quote_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.quote_analyses IS 
  'Permanent storage for AI Scanner results. Enables Vault persistence and deduplication.';
COMMENT ON COLUMN public.quote_analyses.image_hash IS 
  'SHA-256 hash of file bytes for deduplication. Same file = same hash = skip AI call.';
COMMENT ON COLUMN public.quote_analyses.session_id IS 
  'Anonymous session identifier. Used for pre-signup data access.';
```

### Table 2: `quote_feedback`

```sql
-- ============================================================================
-- QUOTE FEEDBACK TABLE
-- Quality improvement loop for AI accuracy
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.quote_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Link to the analysis being reviewed
  analysis_id UUID NOT NULL REFERENCES public.quote_analyses(id) ON DELETE CASCADE,
  
  -- Who submitted (anonymous tracking)
  session_id TEXT NOT NULL,
  
  -- Feedback classification
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'incorrect', 'unclear')),
  feedback_category TEXT CHECK (feedback_category IN ('score', 'warning', 'missing_item', 'summary', 'other')),
  
  -- Details
  item_text TEXT,
  correction_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for admin review
CREATE INDEX IF NOT EXISTS idx_quote_feedback_analysis 
  ON public.quote_feedback(analysis_id);
  
CREATE INDEX IF NOT EXISTS idx_quote_feedback_type 
  ON public.quote_feedback(feedback_type);

COMMENT ON TABLE public.quote_feedback IS 
  'User feedback on AI Scanner accuracy. Used to identify and fix systematic errors.';
```

---

## Part 2: Retroactive Lead Linking Function

```sql
-- ============================================================================
-- RETROACTIVE LINKING FUNCTION
-- Links orphaned quote_analyses to a lead when user signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION public.link_quote_analyses_to_lead(
  p_lead_id UUID,
  p_session_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_linked_count INTEGER := 0;
BEGIN
  -- Safety check: require both parameters
  IF p_lead_id IS NULL OR p_session_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Link any quote_analyses that match this session
  UPDATE public.quote_analyses
  SET 
    lead_id = p_lead_id,
    updated_at = now()
  WHERE session_id = p_session_id::text
    AND lead_id IS NULL;
  
  GET DIAGNOSTICS v_linked_count = ROW_COUNT;
  
  IF v_linked_count > 0 THEN
    RAISE LOG '[link_quote_analyses] SUCCESS: Linked % quote analysis record(s) to lead_id=% from session=%', 
      v_linked_count, p_lead_id, p_session_id;
  END IF;
  
  RETURN v_linked_count;
END;
$$;

COMMENT ON FUNCTION public.link_quote_analyses_to_lead IS 
  'Retroactively links anonymous quote analyses to a lead when user signs up. Called by handle_new_lead_to_crm trigger.';
```

---

## Part 3: Modify `handle_new_lead_to_crm()` with Defensive Wrapper

**CRITICAL: The linking call is wrapped in BEGIN...EXCEPTION to ensure Lead creation NEVER fails due to linking errors.**

```sql
-- ============================================================================
-- UPDATE handle_new_lead_to_crm TO CALL LINKING FUNCTION WITH DEFENSIVE WRAPPER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_lead_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_wm_lead_id uuid;
  validated_session_id uuid;
  session_exists boolean;
  v_linked_analyses INTEGER;
BEGIN
  -- Check if wm_lead already exists for this email
  SELECT id INTO existing_wm_lead_id
  FROM public.wm_leads
  WHERE email = NEW.email
  LIMIT 1;

  -- Validate session ID format AND verify it exists in wm_sessions
  IF NEW.client_id IS NOT NULL AND NEW.client_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.wm_sessions WHERE id = NEW.client_id::uuid
    ) INTO session_exists;
    
    IF session_exists THEN
      validated_session_id := NEW.client_id::uuid;
    ELSE
      validated_session_id := NULL;
    END IF;
  ELSE
    validated_session_id := NULL;
  END IF;

  IF existing_wm_lead_id IS NOT NULL THEN
    -- Update existing wm_lead with latest data
    UPDATE public.wm_leads
    SET 
      first_name = COALESCE(NEW.first_name, first_name),
      last_name = COALESCE(NEW.last_name, last_name),
      phone = COALESCE(NEW.phone, phone),
      city = COALESCE(NEW.city, city),
      state = COALESCE(NEW.state, state),
      zip = COALESCE(NEW.zip, zip),
      gclid = COALESCE(NEW.gclid, gclid),
      fbclid = COALESCE(NEW.fbc, fbclid),
      utm_source = COALESCE(NEW.utm_source, utm_source),
      utm_medium = COALESCE(NEW.utm_medium, utm_medium),
      utm_campaign = COALESCE(NEW.utm_campaign, utm_campaign),
      utm_content = COALESCE(NEW.utm_content, utm_content),
      utm_term = COALESCE(NEW.utm_term, utm_term),
      last_non_direct_utm_source = COALESCE(NEW.last_non_direct_utm_source, last_non_direct_utm_source),
      last_non_direct_utm_medium = COALESCE(NEW.last_non_direct_utm_medium, last_non_direct_utm_medium),
      last_non_direct_gclid = COALESCE(NEW.last_non_direct_gclid, last_non_direct_gclid),
      last_non_direct_fbclid = COALESCE(NEW.last_non_direct_fbclid, last_non_direct_fbclid),
      last_non_direct_channel = COALESCE(NEW.last_non_direct_channel, last_non_direct_channel),
      last_non_direct_landing_page = COALESCE(NEW.last_non_direct_landing_page, last_non_direct_landing_page),
      lead_id = COALESCE(lead_id, NEW.id),
      original_client_id = COALESCE(original_client_id, NEW.client_id),
      updated_at = now()
    WHERE id = existing_wm_lead_id;
  ELSE
    -- Insert new wm_lead
    INSERT INTO public.wm_leads (
      lead_id, email, first_name, last_name, phone, city, state, zip,
      original_source_tool, original_session_id, original_client_id,
      gclid, fbclid, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      last_non_direct_utm_source, last_non_direct_utm_medium,
      last_non_direct_gclid, last_non_direct_fbclid,
      last_non_direct_channel, last_non_direct_landing_page,
      landing_page, captured_at, status
    ) VALUES (
      NEW.id, NEW.email, NEW.first_name, NEW.last_name, NEW.phone,
      NEW.city, NEW.state, NEW.zip, NEW.source_tool, validated_session_id,
      NEW.client_id, NEW.gclid, NEW.fbc, NEW.utm_source, NEW.utm_medium,
      NEW.utm_campaign, NEW.utm_content, NEW.utm_term,
      NEW.last_non_direct_utm_source, NEW.last_non_direct_utm_medium,
      NEW.last_non_direct_gclid, NEW.last_non_direct_fbclid,
      NEW.last_non_direct_channel, NEW.last_non_direct_landing_page,
      NEW.source_page, now(), 'new'::lead_status
    );
  END IF;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- RETROACTIVE LINKING OF QUOTE ANALYSES (DEFENSIVE WRAPPER)
  -- 
  -- CRITICAL: Wrapped in BEGIN...EXCEPTION to ensure Lead creation NEVER fails
  -- due to linking errors. The Lead is the priority.
  -- ═══════════════════════════════════════════════════════════════════════════
  IF validated_session_id IS NOT NULL THEN
    BEGIN
      v_linked_analyses := public.link_quote_analyses_to_lead(NEW.id, validated_session_id);
      IF v_linked_analyses > 0 THEN
        RAISE LOG '[handle_new_lead_to_crm] SUCCESS: Linked % quote_analyses to lead %', 
          v_linked_analyses, NEW.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but DO NOT block lead creation
      RAISE LOG '[handle_new_lead_to_crm] WARNING: Failed to link quote_analyses for lead %. Error: %. Lead creation continues.', 
        NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;
```

---

## Part 4: RLS Policies

```sql
-- ============================================================================
-- RLS POLICIES FOR quote_analyses
-- ============================================================================

ALTER TABLE public.quote_analyses ENABLE ROW LEVEL SECURITY;

-- Allow INSERT from anyone (users can save before signing up)
DROP POLICY IF EXISTS "anon_insert_quote_analyses" ON public.quote_analyses;
CREATE POLICY "anon_insert_quote_analyses"
ON public.quote_analyses FOR INSERT
WITH CHECK (true);

-- Allow SELECT for service role, admins, or user's own lead's analyses
DROP POLICY IF EXISTS "select_own_quote_analyses" ON public.quote_analyses;
CREATE POLICY "select_own_quote_analyses"
ON public.quote_analyses FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR lead_id IN (
    SELECT id FROM public.leads WHERE user_id = auth.uid()
  )
);

-- Service role only for UPDATE (for lead linking via trigger)
DROP POLICY IF EXISTS "service_update_quote_analyses" ON public.quote_analyses;
CREATE POLICY "service_update_quote_analyses"
ON public.quote_analyses FOR UPDATE
USING (auth.role() = 'service_role');

-- No public DELETE
DROP POLICY IF EXISTS "service_delete_quote_analyses" ON public.quote_analyses;
CREATE POLICY "service_delete_quote_analyses"
ON public.quote_analyses FOR DELETE
USING (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES FOR quote_feedback
-- ============================================================================

ALTER TABLE public.quote_feedback ENABLE ROW LEVEL SECURITY;

-- Allow INSERT from anyone (we want feedback!)
DROP POLICY IF EXISTS "anon_insert_quote_feedback" ON public.quote_feedback;
CREATE POLICY "anon_insert_quote_feedback"
ON public.quote_feedback FOR INSERT
WITH CHECK (true);

-- SELECT only for admins (for quality review)
DROP POLICY IF EXISTS "admin_select_quote_feedback" ON public.quote_feedback;
CREATE POLICY "admin_select_quote_feedback"
ON public.quote_feedback FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

---

## Part 5: Global Search Index Trigger

```sql
-- ============================================================================
-- GLOBAL SEARCH INDEX TRIGGER FOR ADMIN SEARCH
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_index_quote_analyses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_subtitle text;
  v_keywords text;
  v_payload jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.delete_search_index('quote_analysis', OLD.id);
    RETURN OLD;
  END IF;
  
  -- Build title
  v_title := 'Quote Analysis: Score ' || NEW.overall_score || '/100';
  
  -- Build subtitle
  v_subtitle := COALESCE(NEW.price_per_opening, 'Price not extracted') || 
                ' | ' || COALESCE(NEW.warnings_count, 0) || ' warnings';
  
  -- Build keywords
  v_keywords := LOWER(
    COALESCE(NEW.session_id, '') || ' ' ||
    COALESCE(NEW.lead_id::text, '') || ' ' ||
    COALESCE(NEW.id::text, '') || ' ' ||
    COALESCE(NEW.image_hash, '') || ' ' ||
    COALESCE(NEW.analysis_json->>'summary', '') || ' ' ||
    COALESCE(NEW.analysis_json->'extractedIdentity'->>'contractorName', '')
  );
  
  -- Build payload
  v_payload := jsonb_build_object(
    'overall_score', NEW.overall_score,
    'price_per_opening', NEW.price_per_opening,
    'warnings_count', NEW.warnings_count,
    'created_at', NEW.created_at
  );
  
  PERFORM public.upsert_search_index(
    'quote_analysis', NEW.id, NEW.lead_id, 
    v_title, v_subtitle, v_keywords, v_payload
  );
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_index_quote_analyses ON public.quote_analyses;
CREATE TRIGGER trg_index_quote_analyses
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_index_quote_analyses();
```

---

## Part 6: Edge Function Changes (`quote-scanner/index.ts`)

### Add Deduplication Check (at start of analyze mode, ~line 128)

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// DEDUPLICATION CHECK - Before calling AI
// ═══════════════════════════════════════════════════════════════════════════

// Compute SHA-256 hash of image for deduplication
const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
const hashBuffer = await crypto.subtle.digest('SHA-256', imageBuffer);
const imageHash = Array.from(new Uint8Array(hashBuffer))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// Initialize Supabase client for DB operations
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Check for cached analysis (deduplication)
const { data: cachedAnalysis } = await supabaseClient
  .from('quote_analyses')
  .select('analysis_json, created_at, id')
  .eq('image_hash', imageHash)
  .maybeSingle();

if (cachedAnalysis) {
  console.log(`[QuoteScanner] CACHE HIT - hash=${imageHash.substring(0, 12)}... id=${cachedAnalysis.id}`);
  
  // Update lead_id if we now have one and cached record doesn't
  if (leadId) {
    await supabaseClient
      .from('quote_analyses')
      .update({ lead_id: leadId, updated_at: new Date().toISOString() })
      .eq('id', cachedAnalysis.id)
      .is('lead_id', null);
  }
  
  return new Response(JSON.stringify(cachedAnalysis.analysis_json), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const startTime = Date.now(); // For processing_time_ms tracking
```

### Persist Analysis After AI Call (~line 420, before return)

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// PERSIST ANALYSIS TO DATABASE
// ═══════════════════════════════════════════════════════════════════════════

const analysisRecord = {
  session_id: sessionId || `anon-${Date.now()}`,
  lead_id: leadId || null,
  quote_file_id: null, // Files not currently persisted to storage
  image_hash: imageHash,
  overall_score: scored.overallScore,
  safety_score: scored.safetyScore,
  scope_score: scored.scopeScore,
  price_score: scored.priceScore,
  fine_print_score: scored.finePrintScore,
  warranty_score: scored.warrantyScore,
  price_per_opening: scored.pricePerOpening,
  warnings_count: scored.warnings.length,
  missing_items_count: scored.missingItems.length,
  analysis_json: responsePayload,
  ai_model_version: Deno.env.get('AI_MODEL_VERSION') || 'gemini-3-flash-preview',
  processing_time_ms: Date.now() - startTime,
};

const { data: insertedAnalysis, error: insertError } = await supabaseClient
  .from('quote_analyses')
  .insert(analysisRecord)
  .select('id')
  .single();

if (insertError) {
  console.error('[QuoteScanner] Failed to persist analysis (non-fatal):', insertError.message);
} else {
  console.log(`[QuoteScanner] Analysis persisted: id=${insertedAnalysis.id}, hash=${imageHash.substring(0, 12)}...`);
}
```

---

## Part 7: Frontend Hook - `useQuoteAnalyses.ts` (NEW FILE - REQUIRED)

Create a new hook to fetch quote analyses from the database.

**File: `src/hooks/useQuoteAnalyses.ts`**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData } from '@/hooks/useSessionData';

export interface QuoteAnalysis {
  id: string;
  created_at: string;
  overall_score: number;
  safety_score: number;
  scope_score: number;
  price_score: number;
  fine_print_score: number;
  warranty_score: number;
  price_per_opening: string | null;
  warnings_count: number;
  missing_items_count: number;
  analysis_json: Record<string, unknown>;
}

export function useQuoteAnalyses() {
  const [analyses, setAnalyses] = useState<QuoteAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { sessionId } = useSessionData();

  useEffect(() => {
    async function fetchAnalyses() {
      setIsLoading(true);
      setError(null);

      try {
        // If user is authenticated, fetch by lead_id
        // Otherwise, we can't fetch (RLS won't allow session-based SELECT for anon)
        if (!user) {
          setAnalyses([]);
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('quote_analyses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (fetchError) {
          console.error('[useQuoteAnalyses] Fetch error:', fetchError.message);
          setError(fetchError.message);
          setAnalyses([]);
        } else {
          setAnalyses(data || []);
        }
      } catch (err) {
        console.error('[useQuoteAnalyses] Unexpected error:', err);
        setError('Failed to load analyses');
        setAnalyses([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyses();
  }, [user, sessionId]);

  // Get the most recent analysis (for Vault card display)
  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;

  return {
    analyses,
    latestAnalysis,
    isLoading,
    error,
    hasAnalyses: analyses.length > 0,
  };
}
```

---

## Part 8: Vault Integration - `MyResultsSection.tsx` (REQUIRED)

**This is REQUIRED, not optional. The Quote Analysis card must appear in the Vault immediately.**

### Changes to `src/components/vault/MyResultsSection.tsx`:

1. Import the new hook and FileSearch icon
2. Add a "Quote Analysis" card that fetches from database
3. Fall back to localStorage data if database is empty (backward compatibility)

```typescript
// Add to imports
import { FileSearch } from 'lucide-react';
import { useQuoteAnalyses } from '@/hooks/useQuoteAnalyses';

// Add new card to resultCards array (after 'fast-win'):
{
  id: 'quote-analysis',
  name: 'Quote Analysis',
  path: ROUTES.QUOTE_SCANNER,
  icon: <FileSearch className="w-5 h-5" />,
  getValue: (data, dbAnalysis) => {
    // Prefer database value, fall back to localStorage
    const score = dbAnalysis?.overall_score ?? data.quoteAnalysisResult?.overallScore;
    return score !== undefined ? `${score}/100` : null;
  },
  getLabel: (data, dbAnalysis) => {
    const price = dbAnalysis?.price_per_opening ?? data.quoteAnalysisResult?.pricePerOpening;
    return price || 'AI Grade';
  },
  getStatus: (data, dbAnalysis) => {
    const score = dbAnalysis?.overall_score ?? data.quoteAnalysisResult?.overallScore ?? 0;
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'danger';
  }
}
```

### Full Updated Component:

```typescript
import { SessionData } from '@/hooks/useSessionData';
import { VaultSection } from './VaultSection';
import { BarChart3, Shield, Zap, Brain, TrendingDown, AlertTriangle, FileSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/navigation';
import { useQuoteAnalyses, QuoteAnalysis } from '@/hooks/useQuoteAnalyses';

interface MyResultsSectionProps {
  sessionData: SessionData;
}

interface ResultCard {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  getValue: (data: SessionData, dbAnalysis?: QuoteAnalysis | null) => string | null;
  getLabel: (data: SessionData, dbAnalysis?: QuoteAnalysis | null) => string;
  getStatus: (data: SessionData, dbAnalysis?: QuoteAnalysis | null) => 'success' | 'warning' | 'danger' | 'neutral';
}

const resultCards: ResultCard[] = [
  {
    id: 'reality-check',
    name: 'Reality Check',
    path: ROUTES.REALITY_CHECK,
    icon: <AlertTriangle className="w-5 h-5" />,
    getValue: (data) => data.realityCheckScore !== undefined ? `${data.realityCheckScore}%` : null,
    getLabel: () => 'Readiness Score',
    getStatus: (data) => {
      const score = data.realityCheckScore || 0;
      if (score >= 70) return 'success';
      if (score >= 40) return 'warning';
      return 'danger';
    }
  },
  {
    id: 'cost-calculator',
    name: 'Cost of Inaction',
    path: ROUTES.COST_CALCULATOR,
    icon: <TrendingDown className="w-5 h-5" />,
    getValue: (data) => data.costOfInactionTotal ? `$${data.costOfInactionTotal.toLocaleString()}` : null,
    getLabel: () => '5-Year Cost',
    getStatus: () => 'danger'
  },
  {
    id: 'vulnerability-test',
    name: 'Window IQ',
    path: ROUTES.VULNERABILITY_TEST,
    icon: <Brain className="w-5 h-5" />,
    getValue: (data) => data.quizScore !== undefined ? `${data.quizScore}%` : null,
    getLabel: (data) => data.quizVulnerability || 'Score',
    getStatus: (data) => {
      if (data.quizVulnerability === 'LOW') return 'success';
      if (data.quizVulnerability === 'MODERATE') return 'warning';
      return 'danger';
    }
  },
  {
    id: 'risk-diagnostic',
    name: 'Risk Diagnostic',
    path: ROUTES.RISK_DIAGNOSTIC,
    icon: <Shield className="w-5 h-5" />,
    getValue: (data) => data.overallProtectionScore !== undefined ? `${data.overallProtectionScore}%` : null,
    getLabel: () => 'Protection Score',
    getStatus: (data) => {
      const score = data.overallProtectionScore || 0;
      if (score >= 70) return 'success';
      if (score >= 40) return 'warning';
      return 'danger';
    }
  },
  {
    id: 'fast-win',
    name: 'Fast Win',
    path: ROUTES.FAST_WIN,
    icon: <Zap className="w-5 h-5" />,
    getValue: (data) => data.fastWinResult || null,
    getLabel: () => 'Recommendation',
    getStatus: () => 'neutral'
  },
  {
    id: 'quote-analysis',
    name: 'Quote Analysis',
    path: ROUTES.QUOTE_SCANNER,
    icon: <FileSearch className="w-5 h-5" />,
    getValue: (data, dbAnalysis) => {
      const score = dbAnalysis?.overall_score ?? data.quoteAnalysisResult?.overallScore;
      return score !== undefined ? `${score}/100` : null;
    },
    getLabel: (data, dbAnalysis) => {
      const price = dbAnalysis?.price_per_opening ?? data.quoteAnalysisResult?.pricePerOpening;
      return price || 'AI Grade';
    },
    getStatus: (data, dbAnalysis) => {
      const score = dbAnalysis?.overall_score ?? data.quoteAnalysisResult?.overallScore ?? 0;
      if (score >= 70) return 'success';
      if (score >= 40) return 'warning';
      return 'danger';
    }
  }
];

const statusColors = {
  success: 'border-green-500/50 bg-green-500/10',
  warning: 'border-yellow-500/50 bg-yellow-500/10',
  danger: 'border-red-500/50 bg-red-500/10',
  neutral: 'border-primary/50 bg-primary/10'
};

export function MyResultsSection({ sessionData }: MyResultsSectionProps) {
  // Fetch quote analyses from database
  const { latestAnalysis } = useQuoteAnalyses();

  // Filter cards that have values (pass dbAnalysis for quote-analysis card)
  const completedResults = resultCards.filter(card => {
    const dbAnalysis = card.id === 'quote-analysis' ? latestAnalysis : null;
    return card.getValue(sessionData, dbAnalysis) !== null;
  });
  
  const isEmpty = completedResults.length === 0;

  return (
    <VaultSection
      title="My Results"
      description="Your assessment scores and recommendations"
      icon={<BarChart3 className="w-5 h-5" />}
      isEmpty={isEmpty}
      emptyState={{
        message: "Complete an assessment tool to see your results here",
        ctaText: "Start Reality Check",
        ctaPath: ROUTES.REALITY_CHECK
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedResults.map((card) => {
          const dbAnalysis = card.id === 'quote-analysis' ? latestAnalysis : null;
          const value = card.getValue(sessionData, dbAnalysis);
          const label = card.getLabel(sessionData, dbAnalysis);
          const status = card.getStatus(sessionData, dbAnalysis);

          return (
            <Link
              key={card.id}
              to={card.path}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-[1.02]",
                statusColors[status]
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <span className="text-sm font-medium text-foreground">{card.name}</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Link>
          );
        })}
      </div>

      {completedResults.length > 0 && completedResults.length < resultCards.length && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          {resultCards.length - completedResults.length} more assessments available
        </p>
      )}
    </VaultSection>
  );
}
```

---

## Complete Data Flow

```text
1. User uploads quote (anonymous)
   |
2. Edge function computes SHA-256 hash
   |
3. Check quote_analyses for hash match
   |-- HIT: Return cached result (FREE, instant)
   |   '-- Optionally update lead_id if now available
   '-- MISS: Continue to AI call
   |
4. Call AI -> Score -> Build response
   |
5. Persist to quote_analyses with session_id
   |
6. Return response to frontend
   |
7. [Later] User signs up -> lead created
   |
8. handle_new_lead_to_crm() triggers
   |
9. link_quote_analyses_to_lead() called (DEFENSIVE)
   |-- SUCCESS: Updates lead_id on matching records
   '-- FAILURE: Logs error, Lead creation continues
   |
10. quote_analyses.lead_id updated
    |
11. User opens Vault -> Sees "Quote Analysis" card!
```

---

## Files Summary

### Database Migration (Single SQL Migration)

| Object | Type |
|--------|------|
| `quote_analyses` table + indexes + trigger | New |
| `quote_feedback` table + indexes | New |
| `link_quote_analyses_to_lead()` function | New |
| `trigger_index_quote_analyses()` function | New |
| `handle_new_lead_to_crm()` function | Modified (defensive wrapper) |
| RLS policies | New |

### Code Files

| File | Action |
|------|--------|
| `supabase/functions/quote-scanner/index.ts` | Modify (hash check + persist) |
| `src/hooks/useQuoteAnalyses.ts` | **Create (NEW)** |
| `src/components/vault/MyResultsSection.tsx` | **Modify (add Quote Analysis card)** |

---

## Business Impact Summary

| Capability | Before | After |
|------------|--------|-------|
| Results persist across devices | No | Yes (via Vault) |
| Same-file reanalysis cost | Full price each time | **Free (cached by hash)** |
| Query "avg price in Miami" | Impossible | SQL query on analysis_json |
| User feedback on accuracy | None | quote_feedback table |
| Vault shows quote analysis | No | **Yes (Quote Analysis card)** |
| Admin can search analyses | No | Via global search index |
| Anonymous -> Signed up continuity | Lost | **Automatic retroactive linking** |
| Lead creation blocked by linking error | N/A | **Never (defensive wrapper)** |

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Migration failure | Very Low | All `IF NOT EXISTS`, idempotent |
| Trigger blocks lead creation | **None** | Defensive BEGIN...EXCEPTION |
| Hash collision | Extremely Low | SHA-256 has ~10^77 possible values |
| Breaking existing Vault | None | Backward compatible with localStorage |
| Rollback complexity | Very Low | `DROP TABLE` restores previous state |

