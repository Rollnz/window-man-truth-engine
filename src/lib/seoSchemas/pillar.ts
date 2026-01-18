/**
 * Pillar Page Schema Generator
 * Handles structured data for pillar/authority pages
 */

import { PILLARS, PillarKey } from "@/config/pillarMapping";
import { REVIEW_BOARD } from "@/config/expertIdentity";

const SITE_URL = "https://itswindowman.com";

interface PillarSchemaConfig {
  pillarKey: PillarKey;
  headline: string;
  description: string;
  imageUrl?: string;
  datePublished: string;
  dateModified: string;
}

/**
 * Configuration for each pillar's schema metadata
 */
export const PILLAR_SCHEMA_CONFIGS: Record<PillarKey, Omit<PillarSchemaConfig, 'pillarKey'>> = {
  'window-cost-truth': {
    headline: 'How Much Do Impact Windows Really Cost Over 10 Years in Florida?',
    description: 'Discover the true long-term cost of impact windows in Florida. Learn why cheap windows cost more, hidden replacement costs, and how to calculate your real 10-year investment.',
    imageUrl: `${SITE_URL}/images/pillars/cost-truth-hero.webp`,
    datePublished: '2025-01-16',
    dateModified: '2025-01-17',
  },
  'window-risk-and-code': {
    headline: 'Is Your Florida Home Actually Hurricane-Ready? Code Requirements Explained',
    description: 'Understand Florida hurricane window requirements, impact window code compliance, and wind mitigation essentials. Learn if your home meets current standards.',
    imageUrl: `${SITE_URL}/images/pillars/risk-code-hero.webp`,
    datePublished: '2025-01-16',
    dateModified: '2025-01-17',
  },
  'window-sales-truth': {
    headline: 'Are You Being Manipulated? How Window Sales Pressure Tactics Work',
    description: 'Expose common window sales manipulation tactics. Learn to recognize pressure techniques, identify quote red flags, and negotiate confidently.',
    imageUrl: `${SITE_URL}/images/pillars/sales-truth-hero.webp`,
    datePublished: '2025-01-16',
    dateModified: '2025-01-17',
  },
  'window-verification-system': {
    headline: 'How to Verify Any Window Quote Before You Sign',
    description: 'Learn how to verify window quotes, check installer credentials, and validate window specifications. The complete verification system for Florida homeowners.',
    imageUrl: `${SITE_URL}/images/pillars/verification-hero.webp`,
    datePublished: '2025-01-16',
    dateModified: '2025-01-17',
  },
};

/**
 * Generate inline expert schema for pillar pages
 */
function getInlineExpertSchema(): Record<string, unknown> {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#expert`,
    "name": REVIEW_BOARD.name,
    "jobTitle": REVIEW_BOARD.jobTitle,
    "description": REVIEW_BOARD.description,
    "knowsAbout": REVIEW_BOARD.knowsAbout,
    "worksFor": { "@id": `${SITE_URL}/#organization` }
  };
}

/**
 * Generate inline organization schema for pillar pages
 */
function getInlineOrganizationSchema(): Record<string, unknown> {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    "name": "Window Man Your Hurricane Hero",
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/icon-512.webp`
    },
    "sameAs": [
      "https://www.facebook.com/its.windowman",
      "https://twitter.com/itswindowman"
    ]
  };
}

/**
 * Get tool/guide name from path for richer hasPart references
 */
function getPageNameFromPath(path: string): string {
  const pathNames: Record<string, string> = {
    '/cost-calculator': 'Cost of Inaction Calculator',
    '/fair-price-quiz': 'Fair Price Quiz',
    '/free-estimate': 'Free Estimate Calculator',
    '/risk-diagnostic': 'Risk Diagnostic Tool',
    '/beat-your-quote': 'Beat Your Quote Tool',
    '/quote-scanner': 'AI Quote Scanner',
    '/roleplay': 'Sales Roleplay Simulator',
    '/vulnerability-test': 'Vulnerability Test',
    '/claim-survival': 'Claim Survival Kit',
    '/evidence': 'Evidence Locker',
    '/sales-tactics-guide': 'Sales Tactics Guide',
    '/spec-checklist-guide': 'Spec Checklist Guide',
    '/insurance-savings-guide': 'Insurance Savings Guide',
    '/kitchen-table-guide': 'Kitchen Table Guide',
    '/expert': 'Expert System',
  };
  return pathNames[path] || path.replace(/^\//, '').replace(/-/g, ' ');
}

/**
 * Generate the complete @graph array for a pillar page
 */
export function generatePillarSchemaGraph(pillarKey: PillarKey): Record<string, unknown> {
  const pillar = PILLARS[pillarKey];
  const config = PILLAR_SCHEMA_CONFIGS[pillarKey];
  const pillarUrl = `${SITE_URL}${pillar.url}`;
  
  // Get child pages (guides and tools) for hasPart with enhanced metadata
  const childPages = [...new Set([...pillar.guides, ...pillar.tools])];
  
  return {
    "@context": "https://schema.org",
    "@graph": [
      // Inline Expert schema - prevents "missing reference" warnings
      getInlineExpertSchema(),
      // Inline Organization schema
      getInlineOrganizationSchema(),
      // Article schema - the main content
      {
        "@type": "Article",
        "@id": `${pillarUrl}#article`,
        "isPartOf": { "@id": pillarUrl },
        "author": { "@id": `${SITE_URL}/#expert` },
        "headline": config.headline,
        "description": config.description,
        "image": config.imageUrl || `${SITE_URL}/icon-512.webp`,
        "publisher": { "@id": `${SITE_URL}/#organization` },
        "mainEntityOfPage": { "@id": pillarUrl },
        "datePublished": config.datePublished,
        "dateModified": config.dateModified,
        "hasPart": childPages.map(path => ({
          "@type": "WebPage",
          "@id": `${SITE_URL}${path}`,
          "name": getPageNameFromPath(path),
          "url": `${SITE_URL}${path}`
        }))
      },
      // WebPage schema - page identification
      {
        "@type": "WebPage",
        "@id": pillarUrl,
        "url": pillarUrl,
        "name": `${pillar.title} | Window Man Truth Engine`,
        "isPartOf": { "@id": `${SITE_URL}/#website` },
        "breadcrumb": { "@id": `${pillarUrl}#breadcrumb` }
      },
      // BreadcrumbList schema
      {
        "@type": "BreadcrumbList",
        "@id": `${pillarUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": SITE_URL
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": pillar.title,
            "item": pillarUrl
          }
        ]
      }
    ]
  };
}

/**
 * Get all pillar references for the homepage WebSite schema hasPart property
 */
export function getPillarHasPartReferences(): Array<{ "@id": string }> {
  return Object.values(PILLARS).map(pillar => ({
    "@id": `${SITE_URL}${pillar.url}`
  }));
}
