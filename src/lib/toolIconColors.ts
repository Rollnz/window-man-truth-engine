// Centralized icon color theming for tools
// Each tool has a semantic color based on its meaning/purpose

export const toolIconColors: Record<string, { text: string; bg: string; border: string }> = {
  'reality-check': { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  'cost-calculator': { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'quiz': { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'vulnerability-test': { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'expert-system': { text: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  'expert': { text: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  'comparison': { text: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  'risk-diagnostic': { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  'claim-survival': { text: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  'fast-win': { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  'evidence': { text: 'text-amber-700', bg: 'bg-amber-700/10', border: 'border-amber-700/20' },
  'intel-library': { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  'intel': { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  'quote-scanner': { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  'quote-builder': { text: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
};

export function getToolIconColors(toolId: string) {
  return toolIconColors[toolId] || { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
}
