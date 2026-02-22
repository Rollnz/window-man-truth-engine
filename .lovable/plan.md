

# Idea 1: "Forensic Clipboard" Ghost Preview Card + Exit Intent Image Swap

## Two Changes

### Change 1: Forensic Clipboard Ghost Preview Card (After column, idle state)

Replace the current blurred ghost report background (score donut + bar placeholders at lines 256-280 in `QuoteScanner.tsx`) with a styled "Forensic Clipboard" card that uses the uploaded `ai_decoded_results_g.webp` image as a semi-transparent background. This creates a tangible preview of what the user will receive, setting expectations and increasing upload conversion.

**File: `src/pages/QuoteScanner.tsx`** (lines ~254-341, the `phase === 'idle'` block)

- Replace the blurred donut/bar placeholder with an `<img>` of `ai_decoded_results_g.webp` positioned absolutely, with `opacity-20 blur-[2px]` and a vignette overlay
- Keep the existing content layer (ShieldCheck icon, "Your Report Will Include" heading, bullet list, dual CTAs) on top — unchanged
- The image acts as a "this is what you'll get" teaser, much more compelling than abstract shapes

### Change 2: Exit Intent Modal — Replace Shield Circle with Image

Replace the left pane's circular ShieldCheck placeholder (lines 1188-1198 in `ExitIntentModal.tsx`) with the uploaded `ai_decoded_b_1_1.webp` image.

**File: `src/components/authority/ExitIntentModal.tsx`** (lines ~1188-1198, the "Character / Visual Area" section)

- Remove the `w-40 h-40 rounded-full` container with the `ShieldCheck` icon
- Replace with an `<img>` tag using `/lovable-uploads/ai_decoded_b_1_1.webp` as the source
- Style: `w-48 h-auto rounded-xl border border-slate-700/50 shadow-lg` with the existing cyan ambient glow behind it
- Add `object-contain` and reasonable max dimensions so it fits the left pane without overflow

## Technical Details

### Files Modified: 2

1. **`src/pages/QuoteScanner.tsx`** — Swap the ghost report placeholder (lines 257-279) with an `<img>` element pointing to the uploaded results screenshot
2. **`src/components/authority/ExitIntentModal.tsx`** — Swap the shield circle (lines 1189-1197) with an `<img>` element pointing to the uploaded character image

### New Files: 0
### New Dependencies: 0
### Database Changes: None

Both uploaded images need to be copied into `public/lovable-uploads/` so they are available at build time. The `user-uploads://` paths will be resolved to their final public paths during implementation.
