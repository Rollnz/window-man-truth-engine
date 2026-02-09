import { RefObject } from 'react';
import { AlertTriangle, CheckCircle2, Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';

interface AIComparisonSectionProps {
  uploadRef: RefObject<HTMLDivElement>;
}

export const AIComparisonSection = ({ uploadRef }: AIComparisonSectionProps) => {
  const handleCTAClick = () => {
    trackEvent('cta_click', {
      location: 'ai_comparison_section',
      destination: 'scanner',
      cta_label: 'Try the AI Quote Scanner',
    });
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="tp-section bg-slate-950 py-20 md:py-28">
      <div className="tp-circuit-bg absolute inset-0" />
      {/* Radial overlay handled by tp-section::before */}

      <div className="container px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Brain visual — first on mobile (order-1), right on desktop (lg:order-2) */}
          <div className="order-1 lg:order-2 relative flex flex-col items-center gap-8">
            <div className="relative flex items-center justify-center">
              {/* Glowing brain */}
              <div className="tp-brain-shell relative flex items-center justify-center w-32 h-32 rounded-full bg-slate-900 border border-blue-500/30">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
                <div className="tp-brain-color-pulse relative z-10">
                  <Brain className="w-16 h-16" />
                </div>
              </div>
            </div>

            {/* Live data stream bar */}
            <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="relative flex h-2 w-2">
                    <span className="tp-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live data stream
                </span>
                <span className="text-slate-500 text-xs">Analyzing scenarios</span>
              </div>

              <div className="relative h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="tp-stream-pulse absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
                <div className="absolute inset-y-0 right-0 flex gap-1 items-center pr-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block w-0.5 h-0.5 rounded-full bg-slate-400/60" />
                  ))}
                </div>
              </div>

              <p className="text-center text-xs text-slate-500 italic leading-relaxed">
                Even if you never read the fine print, your AI co-pilot does.
              </p>
            </div>

            {/* CTA button */}
            <Button
              onClick={handleCTAClick}
              data-id="cta-ai-comparison"
              className="shimmer-cta rounded-full px-8 py-6 text-base font-semibold bg-blue-600 text-white hover:bg-blue-500 border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              size="lg"
            >
              Try the AI Quote Scanner
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>

            {/* Decorative corner nodes */}
            <div className="tp-node" style={{ top: '10%', right: '5%' }} />
            <div className="tp-node tp-node-emerald" style={{ bottom: '15%', left: '8%' }} />
            <div className="tp-node tp-node-rose" style={{ top: '60%', right: '12%' }} />
          </div>

          {/* Copy + cards — second on mobile (order-2), left on desktop (lg:order-1) */}
          <div className="order-2 lg:order-1 space-y-8">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Why AI instead of human advisors?
              </p>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
                  <span className="block w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  AI Advantage
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight max-w-xl">
                Unbiased Comparison.{' '}
                <span className="text-primary">Data Driven insight. Updated Daily</span>
              </h2>

              <p className="text-slate-400 leading-relaxed max-w-xl">
                Our AI doesn't get tired, distracted, or commission-driven. It reads every line,
                compares thousands of scenarios, and flags risk in seconds — so you can make decisions
                with the same confidence the institutions have.
              </p>
            </div>

            {/* Problem vs Solution cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Problem card */}
              <div className="tp-glow-problem relative rounded-xl bg-slate-950/40 backdrop-blur-md border border-red-400/40 p-5 space-y-3 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/80 to-red-400/40" />
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-red-500/5 blur-2xl" />
                <h3 className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Traditional Human Advisors
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    Commission bias, sales pressure, and inconsistent advice.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    Can't realistically analyze every option or scenario.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    Limited time, limited memory, and human error.
                  </li>
                </ul>
              </div>

              {/* Solution card */}
              <div className="tp-glow-solution relative rounded-xl bg-slate-950/40 backdrop-blur-md border border-blue-500/40 p-5 space-y-3 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/80 to-blue-400/40" />
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-500/5 blur-2xl" />
                <h3 className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  AI Advisor Engine
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    Reads every number, clause, and edge case — instantly.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    Flags hidden risk and overpricing with data, not gut feelings.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                    24/7 availability, consistent logic, transparent reasoning.
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-slate-600 tracking-wide text-center sm:text-left">
              Innovation at scale · Human-level empathy, machine-level focus
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
