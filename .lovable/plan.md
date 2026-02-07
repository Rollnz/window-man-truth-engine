

# Universal PII Translator - Enhanced `extractPII` Implementation

## Overview
Transform the `extractPII` function in `supabase/functions/log-event/index.ts` into a robust "Universal Translator" that captures user data regardless of how GTM, Meta, Google, or external sources label PII fields.

## Current State Analysis

The existing `extractPII` function only handles:
- **Email**: 3 variations (email in body, user_data, metadata)
- **Phone**: 6 variations (phone, phone_number in body, user_data, metadata)
- **Names**: Not extracted at all
- **External ID**: Partially handled in main handler

**Problem**: GTM tags and external integrations often use inconsistent field names (`mobile` vs `phone`, `fname` vs `firstName`), causing 0% match rates in EMQ scoring.

---

## Implementation Plan

### Step 1: Define Field Variation Maps

Create constant arrays defining all acceptable variations for each PII field:

```text
EMAIL_KEYS:     email, email_address, mail, e-mail, em, userEmail
PHONE_KEYS:     phone, phone_number, phoneNumber, mobile, cell, tel, ph, number, telephone
FIRST_NAME_KEYS: firstName, first_name, fname, first, fn, givenName, given_name
LAST_NAME_KEYS:  lastName, last_name, lname, last, ln, familyName, family_name, surname
EXTERNAL_ID_KEYS: external_id, externalId, user_id, userId, id, client_user_id
```

### Step 2: Create Universal Field Finder Helper

A generic helper function that searches for a field across:
1. Top-level body
2. Nested `user_data` object  
3. Nested `metadata` object

Returns the first non-null, non-empty string value found.

### Step 3: Add Name Hashing Function

```text
hashName(name: string) → string
  1. Lowercase the input
  2. Trim whitespace
  3. Remove extra internal whitespace (normalize "John  Doe" → "john doe")
  4. SHA-256 hash the result
```

### Step 4: Extend ExtractedPII Interface

```text
interface ExtractedPII {
  rawEmail: string | null;
  rawPhone: string | null;
  rawFirstName: string | null;      // NEW
  rawLastName: string | null;       // NEW
  rawExternalId: string | null;     // NEW
  emailWasHashed: boolean;
  phoneWasHashed: boolean;
  firstNameWasHashed: boolean;      // NEW
  lastNameWasHashed: boolean;       // NEW
}
```

### Step 5: Rewrite extractPII Function

The new function will:
1. Use the field variation maps to search all locations
2. Detect if values are already hashed (64-char hex)
3. Return all extracted PII in a single pass

### Step 6: Update sanitizePIIKeys Function

Remove ALL PII key variations from objects:
- All email variations
- All phone variations
- All name variations
- All external ID variations (optional - may want to keep for debugging)

### Step 7: Update Main Handler PII Processing

After extraction, hash and add to `user_data`:
- `em` (hashed email)
- `ph` (hashed phone)
- `fn` (hashed firstName)
- `ln` (hashed lastName)
- `external_id` (preserved as-is)

---

## Technical Specification

### File to Modify
`supabase/functions/log-event/index.ts`

### New Constants (lines ~17-30)

```typescript
// Universal PII field variations for GTM/Meta/Google compatibility
const EMAIL_KEYS = ['email', 'email_address', 'mail', 'e-mail', 'em', 'userEmail'];
const PHONE_KEYS = ['phone', 'phone_number', 'phoneNumber', 'mobile', 'cell', 'tel', 'ph', 'number', 'telephone'];
const FIRST_NAME_KEYS = ['firstName', 'first_name', 'fname', 'first', 'fn', 'givenName', 'given_name'];
const LAST_NAME_KEYS = ['lastName', 'last_name', 'lname', 'last', 'ln', 'familyName', 'family_name', 'surname'];
const EXTERNAL_ID_KEYS = ['external_id', 'externalId', 'user_id', 'userId', 'id', 'client_user_id'];

// All PII keys to sanitize from output objects
const ALL_PII_KEYS = [
  ...EMAIL_KEYS,
  ...PHONE_KEYS,
  ...FIRST_NAME_KEYS,
  ...LAST_NAME_KEYS,
];
```

### New Helper Function

```typescript
/**
 * Search for a field value across multiple key variations and object locations
 * Returns first non-null, non-empty string found
 */
function findFieldValue(
  body: Record<string, unknown>,
  keys: string[]
): { value: string | null; wasHashed: boolean } {
  const locations = [
    body,
    body.user_data as Record<string, unknown>,
    body.metadata as Record<string, unknown>,
  ];
  
  for (const location of locations) {
    if (!location || typeof location !== 'object') continue;
    
    for (const key of keys) {
      const val = location[key];
      if (typeof val === 'string' && val.length > 0) {
        return {
          value: val,
          wasHashed: isAlreadyHashed(val),
        };
      }
    }
  }
  
  return { value: null, wasHashed: false };
}
```

### New Name Hashing Function

```typescript
/**
 * Hash name with normalization
 * Lowercase, trim, collapse internal whitespace
 */
async function hashName(name: string): Promise<string> {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
  return sha256Hash(normalized);
}
```

### Updated extractPII Function

```typescript
interface ExtractedPII {
  rawEmail: string | null;
  rawPhone: string | null;
  rawFirstName: string | null;
  rawLastName: string | null;
  rawExternalId: string | null;
  emailWasHashed: boolean;
  phoneWasHashed: boolean;
  firstNameWasHashed: boolean;
  lastNameWasHashed: boolean;
}

function extractPII(body: Record<string, unknown>): ExtractedPII {
  const email = findFieldValue(body, EMAIL_KEYS);
  const phone = findFieldValue(body, PHONE_KEYS);
  const firstName = findFieldValue(body, FIRST_NAME_KEYS);
  const lastName = findFieldValue(body, LAST_NAME_KEYS);
  const externalId = findFieldValue(body, EXTERNAL_ID_KEYS);
  
  return {
    rawEmail: email.value,
    rawPhone: phone.value,
    rawFirstName: firstName.value,
    rawLastName: lastName.value,
    rawExternalId: externalId.value,
    emailWasHashed: email.wasHashed,
    phoneWasHashed: phone.wasHashed,
    firstNameWasHashed: firstName.wasHashed,
    lastNameWasHashed: lastName.wasHashed,
  };
}
```

### Updated sanitizePIIKeys Function

```typescript
function sanitizePIIKeys(obj: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized = { ...obj };
  
  // Remove all PII key variations
  for (const key of ALL_PII_KEYS) {
    delete sanitized[key];
  }
  
  return sanitized;
}
```

### Updated Main Handler (PII Processing Section)

Add name hashing after existing email/phone processing:

```typescript
// Hash firstName if present and not already hashed
let firstNameSha256: string | null = null;
if (extractedPII.rawFirstName) {
  if (extractedPII.firstNameWasHashed) {
    firstNameSha256 = extractedPII.rawFirstName;
  } else {
    firstNameSha256 = await hashName(extractedPII.rawFirstName);
  }
  processedUserData.fn = firstNameSha256;
  processedUserData.sha256_first_name = firstNameSha256;
}

// Hash lastName if present and not already hashed
let lastNameSha256: string | null = null;
if (extractedPII.rawLastName) {
  if (extractedPII.lastNameWasHashed) {
    lastNameSha256 = extractedPII.rawLastName;
  } else {
    lastNameSha256 = await hashName(extractedPII.rawLastName);
  }
  processedUserData.ln = lastNameSha256;
  processedUserData.sha256_last_name = lastNameSha256;
}

// Use extracted external_id (already handles variations)
const externalId = extractedPII.rawExternalId || leadId || null;
```

---

## Processing Logic Summary

| Field | Input Variations | Normalization | Output Keys |
|-------|-----------------|---------------|-------------|
| Email | email, email_address, mail, e-mail, em | lowercase → trim → SHA-256 | em, email_sha256, sha256_email_address |
| Phone | phone, phone_number, mobile, cell, tel, ph | remove non-digits → E.164 → SHA-256 | ph, phone_sha256, sha256_phone_number |
| First Name | firstName, first_name, fname, first, fn | lowercase → trim → collapse spaces → SHA-256 | fn, sha256_first_name |
| Last Name | lastName, last_name, lname, last, ln | lowercase → trim → collapse spaces → SHA-256 | ln, sha256_last_name |
| External ID | external_id, externalId, user_id, userId, id | passthrough (no hashing) | external_id |

---

## Expected Results

| Metric | Current | After Fix |
|--------|---------|-----------|
| EMQ firstName | 0% | ~80%+ |
| EMQ lastName | 0% | ~60%+ |
| Overall EMQ | 4.6/10 | ~8.0-8.5/10 |

---

## Risk Assessment

- **Low Risk**: All changes are additive to existing logic
- **Backward Compatible**: Existing field names still work
- **No Breaking Changes**: Missing fields result in null, not errors
- **Self-Healing**: GTM misconfigurations will now auto-correct

---

## Files to Modify

1. **`supabase/functions/log-event/index.ts`**
   - Add field variation constants
   - Add `findFieldValue` helper
   - Add `hashName` function
   - Extend `ExtractedPII` interface
   - Rewrite `extractPII` function
   - Update `sanitizePIIKeys` function
   - Add name hashing in main handler

2. **`src/lib/highValueSignals.ts`** (complementary)
   - Add firstName/lastName to LogSignalParams interface
   - Pass names in payloads

3. **`src/components/conversion/ConsultationBookingModal.tsx`** (complementary)
   - Pass firstName/lastName to logBookingConfirmed

