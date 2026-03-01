

# Fix: Add missing `generateFAQSchema` import in FAQ.tsx

## Problem
`FAQ.tsx` line 9 imports `getGuidePageSchemas` and `getBreadcrumbSchema` from `@/lib/seoSchemas/index`, but line 90 calls `generateFAQSchema(faqs)` which is not imported, causing a runtime crash.

## Fix
One line change in `src/pages/FAQ.tsx` line 9:

**Before:**
```typescript
import { getGuidePageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
```

**After:**
```typescript
import { generateFAQSchema, getGuidePageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
```

`generateFAQSchema` is already exported from `@/lib/seoSchemas/index.ts` (re-exported from `./tool`). No other changes needed.

