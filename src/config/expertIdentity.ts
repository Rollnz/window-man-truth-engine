/**
 * WindowMan Review Board Expert Identity
 * Used for E-E-A-T signals and Person schema in structured data
 */

export const REVIEW_BOARD = {
  "@type": "Person" as const,
  "@id": "https://itswindowman.com/#expert",
  name: "WindowMan Review Board",
  jobTitle: "Florida Impact Window Specialists",
  description: "A team of licensed Florida contractors and industry veterans who verify all content for accuracy.",
  url: "https://itswindowman.com/about",
  credentials: [
    "15+ Years Florida Impact Window Experience",
    "Miami-Dade Code Certified",
    "Licensed & Insured Contractors"
  ],
  knowsAbout: [
    "Impact Window Installation",
    "Florida Building Codes",
    "Hurricane Protection Requirements",
    "Window Replacement Cost Analysis",
    "Insurance Claim Documentation",
    "Miami-Dade NOA Certification"
  ],
  affiliation: {
    "@type": "Organization",
    name: "Window Man Your Hurricane Hero",
    url: "https://itswindowman.com"
  }
};

/**
 * Generate Person schema for SEO structured data
 */
export function getReviewBoardSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": REVIEW_BOARD["@id"],
    "name": REVIEW_BOARD.name,
    "jobTitle": REVIEW_BOARD.jobTitle,
    "description": REVIEW_BOARD.description,
    "url": REVIEW_BOARD.url,
    "knowsAbout": REVIEW_BOARD.knowsAbout,
    "affiliation": {
      "@type": "Organization",
      "name": REVIEW_BOARD.affiliation.name,
      "url": REVIEW_BOARD.affiliation.url
    }
  };
}

/**
 * Get author reference for Article/FAQ schemas
 */
export function getAuthorReference(): Record<string, unknown> {
  return {
    "@type": "Person",
    "@id": REVIEW_BOARD["@id"],
    "name": REVIEW_BOARD.name,
    "jobTitle": REVIEW_BOARD.jobTitle
  };
}
