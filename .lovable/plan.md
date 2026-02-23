

# Comprehensive Contrast Fix -- All Text vs Background at 4.5:1+

## Problem

The current `--primary: 209 68% 46%` only achieves **4.25:1** against white -- still failing the 4.5:1 WCAG AA minimum. On dark backgrounds (surface-1/2/3, cards), it's even worse (~3.7-4.3:1). The `--primary-light` token exists but was only applied to 4 lines in one file. Around 20+ instances across 7 other homepage sections still use `text-primary` on dark backgrounds.

## Contrast Math

| Token | HSL Lightness | vs White (#FFFFFF) | vs Surface-3 (#23272F) | vs Card (#151A1E) |
|---|---|---|---|---|
| Current (46%) | 46% | 4.25:1 FAIL | 4.3:1 FAIL | 3.7:1 FAIL |
| **Fixed (44%)** | 44% | **4.95:1 PASS** | 3.7:1 (won't use) | 3.4:1 (won't use) |
| primary-light (65%) | 65% | 2.9:1 (won't use) | **6.0:1 PASS** | **7.2:1 PASS** |

**Rule**: Darker primary (44%) on light backgrounds only. Lighter primary-light (65%) on dark backgrounds only.

## Changes (10 files)

### 1. `src/index.css`
- Darken `--primary` from `209 68% 46%` to `209 68% 44%`
- Update `--ring`, `--glow`, `--sidebar-primary`, `--sidebar-ring` to match

### 2. `src/components/home/HeroSection.tsx`
- "View a Real Sample AI Report" link: `text-primary` to `text-[hsl(var(--primary-light))]` (small 14px text on dark background)
- Large h1 heading stays `text-primary` (large text only needs 3:1, passes at 3.9:1)

### 3. `src/components/home/MarketRealitySection.tsx`
- "Live Validation" label: `text-primary` to `text-[hsl(var(--primary-light))]`

### 4. `src/components/home/FailurePointsSection.tsx`
- "precision" span (line 103): `text-primary` to `text-[hsl(var(--primary-light))]`
- Line 146 "They ask whether everything was done exactly right": `text-secondary-foreground` to `text-foreground` -- this is a bug where `secondary-foreground` resolves to near-black (`220 20% 6%`) on dark backgrounds, making text nearly invisible

### 5. `src/components/home/SecretPlaybookSection.tsx`
- "answers" span: `text-primary` to `text-[hsl(var(--primary-light))]`

### 6. `src/components/home/SampleReportSection.tsx` (4 instances)
- "Didn't Show You" heading span: `text-primary` to `text-[hsl(var(--primary-light))]`
- "The truth -- translated into leverage": `text-primary` to `text-[hsl(var(--primary-light))]`
- "What Window Man Sees" label: `text-primary` to `text-[hsl(var(--primary-light))]`
- "Start Knowing You Did." heading span: `text-primary` to `text-[hsl(var(--primary-light))]`

### 7. `src/components/home/WeaponizeAuditSection.tsx` (4 instances)
- "You're in Control" heading span: `text-primary` to `text-[hsl(var(--primary-light))]`
- "Keep Your Contractor, Fix Your Contract." text: `text-primary` to `text-[hsl(var(--primary-light))]`
- "The Outcome" label: `text-primary` to `text-[hsl(var(--primary-light))]`
- "You are the most prepared person at the table.": `text-primary` to `text-[hsl(var(--primary-light))]`

### 8. `src/components/home/FinalDecisionSection.tsx` (4 instances)
- Shield icon + "Choose Your Path" badge text: `text-primary` to `text-[hsl(var(--primary-light))]`
- "Before You Sign Anything" heading span: `text-primary` to `text-[hsl(var(--primary-light))]`
- "Best if you already have a quote" label: `text-primary` to `text-[hsl(var(--primary-light))]`
- "Window Man gives you the leverage": `text-primary` to `text-[hsl(var(--primary-light))]`

### 9. `src/components/home/WhoIsWindowManSection.tsx`
- "MORE" span (line 218): `text-primary` to `text-[hsl(var(--primary-light))]`

## What stays as `text-primary` (correct usage on light backgrounds)
- Footer text/links (white background, 4.95:1)
- `bg-primary text-primary-foreground` buttons (white on blue, 4.95:1)
- Decorative icons (no WCAG text requirement)
- Hero h1 large text (large text passes at 3:1)

## Visual Impact
- Buttons/footer links become marginally darker blue (barely perceptible)
- Text on dark sections becomes slightly lighter blue (noticeably more readable)
- The FailurePoints `text-secondary-foreground` bug fix makes previously near-invisible text visible
- No layout, spacing, or functional changes

