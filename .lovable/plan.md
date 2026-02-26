

# VaultSignupModal: Three-Theme Lead + Auth Modal

## Summary

Create a `VaultSignupModal` component with three visual themes, wire it to the Vault page with test buttons, and add `'vault'` to source tool registries. The modal combines lead capture (`useLeadFormSubmit`) with Magic Link auth (`signInWithMagicLink`) in a single dual-submit flow.

**Important note on edge function deployment:** This project runs on Lovable Cloud, which automatically deploys edge functions when code changes. No manual CLI deployment is needed -- updating the `sourceTools.ts` files is sufficient.

---

## Changes

### 1. Add 'vault' to SOURCE_TOOLS (2 files)

- `src/types/sourceTool.ts` -- add `'vault'` to the array
- `supabase/functions/_shared/sourceTools.ts` -- add `'vault'` to the array

Without this, `save-lead` will reject submissions with `sourceTool: 'vault'`.

### 2. New Component: `src/components/vault/VaultSignupModal.tsx`

**Props:**
```text
themeVariant: 'vault' | 'engine' | 'report'
isOpen: boolean
onClose: () => void
onSuccess?: (leadId: string) => void
mode: 'with-quote' | 'no-quote'
```

**Form fields (all required):**
- First Name + Last Name (side-by-side)
- Email (full width)
- Phone (full width, auto-formatted as `(XXX) XXX-XXXX` using `formatPhoneDisplay`)

**Validation approach:**
- Zod schema strips non-digits from phone BEFORE checking length === 10
- `InlineFieldStatus` renders red errors under each invalid field on submit attempt
- Submit button disabled while any required field is empty

**Phone input masking:**
- On every keystroke, strip non-digits, cap at 10, then pass through `formatPhoneDisplay` for visual formatting
- The raw digits (not the formatted string) are what Zod validates and what gets submitted

**Dual submit (Promise.allSettled):**
```text
On submit:
1. useFormLock.lockAndExecute wraps everything
2. Promise.allSettled([
     leadFormSubmit.submit({
       email,
       name: `${firstName} ${lastName}`,   // dynamic interpolation, NOT literal
       firstName,
       phone: digitsOnly                    // raw 10 digits
     }),
     signInWithMagicLink(email)
   ])
3. Check results:
   - If lead save succeeded -> transition to 'success' state
     - If magic link ALSO failed -> show warning: "Your info is saved, but the email didn't send. Try again in a few minutes."
   - If lead save failed -> show error, stay on form, unlock for retry
```

**Key detail on `name` field:** The `LeadFormData` interface has `name` and `firstName` but no `lastName`. We pass `name: \`${firstName} ${lastName}\`` (template literal with the actual form values) and `firstName` separately. The hook splits `name` for the `wmLead` call internally.

**State machine:** `'form'` -> `'submitting'` -> `'success'`

**Success state:** Form content smoothly transitions to show a checkmark/mail icon with "Vault Created! Check your email for your secure Magic Link." If the magic link failed, a warning is shown instead. Modal stays open so user reads the message.

**Three visual variants:**

| Variant | Background | Accents | Button | Headline |
|---|---|---|---|---|
| `vault` | Deep charcoal `bg-[#1a1a1a]` | Gold (amber-500/600) borders | Gold gradient, dark text | "Unlock Your Private Vault" |
| `engine` | Dark + glassmorphism (`backdrop-blur-xl`, `bg-black/60`) | Teal `#0F766E` focus rings | Teal with subtle glow shadow | "Create Your Free Truth Engine Account" |
| `report` | Clean white | Slate borders, high contrast | Standard primary | "Secure Your Analysis" |

- The `vault` and `engine` variants use custom `DialogContent` styling (dark backgrounds, so NOT wrapped in `TrustModal`)
- The `report` variant uses `FormSurfaceProvider surface="trust"` for light-on-white inputs
- All variants use `FormSurfaceProvider` with appropriate surface values for their backgrounds

### 3. Vault Page: Add Test Buttons

**File:** `src/pages/Vault.tsx`

Add three temporary buttons in the hero section:
```text
[Test Vault Theme]  [Test Engine Theme]  [Test Report Theme]
```

Each opens `VaultSignupModal` with the corresponding `themeVariant` and `mode="no-quote"`. State tracks `isModalOpen` and `activeTheme`.

---

## Hooks Used (no duplication)

| Hook | Purpose |
|---|---|
| `useLeadFormSubmit({ sourceTool: 'vault' })` | Lead save, leadAnchor, sessionData PII, wmLead event |
| `useAuth().signInWithMagicLink` | Sends Magic Link via `signInWithOtp` |
| `useFormLock` | Double-click protection with 500ms min loading |
| `InlineFieldStatus` | Red error text under fields |
| `formatPhoneDisplay` / `isValidUSPhone` | Phone masking and validation |

## Files Modified

| File | Change |
|---|---|
| `src/types/sourceTool.ts` | Add `'vault'` |
| `supabase/functions/_shared/sourceTools.ts` | Add `'vault'` |
| `src/components/vault/VaultSignupModal.tsx` | **New** -- three-variant auth + lead modal |
| `src/pages/Vault.tsx` | Add 3 test buttons + modal rendering |

## What This Does NOT Do

- Does not change routing or remove AuthGuard (separate task)
- Does not add nav links to header/footer (separate task)
- Does not handle file upload or scanner triggering (separate task)
- Does not modify `save-lead` edge function or database schema

