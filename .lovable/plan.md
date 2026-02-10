

# Before vs. After Visual Enhancement for Scanner Hero

## What This Does

Enhances the existing two-column scanner layout to match the high-fidelity reference mockups. The structure already exists -- `QuoteUploadZone` (left/Before) and `QuoteAnalysisResults` (right/After) -- but needs visual polish to create a stronger contrast between "confusing estimate chaos" and "clean AI gradecard."

---

## Current State vs. Target

The components are already in place:
- `SampleQuoteDocument.tsx` renders skeleton bars simulating a contract
- `FloatingCallout.tsx` renders red/amber/green flag badges
- `QuoteAnalysisResults.tsx` has a glassmorphic lock overlay

The gaps are **visual fidelity** improvements:

| Area | Current | Target |
|------|---------|--------|
| Sample quote | Generic gray skeleton bars | Readable fake text ("Impact Window Solutions LLC", line item labels) |
| Floating callouts | Simple left-border pills | Bolder badges with descriptions (e.g., "Price Warning: Price per opening looks high") |
| Upload CTA overlay | Small button on transparent bg | Prominent centered card with heading "Analyze Quote" |
| Right column lock | Basic blur + lock icon | Cleaner glassmorphic card with "Upload to Reveal" and benefit text |
| Section headers | Small red/blue text | Bolder, more distinct "Before" (red) and "After" (blue) labels |

---

## Files to Modify

### 1. `src/components/quote-scanner/SampleQuoteDocument.tsx` -- Realistic Contract

Replace generic skeleton bars with readable fake contract text to match the reference:

- Company header: "Impact Window Solutions LLC" with "Project Estimate #2847"
- "Project Summary" section header
- Customer line: "Customer: John Smith" with date
- Line items table with readable labels: "SWI Window...", "Picture Windo...", etc. with dollar amounts ($3,500, $3,600, $1,561)
- Bold total: "Project Cost $8,661"
- Fine print: "Subject to final pricing may vary" and "1-year labor warranty"

All text uses `text-muted-foreground/50` to look faded/document-like while remaining readable enough to sell the "confusing estimate" concept.

### 2. `src/components/quote-scanner/FloatingCallout.tsx` -- Descriptive Badges

Enhance badges to include short descriptions matching the reference screenshots:

**Updated props:** Add optional `description` field

**Updated callout configs with richer colors:**
- `price`: Red background badge -- "Price Warning:" + "Price per opening looks high for the market."
- `warning`: Yellow/amber badge -- "Warranty Issue:" + "20 years on product... but 1 year on labor."
- `missing`: Red badge -- "Missing Scope:" + "No clear mention of stucco repair or debris removal."
- `legal`: Red badge -- "Legal Clause:" + '"Subject to remeasure" -- surprise charges later.'

**Visual upgrade:**
- Larger padding, rounded-lg instead of rounded-r-md
- Colored backgrounds (not just border-left) for stronger visual impact
- Bold label text with regular description text
- Subtle shadow and scale animation on appear

### 3. `src/components/quote-scanner/QuoteUploadZone.tsx` -- Prominent Upload Card

Enhance the centered upload CTA overlay to match the reference "Analyze Quote" card:

- Larger white card with shadow (`bg-card shadow-xl rounded-2xl p-6`)
- Heading: "Analyze Quote" in bold green/primary text
- Subtext: "Take a photo or upload a screenshot. Supports JPG, PNG, and PDF. Max 10MB."
- Prominent dark "Upload Your Quote" button (full-width within the card)
- Card uses `backdrop-blur-sm` to sit cleanly over the sample document

### 4. `src/components/quote-scanner/QuoteAnalysisResults.tsx` -- Enhanced Lock State

Polish the locked/empty glassmorphic overlay:

- Larger lock icon with primary-tinted circle background
- "Upload to Reveal" as primary heading
- Sub-line: "See your instant Safety Score & Price Check"
- Subtle upward gradient fade on the placeholder scores beneath
- Clean white/50 glassmorphic background matching the reference

### 5. `src/components/quote-scanner/QuoteScannerHero.tsx` -- Section Context

Add a brief intro line above the two-column grid to frame the Before/After concept:

- Small centered text: "See what our AI finds in seconds" or similar
- This provides context before the user encounters the split layout

---

## Color Strategy

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Before header | `text-rose-600` | `text-rose-400` |
| After header | `text-primary` | `text-primary` |
| Price badge | `bg-red-500 text-white` | `bg-red-500 text-white` |
| Warning badge | `bg-amber-400 text-amber-900` | `bg-amber-500 text-black` |
| Missing badge | `bg-red-600 text-white` | `bg-red-500 text-white` |
| Legal badge | `bg-red-500 text-white` | `bg-red-500 text-white` |
| Upload card | `bg-card shadow-xl` | `bg-card shadow-xl` |
| Lock overlay | `bg-white/50 backdrop-blur-md` | `bg-background/60 backdrop-blur-md` |

---

## Mobile Behavior

- Columns stack vertically (already handled by `grid-cols-1 lg:grid-cols-2`)
- Floating callouts: Show 2 on mobile (hide the right-side ones as currently done via `hideMobile`)
- Upload card: Full-width, slightly smaller padding
- Lock overlay: Same glassmorphic treatment, responsive text sizing

---

## What Stays the Same

- All upload functionality (drag/drop, file select, analyzing state)
- `QuoteAnalysisResults` score display and unlocking logic
- `QuoteQA` chat component
- GTM tracking and lead capture flow
- The `forwardRef` on `QuoteUploadZone` for scroll-to-upload

The changes are purely visual -- no behavioral or data flow modifications.

