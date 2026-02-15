/**
 * Thank You page dynamic content engine.
 * Strict TypeScript interfaces with BASE spread pattern for 11 source keys.
 */

export interface ThankYouSourceConfig {
  headline: string;
  subhead: string;
  callCtaLabel: string;
  callCtaSubtext: string;
  callBullets: [string, string, string];
  guaranteeHeadline: string;
  guaranteeBody: string;
  hesitantLine: string;
  timeline: [
    { step: number; label: string },
    { step: number; label: string },
    { step: number; label: string }
  ];
  primaryWebCta: { label: string; href: string };
  secondaryWebCta: { label: string; href: string };
}

export type ThankYouSource =
  | 'sample-report'
  | 'quote-scanner'
  | 'ai-scanner'
  | 'consultation'
  | 'beat-your-quote'
  | 'fair-price-quiz'
  | 'kitchen-table-guide'
  | 'sales-tactics-guide'
  | 'spec-checklist-guide'
  | 'insurance-savings-guide'
  | 'generic';

const BASE: ThankYouSourceConfig = {
  headline: 'Your Request Is Confirmed.',
  subhead: 'If you want the fastest next step, call now.',
  callCtaLabel: 'Call Window Man Now',
  callCtaSubtext: 'Instant answers • next-step plan • can route to a human',
  callBullets: [
    'Confirm your home + timeline',
    'Ask 3 quick questions about your quote (or your plan)',
    'Tell you the top risks to avoid — and what to do next',
  ],
  guaranteeHeadline: 'Why Window Man is different',
  guaranteeBody:
    "We're built for one outcome: a better deal with safer scope. If a better price exists on the same scope/specs, we can usually find it through our contractor network. If we can't legitimately beat it, we'll tell you — and we won't send you to anyone.",
  hesitantLine: "Prefer text? You can still browse tools — but calling is the fastest.",
  timeline: [
    { step: 1, label: 'Request confirmed' },
    { step: 2, label: 'Quick diagnostic' },
    { step: 3, label: 'Next step with leverage' },
  ],
  primaryWebCta: { label: 'Upload Your Quote', href: '/ai-scanner' },
  secondaryWebCta: { label: 'Explore Tools', href: '/tools' },
};

export const THANK_YOU_CONTENT: Record<ThankYouSource, ThankYouSourceConfig> = {
  'sample-report': {
    ...BASE,
    headline: 'Your Sample Report Is On The Way',
    subhead: 'Check your inbox in a few minutes. If you want the fastest next step, call now — or upload a quote so we can try to beat it.',
    primaryWebCta: { label: 'Upload Your Quote Now', href: '/ai-scanner' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
    timeline: [
      { step: 1, label: 'Report unlocked' },
      { step: 2, label: 'You spot red flags' },
      { step: 3, label: 'You negotiate stronger' },
    ],
  },
  'quote-scanner': {
    ...BASE,
    headline: 'Your AI Review Is Being Prepared',
    subhead: 'While your scan processes, call now for a next-step plan — or upload another quote to compare.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your quote',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Back to Scanner', href: '/ai-scanner' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
    timeline: [
      { step: 1, label: 'Upload received' },
      { step: 2, label: 'Analysis running' },
      { step: 3, label: 'Report ready' },
    ],
  },
  'ai-scanner': {
    ...BASE,
    headline: 'Your AI Review Is Being Prepared',
    subhead: 'While your scan processes, call now for a next-step plan — or upload another quote to compare.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your quote',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Back to Scanner', href: '/ai-scanner' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
    timeline: [
      { step: 1, label: 'Upload received' },
      { step: 2, label: 'Analysis running' },
      { step: 3, label: 'Report ready' },
    ],
  },
  'consultation': {
    ...BASE,
    headline: "You're Booked.",
    subhead: "If you want to move faster, call now — Window Man can start immediately and route to a human when needed.",
    callCtaSubtext: "Can't wait? Get started on the phone right now.",
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your plan',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Back to Consultation', href: '/consultation' },
    secondaryWebCta: { label: 'Upload Your Quote', href: '/ai-scanner' },
    timeline: [
      { step: 1, label: 'Booking confirmed' },
      { step: 2, label: 'We prep your file' },
      { step: 3, label: 'Strategy begins' },
    ],
  },
  'beat-your-quote': {
    ...BASE,
    headline: 'Your Request Is Confirmed',
    subhead: 'Call now. If you upload your quote, we\'ll try to beat it on the same scope/specs — and only connect you if we can.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your quote',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Upload Your Quote', href: '/ai-scanner' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
    timeline: [
      { step: 1, label: 'File created' },
      { step: 2, label: 'Quote compared' },
      { step: 3, label: 'Better offer (if available)' },
    ],
  },
  'fair-price-quiz': {
    ...BASE,
    headline: 'Your Results Are Ready.',
    subhead: 'See your price check, then call for the fastest next step — or upload a quote if you want us to try to beat it.',
    primaryWebCta: { label: 'See Results', href: '/fair-price-quiz' },
    secondaryWebCta: { label: 'Upload Your Quote', href: '/ai-scanner' },
    timeline: [
      { step: 1, label: 'Quiz submitted' },
      { step: 2, label: 'Results calculated' },
      { step: 3, label: 'Next step chosen' },
    ],
  },
  'kitchen-table-guide': {
    ...BASE,
    headline: 'Your Guide Is Unlocked.',
    subhead: 'Check your inbox. If you want the fastest next step, call now — or upload a quote to compare.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your plan',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Download The Kitchen Table Defense Kit', href: '/kitchen-table-guide' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
  },
  'sales-tactics-guide': {
    ...BASE,
    headline: 'Your Guide Is Unlocked.',
    subhead: 'Check your inbox. If you want the fastest next step, call now — or upload a quote to compare.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your plan',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Read The Sales Tactics Playbook', href: '/sales-tactics-guide' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
  },
  'spec-checklist-guide': {
    ...BASE,
    headline: 'Your Guide Is Unlocked.',
    subhead: 'Check your inbox. If you want the fastest next step, call now — or upload a quote to compare.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your plan',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Download The Spec Checklist', href: '/spec-checklist-guide' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
  },
  'insurance-savings-guide': {
    ...BASE,
    headline: 'Your Guide Is Unlocked.',
    subhead: 'Check your inbox. If you want the fastest next step, call now — or upload a quote to compare.',
    callBullets: [
      'Confirm your home + timeline',
      'Ask 3 quick questions about your plan',
      'Tell you the top risks to avoid and what to do next',
    ],
    primaryWebCta: { label: 'Read The Insurance Savings Guide', href: '/insurance-savings-guide' },
    secondaryWebCta: { label: 'Try The Fair Price Calculator', href: '/fair-price-quiz' },
  },
  'generic': {
    ...BASE,
    headline: 'Next step: call Window Man.',
    subhead: 'Your request is confirmed. Call now for the fastest next step — or upload a quote so we can try to beat it.',
    primaryWebCta: { label: 'Upload Your Quote', href: '/ai-scanner' },
    secondaryWebCta: { label: 'Explore Tools', href: '/tools' },
  },
};

/**
 * Resolve a source query param to a valid content key.
 * Returns 'generic' for unknown or missing sources.
 */
export function resolveThankYouSource(source: string | null): ThankYouSource {
  if (!source) return 'generic';
  const normalized = source.toLowerCase().trim();
  if (normalized in THANK_YOU_CONTENT) return normalized as ThankYouSource;
  if (import.meta.env.DEV) {
    console.warn(`[ThankYou] Unknown source "${source}", falling back to generic`);
  }
  return 'generic';
}
