/**
 * Tool FAQs Data - PRD-Compliant FAQ Content
 * 
 * Each FAQ follows the mandated format:
 * - Direct Answer (≤50 words)
 * - Elaboration (built into answer)
 * - Tool CTA (contextual internal link)
 * - Evidence link (if claim-based)
 */

interface FAQ {
  question: string;
  answer: string;
  toolCTA?: {
    text: string;
    href: string;
  };
  evidenceId?: string;
}

export const TOOL_FAQS: Record<string, FAQ[]> = {
  'reality-check': [
    {
      question: "What is the Reality Score and what does it mean?",
      answer: "Your Reality Score (0-100) measures how urgently your windows need replacement. Scores above 75 indicate urgent action needed—you're likely losing significant money on energy and facing potential safety risks. Scores 50-75 suggest planned replacement within 1-2 years is wise. Below 50 means your windows are still functional, but monitoring is recommended.",
      toolCTA: {
        text: "Calculate your monthly energy loss with the Cost Calculator",
        href: "/cost-calculator"
      }
    },
    {
      question: "How long does the Reality Check take to complete?",
      answer: "About 90 seconds. You'll answer 5 questions about your window age, energy bills, home size, draftiness, and noise levels. The quiz uses Department of Energy data to calculate your personalized score and urgency level. No signup required—get instant results.",
      toolCTA: {
        text: "Compare window tier options after your assessment",
        href: "/comparison"
      }
    },
    {
      question: "Is the Reality Check accurate for Florida homes?",
      answer: "Yes—our algorithm is calibrated specifically for Florida's climate, which means higher AC costs and different window stress factors than northern states. We account for humidity, UV exposure, and storm protection requirements unique to Florida homeowners. Results typically align within 10% of professional assessments.",
      toolCTA: {
        text: "Check your hurricane protection gaps",
        href: "/risk-diagnostic"
      },
      evidenceId: "E-492"
    }
  ],

  'cost-calculator': [
    {
      question: "How does the Cost of Inaction Calculator determine my energy loss?",
      answer: "We use Department of Energy data showing windows account for 25-30% of residential heating and cooling costs. Based on your energy bill, window age, and home size, we calculate monthly waste from thermal inefficiency. Older windows with seal failures can leak 2-3x more energy than our baseline estimates.",
      toolCTA: {
        text: "See which window tier stops the bleeding fastest",
        href: "/comparison"
      },
      evidenceId: "E-445"
    },
    {
      question: "When do new windows actually pay for themselves in Florida?",
      answer: "Most Florida window replacements break even in 3-5 years through combined energy savings and insurance discounts. Premium impact windows often pay back faster due to 15-45% insurance premium reductions. Higher your current utility costs, faster your payback. Our calculator shows your specific break-even timeline.",
      toolCTA: {
        text: "Check your insurance savings eligibility",
        href: "/risk-diagnostic"
      },
      evidenceId: "E-387"
    },
    {
      question: "Are these energy savings estimates guaranteed?",
      answer: "Estimates are projections based on DOE averages and Florida-specific data, not guarantees. Actual savings depend on installation quality, window specifications, and usage patterns. However, our estimates typically fall within 15% of actual measured savings based on follow-up homeowner surveys.",
      toolCTA: {
        text: "Get a verified quote to lock in real numbers",
        href: "/free-estimate"
      }
    }
  ],

  'comparison': [
    {
      question: "What window tiers are compared and which should I choose?",
      answer: "We compare three tiers: Budget (basic vinyl, 10-15 year lifespan), Mid-Range (enhanced vinyl or fiberglass, 20-25 years), and Premium (impact-rated, 30+ years). The 'best' choice depends on how long you'll stay in your home, your budget, and whether you need hurricane protection. Premium often costs less over 10 years.",
      toolCTA: {
        text: "Calculate your specific 10-year costs",
        href: "/cost-calculator"
      }
    },
    {
      question: "How is the 10-year true cost calculated for each tier?",
      answer: "True cost = upfront purchase + projected energy costs + maintenance + potential mid-cycle replacement. Budget windows often need replacement at year 12-15, adding a second purchase to your 20-year total. We also factor Florida-specific insurance savings for impact windows, which can offset $200-400/year.",
      toolCTA: {
        text: "See if your quote reflects fair tier pricing",
        href: "/quote-scanner"
      },
      evidenceId: "E-445"
    },
    {
      question: "Should Florida homeowners always choose impact windows?",
      answer: "Not always, but usually. Impact windows provide hurricane protection, noise reduction, and insurance savings that non-impact options can't match. If you're in a non-coastal zone AND plan to sell within 5 years, mid-range might suffice. Otherwise, impact windows typically deliver the best total value for Florida homes.",
      toolCTA: {
        text: "Check your hurricane risk zone requirements",
        href: "/risk-diagnostic"
      }
    }
  ],

  'risk-diagnostic': [
    {
      question: "What does the Risk Diagnostic measure about my home?",
      answer: "We evaluate four vulnerability categories: Storm Protection (window ratings, shutters, roof tie-downs), Security (lock quality, glass strength), Insurance Gaps (coverage limits, deductibles, missing discounts), and Warranty Status (expiration dates, transferability). Each category gets a protection percentage and action priority.",
      toolCTA: {
        text: "See how protection gaps affect your costs",
        href: "/cost-calculator"
      }
    },
    {
      question: "How accurate is the insurance savings estimate?",
      answer: "Our estimates are based on published Florida insurance discount schedules, typically 15-45% for full wind mitigation compliance. Actual savings depend on your specific carrier and policy. We recommend getting a formal wind mitigation inspection to verify eligibility—our estimate gives you negotiating baseline.",
      toolCTA: {
        text: "Get quotes that include insurance impact",
        href: "/free-estimate"
      },
      evidenceId: "E-387"
    },
    {
      question: "Is my Risk Diagnostic information kept private?",
      answer: "Yes, your diagnostic results are processed locally and not shared with third parties. We only store information you explicitly choose to share when requesting a consultation or emailing your report. Your vulnerability data never goes to insurance companies or contractors without your consent.",
      toolCTA: {
        text: "Compare protection options for your gaps",
        href: "/comparison"
      }
    }
  ],

  'quote-scanner': [
    {
      question: "What does the AI Quote Scanner look for in my contractor quote?",
      answer: "Our AI analyzes line-item pricing against Florida market data, identifies hidden fees (permit padding, disposal markups, 'mystery' labor charges), checks for missing scope items, and flags pressure-tactic language. We compare your quote to thousands of verified Florida window projects.",
      toolCTA: {
        text: "Practice handling sales pressure before signing",
        href: "/roleplay"
      }
    },
    {
      question: "Is my quote information kept private and secure?",
      answer: "Yes. Your quote is processed through encrypted channels and never shared with contractors, insurance companies, or third parties. We don't store quote images after analysis. The data helps improve our pricing database anonymously, but your personal details and contractor names are never retained.",
      toolCTA: {
        text: "Build your own estimate to compare",
        href: "/free-estimate"
      }
    },
    {
      question: "What file types can I upload for quote analysis?",
      answer: "We accept photos (JPG, PNG, HEIC) and PDF documents. Our AI can read both printed and handwritten quotes, though typed documents yield more accurate analysis. Blurry or partial images may result in incomplete analysis—we'll let you know if we need a clearer version.",
      toolCTA: {
        text: "No quote yet? Get a fair-price baseline first",
        href: "/fair-price-quiz"
      }
    }
  ],

  'free-estimate': [
    {
      question: "How accurate is the Free Estimate Calculator for Florida projects?",
      answer: "Our estimates use current 2025 Florida material costs and labor rates, updated monthly from contractor surveys and supplier data. Results typically fall within 10-15% of actual project bids for standard configurations. Complex projects or unusual specifications may vary more. Use as a negotiation baseline, not a binding quote.",
      toolCTA: {
        text: "Scan an actual quote to verify the numbers",
        href: "/quote-scanner"
      }
    },
    {
      question: "What information do I need to build my window estimate?",
      answer: "You'll need: approximate window sizes (we provide common defaults), desired style (single-hung, casement, sliding, etc.), frame material preference, and whether you want impact-rated glass. Don't know specs? Our AI Quick Build can suggest configurations based on your home description.",
      toolCTA: {
        text: "Compare tier pricing before configuring",
        href: "/comparison"
      }
    },
    {
      question: "Can I save or email my estimate for later reference?",
      answer: "Yes. After building your estimate, you can download a PDF summary, email it to yourself, or save it to your WindowMan Vault for future reference. Saved estimates include your configuration details, pricing breakdown, and a unique reference ID for easy retrieval.",
      toolCTA: {
        text: "Access your saved estimates in the Vault",
        href: "/vault"
      }
    }
  ],

  'beat-your-quote': [
    {
      question: "How does Beat Your Quote help me negotiate a better price?",
      answer: "We analyze your uploaded quote against our database of 10,000+ Florida window quotes to identify overpriced line items, missing discounts, and negotiation leverage points. You'll receive a detailed breakdown showing fair-market pricing for each component and specific talking points to use with your contractor.",
      toolCTA: {
        text: "Practice your negotiation before the call",
        href: "/roleplay"
      },
      evidenceId: "E-541"
    },
    {
      question: "Is the quote analysis really free?",
      answer: "Yes, the analysis is completely free with no hidden upsells. We believe homeowners deserve pricing transparency before making major decisions. Our mission is to level the playing field between homeowners and window contractors. You'll never be charged for using our analysis tools.",
      toolCTA: {
        text: "Build your own estimate to compare",
        href: "/free-estimate"
      }
    },
    {
      question: "What happens after I submit my quote for analysis?",
      answer: "Our AI processes your quote in 30-60 seconds, extracting pricing data and comparing against fair-market benchmarks. You'll receive a detailed report showing: overall price grade (A-F), line-item analysis, red flags, and a negotiation script. Enter your email to receive the full report and track results.",
      toolCTA: {
        text: "Learn the sales tactics they might use on you",
        href: "/sales-tactics-guide"
      }
    }
  ]
};

/**
 * Get FAQs for a specific tool by its path
 */
export function getToolFAQs(toolPath: string): FAQ[] {
  // Normalize path by removing leading slash
  const normalizedPath = toolPath.replace(/^\//, '');
  return TOOL_FAQS[normalizedPath] || [];
}
