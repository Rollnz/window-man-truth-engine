import { useCallback, useRef, useState } from 'react';
import { Upload, ShieldCheck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteFirstHeroProps {
  onFileSelected: (file: File) => void;
}

/**
 * QuoteFirstHero — mature evolution of the /beat-your-quote dossier hero.
 *
 * Sprint 01 foundation only:
 *   - Establishes the dominant upload action surface.
 *   - Locked copy per SPRINT_01_FOUNDATION Section 10.
 *   - Handoff terminates at onFileSelected — no OCR, no scan, no lead gate.
 */
export function QuoteFirstHero({ onFileSelected }: QuoteFirstHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (file: File | undefined | null) => {
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files?.[0]);
    },
    [handleFiles]
  );

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPicker();
      }
    },
    [openPicker]
  );

  return (
    <section className="relative overflow-hidden bg-[#0A0F14]">
      {/* Subtle forensic ambience — respects prefers-reduced-motion by default (no animation) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,217,255,0.08),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(10,15,20,0.9))]"
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16 md:pt-20">
        {/* Eyebrow */}
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">
          Instant Contractor Quote Audit
        </p>

        {/* Headline — native system stack via font-sans */}
        <h1 className="text-balance text-center text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          Drop Your Estimate Here. Get an Independent Truth Report in 30 Seconds.
        </h1>

        {/* Trust line */}
        <p className="mt-4 text-center text-sm text-white/70 sm:text-base">
          100% Free • No Sales Calls • Keeps Your Quote Private
        </p>

        {/* Supporting copy */}
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-white/60 sm:text-base">
          Upload the estimate you already received. WindowMan helps organize the pricing,
          products, payment terms, specifications, and details worth reviewing before you
          make a decision.
        </p>

        {/* Upload action surface — dominant */}
        <div className="mt-8 sm:mt-10">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload My Estimate"
            onClick={openPicker}
            onKeyDown={onKeyDown}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-10',
              'cursor-pointer bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F14]',
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-white/15 hover:border-primary/50 hover:bg-white/[0.05]'
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 sm:h-16 sm:w-16">
              <Upload className="h-6 w-6 text-primary sm:h-7 sm:w-7" strokeWidth={1.75} />
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Upload Your Estimate
              </p>
              <p className="text-xs text-white/60 sm:text-sm">
                PDF, photo, screenshot, or scanned estimate
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F14]"
            >
              <FileText className="h-4 w-4" />
              Choose My Estimate
            </button>

            <p className="text-[11px] uppercase tracking-widest text-white/40">
              No account required to start
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              onChange={(e) => {
                handleFiles(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          {/* Privacy line */}
          <p className="mt-5 flex items-start justify-center gap-2 px-2 text-center text-xs text-white/50 sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
            <span>
              Your quote stays private. No contractor receives it unless you choose to
              share it.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
