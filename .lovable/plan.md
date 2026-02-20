
# Forward-Compatible AI Pre-Analysis: Database Pivot + Sales Intel HUD

## Summary

Move the `ai_pre_analysis` column from `leads` to `quote_files` (forward-compatible for multi-quote). Update the `analyze-consultation-quote` edge function to write to `quote_files` instead of `leads`. Update `admin-lead-detail` to return the most recent file's analysis. Build the Sales Intel HUD component with auto-polling and dark mode support.

---

## Phase 1: Database Migration

**Two operations in one migration:**

1. **Add** `ai_pre_analysis JSONB DEFAULT '{"status": "none"}'` to `quote_files`
2. **Drop** `ai_pre_analysis` from `leads` (data check: column was just added, no production data at risk)

This makes each quote file carry its own AI analysis, enabling future multi-quote UX without migration.

---

## Phase 2: Edge Function -- `analyze-consultation-quote/index.ts`

Update all DB reads/writes from `leads` to `quote_files`:

- **Idempotency check** (line 56-77): Query `quote_files.ai_pre_analysis` where `id = quoteFileId` instead of `leads` where `id = leadId`
- **Set pending** (line 89-97): Update `quote_files` where `id = quoteFileId`
- **Write completed** (line 277-287): Update `quote_files` where `id = quoteFileId`
- **Write failed** (line 295-304): Update `quote_files` where `id = quoteFileId`

The `leadId` parameter is still accepted (for logging) but no longer used for DB writes. The `quoteFileId` becomes the primary key for all operations.

---

## Phase 3: Edge Function -- `admin-lead-detail/index.ts`

In the GET handler, after the existing `quote_files` query (line 160-172), extract `aiPreAnalysis` from the most recently created file that has a non-"none" status:

```typescript
// Extract AI pre-analysis from the most recent analyzed quote file
let aiPreAnalysis = null;
if (files && files.length > 0) {
  const analyzed = files.find(
    (f: any) => f.ai_pre_analysis && f.ai_pre_analysis.status !== 'none'
  );
  if (analyzed) {
    aiPreAnalysis = analyzed.ai_pre_analysis;
  }
}
```

The `files` query already fetches `*` from `quote_files` ordered by `created_at DESC`, so the first match is always the most recent. Include `aiPreAnalysis` in the response JSON (line 268-294).

---

## Phase 4: Frontend Hook -- `useLeadDetail.ts`

### New Types

```typescript
export interface AiPreAnalysisResult {
  estimated_total_price: number | null;
  window_brand_or_material: string;
  detected_markup_level: 'High' | 'Average' | 'Low' | 'Unknown';
  red_flags: string[];
  sales_angle: string;
}

export interface AiPreAnalysis {
  status: 'none' | 'pending' | 'completed' | 'failed';
  result: AiPreAnalysisResult | null;
  reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  model: string | null;
}
```

### New State + Polling

- Add `const [aiPreAnalysis, setAiPreAnalysis] = useState<AiPreAnalysis | null>(null);`
- Set from `data.aiPreAnalysis` in `fetchData`
- Add to return object and interface

**Polling with safe deps** (fixes infinite loop bug):

```typescript
useEffect(() => {
  if (aiPreAnalysis?.status !== 'pending') return;
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [aiPreAnalysis?.status]);
```

`fetchData` is intentionally omitted from the dependency array. It is stable by reference (memoized with `useCallback` keyed on `leadId` and `toast`), but listing it would cause the interval to reset on every fetch cycle. The `eslint-disable` comment documents this intentional omission.

### Deduplicate Return Interface

The file currently has two `UseLeadDetailReturn` interfaces (lines 108-125 and 127-142). Merge them into one that includes `aiPreAnalysis` and `canonical`.

---

## Phase 5: New Component -- `SalesIntelCard.tsx`

**File:** `src/components/lead-detail/SalesIntelCard.tsx`

### Status: `none` -- Return `null`

### Status: `pending`
- Card with `animate-pulse` border accent
- `Loader2` spinner + "Analyzing competitor quote..." text
- Compact, single-line height

### Status: `failed`
- Muted card with `AlertTriangle` icon
- Shows `reason` text
- Non-intrusive

### Status: `completed` -- The Tactical HUD

**Header:** "Competitor Quote Intel" with `Crosshair` icon

**3-column metrics grid:**
- Estimated Price: `$X,XXX` formatted or "Not detected"
- Brand/Material: string value
- Markup Level: color-coded Badge:
  - High: `variant="destructive"` (red)
  - Average: `bg-amber-500/15 text-amber-600 dark:text-amber-400`
  - Low: `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`
  - Unknown: `variant="secondary"`

**Red Flags:** Pills with `AlertTriangle` icon, `bg-destructive/10 text-destructive`. Empty state: green "No red flags" pill.

**Sales Angle callout** (dark mode safe):
- Container: `bg-blue-500/10 border border-blue-500/20 rounded-lg p-4`
- Label: `text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-semibold` -- "What to say on the call"
- Body: `text-sm text-blue-900 dark:text-blue-100`

**Footer:** `text-xs text-muted-foreground` with model + timestamp

---

## Phase 6: Lead Detail Page -- Placement

**File:** `src/pages/admin/LeadDetail.tsx`

Place `SalesIntelCard` as a full-width banner above the 3-pane grid:

```tsx
<main className="max-w-7xl mx-auto p-4 lg:p-6">
  <SalesIntelCard aiPreAnalysis={aiPreAnalysis} />
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* existing 3 panes */}
  </div>
</main>
```

Destructure `aiPreAnalysis` from `useLeadDetail(id)` on line 26.

---

## Files Modified

1. **Database migration** -- Add `ai_pre_analysis` to `quote_files`, drop from `leads`
2. **`supabase/functions/analyze-consultation-quote/index.ts`** -- All DB ops target `quote_files` by `quoteFileId`
3. **`supabase/functions/admin-lead-detail/index.ts`** -- Extract `aiPreAnalysis` from files array, include in response
4. **`src/hooks/useLeadDetail.ts`** -- Add types, state, polling (safe deps), merge duplicate interface
5. **`src/components/lead-detail/SalesIntelCard.tsx`** -- New component
6. **`src/pages/admin/LeadDetail.tsx`** -- Import + place SalesIntelCard above grid

No new edge functions. No new storage buckets. No new dependencies.
