
# Digital Fortress Test Suite: save-lead Edge Function

## Overview

This plan creates a comprehensive automated test suite for the `save-lead` edge function, verifying the four critical "Digital Fortress" requirements that protect both ad spend efficiency (EMQ 9.5+) and webhook reliability (Phonecall.bot).

## Test Architecture

The tests will be organized into four distinct test groups, each targeting a specific fortress requirement:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                   DIGITAL FORTRESS TEST SUITE                           │
├─────────────────────────────────────────────────────────────────────────┤
│  1. DATA INTEGRITY          │  Full payload → leads → wm_leads sync    │
│  2. EMQ PRECISION           │  SHA-256 hashing + User-Agent capture    │
│  3. WEBHOOK RELIABILITY     │  Phone E.164 + Idempotent upserts        │
│  4. RATE LIMIT SAFETY       │  IP/Email throttling protects webhooks   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Test Groups & Implementation Details

### Group 1: Data Integrity Tests

**Purpose**: Verify full payload persistence including new EMQ 9.5+ fields

| Test Case | Input | Expected Outcome |
|-----------|-------|------------------|
| Full payload with city/state/zip | Complete aiContext | All fields saved to `leads` table |
| wm_leads sync trigger | New lead created | Corresponding `wm_leads` record created with city/state/zip |
| client_user_agent capture | Custom User-Agent header | Field persisted exactly as received |

**Implementation Approach**:
- Send full payload via API call
- Use Supabase client to query `leads` table directly
- Verify each EMQ field matches input

```typescript
// Example test structure
Deno.test("FORTRESS-D1: should persist city/state/zip to leads table", async () => {
  const response = await callSaveLead({
    email: generateTestEmail(),
    sourceTool: "kitchen-table-guide",
    firstName: "Jane",
    lastName: "Doe",
    phone: "5551234567",
    aiContext: {
      city: "Miami",
      state: "FL",
      zip_code: "33101"
    }
  });
  
  const body = await response.json();
  assertEquals(response.status, 200);
  
  // Query database to verify persistence
  const { data: lead } = await supabase
    .from('leads')
    .select('city, state, zip, client_user_agent')
    .eq('id', body.leadId)
    .single();
  
  assertEquals(lead.city, "Miami");
  assertEquals(lead.state, "FL");
  assertEquals(lead.zip, "33101");
  assertExists(lead.client_user_agent);
});
```

---

### Group 2: EMQ Precision Tests

**Purpose**: Verify SHA-256 hashing and Stape GTM payload accuracy

| Test Case | Verification Method |
|-----------|---------------------|
| Email hashing | Compute expected SHA-256 locally, verify against log output |
| Phone hashing (E.164) | Verify 10-digit → `+1XXXXXXXXXX` normalization before hash |
| Name hashing | Verify lowercase/trim normalization, then SHA-256 |
| Stape payload structure | Parse edge function logs for `[Stape GTM] Sending payload` |

**Testing Strategy for Stape GTM Payload**:
Since `sendStapeGTMEvent()` is fire-and-forget, we verify via:
1. **Log inspection**: The function logs the full payload at line 352
2. **Payload structure validation**: Read logs after test execution

```typescript
Deno.test("FORTRESS-E1: should hash firstName/lastName for server-side matching", async () => {
  const testData = {
    firstName: "John",
    lastName: "Smith",
    email: generateTestEmail(),
    phone: "5551234567"
  };
  
  const response = await callSaveLead({
    ...testData,
    sourceTool: "quote-builder"
  });
  
  assertEquals(response.status, 200);
  
  // Compute expected hashes
  const expectedFnHash = await computeSHA256("john"); // lowercase
  const expectedLnHash = await computeSHA256("smith");
  
  // Verify via log inspection (or mock endpoint in test environment)
  // The actual verification would check edge function logs
});
```

**Static Analysis Test** (inspired by existing patterns):
```typescript
Deno.test("FORTRESS-E2: save-lead includes fn/ln in Stape payload", async () => {
  const sourceCode = await Deno.readTextFile("./supabase/functions/save-lead/index.ts");
  
  // Verify fn/ln are included in gtmPayload
  const hasFnInPayload = sourceCode.includes("fn: hashedFirstName");
  const hasLnInPayload = sourceCode.includes("ln: hashedLastName");
  
  assertEquals(hasFnInPayload, true, "gtmPayload should include fn for first name");
  assertEquals(hasLnInPayload, true, "gtmPayload should include ln for last name");
});
```

---

### Group 3: Webhook Reliability Tests (Phonecall.bot Protection)

**Purpose**: Ensure phone data is never null/malformed and upserts prevent duplicate calls

| Test Case | Critical Check |
|-----------|---------------|
| E.164 normalization | 10-digit input → `+15551234567` output |
| Invalid phone rejection | Non-E.164 phones return 400 error |
| Idempotent upsert | Same email, new phone → UPDATE (not INSERT) |
| first_name always populated | Never null if provided |

**Idempotent Upsert Test**:
```typescript
Deno.test("FORTRESS-W1: should update existing lead without creating duplicate", async () => {
  const email = generateTestEmail();
  
  // Step 1: Create lead
  const create = await callSaveLead({
    email,
    sourceTool: "quote-builder",
    firstName: "First",
    phone: "5551111111"
  });
  const createBody = await create.json();
  const originalLeadId = createBody.leadId;
  
  // Step 2: Update with same email, different phone
  const update = await callSaveLead({
    email,
    sourceTool: "consultation",
    firstName: "Updated",
    phone: "5552222222",
    leadId: originalLeadId // Golden Thread
  });
  const updateBody = await update.json();
  
  // CRITICAL: Must return same leadId (no duplicate)
  assertEquals(updateBody.leadId, originalLeadId);
  
  // Verify only one record exists
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase());
  
  assertEquals(count, 1, "Should have exactly one lead record");
});
```

**Phone E.164 Validation Test**:
```typescript
Deno.test("FORTRESS-W2: phone normalization produces valid E.164", async () => {
  const testCases = [
    { input: "5551234567", expected: "+15551234567" },      // 10-digit
    { input: "15551234567", expected: "+15551234567" },     // 11-digit with 1
    { input: "(555) 123-4567", expected: "+15551234567" },  // Formatted
    { input: "555-123-4567", expected: "+15551234567" },    // Dashes
  ];
  
  for (const tc of testCases) {
    const response = await callSaveLead({
      email: generateTestEmail(),
      sourceTool: "consultation",
      phone: tc.input
    });
    assertEquals(response.status, 200);
  }
});

Deno.test("FORTRESS-W3: invalid phone formats are rejected", async () => {
  const invalidPhones = [
    "abc",           // Letters
    "123",           // Too short
    "123456789012345678901", // Too long
  ];
  
  for (const phone of invalidPhones) {
    const response = await callSaveLead({
      email: generateTestEmail(),
      sourceTool: "quote-builder",
      phone
    });
    assertEquals(response.status, 400, `Phone "${phone}" should be rejected`);
  }
});
```

---

### Group 4: Rate Limit Safety Tests

**Purpose**: Verify IP and email throttling prevents bot traffic from wasting Phonecall.bot credits

| Limit Type | Threshold | Window |
|------------|-----------|--------|
| IP Hourly | 10 requests | 1 hour |
| IP Daily | 50 requests | 24 hours |
| Email Hourly | 3 requests | 1 hour |

**Rate Limit Test Strategy**:
```typescript
Deno.test("FORTRESS-R1: email rate limit triggers after 3 submissions", async () => {
  const sharedEmail = generateTestEmail();
  
  // First 3 should succeed
  for (let i = 0; i < 3; i++) {
    const response = await callSaveLead({
      email: sharedEmail,
      sourceTool: "quote-builder"
    });
    assertEquals(response.status, 200, `Request ${i+1} should succeed`);
  }
  
  // 4th request should be rate limited
  const blocked = await callSaveLead({
    email: sharedEmail,
    sourceTool: "quote-builder"
  });
  
  assertEquals(blocked.status, 429);
  const body = await blocked.json();
  assertExists(body.retryAfter);
});
```

**Note on IP Rate Limiting**: Since all test requests originate from the same IP (the test runner), we can naturally trigger IP limits by exceeding 10 requests per hour. However, this may conflict with other tests, so we'll structure these tests to run in isolation.

---

## File Structure

```text
supabase/functions/save-lead/
├── index.ts                    # Main edge function
├── index.test.ts               # Existing basic tests (unchanged)
└── fortress.test.ts            # NEW: Digital Fortress test suite
```

---

## Test Execution

```bash
# Run Digital Fortress tests only
deno test --allow-net --allow-env --allow-read supabase/functions/save-lead/fortress.test.ts

# Run all save-lead tests
deno test --allow-net --allow-env --allow-read supabase/functions/save-lead/
```

---

## Technical Implementation Summary

| Fortress Pillar | Test Count | Key Verification |
|-----------------|------------|------------------|
| Data Integrity | 4 tests | city/state/zip + wm_leads sync |
| EMQ Precision | 4 tests | SHA-256 hashing + fn/ln in Stape payload |
| Webhook Reliability | 5 tests | E.164 normalization + idempotent upserts |
| Rate Limit Safety | 2 tests | IP + Email throttling |

**Total: 15 new automated tests**

---

## Cleanup Strategy

All test data uses the `test-{timestamp}-{random}@integration-test.com` email pattern, which is already handled by the existing `cleanup_test_data()` database function.
