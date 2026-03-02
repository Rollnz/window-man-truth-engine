import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, ArrowRight, Upload, Lock, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/navigation';

export default function Signup2() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap');

        .font-manrope { font-family: 'Manrope', sans-serif; }

        @keyframes s2FadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .s2-fade-up {
          opacity: 0;
          animation: s2FadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .s2-d150 { animation-delay: 150ms; }
        .s2-d250 { animation-delay: 250ms; }
        .s2-d350 { animation-delay: 350ms; }
        .s2-d450 { animation-delay: 450ms; }
        .s2-d550 { animation-delay: 550ms; }

        .s2-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.04;
          mix-blend-mode: multiply;
        }

        .s2-blueprint {
          background-image:
            linear-gradient(rgba(0, 80, 216, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 80, 216, 0.04) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .s2-glass {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 10px 40px -10px rgba(0, 80, 216, 0.08);
        }

        @keyframes s2ScanSweep {
          0% { top: -20%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        .s2-scan-beam {
          animation: s2ScanSweep 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          background: linear-gradient(to bottom, rgba(20, 184, 166, 0) 0%, rgba(20, 184, 166, 0.4) 50%, rgba(20, 184, 166, 0.8) 100%);
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }
      `}</style>

      <div className="relative min-h-screen w-full overflow-hidden bg-[#F7F7F4] font-inter text-slate-800 flex items-center pt-20 pb-12 lg:py-0">

        {/* Background Parallax */}
        <div
          className="absolute inset-0 z-0 transition-transform duration-700 ease-out will-change-transform scale-105"
          style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2600&q=80")' }}
          />
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 z-0 bg-[#F7F7F4]/85 backdrop-blur-[2px]" />
        <div className="absolute inset-0 z-0 s2-blueprint pointer-events-none" />
        <div className="absolute inset-0 z-0 s2-grain pointer-events-none" />

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start pt-10 lg:pt-0">

            {/* Badge */}
            <div className="s2-fade-up s2-d150 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[#0050D8]/20 text-[#0050D8] mb-6 shadow-sm backdrop-blur-sm">
              <Activity size={14} className="text-[#14B8A6]" />
              <span className="font-mono text-xs font-semibold tracking-wide uppercase">FREE AI QUOTE SCAN</span>
            </div>

            {/* Headline */}
            <h1 className="s2-fade-up s2-d250 font-manrope text-5xl sm:text-6xl lg:text-[68px] font-extrabold text-[#0050D8] leading-[1.05] tracking-tight mb-6">
              Scan Your Quote.<br />
              <span className="text-slate-800">See What's Inside.</span>
            </h1>

            {/* Subhead */}
            <p className="s2-fade-up s2-d350 text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              Upload your estimate and let the AI check pricing, scope, warranties, and contract terms in seconds.
            </p>

            {/* CTAs */}
            <div className="s2-fade-up s2-d450 flex flex-col sm:flex-row w-full sm:w-auto gap-4 mb-8">
              <Button asChild size="lg" className="group relative overflow-hidden bg-[#0050D8] hover:bg-[#0042b3] text-white px-8 py-4 rounded-[20px] font-semibold text-lg shadow-[0_8px_24px_rgba(0,80,216,0.25)] hover:shadow-[0_12px_32px_rgba(0,80,216,0.35)] hover:-translate-y-0.5 transition-all duration-300 h-auto">
                <Link to={ROUTES.QUOTE_SCANNER}>
                  <Upload size={20} className="mr-2" />
                  <span>Run Free AI Scan</span>
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="s2-glass hover:bg-white text-[#0050D8] border-[#0050D8]/10 hover:border-[#FF6200] px-8 py-4 rounded-[20px] font-semibold text-lg transition-all duration-300 group h-auto">
                <Link to="/signup">
                  Create Free Account
                  <ArrowRight size={18} className="ml-2 text-[#FF6200] group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Trust Row */}
            <div className="s2-fade-up s2-d550 flex flex-wrap items-center gap-y-2 gap-x-4 text-[13px] font-mono text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#10B981]" />
                <span>No credit card</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Lock size={14} className="text-[#0050D8]" />
                <span>Private report</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Activity size={14} className="text-[#FF6200]" />
                <span>30–60 seconds</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Scanning Card */}
          <div className="lg:col-span-5 relative w-full max-w-md mx-auto s2-fade-up s2-d450">
            <div className="s2-glass rounded-[24px] p-6 relative overflow-hidden transform transition-transform duration-500 hover:scale-[1.02]">

              {/* Mock doc header */}
              <div className="flex justify-between items-start mb-6 border-b border-slate-200/50 pb-4">
                <div>
                  <div className="h-2 w-16 bg-slate-200 rounded-full mb-2" />
                  <div className="h-3 w-32 bg-slate-300 rounded-full" />
                </div>
                <div className="px-2 py-1 bg-[#0050D8]/10 text-[#0050D8] rounded font-mono text-[10px] font-bold tracking-wider">
                  EST-4092
                </div>
              </div>

              {/* Mock rows */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-[#10B981]" />
                    </div>
                    <div>
                      <div className="h-2 w-20 bg-slate-300 rounded-full mb-1" />
                      <div className="font-mono text-[10px] text-slate-400">Materials Scope</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#10B981]">VERIFIED</div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-[#F59E0B]" />
                    </div>
                    <div>
                      <div className="h-2 w-24 bg-slate-300 rounded-full mb-1" />
                      <div className="font-mono text-[10px] text-slate-400">Labor Rate</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#F59E0B]">+12% AVG</div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <FileText size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <div className="h-2 w-16 bg-slate-200 rounded-full mb-1" />
                      <div className="font-mono text-[10px] text-slate-400">Wind Mitigation</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-400">SCANNING...</div>
                </div>
              </div>

              {/* Resilience Score */}
              <div className="bg-slate-50/80 rounded-[16px] p-4 border border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">Resilience Score</span>
                  <span className="font-manrope text-lg font-bold text-[#0050D8]">A+</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#EF4444] w-1/4 opacity-20" />
                  <div className="h-full bg-[#F59E0B] w-1/4 opacity-20" />
                  <div className="h-full bg-[#10B981] w-1/2" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[8px] text-slate-400">CRITICAL</span>
                  <span className="font-mono text-[8px] text-slate-400">OPTIMAL</span>
                </div>
              </div>

              {/* Scan beam */}
              <div className="absolute left-0 right-0 h-16 s2-scan-beam pointer-events-none z-20">
                <div className="absolute bottom-0 w-full h-[1px] bg-[#14B8A6] shadow-[0_0_8px_#14B8A6]" />
              </div>
            </div>

            {/* Decorative border */}
            <div className="absolute -z-10 -right-6 -bottom-6 w-full h-full border-2 border-[#0050D8]/10 rounded-[24px] pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
}
