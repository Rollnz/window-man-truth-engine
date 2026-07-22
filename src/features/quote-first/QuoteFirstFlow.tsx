import { useCallback, useState } from 'react';
import { QuoteFirstHero } from './components/QuoteFirstHero';
import type { QuoteFirstFlowState } from './types';

/**
 * QuoteFirstFlow — portable post-upload product boundary.
 *
 * Sprint 01 foundation only. Future sprints add:
 *   FILE HANDOFF → REAL SCAN → PARTIAL REVEAL → IDENTITY CONFIRMATION →
 *   QUALIFICATION Q1 → QUALIFICATION Q2 → TRUTH REPORT → INBOUND CALL CONVERSION.
 *
 * Explicitly NOT wired in Sprint 01:
 *   - No upload persistence, no OCR, no AI call, no scan session
 *   - No lead gate, no OTP, no fake progress, no fake results
 *   - No coupling to useGatedScanner / PreQuoteLeadModalV2 / QuoteUploadGateModal
 */
export function QuoteFirstFlow() {
  const [state, setState] = useState<QuoteFirstFlowState>({ selectedFile: null });

  const onFileSelected = useCallback((file: File) => {
    setState({ selectedFile: file });
  }, []);

  const reset = useCallback(() => {
    setState({ selectedFile: null });
  }, []);

  return (
    <>
      <QuoteFirstHero onFileSelected={onFileSelected} />

      {state.selectedFile && (
        <section
          aria-live="polite"
          className="relative border-t border-white/5 bg-[#0A0F14] px-4 py-8 sm:px-6"
        >
          <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center">
            <p className="text-sm font-medium text-white">
              File received: <span className="font-mono text-primary">{state.selectedFile.name}</span>
            </p>
            <p className="mt-2 text-xs text-white/60">
              Analysis begins in a future release. Nothing has been uploaded or shared.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 inline-flex items-center rounded-md border border-white/15 bg-transparent px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-primary/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Choose a different file
            </button>
          </div>
        </section>
      )}
    </>
  );
}
