import { useCallback, useRef, useState } from 'react';
import { Upload, ShieldCheck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuoteFirstHeroProps } from '../types';

/**
 * QuoteFirstHero — restrained mature evolution of the /beat-your-quote dossier hero.
 *
 * Uses the existing dossier atmospheric asset as a subtle background, dominant
 * upload action, restrained forensic cyan (tools.truth-engine) accents.
 *
 * Accessibility: a single semantic <button> is the entire dropzone — no nested
 * interactive controls. The visible "Choose My Estimate" pill is a styled span.
 */
export function QuoteFirstHero({ onFileSelected }: QuoteFirstHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const openPicker = useCallback(() => inputRef.current?.click(), []);

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
      handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );

  return (
    <section className="relative overflow-hidden bg-[#0A0F14]">
      {/* Restrained dossier atmospheric background — matured, not theatrical */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/images/beat-your-quote/hero-dossier.webp')] bg-cover bg-center opacity-[0.12]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.06),transparent_60%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,15,20,0.75),rgba(10,15,20,0.95))]"
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16 md:pt-20">
        {/* Eyebrow — literal uppercase source text */}
        <p className="mb-4 text-center text-[11px] font-semibold tracking-[0.2em] text-tools-truth-engine sm:text-xs">
          INSTANT CONTRACTOR QUOTE AUDIT
        </p>

        <h1 className="text-balance text-center text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          Drop Your Estimate Here. Get an Independent Truth Report in 30 Seconds.
        </h1>

        <p className="mt-4 text-center text-sm text-white/70 sm:text-base">
          100% Free • No Sales Calls • Keeps Your Quote Private
        </p>

        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-white/60 sm:text-base">
          Upload the estimate you already received. WindowMan helps organize the pricing,
          products, payment terms, specifications, and details worth reviewing before you
          make a decision.
        </p>

        {/* Upload action surface — one semantic button, no nested interactive controls */}
        <div className="mt-8 sm:mt-10">
          <button
            type="button"
            aria-label="Upload your estimate — opens file picker"
            onClick={openPicker}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              'group relative flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-10',
              'bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-tools-truth-engine focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F14]',
              isDragging
                ? 'border-tools-truth-engine bg-tools-truth-engine/10'
                : 'border-white/15 hover:border-tools-truth-engine/50 hover:bg-white/[0.05]'
            )}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-tools-truth-engine/30 bg-tools-truth-engine/10 sm:h-16 sm:w-16">
              <Upload
                className="h-6 w-6 text-tools-truth-engine sm:h-7 sm:w-7"
                strokeWidth={1.75}
              />
            </span>

            <span className="block space-y-1">
              <span className="block text-lg font-semibold tracking-tight text-white sm:text-xl">
                Upload Your Estimate
              </span>
              <span className="block text-xs text-white/60 sm:text-sm">
                PDF, photo, screenshot, or scanned estimate
              </span>
            </span>

            {/* Visually styled non-interactive pill — mimics a CTA */}
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-2 rounded-lg bg-tools-truth-engine px-5 py-2.5 text-sm font-semibold text-[#0A0F14] shadow-sm transition-colors group-hover:bg-tools-truth-engine-light"
            >
              <FileText className="h-4 w-4" />
              Choose My Estimate
            </span>

            <span className="block text-[11px] uppercase tracking-widest text-white/40">
              No account required to start
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <p className="mt-5 flex items-start justify-center gap-2 px-2 text-center text-xs text-white/50 sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-tools-truth-engine/70" />
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
