
# Animated Score Reveal + Key Issues Detected Block

## Overview
Two enhancements to the `QuoteAnalysisResults` component: (1) upgrade each score row with animated count-up numbers, severity badges, gradient progress bars, and staggered reveal animations; (2) add a "Key Issues Detected" summary block between the overall score and the category scores.

## Changes

### File: `src/components/quote-scanner/QuoteAnalysisResults.tsx` (full rewrite of component internals)

#### Enhancement A: Animated Score Reveal

**ScoreRow upgrades:**
- Replace static score text with a count-up animation (reuse the easeOutCubic pattern from `AnimatedNumber` / `EvidenceStat`) -- implemented inline via `useState` + `useEffect` + `requestAnimationFrame`
- Add a `SeverityBadge` next to each score label showing "Concern" (score < 60, critical), "Caution" (60-79, warning), or "Strong" (>= 80, info)
- Replace the single-color progress bar with a CSS gradient bar: `bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400` as the track, with width still driven by the score percentage
- Add a small triangular marker at the score position on the bar (CSS `border` triangle, absolutely positioned)
- Each ScoreRow receives a `delay` prop (0, 150, 300, 450, 600ms) to stagger the count-up start, creating a cascading reveal effect
- Wrap each row in `motion-safe:animate-fade-in` with staggered `animation-delay`

**Overall score upgrades:**
- The large `text-5xl` number uses the same count-up animation (0 to final score over ~1200ms)
- Add a circular icon badge beside the score number: emerald CheckCircle2 (>= 80), amber AlertTriangle (60-79), rose XCircle (< 60)

#### Enhancement B: Key Issues Detected Summary Block

Insert a new section between the overall score box (line 128) and the category scores (line 131):

- Only renders when `result` exists and has warnings or missing items
- Header: "KEY ISSUES DETECTED" with a count badge (total warnings + missing items) -- rose pill badge
- Content: numbered list combining warnings and missing items (warnings first, then missing items), each with a rose/amber icon prefix
- Max 5 items shown; if more exist, a "...and N more" line
- Styled with `bg-rose-500/5 border border-rose-500/20 rounded-lg p-4`

### Technical Details

**New imports needed:**
- `{ useEffect, useState, useRef }` from React
- `CheckCircle2` from lucide-react (already have `AlertTriangle`, `XCircle`)
- `SeverityBadge` from `@/components/forensic/SeverityBadge`

**No new files, no new dependencies, no database changes.**

**Helper functions added inside the file:**
- `getSeverityLevel(score)` -- returns `'critical' | 'warning' | 'info'`
- `getSeverityLabel(score)` -- returns `'Concern' | 'Caution' | 'Strong'`
- `useAnimatedScore(target, delay, duration)` -- small inline hook for the count-up with stagger delay

**Accessibility:**
- Count-up respects `prefers-reduced-motion` (skip animation, show final value immediately)
- Severity badges have `aria-label` (already built into `SeverityBadge`)
