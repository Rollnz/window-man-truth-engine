

# Update "ENTER THE WAR ROOM" Button

## Changes

### `src/components/quote-scanner/vault-pivot/VaultCTABlock.tsx`

**Line 80**: Change button text from `ENTER THE WAR ROOM` to `ENTER YOUR SECURE VAULT`.

**Lines 70-77**: Replace the emerald/green color classes with fixed orange `#D97706`:
- Remove `bg-emerald-600 hover:bg-emerald-500`, `border-emerald-700`, and emerald-based shadow/animation classes
- Apply `style={{ backgroundColor: '#D97706' }}` with hover via Tailwind `hover:brightness-110`
- Update border to match: `border-2 border-[#b45309]`
- Update dark glow shadow to orange: `dark:shadow-[0_0_30px_rgba(217,119,6,0.4)]`

**Line 174 (radar-pulse keyframe)**: Update the `rgba` values from green `(34,197,94,...)` to orange `(217,119,6,...)` so the dark-mode pulse matches.

No other files change.

