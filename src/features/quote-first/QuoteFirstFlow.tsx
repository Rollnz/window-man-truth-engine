import type { QuoteFirstFlowProps } from './types';

/**
 * QuoteFirstFlow — portable post-upload product boundary.
 *
 * Explicit interface: receives a selected File and an onReset callback.
 * Deliberately does NOT import or render QuoteFirstHero — any future landing
 * page can select a file and hand it directly to this component.
 *
 * Sprint 01A: truthful temporary acknowledgment only. Future sprints will add:
 *   FILE HANDOFF → REAL SCAN → PARTIAL REVEAL → IDENTITY CONFIRMATION →
 *   QUALIFICATION Q1 → QUALIFICATION Q2 → TRUTH REPORT → INBOUND CALL CONVERSION.
 *
 * Explicitly NOT wired in Sprint 01A:
 *   - No upload persistence, no OCR, no AI call, no scan session
 *   - No lead gate, no OTP, no fake progress, no fake results
 */
export function QuoteFirstFlow({ file, onReset }: QuoteFirstFlowProps) {
  return (
    <section
      aria-live="polite"
      className="relative bg-[#0A0F14] px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-tools-truth-engine">
          Estimate Received
        </p>
        <p className="mt-4 text-lg font-semibold tracking-tight text-white sm:text-xl">
          <span className="font-mono text-tools-truth-engine">{file.name}</span>
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          Your file is held locally in this browser session only. Independent analysis
          is not yet connected in this build — nothing has been uploaded or shared.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex items-center rounded-lg border border-white/15 bg-transparent px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-tools-truth-engine/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tools-truth-engine focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F14]"
        >
          Choose a different file
        </button>
      </div>
    </section>
  );
}
