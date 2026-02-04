import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield, Scan, Lock, Sparkles } from "lucide-react";
import { AUDIT_CONFIG } from "@/config/auditConfig";
interface ScannerHeroWindowProps {
  onScanClick: () => void;
  onViewSampleClick?: () => void;
}
export function ScannerHeroWindow({
  onScanClick,
  onViewSampleClick
}: ScannerHeroWindowProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 50,
    y: 50
  });
  useEffect(() => {
    setIsVisible(true);
  }, []);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
    setMousePosition({
      x,
      y
    });
  };
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 py-12 px-4" onMouseMove={handleMouseMove}>
      {/* Ambient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-slate-950 to-slate-950" />
        <div className="absolute bottom-0 left-0 right-0 h-64 opacity-10">
          <svg viewBox="0 0 1200 200" className="w-full h-full" preserveAspectRatio="xMidYMax slice">
            <path d="M0,200 L0,180 Q50,160 100,180 Q150,120 180,140 L180,200 Z" fill="currentColor" className="text-emerald-900" />
            <path d="M150,200 L150,150 Q200,100 220,130 Q250,80 280,120 L280,200 Z" fill="currentColor" className="text-emerald-950" />
            <path d="M900,200 L900,160 Q950,120 980,150 Q1020,90 1050,130 L1050,200 Z" fill="currentColor" className="text-emerald-900" />
            <path d="M1050,200 L1050,140 Q1100,100 1130,130 Q1160,80 1200,120 L1200,200 Z" fill="currentColor" className="text-emerald-950" />
          </svg>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => <div key={i} className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 60}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${2 + Math.random() * 2}s`
        }} />)}
        </div>
      </div>

      {/* Alert Badge */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
        <Badge className={cn("px-3 py-1.5 md:px-4 md:py-2 rounded-md whitespace-nowrap bg-red-500/20 border-red-500/40 text-red-400 text-xs md:text-sm font-medium backdrop-blur-md transition-all duration-1000", isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4")}>
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          ALERT: Is it a "Great Deal" or a "Great Risk"
        </Badge>
      </div>

      {/* Main Window Container */}
      <div className={cn("relative z-10 w-full max-w-4xl mx-auto transition-all duration-1000", isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
        <div className="relative">
          <div className="absolute -inset-2 bg-black/50 rounded-2xl blur-2xl" />

          {/* Window Frame */}
          <div className="relative bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 p-3 md:p-4 rounded-xl shadow-2xl">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />

            {/* Impact Rating Badge */}
            <div className="absolute -top-3 left-8 z-20">
              <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                <Shield className="w-3 h-3" />
                IMPACT RATED
              </div>
            </div>

            {/* Glass Pane */}
            <div className="relative overflow-hidden rounded-lg">
              <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 min-h-[500px] md:min-h-[550px] p-8 md:p-12">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: "20px 20px"
              }} />

                <div className="absolute inset-0 pointer-events-none transition-all duration-300 ease-out" style={{
                background: `radial-gradient(ellipse 60% 40% at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.08) 0%, transparent 60%)`
              }} />

                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute -top-1/2 -left-1/4 w-3/4 h-full bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent rotate-12 transform" />
                </div>

                {/* Scan Line Animation - Blue theme */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-scan-down" style={{
                  boxShadow: "0 0 30px 10px hsl(var(--primary) / 0.3)"
                }} />
                </div>

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-6">
                  <div className={cn("relative transition-all duration-700 delay-200", isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50")}>
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                      <Scan className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl border border-primary/50 animate-ping" />
                  </div>

                  <div className={cn("space-y-2 transition-all duration-700 delay-300", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight">
                      <span className="text-white drop-shadow-lg">The</span>
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 drop-shadow-lg">
                        Lie Detector
                      </span>
                      <span className="text-white drop-shadow-lg">for Window Quotes</span>
                    </h1>
                  </div>

                  <p className={cn("text-lg sm:text-xl md:text-2xl text-slate-300/90 max-w-2xl leading-relaxed transition-all duration-700 delay-400", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                    Contractors hide fees in the fine print.
                    <span className="block text-orange-400 font-semibold mt-1">Our AI Scans it in Seconds.</span>
                  </p>

                  <p className={cn("text-base max-w-xl transition-all duration-700 delay-500 text-destructive-foreground", isVisible ? "opacity-100" : "opacity-0")}>
                    Upload Your Quote For a Free, Instant Audit: We'll Either{" "}
                    <span className="text-emerald-400 font-medium">Validate</span> It's Fair or{" "}
                    <span className="text-orange-400 font-medium">Beat It</span> With a Better Offer.
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950/50 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Window Sill */}
            <div className="relative -mx-3 md:-mx-4 mt-0">
              <div className="h-2 bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-sm" />
              <div className="bg-gradient-to-b from-slate-700 via-slate-750 to-slate-800 px-6 md:px-10 py-8 rounded-b-xl">
                <div className="absolute top-4 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

                <div className={cn("flex flex-col items-center space-y-4 transition-all duration-700 delay-600", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                  {/* Urgency Line */}
                  <p className="text-slate-400 text-sm text-center max-w-md">
                    {AUDIT_CONFIG.hero.urgencyLine}
                  </p>

                  {/* Primary CTA */}
                  <Button onClick={onScanClick} size="lg" className="group relative px-10 py-8 text-xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 hover:from-orange-400 hover:via-orange-300 hover:to-amber-400 text-slate-900 rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-400/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </div>
                    <Scan className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                    {AUDIT_CONFIG.hero.primaryCtaLabel}
                    <span className="absolute -top-3 -right-3 px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full shadow-lg animate-bounce">
                      FREE
                    </span>
                  </Button>

                  {/* Secondary CTA - only if callback provided */}
                  {onViewSampleClick && <div className="flex flex-col items-center space-y-2">
                      <Button variant="outline" onClick={onViewSampleClick} className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-6 py-2">
                        {AUDIT_CONFIG.hero.sampleCtaLabel}
                      </Button>
                      
                      {/* Optional subline */}
                      {AUDIT_CONFIG.hero.sampleCtaSubline && <p className="text-xs text-primary-foreground">
                          {AUDIT_CONFIG.hero.sampleCtaSubline}
                        </p>}
                    </div>}

                  {/* Trust Line */}
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span>{AUDIT_CONFIG.hero.trustLine}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manufacturer Badge */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-700/50 shadow-lg">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-[#3b8cd8]">Powered by AI • Built for Florida</span>
          </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className={cn("absolute bottom-8 left-0 right-0 transition-all duration-700 delay-700", isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 px-4">
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-800/50">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>12,847+ Quotes Scanned</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-800/50">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>$4.2M+ Overcharges Found</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-800/50">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>94% Red Flag Detection</span>
          </div>
        </div>
      </div>
    </section>;
}