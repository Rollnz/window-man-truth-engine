
# Phase 1: Call Agents Command Center - Scaffold Implementation

## Overview
Create a read-only admin page to display PhoneCall.bot voice agent configurations. This scaffold establishes the foundation for the full Call Agents Command Center without any mutation logic.

---

## Files to Create

### 1. SOURCE_TOOL_LABELS Constant
**File:** `src/constants/sourceToolLabels.ts`

Export a reusable constant map for friendly source tool names:
```typescript
export const SOURCE_TOOL_LABELS: Record<string, string> = {
  "quote-scanner": "Quote Scanner",
  "beat-your-quote": "Beat Your Quote",
  "consultation-booking": "Consultation Booking",
  "fair-price-quiz": "Fair Price Quiz",
  "sample-report": "Sample Report",
  "manual_dispatch": "Manual Dispatch",
};
```

---

### 2. Data Hook
**File:** `src/hooks/useCallAgents.ts`

- Fetch agents from `admin-update-call-agent` GET endpoint
- Return: `{ agents, loading, error, refetch }`
- Single fetch on mount via `useEffect([], [])`
- Manual `refetch()` function exposed

Expected agent shape:
```typescript
interface CallAgent {
  source_tool: string;
  agent_id: string;
  enabled: boolean;
  first_message_template: string;
  updated_at: string;
  webhook_url: string;
}
```

Note: The current edge function doesn't return `webhook_url` in its SELECT. The hook will handle this gracefully (optional field).

---

### 3. Agent Table Component  
**File:** `src/components/admin/CallAgentTable.tsx`

Card-based layout (vertical stack) displaying each agent:

| Field | Display |
|-------|---------|
| Source Tool | Large bold label from `SOURCE_TOOL_LABELS` |
| Agent ID | First 8 chars + "..." (masked) |
| Enabled | Green "Active" or Red "Disabled" badge |
| First Message | Truncated to 80 chars with ellipsis |
| Last Updated | Raw ISO timestamp |

States:
- **Loading:** Skeleton cards (3 placeholder cards)
- **Error:** Red banner with message + "Retry" button calling `refetch()`
- **Empty:** "No agents configured" message

---

### 4. Admin Page
**File:** `src/pages/admin/CallAgentsConfig.tsx`

- Protected by `AuthGuard` (same pattern as other admin pages)
- Header with title "Call Agents Command Center" and subtitle
- Refresh button in header calling `refetch()`
- Renders `CallAgentTable` component

---

## Files to Modify

### 5. App.tsx Routing
Add new route under AdminLayout section:
```tsx
<Route path="/admin/call-agents" element={<CallAgentsConfig />} />
```

Add lazy import at top:
```tsx
const CallAgentsConfig = lazy(() => import("./pages/admin/CallAgentsConfig"));
```

---

### 6. AdminHome.tsx Quick Action
Add new QuickActionCard in the Quick Actions section:
```tsx
<QuickActionCard
  title="Call Agents"
  description="Manage voice agent integrations"
  href="/admin/call-agents"
  icon={<Bot className="h-5 w-5 text-primary" />}
/>
```

Import `Bot` icon from lucide-react.

---

## Component Architecture

```text
CallAgentsConfig (page)
├── AuthGuard (protection wrapper)
├── Header
│   ├── Title: "Call Agents Command Center"
│   ├── Subtitle: "Manage PhoneCall.bot voice agent integrations"
│   └── Refresh Button (calls refetch)
└── CallAgentTable
    ├── Loading State → Skeleton cards
    ├── Error State → Red banner + Retry button
    ├── Empty State → "No agents configured"
    └── Agent Cards (one per agent)
        ├── Source Tool Label (bold)
        ├── Agent ID (masked)
        ├── Status Badge (Active/Disabled)
        ├── First Message (truncated)
        └── Last Updated (ISO string)
```

---

## Visual Style Guide

Following existing admin patterns from `PhoneCallOpsPanel` and `CRMDashboard`:

- **Page background:** `bg-background`
- **Header:** Sticky with `border-b bg-card`
- **Cards:** Use `Card`, `CardHeader`, `CardContent` from shadcn/ui
- **Badges:** 
  - Active: `bg-green-500/20 text-green-600`
  - Disabled: `bg-red-500/20 text-red-600`
- **Skeleton:** Standard `Skeleton` component for loading states
- **Error banner:** Red-tinted card with error message

---

## Technical Notes

1. **No Mutations:** This scaffold is read-only. Toggle switches, editors, and save buttons come in Phase 2.

2. **Edge Function:** The existing `admin-update-call-agent` GET endpoint returns agents but doesn't include `webhook_url`. The hook will treat this as optional.

3. **Auth Pattern:** Uses the same `AuthGuard` + admin email whitelist pattern as all other admin pages.

4. **Styling:** Pure Tailwind, matching existing admin aesthetic.

---

## Implementation Order

1. Create `src/constants/sourceToolLabels.ts`
2. Create `src/hooks/useCallAgents.ts`
3. Create `src/components/admin/CallAgentTable.tsx`
4. Create `src/pages/admin/CallAgentsConfig.tsx`
5. Update `src/App.tsx` (add route + lazy import)
6. Update `src/pages/admin/AdminHome.tsx` (add Quick Action card)

**Estimated time:** ~45 minutes
