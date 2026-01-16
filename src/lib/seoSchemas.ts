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

// ============================================
// Guide page schemas
// ============================================

export const GUIDE_SCHEMAS = {
  'faq': generateFAQSchema([
    {
      question: "Is the estimate really free?",
      answer: "Yes. We price-check your project and flag add-ons contractors usually hide. If you want, we'll also schedule a no-pressure inspection."
    },
    {
      question: "What if I already have a quote?",
      answer: "Upload it to the scanner. We'll identify red flags, compare specs, and build a negotiation script for you."
    },
    {
      question: "Can I just download the spec checklist?",
      answer: "Absolutely. Grab the Window Buyer's Specification Checklist and if you need a contractor later, we'll match you with one who fits your home and budget."
    }
  ]),

  'sales-tactics-guide': [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "The 11 Sales Tactics Window Contractors Use on Every Homeowner",
      "description": "Learn to recognize the psychological manipulation tactics used in window sales presentations so you can protect yourself before signing.",
      "author": {
        "@type": "Organization",
        "name": "Window Man Your Hurricane Hero"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Window Man Your Hurricane Hero",
        "logo": {
          "@type": "ImageObject",
          "url": "https://itswindowman.com/icon-512.webp"
        }
      },
      "url": "https://itswindowman.com/sales-tactics-guide"
    },
    generateFAQSchema([
      {
        question: "What sales tactics do window contractors use?",
        answer: "Common tactics include the 'Manager Approval' theatre (fake calls to create urgency), price anchoring (starting high to make discounts seem huge), fake competitor quotes, and emotional fear triggering about storms or break-ins."
      },
      {
        question: "How can I protect myself from high-pressure window sales?",
        answer: "Never sign on the first visit. Name the tactic when you recognize it. Use our guide's scripts to slow down the conversation. Always get multiple quotes and verify pricing with our Quote Scanner."
      },
      {
        question: "Why do window salespeople use these tactics?",
        answer: "These aren't random behaviors - they're trained systems designed to close deals on the first visit. The biggest window companies use proven psychological frameworks to maximize same-day closes."
      }
    ])
  ],

  'spec-checklist-guide': [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Pre-Installation Window Audit Checklist",
      "description": "The complete specification checklist to verify your window installation meets all requirements before work begins.",
      "author": {
        "@type": "Organization",
        "name": "Window Man Your Hurricane Hero"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Window Man Your Hurricane Hero",
        "logo": {
          "@type": "ImageObject",
          "url": "https://itswindowman.com/icon-512.webp"
        }
      },
      "url": "https://itswindowman.com/spec-checklist-guide"
    },
    generateHowToSchema(
      "How to Verify Window Installation Specifications",
      "Step-by-step guide to auditing your window replacement contract before installation begins.",
      [
        { name: "Review Window Specifications", text: "Check that all window specs (size, style, glass type, frame material) match your contract." },
        { name: "Verify Product Certifications", text: "Confirm NOA numbers, impact ratings, and energy certifications are included." },
        { name: "Check Installation Details", text: "Ensure proper flashing, sealant, and installation methods are specified." },
        { name: "Confirm Warranty Terms", text: "Verify both manufacturer and installer warranties are documented in writing." }
      ]
    ),
    generateFAQSchema([
      {
        question: "What should I check before window installation?",
        answer: "Verify window specifications match your contract, confirm NOA certifications, check installation methods are specified, and ensure warranty terms are documented in writing."
      },
      {
        question: "What is an NOA certificate?",
        answer: "A Notice of Acceptance (NOA) is a Miami-Dade County certification that verifies a product meets hurricane protection standards. It's required for impact windows in Florida."
      }
    ])
  ],

  'insurance-savings-guide': [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "How Impact Windows Can Cut Your Florida Insurance by 20%",
      "description": "Learn how to claim insurance discounts for impact windows under Florida law, including documentation requirements and the recalculation process.",
      "author": {
        "@type": "Organization",
        "name": "Window Man Your Hurricane Hero"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Window Man Your Hurricane Hero",
        "logo": {
          "@type": "ImageObject",
          "url": "https://itswindowman.com/icon-512.webp"
        }
      },
      "url": "https://itswindowman.com/insurance-savings-guide"
    },
    generateHowToSchema(
      "How to Claim Insurance Discounts for Impact Windows",
      "Step-by-step guide to getting wind mitigation discounts on your Florida homeowners insurance.",
      [
        { name: "Gather Documentation", text: "Collect your NOA certificates and window installation records from your contractor." },
        { name: "Schedule Wind Mitigation Inspection", text: "Hire a certified inspector to complete a wind mitigation report (typically $75-150)." },
        { name: "Submit to Your Insurer", text: "Send the inspection report to your insurance company and request a premium recalculation." },
        { name: "Verify Discount Applied", text: "Review your updated policy to confirm the opening protection credits are reflected." }
      ]
    ),
    generateFAQSchema([
      {
        question: "Do impact windows really lower insurance in Florida?",
        answer: "Yes. Under Florida Statute 627.0629, insurance companies must provide premium discounts for homes with wind-resistant features including impact windows. Savings can be 15-20% or more."
      },
      {
        question: "What documentation do I need for insurance discounts?",
        answer: "You need NOA (Notice of Acceptance) certificates for your windows and a wind mitigation inspection report from a certified inspector."
      },
      {
        question: "How much can I save on insurance with impact windows?",
        answer: "The average Florida homeowner with impact windows can save $400-800 per year on insurance premiums, though savings vary by carrier and coverage."
      }
    ])
  ]
} as const;

/**
 * Get complete schema array for a tool page
 */
export function getToolPageSchemas(toolId: keyof typeof TOOL_SCHEMAS): Record<string, unknown>[] {
  const schemas = TOOL_SCHEMAS[toolId];
  return [schemas.tool, schemas.faq];
}

/**
 * Get complete schema array for a guide page
 */
export function getGuidePageSchemas(guideId: keyof typeof GUIDE_SCHEMAS): Record<string, unknown>[] {
  const schemas = GUIDE_SCHEMAS[guideId];
  if (Array.isArray(schemas)) {
    return schemas as Record<string, unknown>[];
  }
  return [schemas as Record<string, unknown>];
}
