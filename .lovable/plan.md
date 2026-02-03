

# Remove ConversionBar Section from Quote Scanner Page

## Summary

Remove the white horizontal call-to-action strip that appears between the hero and the scanner section on `/ai-scanner`.

## What Will Be Removed

The following content will be deleted:
- "Scan your quote, then jump straight into a verified estimate." (headline)
- "Our team double-checks pricing, red flags, and negotiates the best numbers for you." (subheadline)
- "No spam. We only use your info to prep your tailored inspection plan." (helper text - default prop)
- "Start your free estimate" button

## Changes

**File: `src/pages/QuoteScanner.tsx`**

1. Remove the `ConversionBar` import (line 11)
2. Remove the container div and ConversionBar component (lines 127-133)

## Result

After this change, the page flow will be:
- Pillar Breadcrumb
- QuoteScannerHero
- Scanner Section ("Before: Just a Confusing Estimate")

The white CTA strip will no longer appear between the hero and scanner sections.

