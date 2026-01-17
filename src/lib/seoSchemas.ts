/**
 * SEO Schema Generator Utility
 * Standardizes structured data across all tool pages
 */

const SITE_URL = "https://itswindowman.com";

interface ToolSchemaConfig {
  name: string;
  description: string;
  url: string;
  faqs?: Array<{ question: string; answer: string }>;
  howToSteps?: Array<{ name: string; text: string }>;
}

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
  'cost-calculator': {
    tool: generateToolSchema({
      name: "Cost of Inaction Calculator - Window Replacement Savings",
      description: "Calculate how much money you're losing every day by delaying window replacement. See the true cost of energy loss and break-even timeline.",
      url: "https://itswindowman.com/cost-calculator"
    }),
    faq: generateFAQSchema([
      {
        question: "How does the Cost of Inaction Calculator work?",
        answer: "Enter your current energy bill, window age, and home details. The calculator estimates monthly energy loss through inefficient windows and projects cumulative waste over 5 years."
      },
      {
        question: "How accurate is the energy savings estimate?",
        answer: "Our calculations are based on Department of Energy data showing that windows account for 25-30% of residential heating and cooling energy use. Individual results may vary."
      },
      {
        question: "When do new windows pay for themselves?",
        answer: "Most window replacements break even in 3-7 years through energy savings. Higher utility costs and older windows typically mean faster payback periods."
      }
    ])
  },

  'expert-system': {
    tool: generateToolSchema({
      name: "Window Questions Expert - AI-Powered Advisor",
      description: "Ask any question about window replacement and get instant, unbiased expert answers. No sales pitch, just facts powered by AI.",
      url: "https://itswindowman.com/expert"
    }),
    faq: generateFAQSchema([
      {
        question: "Is the Expert System really unbiased?",
        answer: "Yes. Unlike contractor consultations, our AI has no incentive to upsell you. It provides factual information based on industry standards and consumer research."
      },
      {
        question: "What questions can I ask?",
        answer: "Anything about window replacement: pricing, materials, installation, warranties, contractor red flags, insurance claims, permit requirements, and more."
      },
      {
        question: "Can the Expert review my specific quote?",
        answer: "The Expert can answer questions about pricing and specs, but for detailed quote analysis, use our Quote Scanner tool which is specifically designed for that."
      }
    ])
  },

  'reality-check': {
    tool: generateToolSchema({
      name: "Reality Check Quiz - Window Replacement Assessment",
      description: "Answer 5 quick questions about your current windows to get your Reality Score and see if replacement is urgent, recommended, or optional.",
      url: "https://itswindowman.com/reality-check"
    }),
    faq: generateFAQSchema([
      {
        question: "What is the Reality Check score?",
        answer: "Your Reality Score (0-100) indicates how urgently your windows need replacement. Scores above 75 suggest immediate action; 50-75 means replacement should be planned; below 50 means windows are still functional."
      },
      {
        question: "How long does the Reality Check take?",
        answer: "About 90 seconds. You'll answer 5 questions about window age, energy bills, drafts, and noise to receive your personalized assessment."
      },
      {
        question: "What factors affect my Reality Score?",
        answer: "The quiz considers window age, current energy bills, home size, draftiness levels, and noise infiltration to calculate your score."
      }
    ])
  },

  'comparison': {
    tool: generateToolSchema({
      name: "Window Tier Comparison Tool - True Cost Analysis",
      description: "Compare budget, mid-range, and premium window options side-by-side. See 10-year true costs including energy savings, maintenance, and replacement.",
      url: "https://itswindowman.com/comparison"
    }),
    faq: generateFAQSchema([
      {
        question: "What window tiers are compared?",
        answer: "We compare three tiers: Budget (basic vinyl windows), Mid-Range (enhanced vinyl or fiberglass), and Premium (impact or high-performance windows). Each shows upfront cost and 10-year true cost."
      },
      {
        question: "How is the 10-year true cost calculated?",
        answer: "True cost includes the initial purchase price plus projected energy costs, expected maintenance, and potential replacement needs over a 10-year period."
      },
      {
        question: "Should I always choose premium windows?",
        answer: "Not necessarily. The best choice depends on your budget, how long you'll stay in the home, local climate, and whether you need hurricane protection. Our tool helps you see the trade-offs."
      }
    ])
  },

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
  },

  'roleplay-simulator': {
    tool: generateToolSchema({
      name: "Sales Pressure Roleplay Simulator",
      description: "Practice handling high-pressure window sales tactics in a safe AI-powered simulation. Build confidence to resist manipulation before the real sales visit.",
      url: "https://itswindowman.com/roleplay"
    }),
    faq: generateFAQSchema([
      {
        question: "How does the roleplay simulator work?",
        answer: "You engage in a conversation with an AI salesperson who uses common high-pressure tactics. Your goal is to resist manipulation and maintain your position without agreeing to sign."
      },
      {
        question: "What tactics does the simulator use?",
        answer: "The AI uses real tactics from window sales training: urgency creation, price anchoring, fear triggering, and social proof manipulation. You'll learn to recognize and counter each one."
      },
      {
        question: "Is the simulator free to use?",
        answer: "Yes, the roleplay simulator is completely free. You can practice as many times as you want to build confidence before your real sales appointment."
      }
    ])
  },

  'fast-win': {
    tool: generateToolSchema({
      name: "Fast Win Product Finder",
      description: "Answer 4 quick questions to find the best window product for your specific situation. Get personalized recommendations in under 60 seconds.",
      url: "https://itswindowman.com/fast-win"
    }),
    faq: generateFAQSchema([
      {
        question: "How accurate is the product recommendation?",
        answer: "Our recommendations are based on your specific pain points, budget priority, and project status. The algorithm matches your needs to the most suitable window types."
      },
      {
        question: "How long does the Fast Win quiz take?",
        answer: "Under 60 seconds. You'll answer 4 simple questions and get an instant product recommendation tailored to your situation."
      }
    ])
  },

  'intel-library': {
    tool: generateToolSchema({
      name: "Window Man Intel Library - Free Guides & Resources",
      description: "Access our complete library of free guides, checklists, and resources to make smarter window replacement decisions. No sales pitch, just facts.",
      url: "https://itswindowman.com/intel"
    }),
    faq: generateFAQSchema([
      {
        question: "What resources are in the Intel Library?",
        answer: "The library includes sales tactics guides, specification checklists, insurance savings guides, kitchen table defense guides, and more - all free to access."
      },
      {
        question: "Do I need to pay for any guides?",
        answer: "No, all resources in the Intel Library are completely free. Some may require an email address so we can save your progress to your personal vault."
      }
    ])
  },

  'vulnerability-test': {
    tool: generateToolSchema({
      name: "Window Sales Vulnerability Quiz",
      description: "Take this 6-question quiz to discover how vulnerable you are to high-pressure window sales tactics. Get your vulnerability score and learn your weak spots.",
      url: "https://itswindowman.com/vulnerability-test"
    }),
    faq: generateFAQSchema([
      {
        question: "What does the vulnerability score mean?",
        answer: "Your vulnerability score shows how likely you are to fall for common sales manipulation tactics. Higher scores mean more vulnerable - but everyone can learn to protect themselves."
      },
      {
        question: "How is the vulnerability calculated?",
        answer: "The quiz tests your knowledge of sales tactics and your confidence in your answers. Both incorrect answers and overconfidence in wrong answers increase vulnerability."
      },
      {
        question: "Can I improve my vulnerability score?",
        answer: "Yes! After the quiz, we provide an answer key showing what to watch for. Most people significantly improve after learning the tactics."
      }
    ])
  },

  'kitchen-table-guide': {
    tool: generateToolSchema({
      name: "Kitchen Table Defense Guide",
      description: "A 12-page guide teaching you how to handle in-home window sales presentations. Learn the scripts and strategies to slow down high-pressure tactics.",
      url: "https://itswindowman.com/kitchen-table-guide"
    }),
    faq: generateFAQSchema([
      {
        question: "What is the Kitchen Table Guide?",
        answer: "A 12-page mobile-friendly field guide designed to be read in under 3 minutes. It includes red flag checklists, pause scripts, and a 'Do Not Sign If...' checklist."
      },
      {
        question: "When should I read this guide?",
        answer: "Read it before any in-home sales appointment. You can even reference it during the presentation - it's designed for quick mobile access."
      },
      {
        question: "Why is this guide free?",
        answer: "Because an informed homeowner makes better decisions. We provide free tools first - if you find them valuable, you can use our quote analysis tools later."
      }
    ])
  },

  'tools-index': {
    itemList: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Window Man Free Tools",
      "description": "Complete collection of free window replacement tools including calculators, analyzers, quizzes, and expert guidance.",
      "url": "https://itswindowman.com/tools",
      "numberOfItems": 12,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Free Estimate Calculator", "url": "https://itswindowman.com/free-estimate" },
        { "@type": "ListItem", "position": 2, "name": "Quote Scanner", "url": "https://itswindowman.com/quote-scanner" },
        { "@type": "ListItem", "position": 3, "name": "Fair Price Quiz", "url": "https://itswindowman.com/fair-price-quiz" },
        { "@type": "ListItem", "position": 4, "name": "Risk Diagnostic", "url": "https://itswindowman.com/risk-diagnostic" },
        { "@type": "ListItem", "position": 5, "name": "Beat Your Quote", "url": "https://itswindowman.com/beat-your-quote" },
        { "@type": "ListItem", "position": 6, "name": "Expert System", "url": "https://itswindowman.com/expert" },
        { "@type": "ListItem", "position": 7, "name": "Cost Calculator", "url": "https://itswindowman.com/cost-calculator" },
        { "@type": "ListItem", "position": 8, "name": "Comparison Tool", "url": "https://itswindowman.com/comparison" },
        { "@type": "ListItem", "position": 9, "name": "Reality Check Quiz", "url": "https://itswindowman.com/reality-check" },
        { "@type": "ListItem", "position": 10, "name": "Claim Survival Kit", "url": "https://itswindowman.com/claim-survival" },
        { "@type": "ListItem", "position": 11, "name": "Evidence Locker", "url": "https://itswindowman.com/evidence" },
        { "@type": "ListItem", "position": 12, "name": "Roleplay Simulator", "url": "https://itswindowman.com/roleplay" }
      ]
    }
  },

  'about': {
    organization: generateOrganizationSchema({
      name: "Window Man Your Hurricane Hero",
      url: "https://itswindowman.com",
      logo: "https://itswindowman.com/icon-512.webp",
      description: "AI-powered tools and resources to protect Florida homeowners from storm risk and contractor games. Get transparent window pricing and expert guidance.",
      contactPhone: "(305) 555-0123"
    }),
    aboutPage: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Window Man",
      "description": "Built to protect Florida homeowners from storm risk and contractor games. AI tools, vetted estimators, and a homeowner-first playbook.",
      "url": "https://itswindowman.com/about"
    }
  },

  'defense': {
    tool: generateToolSchema({
      name: "Window Quote Defense Mode",
      description: "Quick checklist of red flags to watch for before signing any window replacement contract. Protect your home and insurance claims.",
      url: "https://itswindowman.com/defense"
    }),
    faq: generateFAQSchema([
      {
        question: "What are the biggest red flags in window quotes?",
        answer: "Watch for: quotes without line-item pricing, 'today only' pressure discounts, missing wind-load or Miami-Dade approvals, and unverified rebates."
      },
      {
        question: "How do I protect my insurance claim?",
        answer: "Ensure your contractor provides NOA certificates, proper documentation, and specifications that meet your insurance requirements. Use our Claim Survival Kit for detailed guidance."
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
  
  // Handle different schema structures
  if ('tool' in schemas && 'faq' in schemas) {
    return [schemas.tool, schemas.faq];
  }
  if ('itemList' in schemas) {
    return [schemas.itemList as Record<string, unknown>];
  }
  if ('organization' in schemas && 'aboutPage' in schemas) {
    return [schemas.organization, schemas.aboutPage as Record<string, unknown>];
  }
  
  // Fallback - return all values
  return Object.values(schemas) as Record<string, unknown>[];
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
      "url": "https://itswindowman.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://itswindowman.com/icon-512.webp"
      }
    },
    "url": `https://itswindowman.com/evidence?highlight=${caseStudy.evidenceId}`,
    "isAccessibleForFree": true
  };
}

/**
 * Generate CreativeWork schemas for all case studies in the evidence library
 */
export function generateEvidenceLibrarySchemas(caseStudies: EvidenceCaseStudy[]): Record<string, unknown>[] {
  return caseStudies.map(generateCreativeWorkSchema);
}
