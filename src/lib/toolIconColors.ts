/**
 * @deprecated Use getToolIconColors from '@/config/toolRegistry' instead
 * This file is kept for backward compatibility
 */
import { getToolIconColors as getColors } from '@/config/toolRegistry';

// Re-export from the centralized registry
export const getToolIconColors = getColors;

// Legacy export for backward compatibility
export const toolIconColors: Record<string, { text: string; bg: string; border: string }> = {
  'reality-check': { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' },
  'cost-calculator': { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  'quiz': { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
  'vulnerability-test': { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/40' },
  'expert-system': { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  'expert': { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  'comparison': { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40' },
  'risk-diagnostic': { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40' },
  'claim-survival': { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  'fast-win': { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  'evidence': { text: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/40' },
  'intel-library': { text: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40' },
  'intel': { text: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/40' },
  'quote-scanner': { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/40' },
  'quote-builder': { text: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-500/40' },
};
