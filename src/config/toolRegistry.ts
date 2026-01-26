import {
  Calculator,
  FileSearch,
  Shield,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Zap,
  MessageSquare,
  FolderSearch,
  BookOpen,
  FileStack,
  Target,
  Brain,
  Swords,
  AlertTriangle,
  ScanSearch,
  GitCompare,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/config/navigation';

// ============================================
// CRO TYPES
// ============================================

/**
 * Funnel phases for CRO-optimized tool suggestions
 * Used to enforce "No U-Turn" rule - never suggest backward steps
 */
export type FunnelPhase = 'awareness' | 'evaluation' | 'validation' | 'protection' | 'action';

/**
 * Phase order for comparison - higher = further in funnel
 */
const PHASE_ORDER: Record<FunnelPhase, number> = {
  awareness: 1,
  evaluation: 2,
  validation: 3,
  protection: 4,
  action: 5,
};

/**
 * Difficulty levels for tools
 */
export type ToolDifficulty = 'easy' | 'medium' | 'advanced';

/**
 * Tool configuration interface
 * Defines all properties for a tool in the platform
 */
export interface ToolDefinition {
  id: string;
  /** Display name */
  title: string;
  /** Short description for cards */
  description: string;
  /** Longer description for detailed views */
  longDescription?: string;
  /** Route path */
  path: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon text color class (e.g., 'text-sky-400') */
  iconColor: string;
  /** Icon background color class (e.g., 'bg-sky-500/20') */
  bgColor: string;
  /** Icon border color class (e.g., 'border-sky-500/40') */
  borderColor: string;
  /** CTA button text */
  cta: string;
  /** Tool category */
  category: 'primary' | 'analysis' | 'content' | 'support' | 'guide';
  /** Whether tool is featured on homepage */
  featured?: boolean;
  /** Whether tool requires email to save progress */
  gated?: boolean;
  /** Optional badge (e.g., 'Beta', 'New') */
  badge?: string;
  
  // ============================================
  // ENHANCED METADATA
  // ============================================
  /** Estimated time to complete (e.g., '2 min', '5-10 min') */
  estimatedTime?: string;
  /** Difficulty level */
  difficulty?: ToolDifficulty;
  /** Value proposition - what user gets from this tool */
  valueProposition?: string;
  /** Keywords for search/filtering */
  keywords?: string[];
  /** Related tool IDs for cross-linking (legacy - use nextLogicTools) */
  relatedTools?: string[];
  /** CRO-optimized tooltip copy (Gap Theory: problem this solves in 2 min) */
  tooltip?: string;
  
  // ============================================
  // CRO ARCHITECTURE
  // ============================================
  /** Funnel phase for smart tool suggestions */
  funnelPhase: FunnelPhase;
  /** Engagement score awarded on click (10-50, higher = more intent) */
  engagementScore: number;
  /** Forward-only related tools (respects "No U-Turn" rule) */
  nextLogicTools?: string[];
}

/**
 * Central Tool Registry
 * Single source of truth for all tool configurations
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // ============================================
  // AWARENESS PHASE - "Wake Up" Tools
  // ============================================
  'reality-check': {
    id: 'reality-check',
    title: 'Reality Check Tool',
    description: 'Confront the hidden costs your current windows are costing you.',
    path: ROUTES.REALITY_CHECK,
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/40',
    cta: 'See What Cheap Windows Really Cost',
    category: 'analysis',
    featured: true,
    gated: false,
    estimatedTime: '3 min',
    difficulty: 'easy',
    valueProposition: 'Discover the true cost of delaying your window upgrade',
    keywords: ['cost', 'savings', 'analysis', 'hidden costs'],
    relatedTools: ['cost-calculator', 'vulnerability-test'],
    tooltip: '⚠️ Warning: 8 out of 10 bargain windows fail within 7 years. See the math contractors hide from you.',
    // CRO
    funnelPhase: 'awareness',
    engagementScore: 15,
    nextLogicTools: ['fast-win', 'cost-calculator', 'expert'],
  },

  'cost-calculator': {
    id: 'cost-calculator',
    title: 'Cost of Inaction Calculator',
    description: 'Quantify exactly how much waiting is costing you every day.',
    longDescription: "Calculate what windows actually cost in your area. See the real numbers contractors don't want you to know.",
    path: ROUTES.COST_CALCULATOR,
    icon: Calculator,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    cta: 'Calculate Your Hidden Costs',
    category: 'primary',
    featured: true,
    gated: false,
    estimatedTime: '2 min',
    difficulty: 'easy',
    valueProposition: 'See exactly how much money you lose each month with old windows',
    keywords: ['calculator', 'energy', 'savings', 'ROI', 'cost'],
    relatedTools: ['reality-check', 'comparison'],
    tooltip: '💸 Money Pit Alert: See exactly how much cash you are burning every single day by keeping your current windows.',
    // CRO
    funnelPhase: 'awareness',
    engagementScore: 15,
    nextLogicTools: ['fast-win', 'quote-builder', 'comparison'],
  },

  'vulnerability-test': {
    id: 'vulnerability-test',
    title: 'Window IQ Challenge',
    description: '90% of Florida homeowners fail this test and overpay by $5,000+.',
    path: ROUTES.VULNERABILITY_TEST,
    icon: Brain,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    cta: 'Test Your Vulnerability',
    category: 'analysis',
    featured: true,
    gated: false,
    estimatedTime: '5 min',
    difficulty: 'easy',
    valueProposition: 'Learn where you\'re most vulnerable to sales tactics',
    keywords: ['quiz', 'test', 'sales tactics', 'vulnerability'],
    relatedTools: ['roleplay', 'sales-tactics-guide'],
    tooltip: '🧠 Beat the Dealer: Salesmen love uneducated buyers. Take this 5-minute drill so you can\'t be tricked.',
    // CRO
    funnelPhase: 'awareness',
    engagementScore: 20,
    nextLogicTools: ['roleplay', 'sales-tactics-guide', 'expert'],
  },

  'fast-win': {
    id: 'fast-win',
    title: 'Fast Win Detector',
    description: 'Find your highest-ROI upgrade in 45 seconds. No lecture, just results.',
    path: ROUTES.FAST_WIN,
    icon: Zap,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    cta: 'Find My #1 Upgrade',
    category: 'analysis',
    featured: true,
    gated: true,
    estimatedTime: '45 sec',
    difficulty: 'easy',
    valueProposition: 'Instantly discover your best window upgrade opportunity',
    keywords: ['quick', 'fast', 'ROI', 'upgrade', 'recommendation'],
    relatedTools: ['cost-calculator', 'comparison'],
    tooltip: '⚡ Speed Run: Do not have time for research? Find the single highest-ROI upgrade for your specific home type in 45 seconds.',
    // CRO
    funnelPhase: 'awareness',
    engagementScore: 25,
    nextLogicTools: ['quote-builder', 'comparison', 'quote-scanner'],
  },

  // ============================================
  // EVALUATION PHASE - "Shopping" Tools
  // ============================================
  'comparison': {
    id: 'comparison',
    title: 'Comparison Tool',
    description: 'Compare cheap vs. quality window specs side-by-side.',
    longDescription: 'Validate a price with side-by-side spec comparison.',
    path: ROUTES.COMPARISON,
    icon: GitCompare,
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    cta: 'Compare Real Window Specs',
    category: 'analysis',
    featured: true,
    gated: true,
    estimatedTime: '3 min',
    difficulty: 'medium',
    valueProposition: 'Understand exactly what separates quality from cheap windows',
    keywords: ['compare', 'specs', 'quality', 'cheap', 'analysis'],
    relatedTools: ['quote-scanner', 'cost-calculator'],
    tooltip: '🔍 X-Ray Vision: Strip away the marketing fluff. Compare the raw engineering data of cheap vs. quality brands side-by-side.',
    // CRO
    funnelPhase: 'evaluation',
    engagementScore: 25,
    nextLogicTools: ['quote-scanner', 'fair-price-quiz', 'beat-your-quote'],
  },

  'quote-builder': {
    id: 'quote-builder',
    title: 'Project Quote Builder',
    description: 'Get an AI-powered estimate for your window or door project in seconds.',
    path: ROUTES.FREE_ESTIMATE,
    icon: Calculator,
    iconColor: 'text-teal-500',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/40',
    cta: 'Build Your Estimate',
    category: 'primary',
    featured: true,
    gated: true,
    badge: 'Beta',
    estimatedTime: '3-5 min',
    difficulty: 'medium',
    valueProposition: 'Get a fair price estimate before talking to contractors',
    keywords: ['estimate', 'quote', 'builder', 'pricing', 'project'],
    relatedTools: ['quote-scanner', 'comparison'],
    tooltip: '🏗️ No-Sales Zone: Build a highly accurate project estimate in 3 minutes without a single phone call.',
    // CRO
    funnelPhase: 'evaluation',
    engagementScore: 30,
    nextLogicTools: ['quote-scanner', 'comparison', 'expert'],
  },

  'roleplay': {
    id: 'roleplay',
    title: 'Beat The Closer',
    description: 'Practice resisting high-pressure sales tactics.',
    path: ROUTES.ROLEPLAY,
    icon: Swords,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/40',
    cta: 'Start Training',
    category: 'support',
    estimatedTime: '5-10 min',
    difficulty: 'medium',
    valueProposition: 'Build confidence to say no to pushy salespeople',
    keywords: ['roleplay', 'sales', 'practice', 'training', 'pressure'],
    relatedTools: ['vulnerability-test', 'sales-tactics-guide'],
    // CRO
    funnelPhase: 'evaluation',
    engagementScore: 20,
    nextLogicTools: ['kitchen-table-guide', 'expert', 'quote-scanner'],
  },

  // ============================================
  // VALIDATION PHASE - "Verification" Tools
  // ============================================
  'fair-price-quiz': {
    id: 'fair-price-quiz',
    title: 'Fair Price Quiz',
    description: 'Answer a few questions to see if your quote is fair.',
    path: ROUTES.FAIR_PRICE_QUIZ,
    icon: Brain,
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    cta: 'Take the Quiz',
    category: 'analysis',
    estimatedTime: '2 min',
    difficulty: 'easy',
    valueProposition: 'Quickly validate if your quote is in the fair range',
    keywords: ['quiz', 'fair price', 'validation', 'quick'],
    relatedTools: ['quote-scanner', 'comparison'],
    // CRO
    funnelPhase: 'validation',
    engagementScore: 35,
    nextLogicTools: ['quote-scanner', 'beat-your-quote', 'expert'],
  },

  'quote-scanner': {
    id: 'quote-scanner',
    title: 'AI Quote Scanner',
    description: 'Upload your quote and let AI flag hidden risks, missing scope, and overpricing in 30 seconds.',
    longDescription: 'Upload your quote. Get a forensic analysis of hidden markups, inflated pricing, and negotiation leverage points.',
    path: ROUTES.QUOTE_SCANNER,
    icon: ScanSearch,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    cta: 'Scan Your Quote',
    category: 'primary',
    featured: true,
    gated: true,
    estimatedTime: '30 sec',
    difficulty: 'easy',
    valueProposition: 'Instantly expose hidden fees and get negotiation leverage',
    keywords: ['quote', 'scan', 'AI', 'analysis', 'pricing', 'red flags'],
    relatedTools: ['beat-your-quote', 'comparison'],
    tooltip: '🛡️ Scam Shield: Upload a photo of your quote. Our AI exposes hidden fees and missing specs that could cost you $3,000+.',
    // CRO - HIGHEST INTENT
    funnelPhase: 'validation',
    engagementScore: 50,
    nextLogicTools: ['beat-your-quote', 'expert', 'intel'],
  },

  'beat-your-quote': {
    id: 'beat-your-quote',
    title: 'Beat Your Quote',
    description: 'Expose hidden markups and get leverage to negotiate a better deal.',
    path: ROUTES.BEAT_YOUR_QUOTE,
    icon: Target,
    iconColor: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    cta: 'Beat My Quote',
    category: 'primary',
    estimatedTime: '10-15 min',
    difficulty: 'advanced',
    valueProposition: 'Master the art of negotiating a better window price',
    keywords: ['negotiation', 'beat', 'quote', 'leverage', 'markup'],
    relatedTools: ['quote-scanner', 'sales-tactics-guide'],
    // CRO
    funnelPhase: 'validation',
    engagementScore: 45,
    nextLogicTools: ['expert', 'quote-builder'],
  },

  // ============================================
  // PROTECTION PHASE - "Defense" Tools
  // ============================================
  'risk-diagnostic': {
    id: 'risk-diagnostic',
    title: 'Protection Gap Analysis',
    description: 'Identify vulnerabilities and unlock potential insurance savings up to 20%.',
    longDescription: 'Assess your protection gaps and insurance savings potential.',
    path: ROUTES.RISK_DIAGNOSTIC,
    icon: Shield,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    cta: 'Analyze Your Protection Gaps',
    category: 'analysis',
    featured: true,
    gated: true,
    estimatedTime: '5-7 min',
    difficulty: 'medium',
    valueProposition: 'Find insurance savings and protection gaps in your home',
    keywords: ['insurance', 'risk', 'protection', 'savings', 'hurricane'],
    relatedTools: ['claim-survival', 'insurance-savings-guide'],
    tooltip: '💰 Found Money: You might be missing up to 20% in wind mitigation discounts. Find your hidden savings now.',
    // CRO
    funnelPhase: 'protection',
    engagementScore: 30,
    nextLogicTools: ['claim-survival', 'insurance-savings-guide', 'expert'],
  },

  'claim-survival': {
    id: 'claim-survival',
    title: 'Claim Survival Vault',
    description: 'The 7-point documentation system insurers expect. Prevent claim denials before they happen.',
    longDescription: 'Preparing an insurance claim? Get organized with our step-by-step guide to maximize your coverage.',
    path: ROUTES.CLAIM_SURVIVAL,
    icon: ShieldCheck,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/40',
    cta: 'Protect Your Claim',
    category: 'primary',
    featured: true,
    gated: true,
    estimatedTime: '10-15 min',
    difficulty: 'advanced',
    valueProposition: 'Build a bulletproof insurance claim that gets approved',
    keywords: ['insurance', 'claim', 'documentation', 'hurricane', 'damage'],
    relatedTools: ['risk-diagnostic', 'evidence'],
    tooltip: '🛡️ Denial Proof: Insurers deny 40% of claims due to lack of evidence. Download the checklist that forces them to pay.',
    // CRO
    funnelPhase: 'protection',
    engagementScore: 35,
    nextLogicTools: ['evidence', 'intel', 'expert'],
  },

  'evidence': {
    id: 'evidence',
    title: 'Evidence Locker',
    description: 'Review verified case files from 47 completed missions.',
    longDescription: 'Real homeowner case studies with documented outcomes.',
    path: ROUTES.EVIDENCE,
    icon: FolderSearch,
    iconColor: 'text-amber-700',
    bgColor: 'bg-amber-700/20',
    borderColor: 'border-amber-700/40',
    cta: 'Review the Evidence',
    category: 'content',
    featured: true,
    gated: true,
    estimatedTime: '5-10 min',
    difficulty: 'easy',
    valueProposition: 'Learn from real homeowner success stories and savings',
    keywords: ['case studies', 'evidence', 'proof', 'success stories'],
    relatedTools: ['comparison', 'claim-survival'],
    tooltip: '📂 Case Closed: Skeptical? Good. Review 47 verified Case Files proving exactly how we saved homeowners thousands.',
    // CRO
    funnelPhase: 'protection',
    engagementScore: 20,
    nextLogicTools: ['quote-scanner', 'expert', 'claim-survival'],
  },

  'intel': {
    id: 'intel',
    title: 'Intel Library',
    description: 'Download declassified guides: negotiation tactics, claim survival kits, and more.',
    path: ROUTES.INTEL,
    icon: FileStack,
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/40',
    cta: 'Access the Vault',
    category: 'content',
    featured: true,
    gated: true,
    estimatedTime: 'Varies',
    difficulty: 'medium',
    valueProposition: 'Get insider guides and resources to negotiate like a pro',
    keywords: ['guides', 'resources', 'downloads', 'negotiation', 'tactics'],
    relatedTools: ['sales-tactics-guide', 'kitchen-table-guide'],
    tooltip: '🔐 Declassified: Unlock the negotiation scripts and claim survival templates that insurance companies pray you never find.',
    // CRO
    funnelPhase: 'protection',
    engagementScore: 25,
    nextLogicTools: ['quote-scanner', 'roleplay', 'expert'],
  },

  // ============================================
  // ACTION PHASE - "Conversion" Tools
  // ============================================
  'expert': {
    id: 'expert',
    title: 'Expert System',
    description: 'Chat with our AI specialist for neutral, expert advice.',
    path: ROUTES.EXPERT,
    icon: MessageSquare,
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/40',
    cta: 'Chat With the Window Specialist',
    category: 'support',
    featured: true,
    gated: false,
    estimatedTime: '5-15 min',
    difficulty: 'easy',
    valueProposition: 'Get unbiased answers to your window questions instantly',
    keywords: ['chat', 'AI', 'questions', 'advice', 'expert'],
    relatedTools: ['comparison', 'quote-scanner'],
    tooltip: '🤖 0% Sales Pitch: Get instant, unbiased answers to your toughest questions. No commission, just facts.',
    // CRO - TERMINAL ACTION
    funnelPhase: 'action',
    engagementScore: 50,
    nextLogicTools: ['quote-builder', 'quote-scanner'],
  },

  // ============================================
  // GUIDES (Various phases based on content)
  // ============================================
  'kitchen-table-guide': {
    id: 'kitchen-table-guide',
    title: 'Kitchen Table Defense Kit',
    description: 'Prepare for the in-home sales appointment.',
    path: ROUTES.KITCHEN_TABLE_GUIDE,
    icon: Shield,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    cta: 'Get the Kit',
    category: 'guide',
    estimatedTime: '15 min read',
    difficulty: 'medium',
    valueProposition: 'Walk into your sales appointment fully prepared',
    keywords: ['guide', 'preparation', 'sales appointment', 'defense'],
    relatedTools: ['roleplay', 'vulnerability-test'],
    // CRO
    funnelPhase: 'evaluation',
    engagementScore: 15,
    nextLogicTools: ['roleplay', 'expert', 'quote-scanner'],
  },

  'sales-tactics-guide': {
    id: 'sales-tactics-guide',
    title: 'Sales Tactics Exposed',
    description: 'Learn the tricks contractors use to inflate prices.',
    path: ROUTES.SALES_TACTICS_GUIDE,
    icon: Target,
    iconColor: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/40',
    cta: 'Expose Tactics',
    category: 'guide',
    estimatedTime: '10 min read',
    difficulty: 'easy',
    valueProposition: 'Recognize manipulation tactics before they work on you',
    keywords: ['tactics', 'sales', 'manipulation', 'tricks', 'exposed'],
    relatedTools: ['roleplay', 'vulnerability-test'],
    // CRO
    funnelPhase: 'evaluation',
    engagementScore: 15,
    nextLogicTools: ['roleplay', 'quote-scanner', 'expert'],
  },

  'spec-checklist-guide': {
    id: 'spec-checklist-guide',
    title: 'Spec Checklist',
    description: 'The complete audit packet for your window project.',
    path: ROUTES.SPEC_CHECKLIST_GUIDE,
    icon: FileSearch,
    iconColor: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/40',
    cta: 'Get Checklist',
    category: 'guide',
    estimatedTime: '20 min read',
    difficulty: 'advanced',
    valueProposition: 'Ensure every spec is covered before signing a contract',
    keywords: ['checklist', 'specs', 'audit', 'contract', 'verification'],
    relatedTools: ['comparison', 'quote-scanner'],
    // CRO
    funnelPhase: 'validation',
    engagementScore: 15,
    nextLogicTools: ['quote-scanner', 'comparison', 'expert'],
  },

  'insurance-savings-guide': {
    id: 'insurance-savings-guide',
    title: 'Insurance Savings Guide',
    description: 'Maximize your insurance discounts with impact windows.',
    path: ROUTES.INSURANCE_SAVINGS_GUIDE,
    icon: Shield,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    cta: 'Save on Insurance',
    category: 'guide',
    estimatedTime: '10 min read',
    difficulty: 'medium',
    valueProposition: 'Learn how to cut your insurance premiums with impact windows',
    keywords: ['insurance', 'savings', 'discounts', 'impact windows', 'premiums'],
    relatedTools: ['risk-diagnostic', 'claim-survival'],
    // CRO
    funnelPhase: 'protection',
    engagementScore: 15,
    nextLogicTools: ['risk-diagnostic', 'claim-survival', 'expert'],
  },
};

// ============================================
// CRO FUNCTIONS
// ============================================

/**
 * Frame control configuration for dynamic section headers
 */
interface FrameControl {
  title: string;
  description: string;
}

const FRAME_CONTROL_MAP: Record<FunnelPhase, FrameControl> = {
  awareness: {
    title: "⚡ Fix This Problem Now ⚡",
    description: "Stop the bleeding with these tools"
  },
  evaluation: {
    title: "🔍 Verify Before You Sign",
    description: "Don't get tricked by fine print"
  },
  validation: {
    title: "🛡️ Enforce Your Rights",
    description: "Turn the tables on the contractor"
  },
  protection: {
    title: "📋 Complete Your Defense",
    description: "Lock down every angle"
  },
  action: {
    title: "🎯 Take Control Now",
    description: "You're ready. Make your move."
  },
};

/**
 * Get dynamic frame control header for related tools section
 * Based on the current tool's funnel phase
 */
export function getFrameControl(toolId: string): FrameControl {
  const tool = TOOL_REGISTRY[toolId];
  if (!tool) {
    return { title: "Related Tools", description: "" };
  }
  return FRAME_CONTROL_MAP[tool.funnelPhase];
}

/**
 * Get smart related tools with "No U-Turn" logic
 * Only suggests tools at same phase or HIGHER (never backward)
 * 
 * @param currentToolId - The current tool's ID
 * @param completedTools - Optional array of tool IDs the user has already completed
 * @returns Array of ToolDefinition objects, max 3, sorted by engagement score
 */
export function getSmartRelatedTools(
  currentToolId: string,
  completedTools?: string[]
): ToolDefinition[] {
  const currentTool = TOOL_REGISTRY[currentToolId];
  if (!currentTool) return [];
  
  const currentPhaseOrder = PHASE_ORDER[currentTool.funnelPhase];
  const nextLogicIds = currentTool.nextLogicTools || currentTool.relatedTools || [];
  
  return nextLogicIds
    .map(id => TOOL_REGISTRY[id])
    .filter((tool): tool is ToolDefinition => {
      if (!tool) return false;
      
      // 🚫 NO U-TURN RULE: Only same phase or HIGHER
      const toolPhaseOrder = PHASE_ORDER[tool.funnelPhase];
      if (toolPhaseOrder < currentPhaseOrder) return false;
      
      // Skip tools user already completed
      if (completedTools?.includes(tool.id)) return false;
      
      return true;
    })
    // Sort by engagement score (highest first = highest intent)
    .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
    .slice(0, 3);
}

// ============================================
// HELPER FUNCTIONS FOR ENHANCED METADATA
// ============================================

/**
 * Get difficulty label with color
 */
export function getDifficultyConfig(difficulty: ToolDifficulty): { label: string; color: string } {
  const configs: Record<ToolDifficulty, { label: string; color: string }> = {
    easy: { label: 'Easy', color: 'text-green-500' },
    medium: { label: 'Medium', color: 'text-yellow-500' },
    advanced: { label: 'Advanced', color: 'text-orange-500' },
  };
  return configs[difficulty];
}

/**
 * Search tools by keyword
 */
export function searchTools(query: string): ToolDefinition[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(TOOL_REGISTRY).filter(tool => {
    const matchesTitle = tool.title.toLowerCase().includes(lowerQuery);
    const matchesDescription = tool.description.toLowerCase().includes(lowerQuery);
    const matchesKeywords = tool.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
    return matchesTitle || matchesDescription || matchesKeywords;
  });
}

/**
 * Get related tools for a given tool (legacy - prefer getSmartRelatedTools)
 */
export function getRelatedTools(toolId: string): ToolDefinition[] {
  const tool = TOOL_REGISTRY[toolId];
  if (!tool?.relatedTools) return [];
  return getTools(tool.relatedTools);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a tool by its ID
 */
export function getTool(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY[id];
}

/**
 * Get multiple tools by their IDs
 */
export function getTools(ids: string[]): ToolDefinition[] {
  return ids.map(id => TOOL_REGISTRY[id]).filter(Boolean) as ToolDefinition[];
}

/**
 * Get all tools in a category
 */
export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.category === category);
}

/**
 * Get all featured tools (for homepage)
 */
export function getFeaturedTools(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter(tool => tool.featured);
}

/**
 * Get icon colors for a tool (legacy compatibility)
 */
export function getToolIconColors(toolId: string): { text: string; bg: string; border: string } {
  const tool = TOOL_REGISTRY[toolId];
  if (tool) {
    return {
      text: tool.iconColor,
      bg: tool.bgColor,
      border: tool.borderColor,
    };
  }
  return { text: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/40' };
}

// ============================================
// PRESET TOOL GROUPS
// ============================================

/** The 12 tools shown on the homepage */
export const HOMEPAGE_TOOLS = getTools([
  'reality-check',
  'cost-calculator',
  'vulnerability-test',
  'expert',
  'comparison',
  'risk-diagnostic',
  'claim-survival',
  'fast-win',
  'evidence',
  'intel',
  'quote-scanner',
  'quote-builder',
]);

/** Tools shown in Claim Survival related section */
export const CLAIM_SURVIVAL_RELATED = getTools([
  'comparison',
  'risk-diagnostic',
  'evidence',
  'expert',
]);

/** Tools shown in Quote Builder related section */
export const QUOTE_BUILDER_RELATED = getTools([
  'quote-scanner',
  'risk-diagnostic',
  'cost-calculator',
]);

/** Tools shown in Evidence page related section */
export const EVIDENCE_RELATED = getTools([
  'comparison',
  'fast-win',
  'risk-diagnostic',
]);

/** Tools shown in Beat Your Quote arsenal section */
export const BEAT_YOUR_QUOTE_ARSENAL = getTools([
  'quote-scanner',
  'cost-calculator',
  'claim-survival',
]);
