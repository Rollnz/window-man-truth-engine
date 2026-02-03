
# Implementation Plan: Command Center Dashboard Enhancements

## Overview
Extend the Call Agents Command Center with 24-hour stats, search/filter capabilities, and per-agent activity badges.

---

## Build 1: Extend GET Handler with 24H Stats

### File: `supabase/functions/admin-update-call-agent/index.ts`

**Location:** After existing 30-day queries (lines 122-158), before enrichment (line 161)

**Add Query C: 24-Hour Stats**
```typescript
const twentyFourHoursAgo = new Date(
  Date.now() - 24 * 60 * 60 * 1000
).toISOString();

const { data: calls24h } = await supabaseAdmin
  .from("pending_calls")
  .select("source_tool, status")
  .gte("triggered_at", twentyFourHoursAgo);
```

**Aggregate Stats:**
```typescript
const agentStats24h: Record<string, { total: number; errors: number }> = {};
const safeCall24h = calls24h || [];
for (const call of safeCall24h) {
  if (!agentStats24h[call.source_tool]) {
    agentStats24h[call.source_tool] = { total: 0, errors: 0 };
  }
  agentStats24h[call.source_tool].total++;
  if (call.status === "dead_letter") {
    agentStats24h[call.source_tool].errors++;
  }
}

const totalCalls24h = safeCall24h.length;
const totalErrors24h = safeCall24h.filter(c => c.status === "dead_letter").length;
```

**Update Enrichment (line 161):**
```typescript
const enrichedAgents = (agents || []).map(agent => ({
  ...agent,
  last_dispatch_at: lastDispatchMap[agent.source_tool] || null,
  last_error: lastErrorMap[agent.source_tool] || null,
  calls_24h: agentStats24h[agent.source_tool]?.total || 0,
  errors_24h: agentStats24h[agent.source_tool]?.errors || 0,
}));
```

**Update Response (line 167-168):**
```typescript
return json(200, {
  agents: enrichedAgents,
  summary: {
    total_calls_24h: totalCalls24h,
    errors_24h: totalErrors24h,
    active_agents: (agents || []).filter(a => a.enabled).length,
    success_rate: totalCalls24h > 0
      ? Math.round(((totalCalls24h - totalErrors24h) / totalCalls24h) * 100)
      : null,
  },
});
```

**Update ListAgentsResponse Interface (around line 47):**
```typescript
interface ListAgentsResponse {
  agents: Array<{
    source_tool: string;
    agent_id: string;
    agent_name: string;
    enabled: boolean;
    first_message_template: string;
    updated_at: string;
    last_dispatch_at: string | null;
    last_error: { message: string; triggered_at: string } | null;
    calls_24h: number;
    errors_24h: number;
  }>;
  summary: {
    total_calls_24h: number;
    errors_24h: number;
    active_agents: number;
    success_rate: number | null;
  };
}
```

---

## Build 2: Update Hook

### File: `src/hooks/useCallAgents.ts`

**Add AgentSummary Interface (after CallAgent):**
```typescript
export interface AgentSummary {
  total_calls_24h: number;
  errors_24h: number;
  active_agents: number;
  success_rate: number | null;
}
```

**Update CallAgent Interface (add two fields):**
```typescript
export interface CallAgent {
  // ... existing fields ...
  calls_24h: number;
  errors_24h: number;
}
```

**Add Summary State (after agents state):**
```typescript
const [summary, setSummary] = useState<AgentSummary>({
  total_calls_24h: 0,
  errors_24h: 0,
  active_agents: 0,
  success_rate: null,
});
```

**Update Fetch Parsing (line 66-67):**
```typescript
const data = await response.json();
setAgents(data.agents || []);
setSummary(data.summary || {
  total_calls_24h: 0,
  errors_24h: 0,
  active_agents: 0,
  success_rate: null,
});
```

**Update Return Object:**
```typescript
return {
  agents,
  loading,
  error,
  refetch: fetchAgents,
  summary,  // NEW
  testCall,
  toggleEnabled,
  updateAgentId,
  updateTemplate,
  updateAgentName,
  killSwitch,
};
```

**Update UseCallAgentsReturn Interface:**
```typescript
interface UseCallAgentsReturn {
  // ... existing ...
  summary: AgentSummary;
}
```

---

## Build 3: StatsCards Component

### File: `src/components/admin/StatsCards.tsx` (NEW)

**Props:**
```typescript
interface StatsCardsProps {
  summary: AgentSummary;
  totalAgents: number;
}
```

**Layout:** `grid grid-cols-2 md:grid-cols-4 gap-4`

**Card 1: Active Agents**
- Border: `border-l-4 border-blue-500`
- Label: "Active Agents"
- Value: `{summary.active_agents} / {totalAgents}`

**Card 2: Calls Today**
- Border: `border-l-4 border-purple-500`
- Label: "Calls Today"
- Value: `{summary.total_calls_24h}`
- Sub-text: "in the last 24 hours"

**Card 3: Errors Today**
- Border: Dynamic (`border-green-500` if 0, `border-red-500` if > 0)
- Label: "Errors Today"
- Value: `{summary.errors_24h}` with color (green if 0, red if > 0)
- Sub-text: "All clear" (green) or "Check agent cards" (red)

**Card 4: Success Rate**
- Border: Dynamic (gray if null, green ≥80, yellow ≥50, red <50)
- Label: "Success Rate"
- Value: `—` if null, `{n}%` if number
- Sub-text: "No calls yet today" if null, "calls completed successfully" if number

---

## Build 4: SearchFilterBar Component

### File: `src/components/admin/SearchFilterBar.tsx` (NEW)

**Props:**
```typescript
type ShowMode = "all" | "enabled" | "disabled";

interface SearchFilterBarProps {
  onFilterChange: (filters: { query: string; showMode: ShowMode }) => void;
}
```

**Internal State:**
- `query: string` (default: "")
- `showMode: ShowMode` (default: "all")

**Layout:** Single row, space-between

**Left: Search Input**
- Search icon inside input (left)
- Placeholder: "Search agents..."
- Width: `w-64` or `max-w-xs`
- Updates on every keystroke, calls `onFilterChange`

**Right: Toggle Group (3 buttons)**
- "All" | "Active" | "Disabled"
- Selected styles:
  - All: `bg-blue-500 text-white`
  - Active: `bg-green-500 text-white`
  - Disabled: `bg-gray-500 text-white`
- Unselected: `bg-gray-100 text-gray-600`
- Pill shape: `rounded-l-md`, `rounded-none`, `rounded-r-md`

---

## Build 5: Per-Agent Activity Badge + Page Assembly

### 5A: Activity Badge
**File:** `src/components/admin/CallAgentTable.tsx`

**Location:** Top-right of card header, same row as source tool label

**Badge Logic:**
- `calls_24h > 0`: Green badge (`bg-green-500/20 text-green-600`) - "{n} calls today"
- `calls_24h === 0`: Gray badge (`bg-gray-500/10 text-gray-500`) - "No calls today"

### 5B: Page Layout Assembly
**File:** `src/pages/admin/CallAgentsConfig.tsx`

**Add Imports:**
```typescript
import { StatsCards } from '@/components/admin/StatsCards';
import { SearchFilterBar, ShowMode } from '@/components/admin/SearchFilterBar';
import { SOURCE_TOOL_LABELS } from '@/constants/sourceToolLabels';
```

**Destructure from Hook:**
```typescript
const { agents, summary, loading, error, refetch, ... } = useCallAgents();
```

**Add Filter State:**
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [showMode, setShowMode] = useState<ShowMode>("all");
```

**Compute Filtered Agents (useMemo):**
```typescript
const filteredAgents = useMemo(() => {
  return agents.filter(agent => {
    // Show mode filter
    if (showMode === "enabled" && !agent.enabled) return false;
    if (showMode === "disabled" && agent.enabled) return false;

    // Search filter
    if (searchQuery.trim() === "") return true;
    const q = searchQuery.trim().toLowerCase();
    const nameMatch = agent.agent_name.toLowerCase().includes(q);
    const labelMatch = (SOURCE_TOOL_LABELS[agent.source_tool] || "").toLowerCase().includes(q);
    return nameMatch || labelMatch;
  });
}, [agents, searchQuery, showMode]);
```

**Page Render Order:**
1. Header (unchanged - uses full `agents` array for enabledCount)
2. `<StatsCards summary={summary} totalAgents={agents.length} />`
3. `<SearchFilterBar onFilterChange={...} />`
4. `<CallAgentTable agents={filteredAgents} ... />`

---

## Files Modified/Created

| File | Action |
|------|--------|
| `supabase/functions/admin-update-call-agent/index.ts` | MODIFY (GET handler + interface) |
| `src/hooks/useCallAgents.ts` | MODIFY (interface + summary state) |
| `src/components/admin/StatsCards.tsx` | CREATE |
| `src/components/admin/SearchFilterBar.tsx` | CREATE |
| `src/components/admin/CallAgentTable.tsx` | MODIFY (activity badge) |
| `src/pages/admin/CallAgentsConfig.tsx` | MODIFY (layout assembly) |

---

## Technical Constraints Verified

1. TestCallDialog, AgentIdEditor, AgentNameEditor, TemplateEditor, KillSwitchDialog: NOT modified
2. Response shape change is critical - hook must parse `data.agents` and `data.summary` correctly
3. `success_rate: null` renders as "—" (en-dash), NOT "0%" or "N/A"
4. Stats cards and kill switch use FULL `agents` array, filtering only affects CallAgentTable
5. Search matches `agent_name` and `SOURCE_TOOL_LABELS[source_tool]` only
6. Activity badge reads from `agent.calls_24h` (enriched by GET)
7. StatsCards is purely presentational - no internal state or fetching
8. 24h window computed server-side only
9. Default filter state: empty query, showMode "all"
10. useMemo dependencies: `[agents, searchQuery, showMode]`
