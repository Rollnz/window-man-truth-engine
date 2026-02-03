

# Implementation Plan: Command Center Enhancements

## Overview
Extend the Call Agents Command Center with dispatch monitoring, kill switch functionality, and improved UX (copy icons, deep links, relative timestamps).

---

## Build 1: Two Utility Files

### File: `src/utils/relativeTime.ts` (NEW)
```typescript
export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "Never";
  const seconds = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 1000
  );
  if (seconds < 0) return "Just now";
  if (seconds < 60) return "Just now";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return m + " minute" + (m > 1 ? "s" : "") + " ago";
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return h + " hour" + (h > 1 ? "s" : "") + " ago";
  }
  const d = Math.floor(seconds / 86400);
  return d + " day" + (d > 1 ? "s" : "") + " ago";
}
```

### File: `src/utils/clipboard.ts` (NEW)
- Uses `navigator.clipboard.writeText()` with fallback for non-HTTPS environments
- Fallback creates hidden textarea, uses `execCommand('copy')`

---

## Build 2: Extend GET Handler with Dispatch Data

### File: `supabase/functions/admin-update-call-agent/index.ts`

**After existing `call_agents` query (line 107-118), add two additional queries:**

### Query A: Last Dispatch Per Agent
```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const { data: recentCalls } = await supabaseAdmin
  .from("pending_calls")
  .select("source_tool, triggered_at")
  .gte("triggered_at", thirtyDaysAgo)
  .order("triggered_at", { ascending: false })
  .limit(200);
```

**Process in TypeScript:** Build `lastDispatchMap` - first hit per source_tool is most recent.

### Query B: Last Dead Letter Error Per Agent
```typescript
const { data: deadLetters } = await supabaseAdmin
  .from("pending_calls")
  .select("source_tool, triggered_at, last_error")
  .eq("status", "dead_letter")
  .gte("triggered_at", thirtyDaysAgo)
  .order("triggered_at", { ascending: false })
  .limit(50);
```

**Process in TypeScript:** Build `lastErrorMap` with `{ message, triggered_at }`.

### Merge Into Response
```typescript
const enrichedAgents = agents.map(agent => ({
  ...agent,
  last_dispatch_at: lastDispatchMap[agent.source_tool] || null,
  last_error: lastErrorMap[agent.source_tool] || null,
}));
```

**Update `ListAgentsResponse` interface** to include new fields.

---

## Build 3: Extend PATCH Handler with Kill Switch

### File: `supabase/functions/admin-update-call-agent/index.ts`

**Add at TOP of PATCH handler (after JSON parsing, before source_tool validation):**

```typescript
if (body.kill_switch === true) {
  // Early return - separate code path from toggle
  const { data, error: updateErr } = await supabaseAdmin
    .from("call_agents")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("enabled", true)
    .select("source_tool");

  if (updateErr) return json(500, { error: updateErr.message });

  console.log("[admin-update-call-agent] Kill switch activated", {
    disabled_count: data.length,
    requested_by: email,
  });

  return json(200, {
    success: true,
    kill_switch: true,
    disabled_count: data.length,
  });
}
// ... existing toggle logic unchanged below
```

---

## Build 4: Update Hook

### File: `src/hooks/useCallAgents.ts`

### 4a. Update CallAgent Interface
```typescript
export interface CallAgent {
  source_tool: string;
  agent_id: string;
  agent_name: string;
  enabled: boolean;
  first_message_template: string;
  updated_at: string;
  webhook_url?: string;
  last_dispatch_at: string | null;      // NEW
  last_error: { message: string; triggered_at: string } | null;  // NEW
}
```

### 4b. Add killSwitch Function
**Signature:** `() => Promise<{ disabled_count: number }>`

**Logic (server-first, NOT optimistic):**
1. PATCH to admin-update-call-agent with `{ kill_switch: true }`
2. On success: Set all agents' `enabled = false` in local state, call `refetch()`, return `{ disabled_count }`
3. On failure: Throw error (no local state change)

### 4c. Update Return Type
Add `killSwitch` to hook return object.

---

## Build 5: Kill Switch Dialog

### File: `src/components/admin/KillSwitchDialog.tsx` (NEW)

**Props:**
```typescript
interface KillSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ disabled_count: number }>;
  enabledAgentCount: number;
}
```

**States:** `IDLE | LOADING | SUCCESS | ERROR`

### IDLE State
- Header: "System Kill Switch" (red text)
- Warning: "This will disable all {n} active agent(s). Zero calls will dispatch until each agent is re-enabled individually."
- Input: Label "Type DISABLE to confirm", validates exact match (case-sensitive)
- Buttons: "Confirm — Disable All Agents" (red, disabled until input === "DISABLE"), "Cancel"

### LOADING State
- Input disabled, Confirm shows spinner + "Disabling...", Cancel hidden

### SUCCESS State
- Green checkmark, "{n} agent(s) disabled", "Close" button

### ERROR State
- Red banner with error, input re-enabled, Confirm clickable (retry), Cancel visible

**Toast:** Success uses destructive variant (high-impact action emphasis)

---

## Build 6: Card Updates

### 6a. Replace Last Updated with Last Dispatch
**File:** `src/components/admin/CallAgentTable.tsx`

- Remove "Last Updated: {agent.updated_at}"
- Replace with: "Last Dispatch: {formatRelativeTime(agent.last_dispatch_at)}"
- When null: Display "Never" as muted gray badge
- When non-null: Plain text (e.g., "2 hours ago")

### 6b. Error Indicator (Collapsible)
**File:** `src/components/admin/CallAgentTable.tsx`

- Condition: Only renders when `agent.last_error !== null`
- Collapsed (default): Red TriangleAlert icon + "Last Error" text (clickable)
- Expanded: Red-tinted box with error message + relative timestamp
- Uses Collapsible pattern from @radix-ui

### 6c. Copy Icons
**File:** `src/components/admin/AgentIdEditor.tsx`
- In VIEWING state, add Copy icon after pencil
- Click: `copyToClipboard(full agent_id)` → toast "Agent ID copied"

**File:** `src/components/admin/CallAgentTable.tsx`
- Add Copy icon next to Source Tool label
- Hover-only visibility: `opacity-0 group-hover:opacity-100 transition-opacity`
- Click: `copyToClipboard(agent.source_tool)` → toast "Source tool copied"

### 6d. PhoneCall.bot Deep Link
**File:** `src/components/admin/AgentIdEditor.tsx`

- In VIEWING state, add ExternalLink icon after copy icon
- **Render condition:** `AGENT_ID_REGEX.test(agent_id) && agent_id !== "PLACEHOLDER_AGENT_ID"`
- Link: `https://phonecall.bot/agents/{agent_id}` (target="_blank")
- Tooltip on hover: "View on PhoneCall.bot"

---

## Build 7: Wire Kill Switch Into Header

### File: `src/pages/admin/CallAgentsConfig.tsx`

**Compute:** `const enabledCount = agents.filter(a => a.enabled).length;`

**Kill Switch Button:**
- Render condition: `enabledCount > 0` (completely hidden when 0)
- Style: Red background, white text, Power icon
- Click: Opens KillSwitchDialog

**Add state:** `const [isKillSwitchOpen, setIsKillSwitchOpen] = useState(false);`

**Render dialog:**
```tsx
<KillSwitchDialog
  isOpen={isKillSwitchOpen}
  onClose={() => setIsKillSwitchOpen(false)}
  onConfirm={killSwitch}
  enabledAgentCount={enabledCount}
/>
```

---

## Updated Card Layout (Final Order)

```
1. Source Tool label + [copy icon, hover-only]
2. AgentNameEditor
3. Enabled toggle
4. AgentIdEditor VIEWING: masked ID + pencil + copy + deep link
5. First message preview (truncated 80 chars)
6. Edit Script / TemplateEditor (collapsible)
7. Last Dispatch — relative time or "Never" badge
8. Error indicator — conditional, collapsible, red (if last_error)
9. Test Call button
```

---

## Files Modified/Created

| File | Action |
|------|--------|
| `src/utils/relativeTime.ts` | CREATE |
| `src/utils/clipboard.ts` | CREATE |
| `supabase/functions/admin-update-call-agent/index.ts` | MODIFY (GET + PATCH) |
| `src/hooks/useCallAgents.ts` | MODIFY (interface + killSwitch) |
| `src/components/admin/KillSwitchDialog.tsx` | CREATE |
| `src/components/admin/AgentIdEditor.tsx` | MODIFY (copy + deep link) |
| `src/components/admin/CallAgentTable.tsx` | MODIFY (Last Dispatch, error indicator, copy icon) |
| `src/pages/admin/CallAgentsConfig.tsx` | MODIFY (kill switch button + dialog) |

---

## Schema Verification Complete

**pending_calls columns confirmed:**
- `triggered_at` (timestamp with time zone, nullable)
- `last_error` (text, nullable)
- `status` (enum including 'dead_letter')

---

## Technical Constraints Confirmed

1. AgentIdEditor, TemplateEditor, TestCallDialog, POST, PUT, existing PATCH toggle: NOT modified
2. relativeTime utility: exact implementation provided, no date libraries
3. clipboard utility: includes fallback for non-HTTPS
4. Kill switch: exact string "DISABLE" match, case-sensitive, no trimming
5. Source Tool copy: hover-only visibility via group-hover
6. Deep link: hard gate on valid agent_id pattern + not placeholder
7. Error indicator: completely absent when last_error is null
8. Kill switch button: removed from DOM when enabledCount === 0
9. pending_calls queries: scoped to 30 days
10. Kill switch success toast: uses destructive variant

