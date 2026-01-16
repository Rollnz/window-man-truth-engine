/**
 * SEO Schema Generator Utility
 * Standardizes structured data across all tool pages
 */

interface ToolSchemaConfig {
  name: string;
  description: string;
  url: string;
  faqs?: Array<{ question: string; answer: string }>;
  howToSteps?: Array<{ name: string; text: string }>;
}

/**
 * Generate SoftwareApplication schema for free tools
 */
export function generateToolSchema(config: ToolSchemaConfig): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": config.name,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": config.description,
    "url": config.url
  };
}

/**
 * Generate FAQPage schema for rich snippets
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate HowTo schema for step-by-step content
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map(step => ({
      "@type": "HowToStep",
      "name": step.name,
      "text": step.text
    }))
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

// ============================================
// Pre-configured schemas for each tool page
// ============================================

export const TOOL_SCHEMAS = {
  'fair-price-quiz': {
    tool: generateToolSchema({
      name: "Fair Price Quiz - Window Quote Analyzer",
      description: "Answer 7 quick questions about your window quote to get an instant price analysis and find out if you're paying a fair price.",
      url: "https://itswindowman.com/fair-price-quiz"
    }),
    faq: generateFAQSchema([
      {
        question: "How accurate is the fair price analysis?",
        answer: "Our analysis uses real market data from thousands of window projects to compare your quote. Results are typically within 10-15% of actual fair market value."
      },
      {
        question: "What information do I need for the quiz?",
        answer: "You'll need your property type, approximate square footage, number of windows, your current quote amount, and a few details about the contractor's presentation."
      },
      {
        question: "How long does the quiz take?",
        answer: "The quiz takes about 2 minutes to complete. You'll receive instant results with a grade (A-F) and specific recommendations."
      }
    ])
  },

  'quote-scanner': {
    tool: generateToolSchema({
      name: "AI Quote Scanner - Instant Quote Analysis",
      description: "Upload a photo of your window replacement quote and get instant AI-powered analysis identifying red flags, fair pricing, and negotiation tips.",
      url: "https://itswindowman.com/quote-scanner"
    }),
    faq: generateFAQSchema([
      {
        question: "What file types can I upload?",
        answer: "You can upload photos (JPG, PNG) or PDF documents of your quote. Our AI can read handwritten and printed quotes."
      },
      {
        question: "Is my quote information kept private?",
        answer: "Yes, your quote is processed securely and not shared with any third parties. We use the data only to provide your analysis."
      },
      {
        question: "What does the scanner look for?",
        answer: "The scanner analyzes line item pricing, identifies hidden fees, checks for inflated labor costs, and compares against fair market rates in your area."
      }
    ])
  },

  'evidence-locker': {
    tool: generateToolSchema({
      name: "Evidence Locker - Real Homeowner Case Studies",
      description: "Browse real case studies showing how homeowners saved thousands on window replacements using our tools and strategies.",
      url: "https://itswindowman.com/evidence"
    }),
    faq: generateFAQSchema([
      {
        question: "Are these real case studies?",
        answer: "Yes, all case studies are from real homeowners who used our tools. Names and identifying details may be changed to protect privacy."
      },
      {
        question: "How much can I realistically save?",
        answer: "Savings vary by project, but homeowners in our case studies have saved between $2,000 and $15,000 on window replacement projects."
      },
      {
        question: "Which tools should I use first?",
        answer: "Start with the Fair Price Quiz if you have a quote, or the Free Estimate Calculator if you're still shopping. The Evidence Locker shows which tools work best for different situations."
      }
    ])
  }
} as const;

/**
 * Get complete schema array for a tool page
 */
export function getToolPageSchemas(toolId: keyof typeof TOOL_SCHEMAS): Record<string, unknown>[] {
  const schemas = TOOL_SCHEMAS[toolId];
  return [schemas.tool, schemas.faq];
}
