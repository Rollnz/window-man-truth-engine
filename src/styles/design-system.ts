/**
 * Design System — Single Source of Truth
 * Phases 0-2.5: Font Infrastructure, Contrast Engine, Depth Layers, Premium UX/CRO
 */

// ─── Phase 0: Core Tokens ───────────────────────────────────────────────────
export const DS = {
  // Fonts (dual-typeface system)
  fontUI: "'Inter', system-ui, sans-serif",
  fontData: "'JetBrains Mono', 'IBM Plex Mono', monospace",

  // Backgrounds (3-tier depth)
  bgBase: "#0A0E14",
  bgCard: "rgba(15, 20, 30, 0.85)",
  bgInset: "rgba(10, 14, 20, 0.60)",

  // Text (WCAG AAA on bgBase)
  textPrimary: "#E8ECF4",    // 7.2:1
  textSecondary: "#94A3B8",  // 4.8:1
  textMuted: "#64748B",      // 3.6:1

  // Semantic
  trust: "#22C55E",
  warning: "#F59E0B",
  urgent: "#EF4444",
  accent: "#06B6D4",

  // Depth
  borderSubtle: "rgba(100, 200, 255, 0.10)",
  borderActive: "rgba(100, 200, 255, 0.25)",
  shadowCard: "0 4px 24px rgba(0,0,0,0.4), 0 0 1px rgba(100,200,255,0.08)",
  blur: "blur(12px)",

  // Interaction
  activeScale: "scale(0.98)",
  transition: "all 200ms ease",
  radius: "12px",
  radiusLg: "16px",

  // ─── Phase 2.5: Ambient Glows ──────────────────────────────────────────
  glowTrust: "0 0 20px rgba(34, 197, 94, 0.15)",
  glowWarning: "0 0 20px rgba(245, 158, 11, 0.15)",
  glowUrgent: "0 0 20px rgba(239, 68, 68, 0.20)",
  glowAccent: "0 0 30px rgba(6, 182, 212, 0.20)",

  // Surface Gradients
  bgCardGradient: "linear-gradient(145deg, rgba(20,25,35,0.9) 0%, rgba(10,14,20,0.95) 100%)",

  // Advanced Motion
  hoverLift: "translateY(-2px)",
  focusRing: "0 0 0 2px #0A0E14, 0 0 0 4px #06B6D4",
  pulseAnim: "ds-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
} as const;

// ─── Phase 1: Contrast Engine ───────────────────────────────────────────────
export function contrastColor(score: number): string {
  if (score >= 75) return DS.trust;
  if (score >= 50) return DS.warning;
  return DS.urgent;
}

export function contrastClass(score: number): 'trust' | 'warning' | 'urgent' {
  if (score >= 75) return 'trust';
  if (score >= 50) return 'warning';
  return 'urgent';
}

export function semanticGlow(score: number): string {
  if (score >= 75) return DS.glowTrust;
  if (score >= 50) return DS.glowWarning;
  return DS.glowUrgent;
}

// ─── Phase 2: Depth Layers (Elevation) ──────────────────────────────────────
export const ELEVATION = {
  base: {
    background: DS.bgBase,
  },
  card: {
    background: DS.bgCardGradient,
    border: `1px solid ${DS.borderSubtle}`,
    borderRadius: DS.radius,
    backdropFilter: DS.blur,
    boxShadow: DS.shadowCard,
  },
  popover: {
    background: DS.bgCardGradient,
    border: `1px solid ${DS.borderActive}`,
    borderRadius: DS.radiusLg,
    backdropFilter: DS.blur,
    boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 2px rgba(100,200,255,0.12)",
    zIndex: 50,
  },
  interactiveCard: {
    background: DS.bgCardGradient,
    border: `1px solid ${DS.borderSubtle}`,
    borderRadius: DS.radius,
    backdropFilter: DS.blur,
    boxShadow: DS.shadowCard,
    transition: DS.transition,
    cursor: "pointer" as const,
  },
} as const;

// ─── Phase 2.5: Page Wrapper Styles ─────────────────────────────────────────
export const DS_PAGE_STYLES = `
  /* Ambient Micro-Motions */
  .ds-card {
    transition: ${DS.transition};
  }
  .ds-card:hover {
    transform: ${DS.hoverLift};
    border-color: ${DS.borderActive};
    box-shadow: ${DS.shadowCard}, ${DS.glowAccent};
  }
  .ds-card:active {
    transform: ${DS.activeScale};
  }

  /* Universal Focus States */
  .ds-wrapper *:focus-visible {
    box-shadow: ${DS.focusRing};
    outline: none;
  }

  /* Skeleton Pulse */
  @keyframes ds-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* Breathing Glow (urgent items) */
  @keyframes ds-breathe {
    0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.15); }
    50% { box-shadow: 0 0 20px rgba(239,68,68,0.3); }
  }

  /* Skeleton Shimmer */
  @keyframes ds-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .ds-shimmer {
    background: linear-gradient(90deg, rgba(100,200,255,0.03) 25%, rgba(100,200,255,0.08) 50%, rgba(100,200,255,0.03) 75%);
    background-size: 200% 100%;
    animation: ds-shimmer 1.5s ease infinite;
  }

  /* Glassmorphism noise overlay */
  .ds-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }
`;

// ─── Helper: full page wrapper style object ─────────────────────────────────
export const pageWrapperStyle = (overrides?: React.CSSProperties): React.CSSProperties => ({
  minHeight: '100vh',
  background: DS.bgBase,
  fontFamily: DS.fontUI,
  color: DS.textPrimary,
  ...overrides,
});
