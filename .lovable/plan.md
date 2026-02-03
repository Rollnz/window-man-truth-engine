
# Implementation Plan: Agent Name Editor Feature

## Overview
Add an `agent_name` field to the Call Agents Command Center, allowing admins to assign friendly names to each agent. This involves database schema changes, edge function updates, hook extensions, and a new UI component.

---

## Build 1: Database Migration

**Action**: Add `agent_name` column to `call_agents` table

```sql
ALTER TABLE call_agents
ADD COLUMN IF NOT EXISTS agent_name TEXT
DEFAULT '' NOT NULL;
```

**Design Decisions**:
- `DEFAULT ''` ensures existing rows get empty string (not NULL)
- `NOT NULL` constraint means agent_name is always a string
- Empty string = "no name set yet" (handled gracefully in UI)

---

## Build 2: Edge Function Updates

**File**: `supabase/functions/admin-update-call-agent/index.ts`

### 2a. Update GET Handler (Critical Fix)
Add `agent_name` to the select query:

```typescript
// Line 108 - Change from:
.select("source_tool, agent_id, enabled, first_message_template, updated_at")

// To:
.select("source_tool, agent_id, agent_name, enabled, first_message_template, updated_at")
```

Update `ListAgentsResponse` interface to include `agent_name: string`

### 2b. Extend PUT Handler
Modify to accept optional fields dynamically:

**New Request Body Schema**:
```typescript
{
  source_tool: string,              // REQUIRED
  first_message_template?: string,  // optional, max 500 chars
  agent_name?: string               // optional, max 100 chars
}
```

**Validation Logic**:
1. `source_tool` must be present and non-empty string → 400 if missing
2. If neither `first_message_template` nor `agent_name` present → 400 "Nothing to update"
3. If `first_message_template` present and > 500 chars → 400 "Template must be 500 characters or fewer"
4. If `agent_name` present and > 100 chars → 400 "Agent name must be 100 characters or fewer"

**Dynamic UPDATE Construction**:
- Build update object only with fields that are present
- Always set `updated_at = now()` when any field updates

---

## Build 3: Hook Extension

**File**: `src/hooks/useCallAgents.ts`

### 3a. Update CallAgent Interface
```typescript
export interface CallAgent {
  source_tool: string;
  agent_id: string;
  agent_name: string;   // NEW - always string, never null
  enabled: boolean;
  first_message_template: string;
  updated_at: string;
  webhook_url?: string;
}
```

### 3b. Add updateAgentName Function
**Signature**: `(source_tool: string, agent_name: string) => Promise<void>`

**Pattern**: Server-first (NOT optimistic) - same as `updateTemplate`

```
Step 1: PUT to admin-update-call-agent
        Body: { source_tool, agent_name }
Step 2 (success): Update local state with new agent_name
        Call refetch() to sync updated_at
Step 3 (failure): Throw error (no local state change)
```

### 3c. Update Return Type
```typescript
return {
  agents,
  loading,
  error,
  refetch,
  testCall,
  toggleEnabled,
  updateAgentId,
  updateTemplate,
  updateAgentName,  // NEW
};
```

---

## Build 4: AgentNameEditor Component

**File**: `src/components/admin/AgentNameEditor.tsx`

### Props Interface
```typescript
interface AgentNameEditorProps {
  source_tool: string;
  current_agent_name: string;
  onSave: (source_tool: string, agent_name: string) => Promise<void>;
}
```

### State Machine
```
VIEWING → (click pencil) → EDITING
EDITING → (click Save) → SAVING
SAVING → (success) → VIEWING
SAVING → (failure) → ERROR
ERROR → (click Save/retry) → SAVING
ERROR → (click Cancel) → VIEWING
EDITING → (click Cancel) → VIEWING
```

### VIEWING State
| Condition | Display |
|-----------|---------|
| `current_agent_name` non-empty | Name in readable font + pencil icon |
| `current_agent_name` empty | Muted text "Add a name..." + pencil icon |

### EDITING State
- Text input pre-filled with `current_agent_name`
- Empty input = no placeholder text (that was display-only)
- Validation on every keystroke (no debounce):

| Input State | Icon | Error Text |
|-------------|------|------------|
| Empty | None | None |
| Length ≤ 100 | Green checkmark | None |
| Length > 100 | Red X | "Max 100 characters" |

- **Save button**: Disabled when length > 100 (empty IS valid)
- **Cancel button**: Always visible, returns to VIEWING

### SAVING State
- Input disabled
- Save button shows spinner + "Saving..."
- Cancel button hidden

### ERROR State
- Red banner above input with server error message
- Input re-enabled with failed value
- Save button acts as retry
- Cancel button visible

### Toast Messages
- Success: `"Name updated for {SOURCE_TOOL_LABELS[source_tool]}"`
- Failure: `"Failed to save name: {error message}"`

---

## Build 5: Wire Into Cards

**File**: `src/components/admin/CallAgentTable.tsx`

### Updated Card Layout Order
```
1. Source Tool label (bold) ← unchanged
2. AgentNameEditor         ← NEW (directly below label)
3. Enabled toggle          ← unchanged
4. AgentIdEditor           ← unchanged
5. First message preview   ← unchanged
6. Edit Script button      ← unchanged
7. TemplateEditor panel    ← unchanged
8. Last Updated            ← unchanged
9. Test Call button        ← unchanged
```

### Props Updates

**CallAgentTableProps** - add:
```typescript
updateAgentName: (source_tool: string, agent_name: string) => Promise<void>;
```

**AgentCardProps** - add:
```typescript
onUpdateAgentName: (source_tool: string, agent_name: string) => Promise<void>;
```

### Integration
Pass `updateAgentName` from hook → `CallAgentTable` → each `AgentCard` → `AgentNameEditor` as `onSave`

---

## Implementation Order

| Step | Component | Reason |
|------|-----------|--------|
| 1 | Database Migration | Schema must exist before code references it |
| 2 | Edge Function (GET + PUT) | Backend must serve/accept agent_name |
| 3 | Hook Interface + Function | Frontend needs type + mutation |
| 4 | AgentNameEditor Component | Isolated component, can be tested standalone |
| 5 | CallAgentTable Integration | Wire everything together |

---

## Verification Checklist

After implementation, verify:

1. **Empty state works**: Existing cards (all with empty `agent_name`) show "Add a name..." without errors
2. **Validation fires on keystroke**: Type 101+ characters → red X + error text appears instantly
3. **Empty string saves**: Clear an existing name, save → persists as empty string, shows "Add a name..."
4. **Server validation enforced**: Manually POST >100 chars via curl → 400 error returned
5. **No regression on template editor**: Edit Script still works with PUT endpoint changes
6. **Full loop**: Add name → save → refresh page → name persists

---

## Files Modified

| File | Change Type |
|------|-------------|
| `supabase/functions/admin-update-call-agent/index.ts` | Modify GET select, extend PUT handler |
| `src/hooks/useCallAgents.ts` | Add `agent_name` to interface, add `updateAgentName` function |
| `src/components/admin/AgentNameEditor.tsx` | Create new component |
| `src/components/admin/CallAgentTable.tsx` | Add props, integrate AgentNameEditor |
| `src/pages/admin/CallAgentsConfig.tsx` | Pass `updateAgentName` prop |

---

## Constraints Confirmed

- AgentIdEditor.tsx: NOT modified
- TemplateEditor.tsx: NOT modified
- GET, POST, PATCH handlers: NOT modified (only GET select list updated, PUT extended)
- `agent_name` always string, never null
- 100-char limit enforced client-side (disable Save) AND server-side (400 response)
- AgentNameEditor is separate component from AgentIdEditor
