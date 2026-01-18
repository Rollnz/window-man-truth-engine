/**
 * Semantic Pillar Mapping Configuration
 * Defines the authoritative truth hierarchy for WindowMan SEO
 * 
 * LINKING LAW:
 * - Pillars link DOWN to guides only (never to tools or other pillars)
 * - Guides link DOWN to tools and UP to their pillar
 * - Tools link UP to their parent pillar only
 * - Evidence links UP and SIDEWAYS
 */

export type PillarKey = 
  | 'window-cost-truth'
  | 'window-risk-and-code'
  | 'window-sales-truth'
  | 'window-verification-system';

export interface PillarDefinition {
  url: string;
  title: string;
  shortTitle: string;
  h1: string;
  description: string;
  intent: string;
  ownsQueries: string[];
  guides: string[];
  tools: string[];
  softCTA: {
    text: string;
    link: string;
  };
}

export const PILLARS: Record<PillarKey, PillarDefinition> = {
  'window-cost-truth': {
    url: '/window-cost-truth',
    title: 'Window Cost Truth',
    shortTitle: 'Cost Truth',
    h1: 'How Much Do Impact Windows Really Cost Over 10 Years in Florida?',
    description: 'Discover the true long-term cost of impact windows in Florida. Learn why cheap windows cost more, hidden replacement costs, and how to calculate your real 10-year investment.',
    intent: 'How much do windows really cost over time?',
    ownsQueries: [
      'why cheap windows cost more',
      'window replacement true cost',
      'hidden costs of replacement windows',
      'long term cost of impact windows',
      'impact window roi florida',
    ],
    guides: [
      '/insurance-savings-guide',
      '/fair-price-quiz',
    ],
    tools: [
      '/cost-calculator',
      '/fair-price-quiz',
      '/comparison',
    ],
    softCTA: {
      text: 'Verify your real cost with the Cost Calculator',
      link: '/cost-calculator',
    },
  },
  'window-risk-and-code': {
    url: '/window-risk-and-code',
    title: 'Window Risk & Code Truth',
    shortTitle: 'Risk & Code',
    h1: 'Is Your Florida Home Actually Hurricane-Ready? Code Requirements Explained',
    description: 'Understand Florida hurricane window requirements, impact window code compliance, and wind mitigation essentials. Learn if your home meets current standards.',
    intent: 'Is my home actually protected — legally and structurally?',
    ownsQueries: [
      'hurricane window requirements florida',
      'impact window code compliance',
      'do I need impact windows',
      'wind mitigation checklist',
      'florida building code windows',
    ],
    guides: [
      '/spec-checklist-guide',
      '/claim-survival',
      '/defense',
    ],
    tools: [
      '/risk-diagnostic',
      '/vulnerability-test',
    ],
    softCTA: {
      text: 'Check your protection gaps with the Risk Diagnostic',
      link: '/risk-diagnostic',
    },
  },
  'window-sales-truth': {
    url: '/window-sales-truth',
    title: 'Window Sales Tactics Truth',
    shortTitle: 'Sales Truth',
    h1: 'Are You Being Manipulated? How Window Sales Pressure Tactics Work',
    description: 'Expose common window sales manipulation tactics. Learn to recognize pressure techniques, identify quote red flags, and negotiate confidently.',
    intent: 'Am I being manipulated or quoted fairly?',
    ownsQueries: [
      'window sales tactics',
      'are window quotes negotiable',
      'window quote red flags',
      'high pressure window sales',
      'how to negotiate window prices',
    ],
    guides: [
      '/sales-tactics-guide',
      '/kitchen-table-guide',
    ],
    tools: [
      '/ai-scanner',
      '/roleplay',
      '/beat-your-quote',
    ],
    softCTA: {
      text: 'Scan your quote for red flags',
      link: '/ai-scanner',
    },
  },
  'window-verification-system': {
    url: '/window-verification-system',
    title: 'Window Verification System',
    shortTitle: 'Verification',
    h1: 'How to Verify Any Window Quote Before You Sign',
    description: 'Learn how to verify window quotes, check installer credentials, and validate window specifications. The complete verification system for Florida homeowners.',
    intent: 'How do I verify claims before signing anything?',
    ownsQueries: [
      'how to verify window quotes',
      'window installer red flags',
      'how to check window specs',
      'verify impact window rating',
      'window contractor verification',
    ],
    guides: [
      '/evidence',
      '/intel',
    ],
    tools: [
      '/evidence',
      '/intel',
      '/vault',
    ],
    softCTA: {
      text: 'Browse verified case studies',
      link: '/evidence',
    },
  },
};

/**
 * Reverse lookup: Maps each page path to its parent pillar
 * Used for upward linking and breadcrumb generation
 */
export const PAGE_TO_PILLAR: Record<string, PillarKey> = {
  // Window Cost Truth children
  '/cost-calculator': 'window-cost-truth',
  '/fair-price-quiz': 'window-cost-truth',
  '/comparison': 'window-cost-truth',
  '/insurance-savings-guide': 'window-cost-truth',
  
  // Window Risk & Code children
  '/risk-diagnostic': 'window-risk-and-code',
  '/vulnerability-test': 'window-risk-and-code',
  '/spec-checklist-guide': 'window-risk-and-code',
  '/claim-survival': 'window-risk-and-code',
  '/defense': 'window-risk-and-code',
  
  // Window Sales Truth children
  '/ai-scanner': 'window-sales-truth',
  '/roleplay': 'window-sales-truth',
  '/beat-your-quote': 'window-sales-truth',
  '/sales-tactics-guide': 'window-sales-truth',
  '/kitchen-table-guide': 'window-sales-truth',
  
  // Window Verification System children
  '/evidence': 'window-verification-system',
  '/intel': 'window-verification-system',
  '/vault': 'window-verification-system',
  '/expert': 'window-verification-system',
  
  // Additional mappings
  '/fast-win': 'window-cost-truth',
  '/reality-check': 'window-cost-truth',
  '/calculate-estimate': 'window-cost-truth',
};

/**
 * Get the parent pillar for a given page path
 */
export function getParentPillar(pagePath: string): PillarDefinition | null {
  const pillarKey = PAGE_TO_PILLAR[pagePath];
  if (!pillarKey) return null;
  return PILLARS[pillarKey];
}

/**
 * Get sibling tools (other tools under the same pillar)
 */
export function getSiblingTools(pagePath: string): string[] {
  const pillarKey = PAGE_TO_PILLAR[pagePath];
  if (!pillarKey) return [];
  return PILLARS[pillarKey].tools.filter(tool => tool !== pagePath);
}

/**
 * Get all guides under the same pillar
 */
export function getPillarGuides(pagePath: string): string[] {
  const pillarKey = PAGE_TO_PILLAR[pagePath];
  if (!pillarKey) return [];
  return PILLARS[pillarKey].guides;
}

/**
 * Check if a page is a pillar page
 */
export function isPillarPage(pagePath: string): boolean {
  return Object.values(PILLARS).some(pillar => pillar.url === pagePath);
}

/**
 * Get pillar by URL
 */
export function getPillarByUrl(url: string): PillarDefinition | null {
  return Object.values(PILLARS).find(pillar => pillar.url === url) || null;
}
