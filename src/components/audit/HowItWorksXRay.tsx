import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Upload, Scan, AlertTriangle, FileCheck, ArrowRight, Zap } from 'lucide-react';

interface HowItWorksXRayProps {
  onScanClick: () => void;
}

const STEPS = [{
  number: '01',
  icon: Upload,
  title: 'Drop Your Quote',
  description: 'Snap a photo, drag a PDF, or paste text. Works with handwritten estimates, professional quotes, and everything in between.',
  color: 'from-slate-600 to-slate-500',
  iconColor: 'text-slate-400',
  borderColor: 'border-slate-700'
}, {
  number: '02',
  icon: Scan,
  title: 'AI X-Ray Scan',
  description: 'Our AI reads every line item, decodes contractor jargon, and compares against 10,000+ Florida installations in our database.',
  color: 'from-cyan-500 to-cyan-400',
  iconColor: 'text-cyan-400',
  borderColor: 'border-cyan-500/30',
  highlight: true
}, {
  number: '03',
  icon: AlertTriangle,
  title: 'Red Flags Exposed',
  description: 'Hidden fees, missing permits, vague warranty terms, inflated labor costs—we surface everything they hoped you wouldn\'t notice.',
  color: 'from-red-500 to-orange-500',
  iconColor: 'text-red-400',
  borderColor: 'border-red-500/30'
}, {
  number: '04',
  icon: FileCheck,
  title: 'Your Verdict',
  description: 'Get a clear "Fair" or "Overpriced" verdict with a dollar amount. Plus negotiation scripts and a better counter-offer if needed.',
  color: 'from-emerald-500 to-emerald-400',
  iconColor: 'text-emerald-400',
  borderColor: 'border-emerald-500/30'
}];

export function HowItWorksXRay({
  onScanClick
}: HowItWorksXRayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = 'auto';
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return <section className="relative py-20 md:py-28 bg-slate-950 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative px-4">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Instant Analysis
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            X-Ray Vision for Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Wallet
            </span>
          </h2>
          
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Most homeowners overpay by 30% because they don't speak "Contractor."
            Our AI reads the messy handwriting, decodes the jargon, and spots the missing 
            scope items that cost you thousands later.
          </p>
        </div>

        {/* Monitor Frame Video */}
        <div ref={wrapperRef} className="max-w-3xl mx-auto mb-16">
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
            {/* Monitor top bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-slate-500 font-mono">AI Quote Scanner — Live Analysis</span>
              </div>
            </div>
            {/* Video */}
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="none"
              className="w-full aspect-video object-cover"
              aria-label="AI scanning a window replacement quote"
            >
              <source src="https://itswindowman-videos.b-cdn.net/window_estimate_ai_scan_animated.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {STEPS.map((step, index) => <Card key={step.number} className={cn("relative bg-slate-900/50 backdrop-blur-sm border p-6 transition-all duration-300 hover:scale-105 hover:shadow-lg group", step.borderColor, step.highlight && "ring-1 ring-cyan-500/20")}>
              {/* Step number */}
              <div className={cn("text-6xl font-black opacity-10 absolute top-4 right-4", step.highlight ? "text-cyan-400" : "text-slate-600")}>
                {step.number}
              </div>

              {/* Icon */}
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", `bg-gradient-to-br ${step.color}`)}>
                <step.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

              {/* Connector arrow (not on last item) */}
              {index < STEPS.length - 1 && <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-slate-700" />
                </div>}
            </Card>)}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button onClick={onScanClick} size="lg" className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-900 rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all">
            <Scan className="w-5 h-5 mr-2" />
            Try It For Free
          </Button>
          
          <p className="text-sm mt-4 text-gray-400">
            Stop Guessing. Start Auditing. Use AI to find what your contractor "Missed"
          </p>
        </div>
      </div>
    </section>;
}
