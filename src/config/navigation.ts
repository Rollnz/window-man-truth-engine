/**
 * Centralized Navigation Configuration
 * Single source of truth for all route paths across the Window Truth Engine
 */

export const ROUTES = {
  // Core Pages
  HOME: '/',
  TOOLS: '/tools',

  // Primary Tools
  COST_CALCULATOR: '/cost-calculator',
  BEAT_YOUR_QUOTE: '/beat-your-quote',
  QUOTE_SCANNER: '/ai-scanner',
  CLAIM_SURVIVAL: '/claim-survival',

  // Analysis Tools
  REALITY_CHECK: '/reality-check',
  COMPARISON: '/comparison',
  RISK_DIAGNOSTIC: '/risk-diagnostic',
  FAST_WIN: '/fast-win',
  VULNERABILITY_TEST: '/vulnerability-test',
  FAIR_PRICE_QUIZ: '/fair-price-quiz',

  // Content Tools
  EVIDENCE: '/evidence',
  INTEL: '/intel',
  PROOF: '/proof',

  // Expert & Support
  EXPERT: '/expert',

  // Guides
  KITCHEN_TABLE_GUIDE: '/kitchen-table-guide',
  SALES_TACTICS_GUIDE: '/sales-tactics-guide',
  SPEC_CHECKLIST_GUIDE: '/spec-checklist-guide',
  INSURANCE_SAVINGS_GUIDE: '/insurance-savings-guide',

  // Estimate Calculators
  FREE_ESTIMATE: '/free-estimate',
  IMPACT_WINDOW_CALCULATOR: '/impact-window-calculator',

  // User Management
  AUTH: '/auth',
  VAULT: '/vault',

  // Legal
  PRIVACY: '/privacy',
  TERMS: '/terms',

  // Info Pages
  ABOUT: '/about',
  FAQ: '/faq',

  // Interactive
  DEFENSE: '/defense',
  ROLEPLAY: '/roleplay',

  // Analytics (Admin)
  ANALYTICS: '/analytics',
} as const;

/**
 * Footer Navigation Links
 * Used by MinimalFooter component for sticky navigation
 */
export const FOOTER_NAV = {
  // Primary CTAs
  BUILD_QUOTE: ROUTES.FREE_ESTIMATE,
  SCAN_QUOTE: ROUTES.BEAT_YOUR_QUOTE,

  // Navigation
  HOME: ROUTES.HOME,
  ALL_TOOLS: ROUTES.TOOLS,

  // Legal
  PRIVACY: ROUTES.PRIVACY,
  TERMS: ROUTES.TERMS,
} as const;

/**
 * Route Redirects (Legacy URLs)
 * These paths redirect to their canonical destinations.
 * The browser URL will change to the destination.
 */
export const ROUTE_REDIRECTS = {
  '/quote-scanner': ROUTES.QUOTE_SCANNER,
  '/calculate-your-estimate': ROUTES.FREE_ESTIMATE,
} as const;

/**
 * Type-safe route helper
 */
export type RouteKey = keyof typeof ROUTES;
export type Route = typeof ROUTES[RouteKey];
