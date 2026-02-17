// ═══════════════════════════════════════════════════════════════════════════
// Audit Page Configuration - Single Source of Truth
// ═══════════════════════════════════════════════════════════════════════════

export const AUDIT_CONFIG = {
  // Sample Report Gate Modal
  sampleGate: {
    headline: "Don't Risk Your Biggest Asset",
    subheadline: 'See exactly what a "safe" quote looks like. View a sample report.',
    cta: 'Get My Sample Report',
    redirectTo: '/sample-report',
    redirectDelayMs: 1500,
    firstFocusId: 'sample-gate-firstName',
    loadingText: 'Sending...',
    successText: 'Success! Redirecting to your report…',
  },

  // Hero Section CTAs
  hero: {
    urgencyLine: 'Join 12,000+ Florida homeowners who checked their quote before signing.',
    primaryCtaLabel: 'Scan My Quote Free',
    sampleCtaLabel: 'No quote yet? View a sample audit',
    sampleCtaSubline: 'See exactly what we flag before you get a quote.',
    trustLine: 'Private & Secure • No account needed to start',
  },

  // NoQuote Section
  noQuote: {
    sampleCardCta: 'Send Me the Sample',
    sampleCardTitle: 'View Sample Report',
    sampleCardDescription: 'See exactly what our AI flags before you get your own quote. No commitment needed.',
  },
} as const;
