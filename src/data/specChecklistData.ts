// Spec Checklist Guide Landing Page Data

export const heroData = {
  headline: "The 4-Packet System Contractors Don't Want You to Have",
  subheadline: "A comprehensive pre-installation audit checklist that exposes contract gaps, product substitutions, and installation shortcuts before you sign anything or release a single dollar.",
  supportingCopy: "Used by Florida homeowners who refuse to overpay. Every promise verified. Every loophole closed. Every payment protected.",
};

export const problemBullets = [
  {
    icon: 'x' as const,
    text: "Vague Material Specifications → \"Impact windows\" means nothing without brand, series, and model numbers",
  },
  {
    icon: 'x' as const,
    text: "Missing Design Pressure Ratings → Your windows might not be rated for your home's wind zone",
  },
  {
    icon: 'x' as const,
    text: "No Installation Standards Referenced → Contractors can deviate from manufacturer specs with no accountability",
  },
  {
    icon: 'x' as const,
    text: "Warranty Loopholes → Lifetime parts warranty with 1-year labor coverage is a financial trap",
  },
  {
    icon: 'x' as const,
    text: "Payment Released Before Verification → Once you pay, your leverage disappears",
  },
];

export const problemClosing = "The result? Homeowners who paid $40,000 for 'premium' windows discover they received the contractor's cheapest approved product — with no recourse because nothing was specified in writing.";

export const packetData = [
  {
    id: 1,
    title: "Pre-Contract Verification",
    badge: "Use BEFORE signing or paying deposit",
    badgeColor: "destructive" as const,
    previewBullets: [
      "Schedule of Materials audit (every opening specified)",
      "Florida Product Approval verification (FL# numbers)",
      "Design Pressure rating compliance",
    ],
    fullBullets: [
      "Schedule of Materials audit (every opening specified)",
      "Florida Product Approval verification (FL# numbers)",
      "Design Pressure rating compliance",
      "Warranty terms documentation",
    ],
    stopTrigger: "Any specification marked \"to be determined\"",
  },
  {
    id: 2,
    title: "Delivery & Product Inspection",
    badge: "Use BEFORE installation begins",
    badgeColor: "warning" as const,
    previewBullets: [
      "Document-to-product matching",
      "Permanent glass etching verification (your only proof)",
      "NFRC sticker photography (captures DP rating)",
    ],
    fullBullets: [
      "Document-to-product matching",
      "Permanent glass etching verification (your only proof)",
      "NFRC sticker photography (captures DP rating)",
      "Premium interlayer confirmation (if you paid for SentryGlas)",
    ],
    stopTrigger: "Missing Florida approval etching on glass",
  },
  {
    id: 3,
    title: "Installation Field Audit",
    badge: "Use DURING installation",
    badgeColor: "primary" as const,
    previewBullets: [
      "Substrate condition verification",
      "Flashing and water management",
      "Fastener spacing and placement",
    ],
    fullBullets: [
      "Substrate condition verification",
      "Flashing and water management",
      "Fastener spacing and placement",
      "Post-installation operational testing",
    ],
    stopTrigger: "Weep holes blocked by sealant (guaranteed leaks)",
  },
  {
    id: 4,
    title: "Final Inspection & Close-Out",
    badge: "Use BEFORE releasing final payment",
    badgeColor: "secondary" as const,
    previewBullets: [
      "Building permit sign-off verification",
      "Warranty registration confirmation",
      "As-built documentation collection",
    ],
    fullBullets: [
      "Building permit sign-off verification",
      "Warranty registration confirmation",
      "As-built documentation collection",
      "Punch list completion",
    ],
    leverageNote: "Final payment is your final leverage — don't release it until everything passes",
  },
];

export const authorityColumns = [
  {
    title: "Built from Real Failures",
    description: "Compiled from actual dispute cases where homeowners had no recourse because critical details weren't documented before signing.",
  },
  {
    title: "Florida Code Compliant",
    description: "Every checkpoint references specific Florida Building Code requirements and manufacturer installation instructions that are legally binding.",
  },
  {
    title: "Contractor-Tested",
    description: "Professional contractors who use proper processes have zero problem with these audits. The ones who push back are the ones you need to avoid.",
  },
];

export const testimonials = [
  {
    quote: "This checklist caught that my contractor quoted 'impact windows' but the contract didn't specify brand or model. When I pushed back, they tried to substitute a product $8,000 cheaper than what we discussed. I walked away.",
    author: "Sarah M.",
    location: "Boca Raton",
  },
  {
    quote: "Packet 2 saved me. The windows delivered didn't have the Florida approval etching on the glass. The contractor said 'it's fine, trust me.' I refused installation and demanded proof. Turned out they were non-approved units. Full stop.",
    author: "James T.",
    location: "West Palm Beach",
  },
  {
    quote: "I used Packet 1 during my final contractor meeting. He said 'most people don't ask for this level of detail.' I responded, 'most people aren't spending $35,000.' He either documents everything or I walk. He documented everything.",
    author: "Linda R.",
    location: "Delray Beach",
  },
];

export const objectionColumns = {
  professional: {
    title: "Professional Contractors Say:",
    items: [
      "\"I appreciate working with informed clients\"",
      "\"Here's the manufacturer's installation instructions\"",
      "\"Let me show you the Florida approval documents\"",
      "\"I'll make sure everything is in the contract\"",
    ],
  },
  problematic: {
    title: "Problematic Contractors Say:",
    items: [
      "\"You don't need to worry about those details\"",
      "\"We always use the best products\"",
      "\"That's industry standard, trust me\"",
      "\"You're making this too complicated\"",
    ],
  },
};

export const objectionClosing = "The contractors who push back on documentation are the ones you need to walk away from. This system is your filter.";

export const urgencyBullets = [
  { icon: 'clock', text: "Takes 48 hours to properly audit a contract using this system" },
  { icon: 'clipboard', text: "If your meeting is this week, you need this checklist today" },
  { icon: 'dollar', text: "Catching one product substitution pays for itself 100x over" },
  { icon: 'lock', text: "Your contractor won't volunteer what's missing — you must verify" },
];

export const trustSignals = [
  "No credit card required",
  "Instant PDF delivery",
  "Used by 2,000+ Florida homeowners",
  "We'll never share your email",
];

export const valueStackItems = [
  "35-page comprehensive audit guide (not a flimsy 1-page checklist)",
  "4 sequential verification packets (maintain control at every stage)",
  "Stop Work Trigger identification (know when to halt immediately)",
  "Photo documentation protocols (capture proof before it's hidden)",
  "Contractor red flag decoder (recognize manipulation tactics)",
  "Final payment leverage strategy (how to use withholding properly)",
];

export const faqItems = [
  {
    question: "Do I really need to be this detailed?",
    answer: "If you're spending $20,000-$50,000 on impact windows, yes. This is how commercial projects maintain quality control. Your home deserves the same rigor.",
  },
  {
    question: "Will contractors refuse to work with me if I use this?",
    answer: "Professional contractors welcome documentation. If a contractor pushes back on verifying what they promised, that's a red flag telling you to walk away.",
  },
  {
    question: "Can I use this if I already have a quote but haven't signed?",
    answer: "Absolutely. Packet 1 is specifically designed for the pre-contract phase. Use it to audit your quote before signing.",
  },
  {
    question: "What if my contractor already started work?",
    answer: "Start with whichever packet matches your current stage. Packet 2 (delivery verification) and Packet 3 (installation audit) can be used mid-project.",
  },
  {
    question: "Is this only for impact windows?",
    answer: "While designed for Florida impact windows, the audit principles apply to any major window/door replacement project where code compliance and product verification matter.",
  },
];

// exitIntentData removed - using authority/ExitIntentModal with 3-step workflow instead
