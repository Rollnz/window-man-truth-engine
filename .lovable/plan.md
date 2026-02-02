

# Consolidated Fix Plan: Scanner Lead Capture & Validation (Revised)

## Problem Summary

6 interconnected issues causing validation failures, state desync, and broken attribution tracking.

---

## A. Component Architecture

| Component | Key Props/Interfaces | Primary Responsibilities |
|-----------|---------------------|-------------------------|
| `useFormValidation` hook | `schemas`, `initialValues` | Centralized validation with Zod |
| `LeadCaptureModal` | `sourceTool`, `sessionData` | Lead capture form with unified state |
| `VaultCTABlock` | `onEmailSubmit`, `isLoading` | Email CTA with schema validation |
| `QuoteScanner` page | N/A | Wire real handlers with loading state |
| `ClaimVaultSyncButton.test.tsx` | N/A | Test assertions for validation messages |

---

## B. File Structure

```
src/
├── hooks/
│   └── useFormValidation.ts           ← Fix #1: .min(2) for firstName
├── components/
│   ├── conversion/
│   │   └── LeadCaptureModal.tsx       ← Fix #2: Consolidate state + phone validation
│   ├── quote-scanner/
│   │   └── vault-pivot/
│   │       └── VaultCTABlock.tsx      ← Fix #6: Add schema validation
│   └── claim-survival/
│       └── __tests__/
│           └── ClaimVaultSyncButton.test.tsx  ← Fix #5: Update assertions
└── pages/
    └── QuoteScanner.tsx               ← Fix #3, #4: Wire handlers + loading
```

---

## C. Implementation Order

### Phase 1: Foundation (Step 1)

**File: `src/hooks/useFormValidation.ts`**
- **Line 164-165**: Change `.min(3)` → `.min(2)`

```typescript
// BEFORE
firstName: z.string()
  .min(3, 'First name must be at least 3 characters')

// AFTER
firstName: z.string()
  .min(2, 'First name must be at least 2 characters')
```

---

### Phase 2: Test Blast Radius (Step 2)

**File: `src/components/claim-survival/__tests__/ClaimVaultSyncButton.test.tsx`**
- **Line 153**: Update assertion
- **Line 216**: Update assertion

```typescript
// BEFORE (lines 153, 216)
expect(screen.getByText(/first name must be at least 3 characters/i)).toBeInTheDocument();

// AFTER
expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
```

---

### Phase 3: State Consolidation (Step 3)

**File: `src/components/conversion/LeadCaptureModal.tsx`**

**3a. Remove redundant local state (lines 49-51):**
```typescript
// DELETE these lines
const [firstName, setFirstName] = useState(sessionData.firstName || '');
const [lastName, setLastName] = useState(sessionData.lastName || '');
const [phone, setPhone] = useState(sessionData.phone || '');
```

**3b. Add phone to validation schema (lines 69-80):**
```typescript
const { values, hasError, getError, getFieldProps, validateAll, setValue } = useFormValidation({
  initialValues: { 
    email: sessionData.email || '',
    firstName: sessionData.firstName || '',
    lastName: sessionData.lastName || '',
    phone: sessionData.phone || '',  // ADD
  },
  schemas: { 
    email: commonSchemas.email,
    firstName: requiresFullContact ? commonSchemas.firstName : commonSchemas.firstName.optional(),
    lastName: commonSchemas.lastName,
    phone: requiresFullContact ? commonSchemas.phone : commonSchemas.phone.optional(),  // ADD
  },
});
```

**3c. Add computed validation with 10-digit phone check (before return):**
```typescript
// ADD: Strict phone validation for UX
const hasValidPhone = !requiresFullContact || (values.phone.replace(/\D/g, '').length === 10);
const isFormValid = values.email.trim() && (!requiresFullContact || (values.firstName.trim() && hasValidPhone));
```

**3d. Update NameInputPair to use hook values:**
```typescript
<NameInputPair
  firstName={values.firstName}
  lastName={values.lastName}
  onFirstNameChange={(v) => setValue('firstName', v)}
  onLastNameChange={(v) => setValue('lastName', v)}
  errors={{ firstName: hasError('firstName') ? getError('firstName') : undefined }}
  disabled={isLoading}
  autoFocus
/>
```

**3e. Update phone input to use hook:**
```typescript
<Input
  id="phone"
  value={values.phone}
  onChange={(e) => setValue('phone', formatPhoneNumber(e.target.value))}
  // ... rest unchanged
/>
```

**3f. Fix button disabled logic:**
```typescript
disabled={isLoading || !isFormValid}
```

**3g. Simplify normalization (remove safety net):**
```typescript
// BEFORE
const normalizedNames = normalizeNameFields(firstName || values.firstName, lastName || values.lastName);

// AFTER
const normalizedNames = normalizeNameFields(values.firstName, values.lastName);
```

**3h. Update phone reference in payload:**
```typescript
phone: values.phone.trim() || sessionData.phone || null,
```

---

### Phase 4: Wire Real Handlers (Step 4)

**File: `src/pages/QuoteScanner.tsx`**

**4a. Add imports (at top):**
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
```

**4b. Add loading state (inside component):**
```typescript
const { toast } = useToast();
const [isNoQuoteSubmitting, setIsNoQuoteSubmitting] = useState(false);
```

**4c. Replace NoQuotePivotSection handlers (lines 190-199):**
```typescript
<NoQuotePivotSection 
  isLoading={isNoQuoteSubmitting}
  onGoogleAuth={() => {
    // TODO: Wire to real Supabase Google OAuth
    console.log('Google OAuth clicked - will redirect to /vault');
  }}
  onEmailSubmit={async (data) => {
    setIsNoQuoteSubmitting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('save-lead', {
        body: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          sourceTool: 'quote-scanner',
          sessionId: getOrCreateSessionId(),
          sessionData: {
            clientId: getOrCreateClientId(),
          },
          attribution: getAttributionData(),  // ✅ NESTED under "attribution" key
        },
      });
      
      if (error) throw error;
      
      if (result?.leadId) {
        updateField('leadId', result.leadId);
        setLeadId(result.leadId);
        toast({
          title: "Saved!",
          description: "We'll help you prepare for your window project.",
        });
      }
    } catch (err) {
      console.error('[QuoteScanner] NoQuote submit error:', err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsNoQuoteSubmitting(false);
    }
  }}
/>
```

---

### Phase 5: VaultCTABlock Validation (Step 5)

**File: `src/components/quote-scanner/vault-pivot/VaultCTABlock.tsx`**

**5a. Add imports:**
```typescript
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { cn } from '@/lib/utils';
```

**5b. Replace local state with validation hook:**
```typescript
// DELETE
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',
});

// ADD
const { values, setValue, validateAll, hasError, getError } = useFormValidation({
  initialValues: { firstName: '', lastName: '', email: '' },
  schemas: {
    firstName: commonSchemas.firstName,
    lastName: commonSchemas.lastName.min(1, 'Last name is required'),  // Required per form UI
    email: commonSchemas.email,
  },
});
```

**5c. Update form submit handler:**
```typescript
const handleEmailSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateAll()) return;  // ADD guard
  onEmailSubmit?.(values);
};
```

**5d. Update inputs to use hook values:**
```typescript
<Input
  id="firstName"
  type="text"
  value={values.firstName}
  onChange={(e) => setValue('firstName', e.target.value)}
  className={cn("bg-background border-border", hasError('firstName') && 'border-destructive')}
  required
/>
// ... similar for lastName, email
```

**5e. Update button disabled logic (check ALL required fields):**
```typescript
<Button
  type="submit"
  disabled={isLoading || !values.firstName.trim() || !values.lastName.trim() || !values.email.trim()}
  className="w-full"
>
```

---

## D. Analytics Integration Points

| Event | Location | Trigger |
|-------|----------|---------|
| `lead_submission_success` | QuoteScanner.tsx (new handler) | NoQuote email submit |
| `lead_capture_modal_opened` | LeadCaptureModal.tsx (unchanged) | Modal opens |

---

## Before/After Comparison

```text
BEFORE:
┌─────────────────────────────────────────────────────────────┐
│  LeadCaptureModal                                           │
│  ├── useState(firstName)  ← User types here                 │
│  ├── useState(phone)      ← No schema validation            │
│  └── useFormValidation({ firstName }) ← Empty/desynced      │
│                                                             │
│  QuoteScanner NoQuotePivotSection                           │
│  └── onEmailSubmit: console.log()  ← Data lost!             │
│                                                             │
│  VaultCTABlock                                              │
│  └── No validation  ← Invalid emails submitted              │
└─────────────────────────────────────────────────────────────┘

AFTER:
┌─────────────────────────────────────────────────────────────┐
│  LeadCaptureModal                                           │
│  └── useFormValidation({                                    │
│        firstName,  ← Single source of truth                 │
│        phone,      ← Schema validated, 10-digit check       │
│        email                                                │
│      })                                                     │
│                                                             │
│  QuoteScanner NoQuotePivotSection                           │
│  └── onEmailSubmit: supabase.invoke('save-lead', {          │
│        attribution: getAttributionData()  ← Correct nesting │
│      })                                                     │
│  └── isLoading state prevents double-submit                 │
│                                                             │
│  VaultCTABlock                                              │
│  └── useFormValidation + disabled logic for ALL fields      │
└─────────────────────────────────────────────────────────────┘
```

---

## Impact Assessment

| Area | Risk | Notes |
|------|------|-------|
| Breaking changes | Low | Only internal state changes |
| Test files | 1 file | Update 2 assertions for new message |
| User experience | Positive | Short names (Al, Bo) now accepted |
| Attribution | Fixed | Correct nesting for save-lead schema |
| Double-submit | Fixed | Loading state prevents duplicates |

