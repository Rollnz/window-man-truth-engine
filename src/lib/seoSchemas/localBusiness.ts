/**
 * Service Business Schema Generator
 * Uses Organization type for online/home-based businesses
 * (LocalBusiness requires physical storefront address)
 */

const SITE_URL = "https://itswindowman.com";

/**
 * Major Florida metropolitan areas for statewide coverage
 */
const FLORIDA_SERVICE_AREAS = [
  // Statewide
  { "@type": "State", "name": "Florida", "sameAs": "https://en.wikipedia.org/wiki/Florida" },
  // Tri-County Focus
  { "@type": "AdministrativeArea", "name": "Palm Beach County" },
  { "@type": "AdministrativeArea", "name": "Broward County" },
  { "@type": "AdministrativeArea", "name": "Miami-Dade County" },
  // Major Cities (for paid ad coverage)
  { "@type": "City", "name": "Miami", "sameAs": "https://en.wikipedia.org/wiki/Miami" },
  { "@type": "City", "name": "Fort Lauderdale" },
  { "@type": "City", "name": "West Palm Beach" },
  { "@type": "City", "name": "Tampa", "sameAs": "https://en.wikipedia.org/wiki/Tampa,_Florida" },
  { "@type": "City", "name": "Orlando", "sameAs": "https://en.wikipedia.org/wiki/Orlando,_Florida" },
  { "@type": "City", "name": "Jacksonville", "sameAs": "https://en.wikipedia.org/wiki/Jacksonville,_Florida" },
  { "@type": "City", "name": "Naples" },
  { "@type": "City", "name": "Sarasota" },
  { "@type": "City", "name": "Fort Myers" },
  { "@type": "City", "name": "Boca Raton" },
  { "@type": "City", "name": "Pompano Beach" },
  { "@type": "City", "name": "Hollywood" },
  { "@type": "City", "name": "Coral Springs" },
  { "@type": "City", "name": "Cape Coral" },
];

/**
 * Generate Organization schema for statewide service business
 * Replaces LocalBusiness to avoid "Missing Address" errors
 */
export function generateServiceBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#servicebusiness`,
    "name": "Window Man Your Hurricane Hero",
    "description": "Free AI-powered tools to help Florida homeowners get fair window replacement quotes and avoid overpaying.",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icon-512.webp`,
    "image": `${SITE_URL}/icon-512.webp`,
    "telephone": "+1-561-468-5571",
    "email": "support@itswindowman.com",
    "areaServed": FLORIDA_SERVICE_AREAS,
    "priceRange": "Free",
    "serviceType": [
      "Window Quote Analysis",
      "Impact Window Cost Calculator",
      "Hurricane Window Verification"
    ],
    "sameAs": [
      "https://www.facebook.com/its.windowman",
      "https://twitter.com/itswindowman"
    ]
  };
}

// Backward compatibility alias
export const generateLocalBusinessSchema = generateServiceBusinessSchema;

/**
 * Generate Organization schema for homepage
 */
export function generateOrganizationSchema(config: {
  name: string;
  url: string;
  logo: string;
  description: string;
  socialLinks?: string[];
  contactPhone?: string;
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": config.name,
    "url": config.url,
    "logo": config.logo,
    "description": config.description
  };

  if (config.socialLinks?.length) {
    schema.sameAs = config.socialLinks;
  }

  if (config.contactPhone) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      "telephone": config.contactPhone,
      "contactType": "customer service"
    };
  }

  return schema;
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(config: {
  name: string;
  url: string;
  searchUrlTemplate?: string;
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": config.name,
    "url": config.url
  };

  if (config.searchUrlTemplate) {
    schema.potentialAction = {
      "@type": "SearchAction",
      "target": config.searchUrlTemplate,
      "query-input": "required name=search_term_string"
    };
  }

  return schema;
}
