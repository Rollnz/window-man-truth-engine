
# SEO Schema Fixes: Address & Date Issues

## Summary
Fix two Google Rich Results Test errors: (1) Replace LocalBusiness with Organization schema for a home-based/online business, and (2) verify all article dates follow correct chronological order.

---

## Issue Analysis

### 1. LocalBusiness Schema Problem

**Current State:**
- `index.html` has a minimal static LocalBusiness schema (no address at all)
- `src/lib/seoSchemas/localBusiness.ts` generates another LocalBusiness with partial address
- You have **duplicate conflicting schemas** on the same page

**Why It Fails:**
- `LocalBusiness` type **requires** a full street address for brick-and-mortar stores
- For home-based or online-only businesses, Google treats this as a critical error
- Your business serves all of Florida via paid ads - no physical storefront

**Solution:**
- Replace `LocalBusiness` with `Organization` schema (address is recommended, not required)
- Remove the duplicate in `index.html`
- Enhance `areaServed` with major Florida cities for statewide coverage

### 2. Article Date Audit

**Current State:**
All pillar pages and guides show:
- `datePublished: '2025-01-16'`
- `dateModified: '2025-01-17'`

**Verdict:** ✅ These dates are **chronologically correct** (17th is after 16th in the same year).

However, since the current date is February 2026, you may want to update these to reflect when content was actually last modified for freshness signals.

---

## Changes

### File 1: `index.html`

**Remove lines 61-71** (the duplicate minimal LocalBusiness schema):
```html
<!-- JSON-LD Structured Data for Local Business SEO -->
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Its Window Man",
    "description": "Its Window Man - The Homeowners Hurricane Hero",
    "logo": "/icon-512.webp",
    "image": "/og-image.webp"
  }
</script>
```

**Reason:** The React app generates complete schema via Helmet. The static one is incomplete and conflicts.

---

### File 2: `src/lib/seoSchemas/localBusiness.ts`

**Replace `generateLocalBusinessSchema` with `generateServiceBusinessSchema`:**

```typescript
/**
 * Service Business Schema Generator
 * Uses Organization type for online/home-based businesses
 * (LocalBusiness requires physical storefront address)
 */

const SITE_URL = "https://itswindowman.com";

/**
 * Major Florida metropolitan areas for statewide coverage
 */
const FLORIDA_SERVICE_AREAS = [
  // Statewide
  { "@type": "State", "name": "Florida", "sameAs": "https://en.wikipedia.org/wiki/Florida" },
  // Tri-County Focus
  { "@type": "AdministrativeArea", "name": "Palm Beach County" },
  { "@type": "AdministrativeArea", "name": "Broward County" },
  { "@type": "AdministrativeArea", "name": "Miami-Dade County" },
  // Major Cities (for paid ad coverage)
  { "@type": "City", "name": "Miami", "sameAs": "https://en.wikipedia.org/wiki/Miami" },
  { "@type": "City", "name": "Fort Lauderdale" },
  { "@type": "City", "name": "West Palm Beach" },
  { "@type": "City", "name": "Tampa", "sameAs": "https://en.wikipedia.org/wiki/Tampa,_Florida" },
  { "@type": "City", "name": "Orlando", "sameAs": "https://en.wikipedia.org/wiki/Orlando,_Florida" },
  { "@type": "City", "name": "Jacksonville", "sameAs": "https://en.wikipedia.org/wiki/Jacksonville,_Florida" },
  { "@type": "City", "name": "Naples" },
  { "@type": "City", "name": "Sarasota" },
  { "@type": "City", "name": "Fort Myers" },
  { "@type": "City", "name": "Boca Raton" },
  { "@type": "City", "name": "Pompano Beach" },
  { "@type": "City", "name": "Hollywood" },
  { "@type": "City", "name": "Coral Springs" },
  { "@type": "City", "name": "Cape Coral" },
];

export function generateServiceBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#servicebusiness`,
    "name": "Window Man Your Hurricane Hero",
    "description": "Free AI-powered tools to help Florida homeowners get fair window replacement quotes and avoid overpaying.",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icon-512.webp`,
    "image": `${SITE_URL}/icon-512.webp`,
    "telephone": "+1-561-468-5571",
    "email": "support@itswindowman.com",
    "areaServed": FLORIDA_SERVICE_AREAS,
    "priceRange": "Free",
    "serviceType": [
      "Window Quote Analysis",
      "Impact Window Cost Calculator",
      "Hurricane Window Verification"
    ],
    "sameAs": [
      "https://www.facebook.com/its.windowman",
      "https://twitter.com/itswindowman"
    ]
  };
}
```

**Keep existing functions** but rename the export for backward compatibility:
```typescript
// Backward compatibility alias
export const generateLocalBusinessSchema = generateServiceBusinessSchema;
```

---

### File 3: `src/lib/seoSchemas/index.ts`

Update the export to use the new function name:
```typescript
export { generateServiceBusinessSchema, generateLocalBusinessSchema } from './localBusiness';
```

---

### File 4: `src/pages/Index.tsx`

Update the comment to reflect the change:
```typescript
const homepageSchema = [
  // Organization schema for statewide service business (not LocalBusiness)
  generateLocalBusinessSchema(),
  // ... rest unchanged
];
```

---

## Why This Plan Is Optimal

| Approach | Pros | Cons |
|----------|------|------|
| **Organization (Chosen)** | No address required, Google recommends for online services, supports areaServed | Loses some local SEO signals |
| LocalBusiness + Fake Address | Keeps LocalBusiness type | Google penalizes fake/incomplete addresses |
| ProfessionalService | More specific type | Still requires address in many validators |

**Organization is optimal because:**
1. Google explicitly recommends it for businesses without physical storefronts
2. Your business model is online-first (lead capture via paid ads)
3. `areaServed` with cities covers your statewide Florida footprint
4. Eliminates the "Missing Address" error without fabricating data

---

## Files Changed

| File | Action |
|------|--------|
| `index.html` | Remove duplicate LocalBusiness schema (lines 61-71) |
| `src/lib/seoSchemas/localBusiness.ts` | Add Organization-based schema with Florida cities |
| `src/lib/seoSchemas/index.ts` | Update exports |
| `src/pages/Index.tsx` | Update comment only |

---

## Technical Notes

### Date Issue Clarification
Your article dates are **correctly ordered** in the current codebase:
- `datePublished: '2025-01-16'`
- `dateModified: '2025-01-17'`

If you want to update these to current dates for freshness signals, I can add that to the plan. Just confirm the actual publication and modification dates you want to use.

### areaServed Best Practices
The schema includes:
- **State level**: Florida (for broad coverage)
- **County level**: Palm Beach, Broward, Miami-Dade (your focus areas)
- **City level**: 14 major Florida cities (matches paid ad targeting)

This gives Google clear geographic relevance signals without requiring a physical address.
