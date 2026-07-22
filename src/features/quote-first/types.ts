/**
 * Quote-First feature contracts.
 *
 * Foundation-only shapes for Sprint 01. Future sprints will extend these
 * with scan session, OCR results, qualification answers, and Truth Report data.
 */

export interface QuoteFirstFlowState {
  selectedFile: File | null;
}

export interface QuoteFirstContextValue {
  state: QuoteFirstFlowState;
  onFileSelected: (file: File) => void;
  reset: () => void;
}
