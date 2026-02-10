import React, { useEffect, useRef } from 'react';
import { Brain, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { cn } from '@/lib/utils';
interface AIComparisonSectionProps {
  uploadRef?: React.RefObject<HTMLDivElement>;
}
const STYLES = `
.tp-section{position:relative;overflow:hidden}
.tp-circuit-bg{position:relative;background:linear-gradient(90deg,rgba(57,147,221,.08) 1px,transparent 1px),linear-gradient(0deg,rgba(57,147,221,.06) 1px,transparent 1px);background-size:48px 48px}
.tp-section::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.28;background:radial-gradient(circle at 20% 0%,rgba(57,147,221,.25),transparent 55%),radial-gradient(circle at 80% 100%,rgba(57,147,221,.22),transparent 60%)}
@keyframes tp-brain-pulse{0%,100%{transform:scale(1);box-shadow:0 0 16px rgba(57,147,221,.45),0 0 40px rgba(57,147,221,.35)}50%{transform:scale(1.04);box-shadow:0 0 24px rgba(57,147,221,.9),0 0 60px rgba(57,147,221,.7)}}
.tp-brain-shell{will-change:transform,box-shadow;animation:tp-brain-pulse 3s ease-in-out infinite}
@keyframes tp-brain-color-pulse{0%,100%{color:#d4e8f8;filter:drop-shadow(0 0 8px rgba(212,232,248,.5))}50%{color:#3993DD;filter:drop-shadow(0 0 20px rgba(57,147,221,.9))}}
.tp-brain-color-pulse{will-change:color,filter;animation:tp-brain-color-pulse 5s ease-in-out infinite!important}
@keyframes tp-stream-pulse{0%{transform:translateX(-20%);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(120%);opacity:0}}
.tp-stream-pulse{will-change:transform,opacity;animation:tp-stream-pulse 4s linear infinite}
@keyframes tp-node-pulse{0%,100%{transform:translateY(0);opacity:.7}50%{transform:translateY(-6px);opacity:1}}
.tp-node{position:absolute;width:6px;height:6px;border-radius:9999px;background:rgb(57 147 221);box-shadow:0 0 10px rgba(57,147,221,.9);will-change:transform,opacity;animation:tp-node-pulse 3.2s ease-in-out infinite}
.tp-node-rose{background:rgb(234 138 50);box-shadow:0 0 10px rgba(234,138,50,.9);animation-delay:1.6s}
.tp-glow-problem{border-color:rgba(248,113,113,.6);box-shadow:0 0 16px rgba(248,113,113,.25),inset 0 0 14px rgba(127,29,29,.35)}
.tp-glow-solution{border-color:rgba(57,147,221,.7);box-shadow:0 0 20px rgba(57,147,221,.32),inset 0 0 14px rgba(30,64,175,.35)}
@keyframes tp-ping{75%,100%{transform:scale(2);opacity:0}}
.tp-ping{animation:tp-ping 1s cubic-bezier(0,0,.2,1) infinite}
.shimmer-cta{position:relative;overflow:hidden}
.shimmer-cta::after{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(120deg,transparent 0%,transparent 40%,rgba(255,255,255,.3) 50%,transparent 60%,transparent 100%);animation:shimmer-sweep 4s ease-in-out infinite;pointer-events:none}
@keyframes shimmer-sweep{0%{left:-100%}20%{left:100%}100%{left:100%}}
@media(prefers-reduced-motion:reduce){.tp-brain-shell,.tp-stream-pulse,.tp-node,.tp-ping,.tp-brain-color-pulse,.shimmer-cta::after{animation:none!important;transform:none!important}.tp-brain-color-pulse{color:#3993DD!important;filter:drop-shadow(0 0 16px rgba(57,147,221,.8))}.tp-brain-shell{box-shadow:0 0 20px rgba(57,147,221,.6),0 0 50px rgba(57,147,221,.5)}.tp-node{opacity:.8}.tp-stream-pulse{opacity:.7}}
@media(max-width:768px){.tp-section::before{opacity:.16}.tp-circuit-bg{background-size:36px 36px}.tp-stream-pulse{animation:none;opacity:.55}.tp-brain-shell{animation-duration:4s}.tp-glow-problem,.tp-glow-solution{box-shadow:0 0 10px currentColor,inset 0 0 8px currentColor}}
`;
export const AIComparisonSection: React.FC<AIComparisonSectionProps> = ({
  uploadRef
}) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);
  useEffect(() => {
    if (!styleRef.current) {
      const el = document.createElement('style');
      el.textContent = STYLES;
      document.head.appendChild(el);
      styleRef.current = el;
    }
    return () => {
      styleRef.current?.remove();
      styleRef.current = null;
    };
  }, []);
  const handleCTA = () => {
    trackEvent('cta_click', {
      location: 'ai_comparison_section',
      destination: 'scanner'
    });
    uploadRef?.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };
  return <section className="tp-section bg-slate-950 py-16 md:py-24" aria-label="Why AI instead of human advisors">
      <div className="tp-circuit-bg relative z-[1]">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Right column on desktop, first on mobile */}
            <div className="relative flex flex-col items-center gap-8 order-first lg:order-last">
              {/* Orbiting glow ring */}
              <div className="absolute inset-0 flex items-start justify-center pt-4 pointer-events-none">
                <div className="w-52 h-52 md:w-64 md:h-64 rounded-full border border-primary/20 animate-[spin_20s_linear_infinite]" />
              </div>

              {/* Brain visual */}
              <div className="flex flex-col items-center gap-6">
                <div className="tp-brain-shell rounded-full bg-slate-900/80 border-2 border-primary/30 p-8 md:p-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                    <Brain className="tp-brain-color-pulse relative w-20 h-20 md:w-28 md:h-28" />
                  </div>
                </div>

                {/* Data stream bar */}
                <div className="w-full max-w-xs">
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="relative flex h-2 w-2">
                          <span className="tp-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Live data stream
                      </span>
                      <span className="text-slate-500">Analyzing scenarios</span>
                    </div>
                    <div className="h-px bg-slate-700/50" />
                    <div className="relative h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      {[0, 1, 2].map(i => <div key={i} className="tp-stream-pulse absolute inset-y-0 w-1/4 rounded-full bg-gradient-to-r from-primary/80 to-primary/60" style={{
                      animationDelay: `${i * 1.3}s`
                    }} />)}
                    </div>
                    <div className="h-px bg-slate-700/50" />
                    <p className="text-[11px] text-slate-500 text-center italic">
                      Even if you never read the fine print, your AI co-pilot does.
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <button onClick={handleCTA} data-id="cta-ai-comparison" className="shimmer-cta inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/90 transition-colors px-6 py-3 text-sm font-semibold text-secondary-foreground shadow-lg shadow-secondary/30">
                  Try the AI Quote Scanner
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Decorative nodes */}
              <div className="tp-node top-4 right-8" />
              <div className="tp-node tp-node-rose bottom-12 left-4" />
              <div className="tp-node bottom-4 right-16" style={{
              animationDelay: '0.8s'
            }} />
            </div>

            {/* Left column: copy + cards */}
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Why AI instead of human advisors?
                </p>

                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary/80">AI Advantage</span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  <span className="text-white">Unbiased Comparison. </span>
                  <span className="text-primary">Data Driven insight. Updated Daily </span>
                </h2>

                <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-xl">
                  Our AI doesn't get tired, distracted, or commission-driven. It reads every line,
                  compares thousands of scenarios, and flags risk in seconds — so you can make decisions
                  with the same confidence the institutions have.
                </p>
              </div>

              {/* Comparison cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Problem */}
                <div className="tp-glow-problem rounded-xl border-2 bg-slate-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-1 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-red-500/40" />
                  </div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-red-300">
                    <AlertTriangle className="w-4 h-4" />
                    Traditional Human Advisors
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                      Commission bias, sales pressure, and inconsistent advice.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                      Can't realistically analyze every option or scenario.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-red-500/60" />
                      Limited time, limited memory, and human error.
                    </li>
                  </ul>
                </div>

                {/* Solution */}
                <div className="tp-glow-solution rounded-xl border-2 bg-slate-900/70 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-1 rounded-full bg-blue-500/60" />
                    <div className="w-3 h-3 rounded-full bg-blue-500/40" />
                  </div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                    <Brain className="w-4 h-4" />
                    AI Advisor Engine
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
                      Reads every number, clause, and edge case — instantly.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
                      Flags hidden risk and overpricing with data, not gut feelings.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 w-4 h-4 shrink-0 text-emerald-400" />
                      24/7 availability, consistent logic, transparent reasoning.
                    </li>
                  </ul>
                </div>
              </div>

              <p className="text-[11px] uppercase tracking-widest text-primary/40 text-center">
                Innovation at scale · Human-level empathy, machine-level focus
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
};