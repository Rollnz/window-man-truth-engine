/**
 * Friendly labels for source_tool identifiers
 * Used across the Call Agents Command Center UI
 */
export const SOURCE_TOOL_LABELS: Record<string, string> = {
  "quote-scanner": "Quote Scanner",
  "beat-your-quote": "Beat Your Quote",
  "consultation-booking": "Consultation Booking",
  "fair-price-quiz": "Fair Price Quiz",
  "sample-report": "Sample Report",
  "manual_dispatch": "Manual Dispatch",
};

/**
 * Get a friendly label for a source tool, with fallback
 */
export function getSourceToolLabel(sourceTool: string): string {
  return SOURCE_TOOL_LABELS[sourceTool] || sourceTool;
}
