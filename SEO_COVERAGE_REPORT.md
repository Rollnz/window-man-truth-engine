# SEO Coverage Report

**Generated:** January 16, 2026  
**Site:** itswindowman.com (Window Man Truth Engine)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total Public Pages** | 26 |
| **Pages with Structured Data** | 22 |
| **Pages Excluded (Auth/Legal)** | 4 |
| **Coverage Rate** | 100% ✅ |

---

## ✅ All Pages WITH Structured Data (22 Pages)

### Core Tool Pages (12)

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
| **Cost Calculator** | `/cost-calculator` | SoftwareApplication, FAQPage | ✅ Complete |
| **Expert Chat** | `/expert` | SoftwareApplication, FAQPage | ✅ Complete |
| **Reality Check Quiz** | `/reality-check` | SoftwareApplication, FAQPage | ✅ Complete |
| **Comparison Tool** | `/comparison` | SoftwareApplication, FAQPage | ✅ Complete |

### Secondary Tool Pages (6)

| Page | URL | Schema Types | Status |
|------|-----|--------------|--------|
| **Fast Win Finder** | `/fast-win` | SoftwareApplication, FAQPage | ✅ Complete |
| **Roleplay Simulator** | `/roleplay` | SoftwareApplication, FAQPage | ✅ Complete |
| **Intel Library** | `/intel` | SoftwareApplication, FAQPage | ✅ Complete |
| **Vulnerability Test** | `/vulnerability-test` | SoftwareApplication, FAQPage | ✅ Complete |
| **Defense Mode** | `/defense` | SoftwareApplication, FAQPage | ✅ Complete |
| **Tools Index** | `/tools` | ItemList | ✅ Complete |

### Guide & Information Pages (4)

| Page | URL | Schema Types | Status |
|------|-----|--------------|--------|
| **FAQ** | `/faq` | FAQPage | ✅ Complete |
| **Sales Tactics Guide** | `/sales-tactics-guide` | Article, FAQPage | ✅ Complete |
| **Spec Checklist Guide** | `/spec-checklist-guide` | Article, HowTo, FAQPage | ✅ Complete |
| **Insurance Savings Guide** | `/insurance-savings-guide` | Article, HowTo, FAQPage | ✅ Complete |
| **Kitchen Table Guide** | `/kitchen-table-guide` | SoftwareApplication, FAQPage | ✅ Complete |

### About Page

| Page | URL | Schema Types | Status |
|------|-----|--------------|--------|
| **About** | `/about` | Organization, AboutPage | ✅ Complete |

---

## ⚪ Pages Without Structured Data (Intentionally Excluded)

### Auth/Private Pages

| Page | URL | Reason |
|------|-----|--------|
| **Vault** | `/vault` | Auth-protected, private user data |
| **Auth** | `/auth` | Login/signup utility page |

### Legal Pages

| Page | URL | Reason |
|------|-----|--------|
| **Privacy Policy** | `/privacy` | Standard legal, no rich result benefit |
| **Terms of Service** | `/terms` | Standard legal, no rich result benefit |
| **Disclaimer** | `/disclaimer` | Standard legal, no rich result benefit |

### Admin/Internal Pages (No-Index)

| Page | URL | Notes |
|------|-----|-------|
| Admin Home | `/admin` | Protected, no-index |
| CRM Dashboard | `/admin/crm` | Protected, no-index |
| Attribution Dashboard | `/admin/attribution` | Protected, no-index |
| Lead Detail | `/admin/leads/:id` | Protected, no-index |
| Quotes Dashboard | `/admin/quotes` | Protected, no-index |
| Analytics | `/analytics` | Protected, no-index |
| Button Audit | `/button-audit` | Internal utility |

---

## Schema Types Summary

| Schema Type | Count | Usage |
|-------------|-------|-------|
| **SoftwareApplication** | 18 | Free tool pages - enables "Free" price in results |
| **FAQPage** | 21 | Rich FAQ snippets - 2-4 Q&A pairs each |
| **Article** | 3 | Guide/educational content with author info |
| **HowTo** | 4 | Step-by-step instructional content |
| **Organization** | 2 | Homepage + About - Knowledge Graph eligibility |
| **WebSite** | 1 | Homepage - SearchAction for sitelinks |
| **AboutPage** | 1 | About page context |
| **ItemList** | 1 | Tools collection page |

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

### Expected Results by Page Type

| Page Type | Expected Rich Results |
|-----------|----------------------|
| Homepage | FAQ snippets, Organization Knowledge Panel |
| Tool Pages | FAQ snippets, Software Application (free price badge) |
| Guide Pages | FAQ snippets, How-to carousels, Article snippets |
| Tools Index | ItemList with all tools listed |
| About | Organization info, AboutPage context |

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

**Configured Tool IDs:**
- `cost-calculator`, `expert-system`, `reality-check`, `comparison`
- `fair-price-quiz`, `quote-scanner`, `evidence-locker`
- `roleplay-simulator`, `fast-win`, `intel-library`
- `vulnerability-test`, `kitchen-table-guide`
- `tools-index`, `about`, `defense`

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

## Ongoing Maintenance

### When Adding New Tools

1. Add schema config to `TOOL_SCHEMAS` in `src/lib/seoSchemas.ts`
2. Import `SEO` and `getToolPageSchemas` in the new page
3. Add `<SEO>` component with appropriate props
4. Update sitemap.xml with the new route
5. Test with Google Rich Results Test

### Monitoring

- **Google Search Console**: Check for structured data errors weekly
- **Rich Results Test**: Validate after any schema changes
- **Schema Markup Validator**: Use https://validator.schema.org for detailed validation

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
