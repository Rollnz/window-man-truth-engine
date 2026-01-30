

# Performance Optimization Plan for `/audit` Page

## Overview
Fix the 9.4s LCP by addressing missing assets and implementing lazy loading for below-the-fold components.

## Changes

### 1. Fix Missing Image References (Priority: Critical)

The `UploadZoneXRay` and `VaultSection` components reference background images that don't exist:
- `/images/audit/ai-scanner-bg.png`
- `/images/audit/vault-bg.png`

**Solution:** Replace image references with CSS gradient fallbacks that match the design aesthetic. This eliminates 404 errors and maintains visual consistency.

**Files to modify:**
- `src/components/audit/UploadZoneXRay.tsx`
- `src/components/audit/VaultSection.tsx`

---

### 2. Implement Lazy Loading (Priority: High)

Currently all 8 components load synchronously. Components below the initial viewport should be lazy loaded.

**Keep synchronous (above fold):**
- ScannerHeroWindow
- AnimatedStatsBar

**Lazy load (below fold):**
- UploadZoneXRay (user scrolls to this)
- HowItWorksXRay
- BeatOrValidateSection
- RedFlagGallery
- NoQuoteEscapeHatch
- VaultSection

**File to modify:**
- `src/pages/Audit.tsx`

**Implementation:**
```tsx
const UploadZoneXRay = lazy(() => import('@/components/audit/UploadZoneXRay'));
const HowItWorksXRay = lazy(() => import('@/components/audit/HowItWorksXRay'));
// ... etc

<Suspense fallback={<LoadingSkeleton />}>
  <UploadZoneXRay ... />
</Suspense>
```

---

### 3. Create Loading Skeleton (Priority: Medium)

Add a simple loading skeleton component to prevent layout shift during lazy loading.

**File to create:**
- `src/components/audit/LoadingSkeleton.tsx`

This will be a minimal dark-themed placeholder matching the page aesthetic.

---

### 4. Update Component Exports (Priority: Low)

Modify the barrel exports to support both default and named imports for lazy loading compatibility.

**File to modify:**
- `src/components/audit/index.ts`

---

## Technical Details

### Image Fallback Strategy

Replace the missing image references with CSS gradients that create similar depth:

```tsx
// Before (404 error)
backgroundImage: 'url(/images/audit/ai-scanner-bg.png)'

// After (CSS fallback)
background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, transparent 50%)'
```

### Lazy Loading Pattern

Using React's built-in `lazy()` and `Suspense`:

```tsx
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => 
  import('./components/audit/ComponentName').then(m => ({ default: m.ComponentName }))
);

// In render
<Suspense fallback={<div className="min-h-[400px] bg-slate-900 animate-pulse" />}>
  <LazyComponent />
</Suspense>
```

---

## Expected Results

| Metric | Before | After (Est.) |
|--------|--------|--------------|
| Initial JS Bundle | ~400KB | ~180KB |
| 404 Errors | 2 | 0 |
| LCP | 9.4s | ~3-4s |
| FCP | High | Lower |

---

## Files Summary

| File | Action |
|------|--------|
| `src/pages/Audit.tsx` | Modify - Add lazy loading |
| `src/components/audit/UploadZoneXRay.tsx` | Modify - Replace image with CSS |
| `src/components/audit/VaultSection.tsx` | Modify - Replace image with CSS |
| `src/components/audit/LoadingSkeleton.tsx` | Create - Loading placeholder |
| `src/components/audit/index.ts` | Modify - Add default exports |

