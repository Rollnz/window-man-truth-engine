/**
 * Motion tokens for the "Command Center Noir" design system.
 * CSS-only approach — no framer-motion dependency.
 */

/** Expo-out cubic-bezier for CSS transition-timing-function */
export const EASE_EXPO_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** Duration tokens (seconds, for inline style usage) */
export const DURATION = {
  fast: 0.22,
  med: 0.35,
  slow: 0.55,
  cinematic: 0.7,
} as const;

/** Stagger tokens (ms, for setTimeout chains) */
export const STAGGER = {
  sm: 40,
  md: 70,
  lg: 120,
} as const;

/** Command Center Noir palette */
export const NOIR = {
  void: '#0F1419',
  cyan: '#00D9FF',
  cyanDim: 'rgba(0,217,255,0.14)',
  cyanGlow: 'rgba(0,217,255,0.18)',
  glass: 'rgba(27,36,48,0.72)',
  glassBorder: 'rgba(0,217,255,0.14)',
} as const;

/** Grade color mapping */
export function gradeGlow(grade: string): string {
  const g = grade?.charAt(0)?.toUpperCase();
  if (g === 'A' || g === 'B') return '#10b981'; // emerald
  if (g === 'C') return '#f59e0b'; // amber
  return '#ef4444'; // red for D/F
}
