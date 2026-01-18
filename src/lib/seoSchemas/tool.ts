/**
 * Tool Schema Generator
 * Handles SoftwareApplication, FAQ, and HowTo schemas for tool pages
 */

import { getAuthorReference } from "@/config/expertIdentity";

const SITE_URL = "https://itswindowman.com";

interface ToolSchemaConfig {
  name: string;
  description: string;
  url: string;
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
 * Get the standard author and publisher for all Article schemas
 */
export function getStandardAuthorPublisher() {
  return {
    author: getAuthorReference(),
    publisher: {
      "@type": "Organization",
      "name": "Window Man Your Hurricane Hero",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/icon-512.webp`
      }
    }
  };
}

// ============================================
// Pre-configured schemas for each tool page
// ============================================

export const TOOL_SCHEMAS = {
  'cost-calculator': {
    tool: generateToolSchema({
      name: "Cost of Inaction Calculator - Window Replacement Savings",
      description: "Calculate how much money you're losing every day by delaying window replacement. See the true cost of energy loss and break-even timeline.",
      url: `${SITE_URL}/cost-calculator`
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
      url: `${SITE_URL}/expert`
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
      url: `${SITE_URL}/reality-check`
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
      url: `${SITE_URL}/comparison`
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
      url: `${SITE_URL}/fair-price-quiz`
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
      url: `${SITE_URL}/quote-scanner`
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
    ]),
    howTo: generateHowToSchema(
      "How to Scan Your Window Quote for Red Flags",
      "Upload your quote and get instant AI analysis identifying hidden fees and fair pricing.",
      [
        { name: "Upload Your Quote", text: "Take a photo or upload PDF of your window replacement quote" },
        { name: "AI Analysis", text: "Our AI scans for red flags, hidden fees, and pricing issues" },
        { name: "Get Results", text: "Receive detailed report with negotiation tips and fair price comparison" }
      ]
    )
  },

  'risk-diagnostic': {
    tool: generateToolSchema({
      name: "Home Protection Risk Diagnostic",
      description: "Free diagnostic tool to assess your home's protection level against storms, security threats, and insurance gaps. Get personalized recommendations.",
      url: `${SITE_URL}/risk-diagnostic`
    }),
    faq: generateFAQSchema([
      {
        question: "What does the risk diagnostic measure?",
        answer: "The diagnostic evaluates four key areas: storm protection, home security, insurance coverage, and warranty status. You'll receive a protection score and personalized action plan."
      },
      {
        question: "How long does the diagnostic take?",
        answer: "The diagnostic takes about 2-3 minutes to complete. Answer simple questions about your home and receive instant results with actionable recommendations."
      },
      {
        question: "Is my information kept private?",
        answer: "Yes, your diagnostic results are private. We only collect the information you choose to share when requesting a consultation or saving your report."
      }
    ])
  },

  'claim-survival': {
    tool: generateToolSchema({
      name: "Insurance Claim Survival Kit",
      description: "Free tool to organize your insurance claim documents, track your readiness score, and avoid common mistakes that delay or deny claims.",
      url: `${SITE_URL}/claim-survival`
    }),
    faq: generateFAQSchema([
      {
        question: "What documents do I need for an insurance claim?",
        answer: "You need 7 critical documents: insurance policy, photos of damage before and after, contractor estimates, receipts for emergency repairs, inventory of damaged items, written timeline of events, and communication records with your insurer."
      },
      {
        question: "How soon should I file a claim after storm damage?",
        answer: "File your claim as soon as possible, ideally within 24-48 hours. Document damage immediately and take steps to prevent further damage."
      }
    ]),
    howTo: generateHowToSchema(
      "How to File a Successful Insurance Claim",
      "Step-by-step guide to organizing your documents and filing a successful insurance claim after storm damage.",
      [
        { name: "Gather Critical Documents", text: "Collect your insurance policy, photos of damage, receipts, and contractor estimates." },
        { name: "Document All Damage", text: "Follow our photo protocol to capture evidence that adjusters need to approve your claim." },
        { name: "Follow the 24-Hour Playbook", text: "Take immediate action after a storm using our timeline to protect your claim rights." },
        { name: "Analyze Your Readiness", text: "Use our AI tool to identify gaps in your documentation before submitting your claim." }
      ]
    )
  },

  'beat-your-quote': {
    tool: generateToolSchema({
      name: "Beat Your Quote - Quote Bloat Analyzer",
      description: "Upload your window quote and discover hidden markups, bloated pricing, and negotiation leverage points.",
      url: `${SITE_URL}/beat-your-quote`
    }),
    faq: generateFAQSchema([
      {
        question: "How does the quote bloat analyzer work?",
        answer: "Upload your contractor's quote and our AI scans for inflated line items, unnecessary add-ons, and pricing that exceeds market rates."
      },
      {
        question: "What hidden fees does it detect?",
        answer: "Common bloat includes excessive labor charges, duplicate line items, premium markups on standard materials, and vague 'miscellaneous' fees."
      }
    ])
  },

  'evidence-locker': {
    tool: generateToolSchema({
      name: "Evidence Locker - Real Homeowner Case Studies",
      description: "Browse real case studies showing how homeowners saved thousands on window replacements using our tools and strategies.",
      url: `${SITE_URL}/evidence`
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
      url: `${SITE_URL}/roleplay`
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
      url: `${SITE_URL}/fast-win`
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
      url: `${SITE_URL}/intel`
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
      url: `${SITE_URL}/vulnerability-test`
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
      url: `${SITE_URL}/kitchen-table-guide`
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
      "url": `${SITE_URL}/tools`,
      "numberOfItems": 12,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Free Estimate Calculator", "url": `${SITE_URL}/free-estimate` },
        { "@type": "ListItem", "position": 2, "name": "Quote Scanner", "url": `${SITE_URL}/quote-scanner` },
        { "@type": "ListItem", "position": 3, "name": "Fair Price Quiz", "url": `${SITE_URL}/fair-price-quiz` },
        { "@type": "ListItem", "position": 4, "name": "Risk Diagnostic", "url": `${SITE_URL}/risk-diagnostic` },
        { "@type": "ListItem", "position": 5, "name": "Beat Your Quote", "url": `${SITE_URL}/beat-your-quote` },
        { "@type": "ListItem", "position": 6, "name": "Expert System", "url": `${SITE_URL}/expert` },
        { "@type": "ListItem", "position": 7, "name": "Cost Calculator", "url": `${SITE_URL}/cost-calculator` },
        { "@type": "ListItem", "position": 8, "name": "Comparison Tool", "url": `${SITE_URL}/comparison` },
        { "@type": "ListItem", "position": 9, "name": "Reality Check Quiz", "url": `${SITE_URL}/reality-check` },
        { "@type": "ListItem", "position": 10, "name": "Claim Survival Kit", "url": `${SITE_URL}/claim-survival` },
        { "@type": "ListItem", "position": 11, "name": "Evidence Locker", "url": `${SITE_URL}/evidence` },
        { "@type": "ListItem", "position": 12, "name": "Roleplay Simulator", "url": `${SITE_URL}/roleplay` }
      ]
    }
  },

  'about': {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Window Man Your Hurricane Hero",
      "url": SITE_URL,
      "logo": `${SITE_URL}/icon-512.webp`,
      "description": "AI-powered tools and resources to protect Florida homeowners from storm risk and contractor games. Get transparent window pricing and expert guidance.",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "(305) 555-0123",
        "contactType": "customer service"
      }
    },
    aboutPage: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Window Man",
      "description": "Built to protect Florida homeowners from storm risk and contractor games. AI tools, vetted estimators, and a homeowner-first playbook.",
      "url": `${SITE_URL}/about`
    }
  },

  'defense': {
    tool: generateToolSchema({
      name: "Window Quote Defense Mode",
      description: "Quick checklist of red flags to watch for before signing any window replacement contract. Protect your home and insurance claims.",
      url: `${SITE_URL}/defense`
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

/**
 * Get complete schema array for a tool page
 * Now includes HowTo schemas when present
 */
export function getToolPageSchemas(toolId: keyof typeof TOOL_SCHEMAS): Record<string, unknown>[] {
  const schemas = TOOL_SCHEMAS[toolId];
  const results: Record<string, unknown>[] = [];
  
  // Add tool schema if present
  if ('tool' in schemas) results.push(schemas.tool);
  
  // Add FAQ schema if present
  if ('faq' in schemas) results.push(schemas.faq);
  
  // Add HowTo schema if present (NEW)
  if ('howTo' in schemas) results.push(schemas.howTo as Record<string, unknown>);
  
  // Handle other schema types
  if ('itemList' in schemas) results.push(schemas.itemList as Record<string, unknown>);
  if ('organization' in schemas) results.push(schemas.organization);
  if ('aboutPage' in schemas) results.push(schemas.aboutPage as Record<string, unknown>);
  
  return results;
}
