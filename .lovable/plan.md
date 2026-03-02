

# Redesign QualificationFlow as a Focus-Trap Modal

## Problem
The current QualificationFlow renders as a small Card embedded in the page layout. After form submission, users don't notice it because it blends into the background. It needs to command attention.

## Solution
Rewrite `QualificationFlow` as a full-screen centered overlay (focus-trap modal) that shows one question at a time. When the user clicks an option, it auto-advances to the next question after a brief highlight animation (300ms). No "Next" or "Back" buttons needed -- just tap and go. On the final question, selecting an answer auto-submits.

## Design Details

- **Full-screen overlay**: Fixed position, semi-transparent dark backdrop (`bg-black/60`), centered white card
- **One question per screen**: Large, clear question text with big tap-friendly option buttons
- **Auto-advance on click**: User clicks an option, it highlights briefly (300ms), then the next question slides in
- **Progress dots**: 4 small dots at the top showing which question you're on (replaces the progress bar)
- **Step counter**: Small "1 of 4" label
- **No Next/Back buttons**: Clicking an option IS the action. Add a small back arrow in the top-left for corrections
- **Final step auto-submits**: When the user answers question 4, it auto-calls `onSubmit`
- **Slide animation**: Each question slides in from the right, slides out to the left

## Technical Changes

### File: `src/components/signup/QualificationFlow.tsx` (full rewrite)

- Wrap in a fixed overlay div with `inset-0 z-50 flex items-center justify-center bg-black/60`
- Use `focus-trap` behavior via `onKeyDown` escape handling and `aria-modal="true"`
- Each option click: set state, wait 300ms, advance step (or submit on step 4)
- Replace Card with a centered panel (`max-w-md w-full mx-4 rounded-2xl bg-card p-6 shadow-2xl`)
- Add `animate-in slide-in-from-right` on step transitions
- Progress indicator: 4 dots, filled up to current step
- Back arrow (ChevronLeft icon) in top-left, disabled on step 1
