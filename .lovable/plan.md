

# Add SAMPLE_REPORT Route Constant

## Summary

Add the missing `SAMPLE_REPORT` route to the centralized navigation config so it can be referenced cleanly in `PreQuoteLeadModal` and elsewhere.

## Change

### `src/config/navigation.ts`

Add one line under the Primary Tools section, after `QUOTE_SCANNER`:

```
SAMPLE_REPORT: '/sample-report',
```

This slots it between `QUOTE_SCANNER` and `CLAIM_SURVIVAL` in the existing list.

## Why

The `/sample-report` path is already used across the app but lacks a constant in the `ROUTES` object. Adding it here keeps routing DRY and prepares for the post-submission routing logic in `PreQuoteLeadModal`.

