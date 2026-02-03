
# Disable Placeholder Call Agents

## Overview
Disable all `call_agents` rows that have placeholder or invalid `agent_id` values to prevent the `tr_auto_dispatch_call` trigger from scheduling calls that will fail.

## Database Update

Execute a single UPDATE statement to set `enabled = FALSE` for all agents that don't have a properly formatted PhoneCall.bot agent ID:

```sql
UPDATE call_agents
SET 
  enabled = FALSE,
  updated_at = NOW()
WHERE agent_id NOT LIKE 'agent_%'
   OR agent_id = 'PLACEHOLDER_AGENT_ID';
```

## Affected Rows

| Source Tool | Will Be Disabled |
|-------------|------------------|
| beat-your-quote | Yes |
| consultation-booking | Yes |
| fair-price-quiz | Yes |
| quote-scanner | Yes |
| sample-report | Yes |
| manual_dispatch | No (properly configured) |

## Expected Behavior After Update

1. **New leads** from disabled source tools will still be saved to `leads` table
2. **Trigger fires** but logs `[AutoDispatch] Skipping: No enabled call_agent for source_tool=[X]`
3. **No failed calls** - prevents wasted API calls to PhoneCall.bot with invalid agent IDs
4. **Re-enablement** - Simply update `enabled = TRUE` after configuring real agent IDs

## Verification Query

After the update, confirm the change:

```sql
SELECT source_tool, agent_id, enabled
FROM call_agents
ORDER BY enabled DESC, source_tool;
```

Expected result: Only `manual_dispatch` should have `enabled = true`.
