

# Traffic Cop: Route Vault Signups to `accounts` Table

## Overview

Add a routing condition in the `save-lead` edge function so that when `sourceTool === 'vault'`, data goes to the new `accounts` table instead of `leads`. The frontend remains untouched. All downstream side effects (wm_event_log, Stape GTM, email notifications, rate limiting) continue firing using the account's `id` as `leadId`.

---

## Step 1: Create `accounts` Table (Migration)

Create a comprehensive table that mirrors all `leadRecord` columns plus the 4 CRM columns. Uses `fbc`/`fbp` (no underscores) to match the existing edge function convention.

**Columns (grouped):**

| Group | Columns |
|---|---|
| PK | `id` (uuid, default gen_random_uuid()) |
| Auth linkage | `supabase_user_id` (uuid, nullable, references auth.users) |
| PII | `first_name` (text, not null), `last_name` (text, not null), `email` (text, not null, unique), `phone` (text, not null), `name` (text) |
| CRM internal | `account_status` (text, default 'pending_verification'), `wmlead_id` (text), `phonecall_bot_status` (text, default 'idle'), `external_crm_id` (text) |
| Identity | `client_id` (text), `original_session_id` (uuid), `identity_version` (smallint, default 2) |
| Source | `source_tool` (text, default 'vault'), `source_page` (text), `source_form` (text) |
| UTM (last-touch) | `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` (all text) |
| Click IDs | `gclid`, `fbclid`, `fbc`, `fbp`, `msclkid`, `gbraid`, `wbraid`, `ttclid` (all text) |
| Meta granular | `meta_placement`, `meta_campaign_id`, `meta_adset_id`, `meta_ad_id`, `meta_site_source_name`, `meta_creative_id` (all text) |
| Last Non-Direct | `last_non_direct_utm_source`, `last_non_direct_utm_medium`, `last_non_direct_gclid`, `last_non_direct_fbclid`, `last_non_direct_channel`, `last_non_direct_landing_page` (all text) |
| Geo | `city`, `state`, `zip` (all text) |
| Device/fingerprint | `device_type`, `referrer`, `landing_page`, `ip_hash`, `client_user_agent`, `landing_page_url` (all text) |
| Session | `session_data` (jsonb, default '{}') |
| Timestamps | `created_at`, `updated_at` (timestamptz, default now()) |

**RLS policies:**
- Anonymous INSERT allowed (for unauthenticated vault signups via service role in edge function -- but since edge function uses service_role_key, RLS is bypassed anyway; we still add policies for defense-in-depth)
- Authenticated SELECT where `supabase_user_id = auth.uid()`
- Admin SELECT/UPDATE via `has_role(auth.uid(), 'admin')`
- No public DELETE

**Trigger:** `set_updated_at` on UPDATE (reuse existing moddatetime or custom trigger pattern).

---

## Step 2: Update `save-lead` Edge Function (The Traffic Cop)

**File:** `supabase/functions/save-lead/index.ts`

**What changes:** The Golden Thread logic block (lines 691-903) gets wrapped in a routing condition. Approximately 80 lines of new code inserted.

### Routing Logic (inserted at line 691)

```text
if (sourceTool === 'vault') {
  // ═══ VAULT PATH: Route to accounts table ═══
  
  // 1. Check for existing account by email
  const { data: existingAccounts } = await supabase
    .from('accounts')
    .select('id, first_name, last_name, phone, utm_source, gclid, fbc, msclkid, gbraid, wbraid, ttclid, client_id')
    .eq('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  const existingAccount = existingAccounts?.[0] || null;

  if (existingAccount) {
    // 2a. UPDATE existing account
    // CRITICAL: DO NOT overwrite first_name, last_name, or phone
    leadId = existingAccount.id;
    
    // Build update record (attribution only, NO PII overwrite)
    const accountUpdate = {
      updated_at: new Date().toISOString(),
      identity_version: 2,
      source_form: aiContext?.source_form || undefined,
      client_user_agent: clientUserAgent,
      // Same first-touch preservation logic as leads path
      // UTM: only if not already set
      // Click IDs: only if not already set  
      // Meta granular: always update (last-touch)
      // Last Non-Direct: always update
    };
    
    await supabase.from('accounts').update(accountUpdate).eq('id', leadId);
    
  } else {
    // 2b. INSERT new account
    // Map leadRecord fields to accounts columns (same field names)
    const accountRecord = {
      ...leadRecord,  // All fields from the existing leadRecord object
      // CRM defaults (not in leadRecord)
      account_status: 'pending_verification',
      phonecall_bot_status: 'idle',
    };
    
    const { data: newAccount, error: insertError } = await supabase
      .from('accounts')
      .insert(accountRecord)
      .select('id')
      .single();
      
    if (insertError || !newAccount) throw new Error('Database error creating account');
    
    leadId = newAccount.id;
    
    // Fire admin notification + Stape GTM (same as leads path)
    triggerEmailNotification({ ... });
    sendStapeGTMEvent({ ... });
  }
  
} else {
  // ═══ LEGACY PATH: Existing leads logic (lines 691-903 unchanged) ═══
  // ... all existing Golden Thread lead lookup + insert/update code ...
}
```

### Key Implementation Details

1. **`leadRecord` reuse**: The `leadRecord` object (built at lines 615-686) is already constructed before the routing block. For the accounts INSERT path, we spread it directly since accounts columns match leads columns (same names: `fbc`, `fbp`, `utm_source`, etc.). We just add the 4 CRM columns.

2. **PII protection on UPDATE**: When an account already exists, the update record explicitly excludes `first_name`, `last_name`, `phone`, and `email`. Only attribution, meta granular, last-non-direct, and device fields are updated.

3. **First-touch preservation**: Same logic as the existing leads UPDATE path -- only set `utm_source`, `gclid`, `fbc`, `msclkid`, `gbraid`, `wbraid`, `ttclid` if not already present on the existing record.

4. **`leadId` variable**: After the routing block, `leadId` holds either `accounts.id` or `leads.id`. Everything downstream (lines 938-1353) uses this variable unchanged:
   - Quote file linking
   - Consultation creation
   - Email notifications
   - Rate limit recording
   - `wm_events` attribution logging
   - `wm_event_log` canonical ledger write
   - Stape GTM server-side event
   - Response: `{ success: true, leadId }`

5. **Frontend compatibility**: `useLeadFormSubmit` reads `responseData.leadId` and passes it to `setLeadId`, `setExplicitSubmission`, `setLeadAnchor`, `updateFields`. All continue working because the value is a valid UUID from `accounts.id`.

6. **Columns that accounts has but leadRecord doesn't**: `account_status`, `wmlead_id`, `phonecall_bot_status`, `external_crm_id`, `supabase_user_id` -- these use defaults or null on INSERT. The edge function doesn't need to populate them.

7. **Columns that leadRecord has but accounts doesn't need differently**: `chat_history` exists in leadRecord but won't be in accounts (vault signups don't have chat). We'll exclude it from the accounts insert to keep the table clean. Similarly `window_count`, `specific_detail`, `emotional_state`, `urgency_level`, `insurance_carrier` -- AI context fields that don't apply to vault signups will be excluded.

---

## Step 3: Auth Linkage Trigger (SQL provided, not executed)

Since we cannot modify the `auth` schema directly, the linkage will be handled by extending the existing `handle_new_user` trigger function (which already fires on `auth.users` INSERT). We will provide SQL that:

1. Adds logic to the existing trigger: when a new auth user is created, check if `accounts.email` matches and set `accounts.supabase_user_id = NEW.id`
2. Also handles the email confirmation case: a separate function callable via RPC or a scheduled check

**Alternative approach**: Since Magic Link creates the user AND confirms email in one step (`signInWithOtp`), the `handle_new_user` trigger fires when the user clicks the link. At that point we can link the account. SQL will be provided in the implementation for you to review and run manually.

---

## Files Modified

| File | Change |
|---|---|
| Database migration | Create `accounts` table (~50 columns) + RLS + updated_at trigger |
| `supabase/functions/save-lead/index.ts` | Add vault routing condition (~80 lines wrapping lines 691-903) |
| SQL snippet (provided as comment) | Auth linkage trigger for manual execution |

## What Stays Untouched

- `src/components/vault/VaultSignupModal.tsx` -- zero changes
- `src/hooks/useLeadFormSubmit.ts` -- zero changes
- All other edge functions
- All existing leads table logic (wrapped in `else` branch)
- All downstream side effects (wm_event_log, Stape GTM, email, rate limiting)

