
# Fix: PhoneCall.bot Deep Link URL

## Problem
The deep link in `AgentIdEditor.tsx` uses the wrong URL structure, causing 404 errors when clicking the external link icon.

## Change
**File:** `src/components/admin/AgentIdEditor.tsx`  
**Line:** 135

| Current | Correct |
|---------|---------|
| `https://phonecall.bot/agents/${current_agent_id}` | `https://app.phonecall.bot/agents/all?id=${current_agent_id}` |

## Technical Details
- Uses `app.phonecall.bot` subdomain (dashboard) instead of `phonecall.bot` (marketing site)
- Uses query parameter format (`?id=`) instead of path segment (`/agents/id`)
- The `current_agent_id` variable is already dynamic from props — no other changes needed

## Files Modified
| File | Change |
|------|--------|
| `src/components/admin/AgentIdEditor.tsx` | Update href on line 135 |
