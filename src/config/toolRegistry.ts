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
}

/**
 * Central Tool Registry
 * Single source of truth for all tool configurations
 */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // ============================================
  // PRIMARY TOOLS
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
  },

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
  },

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
  },

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
  },

  // ============================================
  // ADDITIONAL TOOLS (for related sections)
  // ============================================
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
