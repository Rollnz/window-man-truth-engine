/**
 * Breadcrumb Schema Generator
 * Handles all breadcrumb-related structured data
 */

const SITE_URL = "https://itswindowman.com";

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate BreadcrumbList schema for navigation hierarchy
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// ============================================
// Breadcrumb configurations for all pages
// ============================================

const BREADCRUMB_CONFIGS: Record<string, BreadcrumbItem[]> = {
  // Home (1 level)
  'home': [
    { name: "Home", url: `${SITE_URL}/` }
  ],

  // Info Pages (2 levels)
  'tools-index': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` }
  ],
  'intel-library': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Intel Library", url: `${SITE_URL}/intel` }
  ],
  'about': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "About", url: `${SITE_URL}/about` }
  ],
  'faq': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "FAQ", url: `${SITE_URL}/faq` }
  ],
  'defense': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Defense Mode", url: `${SITE_URL}/defense` }
  ],

  // Tool Pages (3 levels)
  'quote-scanner': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "AI Quote Scanner", url: `${SITE_URL}/quote-scanner` }
  ],
  'fair-price-quiz': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Fair Price Quiz", url: `${SITE_URL}/fair-price-quiz` }
  ],
  'free-estimate': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Free Estimate Calculator", url: `${SITE_URL}/free-estimate` }
  ],
  'risk-diagnostic': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Risk Diagnostic", url: `${SITE_URL}/risk-diagnostic` }
  ],
  'beat-your-quote': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Beat Your Quote", url: `${SITE_URL}/beat-your-quote` }
  ],
  'expert-system': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Expert System", url: `${SITE_URL}/expert` }
  ],
  'cost-calculator': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Cost Calculator", url: `${SITE_URL}/cost-calculator` }
  ],
  'comparison': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Comparison Tool", url: `${SITE_URL}/comparison` }
  ],
  'reality-check': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Reality Check Quiz", url: `${SITE_URL}/reality-check` }
  ],
  'claim-survival': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Claim Survival Kit", url: `${SITE_URL}/claim-survival` }
  ],
  'evidence-locker': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Evidence Locker", url: `${SITE_URL}/evidence` }
  ],
  'roleplay-simulator': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Roleplay Simulator", url: `${SITE_URL}/roleplay` }
  ],
  'fast-win': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Fast Win", url: `${SITE_URL}/fast-win` }
  ],
  'vulnerability-test': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tools", url: `${SITE_URL}/tools` },
    { name: "Vulnerability Test", url: `${SITE_URL}/vulnerability-test` }
  ],

  // Guide Pages (3 levels - under Intel Library)
  'sales-tactics-guide': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Intel Library", url: `${SITE_URL}/intel` },
    { name: "Sales Tactics Guide", url: `${SITE_URL}/sales-tactics-guide` }
  ],
  'spec-checklist-guide': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Intel Library", url: `${SITE_URL}/intel` },
    { name: "Spec Checklist Guide", url: `${SITE_URL}/spec-checklist-guide` }
  ],
  'insurance-savings-guide': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Intel Library", url: `${SITE_URL}/intel` },
    { name: "Insurance Savings Guide", url: `${SITE_URL}/insurance-savings-guide` }
  ],
  'kitchen-table-guide': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Intel Library", url: `${SITE_URL}/intel` },
    { name: "Kitchen Table Guide", url: `${SITE_URL}/kitchen-table-guide` }
  ],

  // Legal Pages (2 levels)
  'privacy': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Privacy Policy", url: `${SITE_URL}/privacy` }
  ],
  'terms': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Terms of Service", url: `${SITE_URL}/terms` }
  ],
  'disclaimer': [
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Disclaimer", url: `${SITE_URL}/disclaimer` }
  ],
};

/**
 * Get breadcrumb schema for a specific page
 */
export function getBreadcrumbSchema(pageId: string): Record<string, unknown> {
  const items = BREADCRUMB_CONFIGS[pageId];
  if (!items) {
    // Fallback to home breadcrumb
    return generateBreadcrumbSchema([{ name: "Home", url: `${SITE_URL}/` }]);
  }
  return generateBreadcrumbSchema(items);
}
