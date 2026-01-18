/**
 * LocalBusiness Schema Generator
 * Handles LocalBusiness structured data (fixes Google Rich Results errors)
 */

const SITE_URL = "https://itswindowman.com";

/**
 * Generate LocalBusiness schema with proper address for Google validation
 * Resolves "Missing Address" error in Rich Results Test
 */
export function generateLocalBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    "name": "Window Man Your Hurricane Hero",
    "description": "Free tools to help Florida homeowners get fair window replacement quotes and avoid overpaying.",
    "url": SITE_URL,
    "logo": `${SITE_URL}/icon-512.webp`,
    "image": `${SITE_URL}/icon-512.webp`,
    "telephone": "+1-561-468-5571",
    "email": "support@itswindowman.com",
    "address": {
      "@type": "PostalAddress",
      "postalCode": "33069",
      "addressRegion": "Florida",
      "addressCountry": "US"
    },
    "areaServed": [
      {
        "@type": "State",
        "name": "Florida",
        "sameAs": "https://en.wikipedia.org/wiki/Florida"
      },
      {
        "@type": "AdministrativeArea",
        "name": "Miami-Dade County"
      },
      {
        "@type": "AdministrativeArea",
        "name": "Broward County"
      },
      {
        "@type": "AdministrativeArea",
        "name": "Palm Beach County"
      }
    ],
    "priceRange": "Free",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "sameAs": [
      "https://www.facebook.com/its.windowman",
      "https://twitter.com/itswindowman"
    ]
  };
}

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
