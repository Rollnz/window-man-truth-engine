# Plan: Restyle "Your Fair Price Analysis is Ready" form → Harmonizer dark aesthetic

## Goal
Visually rebuild `src/components/fair-price-quiz/BlurGate.tsx` to match the Project Harmonizer modal style (dark card, white/[0.08] borders, Plus Jakarta Sans, rounded-full white CTA) while preserving all current behavior, fields, validation, and lead submission.

This is a **style-only refactor** of the lead capture card. No state machine, no multi-step, no scoring logic — the original BlurGate is a single-step gate.

## Scope

**In scope**
- New presentational component `src/components/fair-price-quiz/HarmonizerLeadCard.tsx` that renders the same form (firstName, lastName, email, phone) with Harmonizer styling.
- `BlurGate.tsx` swaps its current white card markup for `<HarmonizerLeadCard />`. Keeps `formSchema`, `useFormLock`, `useTickerStats`, `onSubmit`, and the blurred backdrop behind the modal.
- Plus Jakarta Sans font import (Google Fonts) added to `index.html` or `index.css` — scoped to the new component via a wrapper class so the rest of the app is untouched.
- A small `OptionPill.tsx` for the grade pill at the top (replaces the current `bg-primary/10` chip with Harmonizer-style `bg-white/10 border-white/[0.08]` pill).

**Out of scope**
- Multi-step flow, scoring tiers, Calendly, outcome screens (Harmonizer-specific — not in this form).
- Changing field set, validation rules, submit handler, or analytics.
- Changing the blurred results preview behind the modal.
- Global theme/token changes — Harmonizer styles are applied with arbitrary Tailwind values inside the component only, so no `index.css` token edits.

## Visual spec (applied to the lead card)

| Element | Class |
|---|---|
| Card | `max-w-lg rounded-2xl border border-white/[0.08] bg-[#111111] shadow-2xl p-6 md:p-8` |
| Font wrapper | `font-[\'Plus_Jakarta_Sans\']` on root |
| Grade pill | `inline-flex gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/[0.08] text-white text-sm font-semibold` |
| Headline (h2) | `text-2xl font-bold text-white` |
| Sub-headline | `text-sm text-white/60` |
| Field label | `text-sm font-medium text-white/60` |
| Input | `h-11 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/30 px-3 focus:border-white/40 focus:ring-0 outline-none` |
| Error text | `text-xs text-red-400` |
| Primary CTA | `w-full rounded-full bg-white text-black px-6 py-3 text-sm font-bold hover:bg-white/90 disabled:opacity-50` |
| Helper text | `text-xs text-white/40` |
| Social proof line | `text-xs text-white/50` |
| Backdrop (unchanged) | existing blurred preview stays behind |

Layout: grade pill (centered) → headline → sub-headline → 2-col First/Last → Email → Phone + helper → CTA → "We'll also email you a copy" → ticker line.

## Behavior (unchanged)
- `formSchema` zod validation as-is.
- `useFormLock().lockAndExecute` wraps `onSubmit`.
- Phone formatted via `formatPhoneNumber` on change.
- `FormSurfaceProvider surface="trust"` — **removed**, since trust surface forces white styling that fights the dark card. Inputs styled directly per the table above.
- Error messages render under each input.

## Files

| File | Change |
|---|---|
| `src/components/fair-price-quiz/HarmonizerLeadCard.tsx` | NEW — presentational dark card with form markup |
| `src/components/fair-price-quiz/BlurGate.tsx` | EDIT — replace inner white card JSX with `<HarmonizerLeadCard analysis={analysis} ...formProps />`; keep blurred backdrop, state, validation, submit |
| `index.html` | EDIT — add `<link>` for Plus Jakarta Sans (weights 400/500/600/700/800) |

No changes to `index.css`, `tailwind.config.ts`, design tokens, hooks, schemas, or analytics.

## Acceptance
- Visual match to Harmonizer screenshot: black `#111` card, white/[0.08] borders, Plus Jakarta Sans, white pill CTA with rounded-full, dark inputs.
- All four fields submit and validate exactly as today.
- `useFormLock`, ticker count, and `onSubmit` callback behavior unchanged.
- No regressions on other pages (font import is global but only applied where the class is set).

## Open question
The current pill shows the actual computed grade (e.g. "Bad" with emoji). Keep the grade preview in the Harmonizer pill, or drop the pill entirely for a cleaner Harmonizer-style top? Default in this plan: **keep grade pill, restyled**.
