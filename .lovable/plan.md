

# 5 CRO Layout Options for Before/After Hero Images on /ai-scanner

## The Assets

- **Image A** (BEFORE): Silhouette surrounded by red question marks and chaos. Emotional state: confusion, vulnerability.
- **Image B** (AFTER): Silhouette with shield, green checkmarks, data dashboards. Emotional state: confidence, control.
- **Image C** (AI Decoded Results): Forensic clipboard showing the 6-category audit checklist. Product proof artifact.

## Current Page Structure (relevant section)

```text
QuoteScannerHero
UrgencyTicker
SectionFrame ("Forensic Pipeline" + ScanPipelineStrip)
  |
  v  <--- images would go somewhere around here
  |
Before/After Two-Column Cards (upload zone + report preview)
```

---

## Option 1: Paired Column Headers (Recommended for CRO)

Place Image A directly above the BEFORE card and Image B directly above the AFTER card, inside the same `grid grid-cols-1 lg:grid-cols-2` container. Each image sits as a `max-w-[280px]` centered thumbnail with rounded corners and a subtle shadow, acting as the emotional "thesis statement" for the card below it.

**Why it converts:** The user sees the emotional contrast (chaos vs. control) and immediately understands what the upload action transforms. The images pre-frame the value proposition before the user even reads the card content.

**Layout:**
```text
[BEFORE image]          [AFTER image]
[Upload card]           [Report preview card]
```

**Implementation:** Add two `<img>` elements inside the existing `AnimateOnScroll` wrappers, above the header text (lines 152 and 228), inheriting the same directional entrance animations (left/right).

---

## Option 2: Full-Width Narrative Strip (Story Arc)

A horizontal 3-panel strip placed between the ScanPipelineStrip and the Before/After cards. Left: Image A. Center: Image C (the clipboard). Right: Image B. Connected by subtle arrow/chevron dividers. Reads as: "You start here -> We decode this -> You end here."

**Why it converts:** Creates a clear 3-act story. The clipboard in the center positions the AI tool as the transformation mechanism. Strong for users who scan quickly -- the visual narrative communicates the value in under 2 seconds.

**Layout:**
```text
[BEFORE img] --> [AI Decoded clipboard] --> [AFTER img]
          "Your Journey From Confusion to Clarity"
```

**Implementation:** New `TransformationStripSection` component rendered between lines 133 and 135 in QuoteScanner.tsx. Uses `grid grid-cols-3` on desktop, stacks vertically on mobile.

---

## Option 3: Stacked Transformation Banner (Emotional Punch)

A full-width section with Image A and Image B side by side at large scale (400px each), with a bold headline between them: "This Is the Difference." Below: a single-line subhead and a CTA button that scrolls to the upload zone. Image C is NOT used here (reserved for the After card's ghost preview, which already exists).

**Why it converts:** Maximum emotional impact. The large-scale contrast hits hard. Works best for cold traffic that needs to be convinced of the problem before engaging with the tool.

**Layout:**
```text
[  BEFORE (large)  ]  |  [  AFTER (large)  ]
       "This Is What Our AI Does For You"
              [ Start My Free Audit ]
```

**Implementation:** New `TransformationBannerSection` between ScanPipelineStrip and the Before/After cards. Full bleed dark background to match the forensic theme.

---

## Option 4: Floating Card Accents (Subtle Authority)

Image A as a small (180px) rounded thumbnail pinned to the top-left corner of the BEFORE card (overlapping the card border by 30%). Image B same treatment on the AFTER card. Image C replaces the current ghost preview background inside the AFTER card's idle state (it already uses `ai_decoded_results_g.webp` -- swap for the new uploaded version at higher opacity).

**Why it converts:** Doesn't add vertical scroll. The images act as visual badges that reinforce the card identity without interrupting the primary conversion flow (upload). Lowest risk option for existing conversion rates.

**Layout:**
```text
  [A]                        [B]
[BEFORE card]          [AFTER card]
```

Images overlap the card corners with `absolute -top-6 -left-4` positioning inside a `relative` wrapper.

---

## Option 5: Scroll-Triggered Transformation (Interactive)

A single centered image container above both cards. On load, shows Image A with a red-tinted overlay and the text "BEFORE: This is you right now." As the user scrolls past 40% of the viewport, it crossfades to Image B with a green-tinted overlay: "AFTER: This is you in 60 seconds." Image C appears as a small floating badge anchored to the bottom-right of the container.

**Why it converts:** Creates a micro-interaction moment that makes the transformation feel tangible. The scroll trigger maps the physical act of scrolling to the emotional journey. High engagement, memorable.

**Layout:**
```text
[ Single container that morphs A -> B on scroll ]
           [C badge in corner]
[BEFORE card]          [AFTER card]
```

**Implementation:** New component with `IntersectionObserver` and CSS `transition-opacity` for the crossfade. Image C uses `absolute bottom-4 right-4` with a `w-[120px]` size.

---

## CRO Recommendation

**Option 1 (Paired Column Headers)** is the strongest default because:
- Zero additional scroll depth added (images sit inside existing card columns)
- Reinforces the Before/After mental model that the card content already uses
- Lowest implementation risk -- no new sections, no scroll observers
- Mobile-friendly: images stack naturally in the single-column layout

**Option 2 (Narrative Strip)** is the runner-up if you want a stronger "story arc" before the user reaches the cards.

---

## Implementation Plan (Option 1 -- Recommended)

### Files to Change

| Action | File | What Changes |
|--------|------|-------------|
| COPY | `user-uploads://Screenshot_2026-02-15_130445.png` to `src/assets/before-confused.png` | Before image asset |
| COPY | `user-uploads://Screenshot_2026-02-15_130509.png` to `src/assets/after-armed.png` | After image asset |
| COPY | `user-uploads://Screenshot_2026-02-21_175920.png` to `src/assets/ai-decoded-clipboard.png` | AI Decoded clipboard (reserved for future use or Option 2) |
| MODIFY | `src/pages/QuoteScanner.tsx` | Add image imports; insert `<img>` elements above each card header |

### Technical Details

1. Import assets at the top of QuoteScanner.tsx:
```typescript
import beforeConfusedImg from '@/assets/before-confused.png';
import afterArmedImg from '@/assets/after-armed.png';
```

2. Inside each `AnimateOnScroll` wrapper, above the header `<div>`, add a centered image:

**Left column (before line 152):**
```tsx
<div className="flex justify-center mb-4">
  <img
    src={beforeConfusedImg}
    alt="Before: Confused by jargon, vulnerable to tactics"
    className="w-full max-w-[280px] h-auto rounded-xl shadow-lg"
    loading="lazy"
    decoding="async"
  />
</div>
```

**Right column (before line 228):**
```tsx
<div className="flex justify-center mb-4">
  <img
    src={afterArmedImg}
    alt="After: Clear understanding, armed with leverage"
    className="w-full max-w-[280px] h-auto rounded-xl shadow-lg"
    loading="lazy"
    decoding="async"
  />
</div>
```

3. The images inherit the parent `AnimateOnScroll` directional animations (left entrance for Before, right entrance for After), creating a cohesive reveal.

4. On mobile (single column), the images stack naturally above each card.

