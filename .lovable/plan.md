

# ExitIntentModal Visual Facelift -- Dark Forensic Split-Pane

## What Changes

A complete visual rebuild of `src/components/authority/ExitIntentModal.tsx` render output. All logic, state machine, analytics, hooks, form validation, trigger detection, and handler functions remain **100% identical**. Only the JSX return and inline styling change.

## New Layout

The modal transforms from a single white card into a **split-pane forensic modal**:

```text
+-----------------------------------------------+
|  LEFT PANE (dark)    |   RIGHT PANE (form)     |
|                      |                         |
|  FORENSIC            |   Step 1 of 3           |
|  ALLY                |                         |
|  For Impact Window   |   [INTELLIGENCE DATABASE]|
|  Decisions           |                         |
|                      |   SEE WHAT YOUR         |
|  [Character Image]   |   NEIGHBORS ACTUALLY    |
|                      |   PAID.                 |
|  1. Pricing Intel    |                         |
|  2. Storm Sentinel   |   [Name]  [Phone]       |
|  3. Defense Protocol |   [Email]               |
|                      |   [Window Count Grid]   |
|                      |                         |
|                      |   [=== CTA BUTTON ===]  |
|                      |                         |
|                      |   Skip link             |
|                      |   Lock + Encrypted      |
+-----------------------------------------------+
```

On **mobile** (`< md`), the left pane is hidden entirely -- only the right form pane renders as a full-width dark card.

## Visual Specifications (Matching Reference Image)

### Overall Container
- Background: `bg-[hsl(220,25%,7%)]` (near-black industrial)
- Border: `border border-[hsl(200,60%,25%/0.3)]` (subtle cyan border)
- Shadow: `shadow-[0_30px_80px_rgba(0,0,0,0.6)]` (dramatic depth)
- Rounded: `rounded-2xl`
- Max width: `max-w-4xl` (wider to accommodate two panes)
- Animation: keep existing `animate-in fade-in slide-in-from-right-4`

### Left Pane (Branding -- Desktop Only)
- Width: ~40% (`w-[42%]`)
- Background: `bg-[hsl(220,22%,9%)]` with CSS grid blueprint pattern overlay (subtle blue grid lines)
- Content:
  - Forensic Ally logo/title in cyan (`text-cyan-400`) + white
  - Tagline: "For Impact Window Decisions"
  - Character placeholder area with cyan ambient glow
  - Step tracker sidebar: 3 numbered steps with the active step highlighted in cyan

### Right Pane (Form Surface)
- Width: ~60% (`w-[58%]`)
- Background: `bg-[hsl(220,20%,11%)]` (slightly lighter than left)
- All text: `text-slate-200` for body, `text-white` for headings
- Input styling: `bg-[hsl(220,25%,8%)]` dark inputs with `border-slate-700`, `text-slate-200`, `placeholder:text-slate-500`
- Focus ring: `focus:ring-cyan-500 focus:ring-offset-[hsl(220,20%,11%)]`

### Inputs (Dark Forensic Override)
- Remove FormSurfaceProvider `surface="trust"` (white card context)
- Directly apply dark input classes: `bg-[hsl(220,25%,8%)] text-slate-200 border-slate-700`
- Labels: `text-slate-300 font-semibold`
- Error text: keep `text-destructive`

### Window Count Selector (Dark)
- Unselected: `bg-[hsl(220,25%,8%)] text-slate-400 border-slate-700 hover:border-slate-500`
- Selected: `bg-cyan-900/40 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(8,145,178,0.2)]`
- Focus ring: `focus:ring-cyan-500 focus:ring-offset-[hsl(220,20%,11%)]`

### CTA Button
- Gradient: `bg-gradient-to-r from-cyan-600 to-blue-700`
- Hover: `hover:from-cyan-500 hover:to-blue-600`
- Glow shadow: `shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)]`
- Border: `border border-cyan-400/30`
- This replaces the existing `variant="cta"` with inline classes since the modal has its own dark theme context

### Badges
- Step 1 "INTELLIGENCE DATABASE": `bg-cyan-500/10 text-cyan-400 border border-cyan-500/30`
- Step indicator: `text-cyan-400 text-xs tracking-wider uppercase`

### Decline Links
- `text-slate-500 hover:text-slate-300 underline underline-offset-4 uppercase text-xs tracking-wider`
- Keep fat-finger safety: `mt-6 border-t border-slate-800 pt-4`

### Trust Footer
- `text-slate-600 text-xs` with ShieldCheck icon
- "SECURE 256-BIT ENCRYPTED TRANSMISSION" in uppercase tracking-wider

### Step Tracker (Left Pane)
- Active step: cyan numbered circle (`bg-cyan-500/20 border-cyan-500 text-cyan-400`)
- Inactive steps: slate (`bg-slate-800 border-slate-700 text-slate-500`)
- Step title: `text-white font-bold` (active) / `text-slate-500` (inactive)
- Description: `text-slate-400 text-xs` (active) / `text-slate-600 text-xs` (inactive)

### Overlay
- `bg-black/70 backdrop-blur-md` (deeper than current `bg-background/80 backdrop-blur-sm`)

## Wording Updates (Per Reference)

**Step 1 -- Insider Price:**
- Badge: "INTELLIGENCE DATABASE"
- Headline: "SEE WHAT YOUR NEIGHBORS ACTUALLY PAID."
- Sub: "Stop guessing. Unlock our proprietary database of recent impact window project costs verified in your exact zip code."
- CTA: "Reveal Local Pricing Data"
- Decline: "SKIP -- I DON'T CARE ABOUT PRICING"
- Labels: "Full Name" / "Phone Number" / "Email Address" / "Scope of Project (Window Count)"

**Step 2 -- Storm Sentinel:**
- Headline: "DON'T GET CAUGHT IN SUPPLY CHAIN GRIDLOCK."
- Sub: "When named storms approach, lead times triple overnight. Activate our early-warning SMS system for immediate manufacturing delays and flash price drops."
- CTA: "Activate Instant SMS Alerts"
- Decline: "SKIP -- I'LL RISK THE BACKORDER"
- Label: "Direct Alert Number"

**Step 3 -- Kitchen Table:**
- Headline: "ARM YOURSELF WITH THE DEFENSE PROTOCOL."
- Sub: "Preparing for in-home quotes? Download the definitive '3-Question Blueprint' engineered to instantly disarm high-pressure sales tactics."
- CTA: "Send The Blueprint Securely"
- Decline: "SKIP -- I ENJOY SALES PITCHES"
- Label: "Delivery Address" (email)

## Step 1 Form Layout Change

The reference shows **Name + Phone side by side** on one row, then Email full-width below:

```text
[ Full Name          ] [ Phone Number      ]
[ Email Address                            ]
[ Window Count Grid (2x2)                  ]
```

This is a `grid grid-cols-2 gap-3` for row 1, then full-width inputs below.

## Files Changed

**Only one file:** `src/components/authority/ExitIntentModal.tsx`

Changes are exclusively in:
1. The `WindowCountSelector` component's className strings (dark theme)
2. The JSX return block (lines 693-961) -- restructured into split-pane layout
3. Labels, headings, and button text (wording updates)

## What Does NOT Change

- All imports (lines 16-31)
- Type definitions (lines 37-50)
- Constants (lines 56-71)
- WindowCountSelector keyboard logic (lines 86-115)
- All state, refs, hooks (lines 170-261)
- All form configs and submission hooks (lines 227-338)
- Modal lifecycle (canShowModal, showModal) (lines 343-395)
- All useEffect blocks for analytics (lines 398-577)
- All handlers (handleClose, handleDecline, handleBack, handleStep*Submit) (lines 582-684)
- The barrel export from `src/components/authority/index.ts`
- No database, edge function, or routing changes

