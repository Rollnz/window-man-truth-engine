

# Fix wm_sessions 409 Duplicate Key + GTM fbq Guard Guidance

## Problem 1: wm_sessions 409 (Code Fix)

The network logs show:
```
POST wm_sessions -> 409 "duplicate key value violates unique constraint"
```

**Root cause:** `createOrRefreshSession()` in `src/lib/windowTruthClient.ts` does a `select` to check if the session exists, then an `insert` if not found. Under concurrent calls (multiple components mounting simultaneously, page reloads), the select returns empty but the row is inserted by a parallel call, causing a 409.

**Fix:** Replace the `insert` with `upsert` using `onConflict: 'id'`. This makes the operation idempotent -- if the row exists, it updates; if not, it inserts.

**File:** `src/lib/windowTruthClient.ts`

Change the insert block (lines 97-110) from:
```typescript
const { error } = await supabase
  .from('wm_sessions')
  .insert({
    id: newSessionId,
    anonymous_id: anonymousId,
    landing_page: window.location.pathname,
    user_agent: navigator.userAgent,
    referrer: attribution.referrer,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
  });
```

To:
```typescript
const { error } = await supabase
  .from('wm_sessions')
  .upsert({
    id: newSessionId,
    anonymous_id: anonymousId,
    landing_page: window.location.pathname,
    user_agent: navigator.userAgent,
    referrer: attribution.referrer,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
  }, { onConflict: 'id', ignoreDuplicates: true });
```

Using `ignoreDuplicates: true` means: if the session already exists, do nothing (don't overwrite attribution data from the first visit). This is safer than a full upsert that would overwrite landing_page/referrer on subsequent loads.

---

## Problem 2: fbq is not defined (GTM Container Fix -- Manual)

This is NOT a code issue. Your site never calls `fbq` directly. The crash happens inside your GTM container's "Meta - Lead Conversion" Custom HTML tag.

### What to do in GTM (tagmanager.google.com):

**Step 1: Verify Meta Pixel Base Code tag**
- Open GTM > Tags > "Meta Pixel - Base Code"
- Confirm its trigger is "Initialization - All Pages" (not just "All Pages")
- This ensures `fbq` is defined before any event tags fire

**Step 2: Confirm Tag Sequencing on "Meta - Lead Conversion"**
- Open GTM > Tags > "Meta - Lead Conversion"
- Under Tag Sequencing > Setup Tag, confirm "Meta Pixel - Base Code" is set
- Your GTM_TAG_CONFIGURATION.md says this is already configured -- verify it survived recent edits

**Step 3: Add defensive guard to the Custom HTML**

Change the tag HTML from:
```html
<script>
fbq('track', 'Lead', {
  value: {{DLV - value}},
  currency: {{DLV - currency}}
}, {
  eventID: '{{DLV - event_id}}'
});
</script>
```

To:
```html
<script>
if (typeof window.fbq === 'function') {
  fbq('track', 'Lead', {
    value: {{DLV - value}},
    currency: {{DLV - currency}}
  }, {
    eventID: '{{DLV - event_id}}'
  });
} else {
  console.warn('[GTM] Meta Pixel not loaded, Lead event skipped');
}
</script>
```

**Step 4: Also guard "Meta - High Engagement (60+)"**
- This is another Custom HTML tag that likely calls `fbq`
- Apply the same `typeof window.fbq === 'function'` guard

**Step 5: Publish GTM container**

### Why this matters

Even with perfect sequencing, `fbq` can be undefined when:
- Ad blockers prevent fbevents.js from loading
- DNS/network issues with Meta's CDN
- Stape proxy misconfiguration for Meta endpoints

The guard ensures your site never crashes from a missing third-party script, while still firing the event when Meta is available.

---

## Summary

| Issue | Fix Location | Type |
|-------|-------------|------|
| wm_sessions 409 duplicate key | `src/lib/windowTruthClient.ts` line 97 | Code change (upsert) |
| fbq is not defined crash | GTM container UI | Manual GTM configuration |
| Meta base pixel timing | GTM container UI | Verify Initialization trigger |
| Meta event tags unguarded | GTM container UI | Add typeof guard |

## No other code changes needed

- The Stape loader in `index.html` is correct
- The `save-lead` edge function (with `crypto.randomUUID()` for event_id) is correct
- All frontend form tracking (dataLayer pushes) is correct
- Attribution capture is unaffected

