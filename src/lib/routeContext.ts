import type { AiQaMode } from '@/lib/panelVariants';

export interface RouteContext {
  key: string;
  defaultMode: AiQaMode;
  headline: string;
  subheadline: string;
  ctaPrimaryLabel: string;
  ctaSecondaryLabel: string;
  chips: string[];
  modeBadgeLabel: string;
}

interface RouteEntry {
  match: (pathname: string) => boolean;
  context: RouteContext;
}

const ROUTE_ENTRIES: RouteEntry[] = [
  {
    match: (p) => p.startsWith('/beat-your-quote'),
    context: {
      key: 'beat_quote',
      defaultMode: 'savings',
      headline: 'Find the Hidden Markup',
      subheadline: 'Let Window Man expose what your contractor won\'t show you.',
      ctaPrimaryLabel: 'Analyze My Quote',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'Is my quote competitive?',
        'What markup is normal?',
        'How do I negotiate my quote?',
      ],
      modeBadgeLabel: 'Savings Mode',
    },
  },
  {
    match: (p) => p.startsWith('/ai-scanner'),
    context: {
      key: 'ai_scanner',
      defaultMode: 'proof',
      headline: 'Investigate Your Quote',
      subheadline: 'Upload your quote. We\'ll scan for red flags.',
      ctaPrimaryLabel: 'Scan My Quote',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'What red flags should I look for?',
        'Is this contractor legit?',
        'What\'s missing from my quote?',
      ],
      modeBadgeLabel: 'Proof Mode',
    },
  },
  {
    match: (p) => p.startsWith('/fair-price-quiz'),
    context: {
      key: 'fair_price_quiz',
      defaultMode: 'diagnostic',
      headline: 'What Should You Really Pay?',
      subheadline: 'Get an honest price range in 60 seconds.',
      ctaPrimaryLabel: 'Check My Price',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'What\'s a fair price range?',
        'Am I being overcharged?',
        'What factors affect cost?',
      ],
      modeBadgeLabel: 'Diagnostic Mode',
    },
  },
  {
    match: (p) => p.startsWith('/sample-report'),
    context: {
      key: 'sample_report',
      defaultMode: 'proof',
      headline: 'See What We Uncover',
      subheadline: 'Real analysis. Real results. No fluff.',
      ctaPrimaryLabel: 'Get My Own Report',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'What does a real analysis show?',
        'How accurate is the scanner?',
        'What can I expect?',
      ],
      modeBadgeLabel: 'Proof Mode',
    },
  },
  {
    match: (p) => p.startsWith('/consultation'),
    context: {
      key: 'consultation',
      defaultMode: 'concierge',
      headline: 'Book Your Free Consult',
      subheadline: 'Talk to an expert. Zero pressure.',
      ctaPrimaryLabel: 'Schedule Now',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'What happens during a consult?',
        'How long does it take?',
        'Is it really free?',
      ],
      modeBadgeLabel: 'Consult Mode',
    },
  },
  {
    match: (p) => p.startsWith('/cost-calculator'),
    context: {
      key: 'cost_calculator',
      defaultMode: 'savings',
      headline: 'Understand the Real Costs',
      subheadline: 'Transparent pricing. No hidden fees.',
      ctaPrimaryLabel: 'Calculate My Cost',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'Am I overpaying?',
        'What should windows cost?',
        'How do I budget for this?',
      ],
      modeBadgeLabel: 'Savings Mode',
    },
  },
  {
    match: (p) => p.startsWith('/risk-diagnostic'),
    context: {
      key: 'risk_diagnostic',
      defaultMode: 'diagnostic',
      headline: 'Know Your Risk Level',
      subheadline: 'Assess your windows in under 2 minutes.',
      ctaPrimaryLabel: 'Check My Risk',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'How vulnerable are my windows?',
        'What\'s my biggest risk?',
        'Do I need impact windows?',
      ],
      modeBadgeLabel: 'Diagnostic Mode',
    },
  },
  {
    match: (p) => p.startsWith('/vulnerability-test'),
    context: {
      key: 'vulnerability_test',
      defaultMode: 'diagnostic',
      headline: 'Check Your Exposure',
      subheadline: 'Find out where your home is most vulnerable.',
      ctaPrimaryLabel: 'Run My Test',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'What\'s my biggest risk?',
        'Are my windows up to code?',
        'What should I fix first?',
      ],
      modeBadgeLabel: 'Diagnostic Mode',
    },
  },
  {
    match: (p) => p === '/',
    context: {
      key: 'home',
      defaultMode: 'concierge',
      headline: 'Window Man Is Standing By',
      subheadline: 'Get honest answers. No sales pitch.',
      ctaPrimaryLabel: 'Ask Me Anything About Windows',
      ctaSecondaryLabel: 'Request a Free Estimate',
      chips: [
        'Where do I start?',
        'How much do impact windows cost?',
        'Is my quote fair?',
      ],
      modeBadgeLabel: '',
    },
  },
];

const DEFAULT_CONTEXT: RouteContext = {
  key: 'default',
  defaultMode: 'concierge',
  headline: 'Get Your Free Estimate',
  subheadline: 'Choose how you\'d like to connect with us.',
  ctaPrimaryLabel: 'Ask Me Anything About Windows',
  ctaSecondaryLabel: 'Request a Free Estimate',
  chips: [
    'How much do impact windows cost?',
    'Is my quote fair?',
    'Do I need a building permit?',
  ],
  modeBadgeLabel: '',
};

/**
 * Pure function — returns route-specific context for the slide-over panel.
 * Uses startsWith() matching for future-safe nested paths.
 */
export function getRouteContext(pathname: string): RouteContext {
  const entry = ROUTE_ENTRIES.find((e) => e.match(pathname));
  return entry?.context ?? DEFAULT_CONTEXT;
}
