

# "With Quote" Badges + Filters for Lead Warehouse

## Overview

Add quote file indicators to the CRM Lead Warehouse so you can instantly see which leads uploaded a quote and which have been analyzed. Two filter toggles let you narrow the board to just those leads.

**No vault image confusion** -- since `quote_files` currently only contains quote uploads, all existing records are implicitly "quote" kind. A `file_kind` column is added now as a forward-compatible guardrail so future vault images never pollute this filter.

## What Changes

| # | File | Action |
|---|---|---|
| 1 | Database migration | Add `file_kind` column + expression index + RPC function |
| 2 | `supabase/functions/crm-leads/index.ts` | Call RPC, merge derived fields, support filter params |
| 3 | `src/types/crm.ts` | Add 3 optional fields to `CRMLead` |
| 4 | `src/hooks/useCRMLeads.ts` | Add filter state + pass query params |
| 5 | `src/components/crm/LeadCard.tsx` | Add "Q" badge pill |
| 6 | `src/pages/admin/CRMDashboard.tsx` | Add two filter toggles + empty state |

---

## Phase 0: Database Migration

### A. Add `file_kind` discriminator column

```sql
ALTER TABLE public.quote_files
ADD COLUMN IF NOT EXISTS file_kind text NOT NULL DEFAULT 'quote';
```

All existing rows get `'quote'` automatically. Future vault image inserts will use a different value.

### B. Add expression index for AI status filtering

```sql
CREATE INDEX IF NOT EXISTS quote_files_lead_id_ai_status_idx
ON public.quote_files(lead_id, ((ai_pre_analysis->>'status')))
WHERE deleted_at IS NULL;
```

The composite index `quote_files_lead_id_created_at_idx` already exists and covers the "latest file" query.

### C. Create `get_quote_indicators` RPC function

A single batch SQL function that accepts an array of lead IDs and returns derived fields. This avoids per-lead correlated subqueries.

```sql
CREATE OR REPLACE FUNCTION public.get_quote_indicators(p_lead_ids uuid[])
RETURNS TABLE(
  lead_id uuid,
  has_quote_file boolean,
  has_analyzed_quote boolean,
  latest_quote_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH scoped AS (
    SELECT *
    FROM public.quote_files
    WHERE lead_id = ANY(p_lead_ids)
      AND deleted_at IS NULL
      AND file_kind = 'quote'
  ),
  latest AS (
    SELECT DISTINCT ON (lead_id)
      lead_id,
      COALESCE(ai_pre_analysis->>'status', 'none') AS latest_quote_status
    FROM scoped
    ORDER BY lead_id, created_at DESC
  ),
  agg AS (
    SELECT
      lead_id,
      TRUE AS has_quote_file,
      BOOL_OR(COALESCE(ai_pre_analysis->>'status','none') = 'completed') AS has_analyzed_quote
    FROM scoped
    GROUP BY lead_id
  )
  SELECT
    agg.lead_id,
    agg.has_quote_file,
    agg.has_analyzed_quote,
    latest.latest_quote_status
  FROM agg
  LEFT JOIN latest USING (lead_id);
$$;
```

---

## Phase 1: Edge Function (`crm-leads/index.ts`)

In the GET handler, after fetching leads from `wm_leads`:

1. Collect all `lead_id` values from the returned leads (filtering out nulls).
2. Call `supabase.rpc('get_quote_indicators', { p_lead_ids: leadIds })`.
3. Build a lookup map from the RPC results.
4. Merge `has_quote_file`, `has_analyzed_quote`, and `latest_quote_status` into each lead object (defaulting to `false`/`null` for leads with no matches).
5. Parse new query params `has_quote` and `analyzed` (both `'true'`/`'false'` strings).
6. Post-filter the merged leads array if either param is set.
7. Recompute summary stats after filtering.

---

## Phase 2: Types (`src/types/crm.ts`)

Add to the `CRMLead` interface:

```typescript
// Quote file indicators (derived server-side from quote_files table)
has_quote_file?: boolean;
has_analyzed_quote?: boolean;
latest_quote_status?: 'none' | 'pending' | 'completed' | 'failed' | null;
```

---

## Phase 3: Hook (`src/hooks/useCRMLeads.ts`)

- Export `fetchLeads` to accept optional `hasQuote` and `analyzed` boolean parameters.
- When set, append `has_quote=true` or `analyzed=true` to the query string sent to the edge function.
- The `CRMDashboard` component will manage the toggle state and pass it through.

---

## Phase 4: Lead Card Badge (`src/components/crm/LeadCard.tsx`)

Add a compact "Q" pill badge next to the existing G/M attribution badges. Uses the same `TooltipProvider` pattern.

| Condition | Badge | Color | Tooltip |
|---|---|---|---|
| `has_quote_file = false` | Hidden | -- | -- |
| `has_quote_file = true`, status = `pending` | Q | Blue | "Analysis Pending" |
| `has_quote_file = true`, status = `failed` | Q | Red | "Analysis Failed" |
| `has_quote_file = true`, status = `none` | Q | Amber | "Quote Uploaded" |
| `has_analyzed_quote = true` | Q | Green | "Quote Analyzed" |

---

## Phase 5: Dashboard Filters (`src/pages/admin/CRMDashboard.tsx`)

Add two new toggles in the header bar, placed next to the existing "High-Touch Only" toggle:

1. **"With Quote"** toggle -- `FileText` icon, filters to `has_quote=true`
2. **"Analyzed"** toggle -- `Search` icon (or `ScanSearch`), filters to `analyzed=true`

Both use the same `Switch` + `Label` + `Badge` count pattern already used by "High-Touch Only".

The subtitle updates to show: `"42 leads (filtered from 180)"` when any filter is active.

**Empty state** when "With Quote" yields zero results: centered `FileText` icon + message "No leads with uploaded quotes found" + "Show All Leads" button.

---

## Performance

- The RPC runs a single batch query against `quote_files` using `ANY(array)` -- no N+1 queries.
- The existing `quote_files_lead_id_created_at_idx` covers the `DISTINCT ON ... ORDER BY lead_id, created_at DESC` pattern.
- The new expression index speeds up the `BOOL_OR(status = 'completed')` aggregation.
- Post-filtering happens in-memory on at most 500 leads -- negligible cost.

## Security

- No changes to admin gate logic. The existing `hasAdminRole` check remains.
- The RPC is `SECURITY DEFINER` but only returns boolean flags and a status string -- no raw quote file data is exposed.
- `file_kind` column prevents future vault images from appearing in quote indicators.

