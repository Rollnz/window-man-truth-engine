import {
  Calculator,
  FileSearch,
  Shield,
  Scale,
  ShieldAlert,
  Zap,
  MessageSquareText,
  FolderSearch,
  BookOpen,
  Target,
  Brain,
  Swords,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/config/navigation';

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
}

/**
 * Central Tool Registry
 * Single source of truth for all tool configurations
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // ============================================
  // PRIMARY TOOLS
  // ============================================
  'quote-scanner': {
    id: 'quote-scanner',
    title: 'Quote Scanner',
    description: 'Upload a contractor quote and let AI analyze it for red flags and hidden fees.',
    longDescription: 'Upload your quote. Get a forensic analysis of hidden markups, inflated pricing, and negotiation leverage points.',
    path: ROUTES.QUOTE_SCANNER,
    icon: FileSearch,
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/40',
    cta: 'Scan My Quote',
    category: 'primary',
    featured: true,
  },

  'cost-calculator': {
    id: 'cost-calculator',
    title: 'Cost Calculator',
    description: 'Calculate long-term costs and savings for hurricane protection.',
    longDescription: "Calculate what windows actually cost in your area. See the real numbers contractors don't want you to know.",
    path: ROUTES.COST_CALCULATOR,
    icon: Calculator,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    cta: 'Calculate Costs',
    category: 'primary',
    featured: true,
  },

  'claim-survival': {
    id: 'claim-survival',
    title: 'Claim Survival Kit',
    description: 'Get organized with our step-by-step guide to maximize your insurance coverage.',
    longDescription: 'Preparing an insurance claim? Get organized with our step-by-step guide to maximize your coverage.',
    path: ROUTES.CLAIM_SURVIVAL,
    icon: Shield,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    cta: 'Start Checklist',
    category: 'primary',
    featured: true,
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
    featured: true,
  },

  // ============================================
  // ANALYSIS TOOLS
  // ============================================
  'comparison': {
    id: 'comparison',
    title: 'Comparison Engine',
    description: 'Compare contractor quotes side-by-side with spec validation.',
    longDescription: 'Validate a price with side-by-side spec comparison.',
    path: ROUTES.COMPARISON,
    icon: Scale,
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    cta: 'Compare Specs',
    category: 'analysis',
    featured: true,
  },

  'risk-diagnostic': {
    id: 'risk-diagnostic',
    title: 'Risk Diagnostic',
    description: "Assess your home's vulnerability and discover protection gaps.",
    longDescription: 'Assess your protection gaps and insurance savings potential.',
    path: ROUTES.RISK_DIAGNOSTIC,
    icon: ShieldAlert,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    cta: 'Check My Gaps',
    category: 'analysis',
    featured: true,
  },

  'fast-win': {
    id: 'fast-win',
    title: 'Fast Win Detector',
    description: 'Find your highest-ROI upgrade in 45 seconds.',
    path: ROUTES.FAST_WIN,
    icon: Zap,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    cta: 'Find My #1 Upgrade',
    category: 'analysis',
    featured: true,
  },

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
    featured: true,
  },

  'vulnerability-test': {
    id: 'vulnerability-test',
    title: 'Vulnerability Test',
    description: 'Discover how exposed your home is to storm damage.',
    path: ROUTES.VULNERABILITY_TEST,
    icon: ShieldAlert,
    iconColor: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/40',
    cta: 'Test My Home',
    category: 'analysis',
  },

  'reality-check': {
    id: 'reality-check',
    title: 'Reality Check',
    description: 'Get a reality check on your window replacement expectations.',
    path: ROUTES.REALITY_CHECK,
    icon: Target,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/40',
    cta: 'Get Reality Check',
    category: 'analysis',
  },

  // ============================================
  // CONTENT TOOLS
  // ============================================
  'evidence': {
    id: 'evidence',
    title: 'Case Studies',
    description: "Learn from real homeowners' claim experiences.",
    longDescription: 'Real homeowner case studies with documented outcomes.',
    path: ROUTES.EVIDENCE,
    icon: FolderSearch,
    iconColor: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/40',
    cta: 'View Cases',
    category: 'content',
    featured: true,
  },

  'intel': {
    id: 'intel',
    title: 'Intel Library',
    description: 'Access guides, checklists, and insider knowledge.',
    path: ROUTES.INTEL,
    icon: BookOpen,
    iconColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/40',
    cta: 'Browse Intel',
    category: 'content',
    featured: true,
  },

  // ============================================
  // SUPPORT TOOLS
  // ============================================
  'expert': {
    id: 'expert',
    title: 'WindowMan AI Advisor',
    description: 'Get instant answers to your window and claim questions.',
    path: ROUTES.EXPERT,
    icon: MessageSquareText,
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/40',
    cta: 'Ask WindowMan',
    category: 'support',
    featured: true,
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
    featured: true,
  },

  // ============================================
  // GUIDES
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
  },
};

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
 * Get all featured tools
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
