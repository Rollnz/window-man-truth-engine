

## What's Happening — The Full Sequence

Here is the exact step-by-step flow when a new user visits `/audit` and uploads a quote:

### Step-by-step flow

1. **User uploads a file** → `handleFileSelect()` fires, creates a preview URL, sets phase to `pre-gate`
2. **Pre-gate interstitial completes** → `completePreGate()` fires, opens the `QuoteUploadGateModal` (lead capture form)
3. **User fills out First Name, Last Name, Email, Phone** → clicks "Start My Analysis"
4. **`captureLead()` fires** → calls `submitLead()` which invokes the `save-lead` edge function
5. **`save-lead` creates an `accounts` row** (because `sourceTool: 'quote-scanner'` routes to the accounts table via the Traffic Cop). The row has `email`, `first_name`, `last_name`, `phone` — but **`supabase_user_id` is NULL** because no auth user exists yet
6. **`runAnalysis()` fires** → calls the `quote-scanner` edge function with the image. This runs the AI analysis and stores results in `quote_analyses`
7. **Results are returned directly** to the frontend and displayed (phase → `revealed`). The `/audit` flow is complete here — no orchestrator call happens on this page.

### The `/signup` flow (where the crash happens)

When the user later goes to `/signup` (or is redirected there), a separate flow kicks in:

1. **User creates a Supabase auth account** (email + password or magic link)
2. **`handle_new_user` trigger fires** on `auth.users` INSERT → but it only creates a `profiles` row and merges `leads`. It **never touches `accounts`**
3. **`handle_email_confirmed` trigger fires** when email is verified → again, only updates `leads.user_id`. **Never touches `accounts.supabase_user_id`**
4. **Frontend calls `orchestrate-quote-analysis`** with the user's JWT
5. **The function extracts `user_id` from JWT** → queries `accounts WHERE supabase_user_id = user_id` → **finds nothing** because no trigger ever linked the account → **404 ACCOUNT_NOT_FOUND**

### The Root Cause

The existing `handle_new_user` and `handle_email_confirmed` triggers were written before the `accounts` table existed. They only link `leads.user_id`. Nobody ever added the equivalent linkage for `accounts.supabase_user_id`.

### The Fix

Update both trigger functions to also set `accounts.supabase_user_id = NEW.id` where `accounts.email = NEW.email` and `accounts.supabase_user_id IS NULL`. This is a single SQL migration that modifies the two existing `SECURITY DEFINER` functions.

### Migration SQL

```sql
-- Update handle_new_user to also link accounts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'name');
  
  -- Only merge if email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.leads 
    SET user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND user_id IS NULL;

    UPDATE public.accounts
    SET supabase_user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND supabase_user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update handle_email_confirmed to also link accounts
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL 
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE public.leads 
    SET user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND user_id IS NULL;

    UPDATE public.accounts
    SET supabase_user_id = NEW.id, updated_at = now()
    WHERE email = NEW.email AND supabase_user_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;
```

No new triggers needed — the existing `on_auth_user_created` and the email confirmation trigger already call these functions. We just add the `accounts` UPDATE alongside the existing `leads` UPDATE.

