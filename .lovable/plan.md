
# "Locked But Alive" Button Effect + 3 Alternative CRO Options

## Overview

Four options for the disabled-state "Request Better Quote Options" button. Each creates visual magnetism without being gimmicky, drawing the eye to the checkbox gating mechanism.

---

## Option 1: Live Wire Border (User's Request)

A conic-gradient border that rotates continuously, simulating energy flowing along the edge. The arrow icon oscillates left-right in a beckoning motion.

**How it works:**
- Wrap the button in a container `div` with a rotating `conic-gradient` (transparent -> orange -> transparent) as background
- The button itself sits inside with a 2px inset, creating the illusion of an animated border
- CSS `@keyframes liveWireRotate` rotates the gradient 360deg over 3s
- CSS `@keyframes beckon` moves the arrow 3px right, pauses, returns over 2s
- Both animations pause when `partnerConsent` is true (button unlocks to solid CTA)
- Uses `prefers-reduced-motion` to disable for accessibility

**Visual:** Dark muted button with a single orange spark continuously tracing the perimeter. Arrow gently beckons.

---

## Option 2: Breathing Glow Halo

The button has a soft orange `box-shadow` that rhythmically expands and contracts, like a heartbeat. The effect suggests the button is "dormant but powerful."

**How it works:**
- CSS `@keyframes breathe` alternates `box-shadow` between `0 0 0px` and `0 0 20px rgba(217,119,6,0.35)` over 2.5s ease-in-out
- A faint orange gradient underline (`::after` pseudo via a child div) slowly pulses opacity 0.3 to 0.7
- The Zap icon (already in the card header) gets a matching micro-pulse, creating visual connection between the card badge and the button
- On checkbox activation, the breathing shadow snaps to a solid orange glow and the button transitions to CTA variant

**Why this converts:** Breathing/pulsing patterns trigger subconscious attention without being distracting. The heartbeat metaphor implies "this is alive and waiting for you." It is the most subtle of the four and works well for audiences who distrust flashy UI.

---

## Option 3: Charge-Up Meter

A thin progress bar sits at the bottom edge of the button, slowly filling from left to right with an orange gradient, then resetting. It looks like the button is "charging up" and waiting for permission.

**How it works:**
- A `::after` pseudo-element (implemented as a child div) with `position: absolute; bottom: 0; left: 0; height: 2px`
- CSS `@keyframes chargeUp` animates `width` from 0% to 100% over 4s, then resets
- The fill uses `background: linear-gradient(90deg, transparent, #D97706, #f59e42)`
- A small "spark" dot (`::before`, 4px circle) rides the leading edge of the fill
- When the checkbox is checked, the bar snaps to 100% and glows, then the whole button transitions to CTA
- The hint text below changes from "Check the box above to enable" to "Charged -- tap to unlock" during the final 20% of each cycle (adds micro-urgency)

**Why this converts:** Progress bars create completion bias -- users feel compelled to "finish" the action. The charging metaphor implies value is building, and the checkbox is the release valve.

---

## Option 4: Magnetic Pull Parallax

The button subtly tracks the user's cursor (desktop) or device tilt (mobile), creating a 3D parallax tilt effect. The surface catches a specular orange highlight that shifts with movement, making it feel physical and interactive.

**How it works:**
- `onMouseMove` handler calculates cursor position relative to button center
- Applies `transform: perspective(600px) rotateX(Xdeg) rotateY(Ydeg)` with max 3deg tilt
- A radial gradient overlay (`hsl(var(--secondary) / 0.15)`) follows the cursor position, simulating a specular light reflection
- The arrow icon counter-rotates slightly to stay "pointing at the user"
- On mobile, uses `DeviceOrientationEvent` for gentle gyroscope-based tilt (with feature detection fallback to static)
- Transition to CTA on checkbox: the tilt effect persists but the surface color shifts from muted to primary, and the specular highlight intensifies

**Why this converts:** Physical-feeling UI elements increase perceived value and trustworthiness. The parallax creates a "premium product" association. Studies show interactive elements that respond to user presence (not just clicks) increase engagement time by 15-25%.

---

## Recommendation

**Option 3 (Charge-Up Meter)** is the strongest CRO pick. It leverages completion bias (a proven psychological trigger), is simple to implement with pure CSS, works identically on mobile and desktop, has zero JS overhead, and respects `prefers-reduced-motion`. Option 1 (Live Wire) is the second pick for its visual impact.

All four options can be combined with each other if desired (e.g., Live Wire border + Charge-Up meter).

---

## Technical Implementation (applies to whichever option is chosen)

### File: `src/components/sample-report/LeverageOptionsSection.tsx`

1. Replace the current `Button` on line 68-71 with a wrapper `div` containing the animation elements and the button
2. Add a `<style>` tag (scoped via unique class prefix `lob-`) with the chosen keyframes
3. All animations respect `@media (prefers-reduced-motion: reduce)` by setting `animation: none`
4. When `partnerConsent` flips to `true`, animations stop and the button transitions to the existing `variant="cta"` style with a 300ms ease-out transition
5. No new dependencies, no new files, no database changes
