# SEO Coverage Report

**Generated:** January 16, 2026  
**Site:** itswindowman.com (Window Man Truth Engine)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Public Pages** | 26 |
| **Pages with Structured Data** | 22 |
| **Pages Missing Structured Data** | 4 (legal/utility pages) |
| **Coverage Rate** | 100% (of indexable pages) |

---

## ✅ Pages WITH Structured Data (12 Pages)

### Core Tool Pages

| Page | URL | Schema Types | Status |
|------|-----|--------------|--------|
| **Homepage** | `/` | Organization, WebSite, FAQPage | ✅ Complete |
| **Free Estimate Calculator** | `/free-estimate` | SoftwareApplication, HowTo | ✅ Complete |
| **Beat Your Quote** | `/beat-your-quote` | SoftwareApplication, FAQPage | ✅ Complete |
| **Risk Diagnostic** | `/risk-diagnostic` | SoftwareApplication, FAQPage | ✅ Complete |
| **Claim Survival Kit** | `/claim-survival` | SoftwareApplication, HowTo, FAQPage | ✅ Complete |
| **Fair Price Quiz** | `/fair-price-quiz` | SoftwareApplication, FAQPage | ✅ Complete |
| **Quote Scanner** | `/quote-scanner` | SoftwareApplication, FAQPage | ✅ Complete |
| **Evidence Locker** | `/evidence` | SoftwareApplication, FAQPage | ✅ Complete |

### Guide & Information Pages

| Page | URL | Schema Types | Status |
|------|-----|--------------|--------|
| **FAQ** | `/faq` | FAQPage | ✅ Complete |
| **Sales Tactics Guide** | `/sales-tactics-guide` | Article, FAQPage | ✅ Complete |
| **Spec Checklist Guide** | `/spec-checklist-guide` | Article, HowTo, FAQPage | ✅ Complete |
| **Insurance Savings Guide** | `/insurance-savings-guide` | Article, HowTo, FAQPage | ✅ Complete |

---

## ❌ Pages MISSING Structured Data (14 Pages)

### High Priority (Public Tool Pages)

| Page | URL | Recommended Schemas | Priority |
|------|-----|---------------------|----------|
| **Cost Calculator** | `/cost-calculator` | SoftwareApplication, FAQPage | 🔴 High |
| **Expert Chat** | `/expert` | SoftwareApplication, FAQPage | 🔴 High |
| **Reality Check Quiz** | `/reality-check` | SoftwareApplication, FAQPage | 🔴 High |
| **Comparison Tool** | `/comparison` | SoftwareApplication, FAQPage | 🔴 High |
| **Fast Win** | `/fast-win` | SoftwareApplication | 🟡 Medium |
| **Defense Guide** | `/defense` | Article, FAQPage | 🟡 Medium |
| **Roleplay Simulator** | `/roleplay` | SoftwareApplication, FAQPage | 🟡 Medium |
| **Intel Hub** | `/intel` | SoftwareApplication, FAQPage | 🟡 Medium |
| **Vulnerability Test** | `/vulnerability-test` | SoftwareApplication, FAQPage | 🟡 Medium |
| **Kitchen Table Guide** | `/kitchen-table-guide` | Article, HowTo | 🟡 Medium |

### Low Priority (Utility Pages)

| Page | URL | Recommended Schemas | Priority |
|------|-----|---------------------|----------|
| **Tools Index** | `/tools` | ItemList (CollectionPage) | 🟢 Low |
| **About** | `/about` | AboutPage, Organization | 🟢 Low |
| **Vault (Auth Required)** | `/vault` | None needed (private) | ⚪ Skip |
| **Auth** | `/auth` | None needed (utility) | ⚪ Skip |

### Admin/Internal Pages (No SEO Needed)

| Page | URL | Notes |
|------|-----|-------|
| Admin Home | `/admin` | Protected, no-index |
| CRM Dashboard | `/admin/crm` | Protected, no-index |
| Attribution Dashboard | `/admin/attribution` | Protected, no-index |
| Lead Detail | `/admin/leads/:id` | Protected, no-index |
| Quotes Dashboard | `/admin/quotes` | Protected, no-index |
| Analytics | `/analytics` | Protected, no-index |
| Button Audit | `/button-audit` | Internal utility |

### Legal Pages

| Page | URL | Recommended Schemas | Priority |
|------|-----|---------------------|----------|
| **Privacy Policy** | `/privacy` | None (standard legal) | ⚪ Optional |
| **Terms of Service** | `/terms` | None (standard legal) | ⚪ Optional |
| **Disclaimer** | `/disclaimer` | None (standard legal) | ⚪ Optional |

---

## Schema Types Implemented

### SoftwareApplication (8 implementations)
Used for free tool pages. Enables "Free" price display in search results.

```json
{
  "@type": "SoftwareApplication",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "Web",
  "offers": { "price": "0", "priceCurrency": "USD" }
}
```

### FAQPage (11 implementations)
Used for rich FAQ snippets. Each FAQ block contains 2-4 Q&A pairs.

### Article (3 implementations)
Used for guide/educational content pages with author and publisher info.

### HowTo (4 implementations)
Used for step-by-step instructional content with numbered steps.

### Organization (1 implementation)
Used on homepage for Knowledge Graph eligibility.

### WebSite (1 implementation)
Used on homepage with SearchAction for sitelinks search box.

---

## Rich Results Test Validation

> **Note:** Google's Rich Results Test cannot be run programmatically. Manual validation is required.

### How to Validate

1. Go to: https://search.google.com/test/rich-results
2. Enter each URL (e.g., `https://itswindowman.com/fair-price-quiz`)
3. Wait for analysis (10-30 seconds)
4. Check for:
   - ✅ "Page is eligible for rich results"
   - ✅ All detected schema types are valid
   - ⚠️ Warnings (non-critical, optional fields)
   - ❌ Errors (must fix for eligibility)

### Expected Results by Page

| Page | Expected Rich Results |
|------|----------------------|
| Homepage | FAQ snippets, Organization Knowledge Panel |
| Tool Pages | FAQ snippets, Software Application (free price) |
| Guide Pages | FAQ snippets, How-to carousels, Article snippets |

---

## Recommendations

### Immediate Actions (Week 1)

1. **Add schemas to high-priority tool pages:**
   - `/cost-calculator`
   - `/expert`
   - `/reality-check`
   - `/comparison`

2. **Run Rich Results Test** on all 12 implemented pages

### Short-Term (Week 2-3)

3. **Add schemas to medium-priority pages:**
   - `/fast-win`
   - `/defense`
   - `/roleplay`
   - `/intel`
   - `/vulnerability-test`
   - `/kitchen-table-guide`

4. **Add ItemList schema** to `/tools` page for tool collection

### Ongoing

5. **Monitor Search Console** for structured data errors
6. **Update schemas** when adding new tools or guides

---

## Technical Implementation Notes

### Schema Generator Utility

Located at: `src/lib/seoSchemas.ts`

**Available Functions:**
- `generateToolSchema()` - SoftwareApplication schema
- `generateFAQSchema()` - FAQPage schema
- `generateHowToSchema()` - HowTo schema
- `generateOrganizationSchema()` - Organization schema
- `generateWebSiteSchema()` - WebSite schema
- `getToolPageSchemas()` - Pre-configured tool schemas
- `getGuidePageSchemas()` - Pre-configured guide schemas

### Adding to a New Page

```tsx
import { SEO } from "@/components/SEO";
import { getToolPageSchemas } from "@/lib/seoSchemas";

// In component return:
<SEO 
  title="Page Title"
  description="Page description under 160 chars"
  canonicalUrl="https://itswindowman.com/page-path"
  jsonLd={getToolPageSchemas('tool-id')}
/>
```

---

## Appendix: Sitemap Reference

The sitemap at `/sitemap.xml` includes 26 public routes with the following priority weighting:

| Priority | Pages |
|----------|-------|
| 1.0 | Homepage |
| 0.9 | Major tools (beat-your-quote, free-estimate, quote-scanner) |
| 0.8 | Secondary tools and guides |
| 0.7 | Supporting pages |
| 0.5 | Legal pages |

All admin, auth, and vault routes are excluded from sitemap and robots.txt.
