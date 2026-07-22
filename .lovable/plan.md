## Sprint 01 — Quote-First Foundation

Establish the `/scan` acquisition experience foundation. No scanner, OCR, OTP, lead gate, or fake results. `/beat-your-quote` stays frozen (read-only visual donor).

### Route collision check
Verified `src/App.tsx` — `/scan` is **not** registered. No collision. Safe to claim.

### Files to create

```text
src/pages/QuoteFirstLanding.tsx
src/features/quote-first/QuoteFirstFlow.tsx
src/features/quote-first/components/QuoteFirstHero.tsx
src/features/quote-first/components/QuoteFirstHeader.tsx
src/features/quote-first/types.ts
src/features/quote-first/index.ts
```

### Files to modify
- `src/App.tsx` — register `<Route path="/scan" element={<QuoteFirstLanding />} />` inside the existing public routes block (alongside `/beat-your-quote`, same guards). No other route touched.

### Component responsibilities

**`QuoteFirstLanding.tsx`** — thin page shell:
- `<SEO>` (title/desc/canonical `/scan`)
- `<QuoteFirstHeader />` (minimal, logo only)
- `<QuoteFirstFlow>` wrapping `<QuoteFirstHero />`
- No `Navbar`, no `UnifiedFooter`, no long-form marketing sections
- Dark forensic background scoped to this page via Tailwind utilities on the root wrapper (no global token mutation)

**`QuoteFirstHeader.tsx`** — reuses existing `windowman_logo_400.webp`. Just logo + wordmark. No nav links, no hamburger.

**`QuoteFirstHero.tsx`** — mature evolution of `DossierHero`, not a clone:
- Eyebrow: `INSTANT CONTRACTOR QUOTE AUDIT`
- H1: `Drop Your Estimate Here. Get an Independent Truth Report in 30 Seconds.` (native system font stack, `tracking-tight`, `leading-tight`, no typewriter font, no giant "THE WINDOW MAN" treatment, no CLASSIFIED stamp, no urgency ticker, no bouncing chevron)
- Supporting copy (locked, verbatim from Section 10)
- Dominant upload surface: dashed border card with drag/drop + click-to-select native `<input type="file" accept="image/*,.pdf">`
  - Surface heading: `Upload Your Estimate`
  - Supporting text: `PDF, photo, screenshot, or scanned estimate`
  - CTA button: `Choose My Estimate`
  - Microcopy: `No account required to start`
- Trust line row: `100% Free • No Sales Calls • Keeps Your Quote Private`
- Privacy line beneath: `Your quote stays private. No contractor receives it unless you choose to share it.`
- Palette: near-black bg (`bg-[#0A0F14]`), high-contrast white, restrained cyan accent via existing `--primary` token, subtle neutral borders. No neon glow, no scanline overlay, no shimmer badge.
- Accessible: semantic h1, keyboard-operable dropzone (button + hidden input pattern), visible focus ring, `prefers-reduced-motion` safe, no hover-only affordances.

**`QuoteFirstFlow.tsx`** — portable post-upload feature boundary (foundation only):
- Props: `children` (to render the hero) and internal state seam for `selectedFile: File | null`
- Exposes an `onFileSelected(file: File)` callback down to the hero via light context or render-prop
- On file selected: stores in local state only, renders a minimal dev-safe acknowledgement panel ("File received — analysis begins in a future release"). **No** upload, no OCR, no fake scan copy, no legacy `useGatedScanner`, no lead modal.
- Includes `reset()` seam for future sprints
- No coupling to `PreQuoteLeadModalV2`, `QuoteUploadGateModal`, `scanner-brain`, or Supabase

**`types.ts`** — `QuoteFirstFlowState`, `QuoteFirstContext` interface stubs for future sprints.

**`index.ts`** — barrel re-exports.

### Locked copy
All hero copy taken verbatim from Section 10. No paraphrasing.

### What is explicitly NOT built
No OCR, no `upload-quote` call, no scan session, no OTP, no lead form, no partial reveal, no Truth Report, no qualification, no exit-intent modal, no floating CTA, no chat, no booking modal, no analytics ladder redesign, no escape-hatch capture flow, no `/beat-your-quote` edits, no donor-repo imports, no V2/V3 naming, no sandbox files.

### Preservation guarantees
- `/beat-your-quote` and all files under `src/components/beat-your-quote/` untouched
- No global CSS token changes (all Quote-First styling via Tailwind utilities scoped to the new components)
- Existing router, primitives (`Button`, `Card`, `SEO`), logo asset, and `cn` utility reused
- No new fonts, no Google Fonts

### Responsive & a11y
- Mobile-first: verified visual composition at 320 / 375 / 390 / 430px — upload surface stays above fold, no horizontal overflow
- Desktop: constrained `max-w-2xl` hero column, intentional composition
- Semantic h1, keyboard-accessible file input, visible `focus-visible` rings, motion respects `prefers-reduced-motion`

### Verification steps before declaring PASS
1. `tsgo` typecheck clean
2. Navigate to `/scan` — renders
3. Navigate to `/beat-your-quote` — unchanged
4. Diff review confirms only the 6 new files + 1 App.tsx route line
5. Report 28/28 acceptance criteria status

### Stop condition
After the foundation renders and verification passes, stop. Do not proceed into scanner, OCR, OTP, qualification, or Truth Report work.
