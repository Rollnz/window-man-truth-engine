/**
 * Quote-First feature contracts.
 *
 * Foundation-only shapes for Sprint 01A. Future sprints will extend these
 * with scan session, OCR results, qualification answers, and Truth Report data.
 */

export interface QuoteFirstFlowProps {
  /** The file selected during acquisition. Handed in explicitly so QuoteFirstFlow
   * remains portable — no coupling to QuoteFirstHero or any specific landing shell. */
  file: File;
  /** Return to the acquisition surface. Callers own the state that renders the Hero. */
  onReset: () => void;
}

export interface QuoteFirstHeroProps {
  onFileSelected: (file: File) => void;
}
