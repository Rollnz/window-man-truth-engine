/**
 * Allowed source tools for lead capture.
 * 
 * IMPORTANT: Keep this list in sync with:
 * - supabase/functions/_shared/sourceTools.ts (backend single source of truth)
 * 
 * Run `npm run verify:source-tools` to check synchronization.
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
  'window-cost-truth',
  'window-risk-and-code',
  'window-sales-truth',
  'window-verification-system',
  'floating-estimate-form',
] as const;

export type SourceTool = typeof SOURCE_TOOLS[number];

/**
 * Type guard to check if a string is a valid SourceTool
 */
export function isValidSourceTool(value: string): value is SourceTool {
  return SOURCE_TOOLS.includes(value as SourceTool);
}
