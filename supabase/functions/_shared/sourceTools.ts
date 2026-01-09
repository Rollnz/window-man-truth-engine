/**
 * Allowed source tools for lead capture - Edge Function version.
 * 
 * IMPORTANT: Keep this list in sync with:
 * - src/types/sourceTool.ts (frontend version)
 * - supabase/functions/save-lead/index.ts (uses this file)
 */
export const SOURCE_TOOLS = [
  'expert-system',
  'comparison-tool',
  'cost-calculator',
  'true-cost-calculator',
  'claim-survival-kit',
  'fast-win',
  'intel-library',
  'risk-diagnostic',
  'reality-check',
  'evidence-locker',
  'kitchen-table-guide',
  'sales-tactics-guide',
  'spec-checklist-guide',
  'insurance-savings-guide',
  'quote-builder',
  'quote-scanner',
  'beat-your-quote',
  'fair-price-quiz',
  'vulnerability-test',
] as const;

export type SourceTool = typeof SOURCE_TOOLS[number];

/**
 * Type guard to check if a string is a valid SourceTool
 */
export function isValidSourceTool(value: string): value is SourceTool {
  return SOURCE_TOOLS.includes(value as SourceTool);
}
