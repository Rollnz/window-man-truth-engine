# Signup3 Sticky Header with Logo, Nav, and Scroll Behavior

## What It Looks Like

### Desktop

- Fixed bar at the top, full width, semi-transparent (50% opacity dark background with backdrop blur).
- **Left**: WindowMan character image (~36px) + "Window" (white) + "Man" (#0050D8) text, bold.  
Nothing else on the header for now to the right. I will be changing the header nav links in the future
- **Always visible** -- never hides regardless of scroll direction. Standard SaaS behavior.

### Mobile

- Same bar but compact. **Left**: logo + text. **Right**: hamburger icon.
- Tapping hamburger opens a Sheet (slide-out panel) with nav links stacked.
- **Scroll down**: Header slides out of view immediately after 50px of downward scroll.
- **Scroll up**: Header reappears only after the user has been scrolling up for 0.5 seconds continuously. Quick flicks are ignored.

## Technical Details

### Files Modified


| File                                 | Action                                           |
| ------------------------------------ | ------------------------------------------------ |
| `src/assets/windowman_logo_400.webp` | **Create** -- copy uploaded logo image           |
| `src/pages/Signup3.tsx`              | **Edit** -- add header component inside the page |


### Implementation

**1. Copy logo asset**
Save `windowman_logo_400.webp` to `src/assets/`.

**2. Add a `Signup3Header` component inside `Signup3.tsx**`

This is a local component (not extracted) to keep the page self-contained per the "exact code" constraint.

Key structure:

```text
+------------------------------------------------------------------+
| [logo img] Window Man                                             | (desktop)
| [logo img] Window Man                            [hamburger]     | (mobile)
+------------------------------------------------------------------+
```

- Uses `useScrollLock({ enabled: isMobile, showDelay: 500 })` from existing hook -- only activates hide/show on mobile.
- Uses `useIsMobile()` from existing hook for breakpoint detection.
- Bar styling: `fixed top-0 left-0 right-0 z-50`, background `bg-[var(--bg-terminal)]/50 backdrop-blur-md`, border-bottom `border-[var(--panel-border)]`.
- Transition for show/hide: `transition-transform duration-300` with `translate-y-0` (visible) or `-translate-y-full` (hidden).
- Hamburger opens a `Sheet` (from `@/components/ui/sheet`) with side="top" or side="right" containing nav links.
- Nav links use `ROUTES` from `@/config/navigation` and `Link` from react-router-dom.
- Theme toggle matches existing Navbar pattern (sun/moon icon swap).
- Auth button: lightweight session check (same deferred pattern as main Navbar) showing Vault or Login.

**3. No changes to HeroSection or FeatureSection**
The header floats above them via `z-50`. The hero content already has top padding from the centered layout, so no spacing adjustments needed.

### Scroll Behavior Summary


| Scenario                    | Desktop          | Mobile                    |
| --------------------------- | ---------------- | ------------------------- |
| At top of page              | Visible          | Visible                   |
| Scrolling down past 50px    | Visible (always) | Hides immediately         |
| Quick scroll-up flick       | Visible (always) | Stays hidden (under 0.5s) |
| Sustained scroll-up (>0.5s) | Visible (always) | Slides back into view     |
