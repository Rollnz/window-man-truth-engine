
# Implementation Plan: Standalone `/audit` Landing Page

## Overview
Create a completely standalone landing page at `/audit` with **zero visual inheritance** from the main site. No navbar, no footer, no global theme variables - a fully isolated dark-themed CRO page that matches the reference design exactly.

## Architecture Summary

```text
/audit (Standalone - NOT inside PublicLayout)
├── ScannerHeroWindow (glass window hero with scan animation)
├── AnimatedStatsBar (count-up stats on scroll)
├── UploadZoneXRay (X-ray style upload with floating callouts)
├── HowItWorksXRay (4-step process cards)
├── BeatOrValidateSection (win-win value proposition)
├── RedFlagGallery (carousel of red flag examples)
├── NoQuoteEscapeHatch (alternative paths: calculator, chat, consultation)
└── VaultSection (retention engine / digital fortress)
```

## Style Isolation Strategy

The uploaded components already use **hardcoded Tailwind classes** (`bg-slate-950`, `text-cyan-400`, `border-slate-700`) instead of CSS variables (`bg-background`, `text-foreground`). This means they are naturally theme-independent.

To ensure complete isolation:

1. **Route outside PublicLayout** - The `/audit` route will be registered alongside `/auth` and `/vault` (outside the `<Route element={<PublicLayout />}>` wrapper)

2. **No Navbar/Footer** - The page will have its own minimal header or none at all

3. **CSS Reset Wrapper** - A lightweight wrapper class will neutralize any inherited global styles (heading weights, letter-spacing)

---

## Files to Create

### 1. Background Images
```text
public/images/audit/ai-scanner-bg.png
public/images/audit/vault-bg.png
```

### 2. Components Directory
```text
src/components/audit/
├── ScannerHeroWindow.tsx    - Glass window hero with parallax + scan line
├── AnimatedStatsBar.tsx     - Intersection Observer count-up stats
├── UploadZoneXRay.tsx       - X-ray document upload with callouts
├── HowItWorksXRay.tsx       - 4-step process explanation
├── BeatOrValidateSection.tsx - Fork-in-the-road value proposition
├── RedFlagGallery.tsx       - Swipeable red flag carousel
├── NoQuoteEscapeHatch.tsx   - Alternative conversion paths
├── VaultSection.tsx         - Retention engine section
└── index.ts                 - Barrel exports
```

### 3. Page File
```text
src/pages/Audit.tsx
```

---

## Technical Changes

### A. Route Registration (App.tsx)

Add the `/audit` route **outside** the `<Route element={<PublicLayout />}>` block, alongside other standalone pages:

```tsx
{/* Private/Standalone Routes (no footer system) */}
<Route path="/auth" element={<Auth />} />
<Route path="/vault" element={...} />
<Route path="/audit" element={<Audit />} />  {/* NEW - Standalone */}
```

### B. CSS Keyframes (index.css)

Add the `scanDown` animation for the hero scan line effect:

```css
@keyframes scanDown {
  0%, 100% {
    top: -10%;
    opacity: 0;
  }
  10% { opacity: 1; }
  90% { opacity: 1; }
  95% {
    top: 110%;
    opacity: 0;
  }
}

.animate-scan-down {
  animation: scanDown 4s ease-in-out infinite;
}
```

### C. Routing Adapter

All uploaded components use `wouter` for routing. They will be adapted to use `react-router-dom`:

```tsx
// FROM (wouter)
import { Link } from 'wouter';

// TO (react-router-dom)
import { Link } from 'react-router-dom';
```

### D. Internal Route Updates

Update internal links to match existing project routes:
- `/calculator` → `/cost-calculator`
- `/chat` → `/expert`
- `/consultation` → `/consultation` (unchanged)
- `/vault` → `/vault` (unchanged)

---

## Component Implementation Details

### ScannerHeroWindow
- Full-viewport height hero with `bg-slate-950` background
- Glass window frame effect with parallax mouse tracking
- Animated cyan scan line (`animate-scan-down`)
- Alert badge: "Florida homeowners overpay by $8,000–$15,000"
- Primary CTA: "Scan My Quote Free" → scrolls to upload section
- Trust signals at bottom (stats pills)

### AnimatedStatsBar
- Intersection Observer triggers count-up animation
- 4 animated stat cards:
  - $4.2M+ Overcharges Detected
  - 12,847+ Quotes Analyzed
  - 94% Red Flag Detection Rate
  - 8,400+ Florida Homeowners Protected
- Subtle gradient pulse background

### UploadZoneXRay
- Two-column layout: Before (quote with callouts) | After (blurred gradecard)
- Animated floating callouts (price warning, missing scope, legal alert)
- Drag-and-drop file upload zone
- Connects to `onFileSelect` prop for backend integration
- Background image: `/images/audit/ai-scanner-bg.png`

### HowItWorksXRay
- 4-step vertical timeline:
  1. Drop Your Quote
  2. AI X-Ray Scan (highlighted)
  3. Red Flags Exposed
  4. Your Verdict
- CTA button scrolls back to upload zone

### BeatOrValidateSection
- Two-path card layout:
  - Path A: "Your Quote is FAIR" (Validator) - green theme
  - Path B: "We'll BEAT IT" (Champion) - cyan theme
- Win-Win Promise badge at bottom

### RedFlagGallery
- Horizontally scrollable carousel
- 5 red flag cards with examples:
  - Hidden Commission
  - Vague Labor Terms
  - No Permit Mention
  - Bait-and-Switch Pricing
  - Warranty Loopholes
- Navigation arrows and dot indicators

### NoQuoteEscapeHatch
- 3 alternative action cards:
  1. Get an Instant Estimate → `/cost-calculator`
  2. Talk to Our AI Expert → `/expert`
  3. Request a Real Quote → `/consultation`

### VaultSection
- Digital fortress theme with lock iconography
- Background image: `/images/audit/vault-bg.png`
- Features list: Store quotes, Access anywhere, Encrypted
- CTA: "Access My Vault" → `/vault`

---

## Page Structure (Audit.tsx)

```tsx
export default function Audit() {
  const uploadRef = useRef<HTMLDivElement>(null);
  
  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  const handleFileSelect = (file: File) => {
    // Navigate to existing /ai-scanner with file in state
    navigate('/ai-scanner', { state: { file } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO ... />
      <ScannerHeroWindow onCTAClick={scrollToUpload} />
      <AnimatedStatsBar />
      <div ref={uploadRef}>
        <UploadZoneXRay onFileSelect={handleFileSelect} />
      </div>
      <HowItWorksXRay onCTAClick={scrollToUpload} />
      <BeatOrValidateSection />
      <RedFlagGallery />
      <NoQuoteEscapeHatch />
      <VaultSection />
    </div>
  );
}
```

---

## File Upload Integration

The page uses a simplified redirect flow:
1. User drops/selects file in UploadZoneXRay
2. `handleFileSelect` callback receives the File object
3. Navigate to existing `/ai-scanner` with file in router state
4. Existing QuoteScanner page handles the analysis

---

## Summary of Changes

| File | Action |
|------|--------|
| `public/images/audit/ai-scanner-bg.png` | Create (copy uploaded) |
| `public/images/audit/vault-bg.png` | Create (copy uploaded) |
| `src/components/audit/*.tsx` | Create (8 components) |
| `src/components/audit/index.ts` | Create (barrel exports) |
| `src/pages/Audit.tsx` | Create (page component) |
| `src/App.tsx` | Modify (add route) |
| `src/index.css` | Modify (add scanDown keyframes) |

---

## Accessibility & Performance

- All images use appropriate alt text
- Focus management for keyboard navigation
- Lazy-loaded images for performance
- CSS animations respect `prefers-reduced-motion`
- Components use semantic HTML structure
- No global theme variables = predictable rendering
