/**
 * Evidence/Case Study Schema Generator
 * Handles CreativeWork structured data for evidence library
 */

import { getReviewBoardSchema } from "@/config/expertIdentity";

const SITE_URL = "https://itswindowman.com";

// ============================================
// CreativeWork schema for Evidence Library
// ============================================

interface EvidenceCaseStudy {
  evidenceId: string;
  missionObjective: string;
  theProblem: string;
  theSolution: string;
  source: string;
  jurisdiction: string;
  datePublished: string;
  location: string;
}

/**
 * Generate CreativeWork schema for a single case study
 */
export function generateCreativeWorkSchema(caseStudy: EvidenceCaseStudy): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": `Case Study ${caseStudy.evidenceId}: ${caseStudy.missionObjective}`,
    "description": `Verified case study documenting ${caseStudy.missionObjective.toLowerCase()} for a homeowner in ${caseStudy.location}. ${caseStudy.theProblem.slice(0, 150)}...`,
    "datePublished": caseStudy.datePublished,
    "sourceOrganization": {
      "@type": "Organization",
      "name": caseStudy.source
    },
    "spatialCoverage": {
      "@type": "Place",
      "name": caseStudy.jurisdiction
    },
    "publisher": {
      "@type": "Organization",
      "name": "Window Man Your Hurricane Hero",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon-512.webp`
      }
    },
    "url": `${SITE_URL}/evidence?highlight=${caseStudy.evidenceId}`,
    "isAccessibleForFree": true
  };
}

/**
 * Generate CreativeWork schemas for all case studies in the evidence library
 */
export function generateEvidenceLibrarySchemas(caseStudies: EvidenceCaseStudy[]): Record<string, unknown>[] {
  return caseStudies.map(generateCreativeWorkSchema);
}

/**
 * Generate AboutPage and WebPage structured data with authority entity
 */
export function getAboutPageSchemas(): Record<string, unknown>[] {
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Window Man - Our Methodology & Mission",
    "description": "Built to protect Florida homeowners from storm risk and contractor games. Learn how our AI tools use Florida-specific data and expert verification.",
    "url": `${SITE_URL}/about`,
    "mainEntity": {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Window Man Your Hurricane Hero",
      "url": SITE_URL,
      "logo": `${SITE_URL}/icon-512.webp`,
      "description": "Free tools to help homeowners get fair window replacement quotes and avoid overpaying.",
      "foundingLocation": {
        "@type": "Place",
        "name": "Florida, United States"
      },
      "areaServed": {
        "@type": "State",
        "name": "Florida"
      },
      "knowsAbout": [
        "Florida Building Code",
        "Impact Window Cost Analysis",
        "Hurricane Mitigation",
        "Miami-Dade NOA Certification",
        "Window Replacement Pricing"
      ],
      "member": getReviewBoardSchema()
    },
    "publisher": {
      "@type": "Organization",
      "name": "Window Man Your Hurricane Hero",
      "url": SITE_URL
    }
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/about#webpage`,
    "url": `${SITE_URL}/about`,
    "name": "About Window Man - Methodology, Mission & Expert Review Board",
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "name": "Window Man Truth Engine",
      "url": SITE_URL
    },
    "about": {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`
    },
    "author": getReviewBoardSchema(),
    "reviewedBy": getReviewBoardSchema()
  };

  return [aboutPageSchema, webPageSchema, getReviewBoardSchema()];
}
