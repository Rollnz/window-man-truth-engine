/**
 * Guide Schema Generator
 * Handles Article, FAQ, and HowTo schemas for guide pages
 */

import { generateFAQSchema, generateHowToSchema, getStandardAuthorPublisher } from './tool';

const SITE_URL = "https://itswindowman.com";

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
      ...getStandardAuthorPublisher(),
      "url": `${SITE_URL}/sales-tactics-guide`,
      "datePublished": "2025-01-16",
      "dateModified": "2025-01-17"
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
      ...getStandardAuthorPublisher(),
      "url": `${SITE_URL}/spec-checklist-guide`,
      "datePublished": "2025-01-16",
      "dateModified": "2025-01-17"
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
      ...getStandardAuthorPublisher(),
      "url": `${SITE_URL}/insurance-savings-guide`,
      "datePublished": "2025-01-16",
      "dateModified": "2025-01-17"
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
  ],

  'kitchen-table-guide': [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Kitchen Table Defense Guide: How to Handle In-Home Window Sales",
      "description": "A 12-page guide teaching you how to handle in-home window sales presentations. Learn the scripts and strategies to slow down high-pressure tactics.",
      ...getStandardAuthorPublisher(),
      "url": `${SITE_URL}/kitchen-table-guide`,
      "datePublished": "2025-01-16",
      "dateModified": "2025-01-17"
    },
    generateFAQSchema([
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
  ]
} as const;

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
