import { useState, useEffect, useRef } from "react";
import HowItWorksSteps from "@/components/signup3/HowItWorksSteps";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ChevronRight,
  Search,
  AlertTriangle,
  FileText,
  TrendingDown,
  AlertCircle,
  Upload,
  Menu,
} from "lucide-react";
import { ROUTES } from "@/config/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import heroImage from "@/assets/hero-quote-scan.webp";
import windowManLogo from "@/assets/windowman_logo_400.webp";
/* ── Signup3 Header ──────────────────────────────────────── */
function Signup3Header() {
  const isMobile = useIsMobile();
  const { isNavbarVisible } = useScrollLock({ enabled: isMobile, showDelay: 500 });

  const navLinks = [
    { label: "Tools", to: ROUTES.TOOLS },
    { label: "Beat Your Quote", to: ROUTES.BEAT_YOUR_QUOTE },
    { label: "AI Scanner", to: ROUTES.QUOTE_SCANNER },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 border-b backdrop-blur-md"
      style={{
        backgroundColor: "rgba(var(--bg-terminal-rgb, 15,23,42), 0.5)",
        borderColor: "var(--panel-border)",
        transform: isNavbarVisible ? "translateY(0)" : "translateY(-100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={windowManLogo} alt="WindowMan" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight">
            <span style={{ color: "#FFFFFF" }}>Window</span>
            <span style={{ color: "#0050D8" }}>Man</span>
          </span>
        </Link>

        {/* Desktop: empty for now (nav links coming later) */}
        {/* Mobile: hamburger */}
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="p-2 text-slate-300 hover:text-white transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-l"
              style={{
                backgroundColor: "var(--bg-terminal)",
                borderColor: "var(--panel-border)",
              }}
            >
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-slate-300 hover:text-white text-lg font-medium transition-colors px-2 py-2"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}

/* ── scoped styles & keyframes ───────────────────────────── */
const styleSheet = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  .font-mono-jb {
    font-family: 'JetBrains Mono', monospace;
  }

  @keyframes fadeUp {
    0% { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-up {
    opacity: 0;
    animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .delay-150 { animation-delay: 150ms; }
  .delay-250 { animation-delay: 250ms; }
  .delay-350 { animation-delay: 350ms; }
  .delay-450 { animation-delay: 450ms; }
  .delay-550 { animation-delay: 550ms; }

  @keyframes chipPingIn {
    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
    50% { transform: scale(1.02) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  .animate-chip {
    opacity: 0;
    animation: chipPingIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes slowDrift {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(1deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }

  .animate-drift {
    animation: slowDrift 8s ease-in-out infinite;
  }

  .bg-grid-pattern {
    background-image: linear-gradient(to right, rgba(30, 41, 59, 0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(30, 41, 59, 0.3) 1px, transparent 1px);
    background-size: 40px 40px;
  }
`;

/* ── Ticking Counter Hook ────────────────────────────────── */
const useCounter = (end: number, duration = 2000, startPlaying = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startPlaying) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, startPlaying]);

  return count.toLocaleString();
};

/* ── Intersection Observer Hook ──────────────────────────── */
const useOnScreen = (options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, options]);

  return [ref, isVisible];
};

/* ══════════════════════════════════════════════════════════
   SCENE 1 — HERO
   ══════════════════════════════════════════════════════════ */
function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const scannedCount = useCounter(142085, 3000);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x: x * 15, y: y * 15 });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--bg-terminal)" }}
      onMouseMove={handleMouseMove}
    >
      {/* Hero background image (parallax -- matching Signup2) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)`,
            transition: 'transform 0.7s ease-out',
          }}
        >
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            style={{ opacity: 0.3 }}
          />
        </div>
      </div>

      {/* Parallax Grid Background */}
      <div
        className="bg-grid-pattern absolute inset-0 pointer-events-none opacity-60"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          transition: "transform 0.15s ease-out",
        }}
      />

      {/* Radial Gradient overlay for center focus */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, var(--bg-terminal) 80%)",
        }}
      />

      {/* Subtle glow spot */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,80,216,0.08), transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-6 sm:px-10 py-16 sm:py-24 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/5">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300 text-sm font-medium mb-6">
          <Search className="w-4 h-4" />
          Powered by Gemini OCR
        </div>

        {/* H1 */}
        <h1 className="animate-fade-up delay-150 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-white">
          Scan Your Quote.{" "}
          <span
            className="block mt-1"
            style={{
              background: "linear-gradient(135deg, #38BDF8, #818CF8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            See What's Inside.
          </span>
        </h1>

        {/* Subheading */}
        <p className="animate-fade-up delay-250 mt-6 text-base sm:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "#FFFFFF" }}>
          Upload your estimate and let the AI check pricing, scope, warranties, and contract terms in seconds.
          Stop overpaying on hidden clauses.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up delay-350 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={ROUTES.QUOTE_SCANNER}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white text-base"
            style={{
              backgroundColor: "#0050D8",
              boxShadow: "0 8px 24px rgba(0,80,216,0.25)",
            }}
          >
            <Upload className="w-4 h-4" />
            Run Free AI Scan
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-slate-300 text-base border border-slate-600 hover:border-slate-400 hover:text-white transition-colors"
            style={{ backgroundColor: "transparent" }}
          >
            Create Free Account
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Trust Row & Ticking Counter */}
        <div className="animate-fade-up delay-450 mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs" style={{ color: "#FFFFFF" }}>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            No credit card
          </span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-500" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            Private report
          </span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-500" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            ⏱ 30–60 seconds
          </span>
          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-500" aria-hidden="true" />
          <span className="flex items-center gap-1.5 font-mono-jb text-sky-400">
            {scannedCount} Quotes Analyzed
          </span>
        </div>
      </div>
    </section>
  );

/* ══════════════════════════════════════════════════════════
   SCENE 2 — FEATURES
   ══════════════════════════════════════════════════════════ */
function FeatureSection() {
  const [ref, isVisible] = useOnScreen({ threshold: 0.2 });

  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{ backgroundColor: "var(--panel-bg)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          ref={ref}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
        >
          {/* Left Column: Copy */}
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300 text-sm font-medium mb-6">
              <Search className="w-4 h-4" />
              Audit Intelligence
            </div>

            <h2 className="animate-fade-up delay-150 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
              AI Finds What{" "}
              <span className="text-sky-400">Humans Miss.</span>
            </h2>

            <p className="animate-fade-up delay-250 mt-4 text-slate-400 leading-relaxed max-w-lg">
              Contractors bury markups in vague line items. Our ledger-matching system cross-references your estimate against thousands of verified market rates, instantly flagging risks and highlighting exact dollar amounts you can negotiate down.
            </p>

            <ul className="animate-fade-up delay-350 mt-8 space-y-4 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
                Identify predatory material markups
              </li>
              <li className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Flag missing warranty protections
              </li>
              <li className="flex items-center gap-3">
                <Search className="w-4 h-4 text-sky-400 flex-shrink-0" />
                Verify labor rate alignment
              </li>
            </ul>
          </div>

          {/* Right Column: Visual */}
          <div className="relative min-h-[420px] flex items-center justify-center">
            {/* Subtle Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(56,189,248,0.06), transparent 70%)",
              }}
            />

            {/* Floating Papers Layer */}
            <div className="relative w-full max-w-sm mx-auto animate-drift">
              {/* Paper 1 (Back) */}
              <div
                className="absolute top-6 left-4 w-[90%] h-56 rounded-lg"
                style={{
                  transform: "rotate(-3deg)",
                  border: "1px solid rgba(30,41,59,0.4)",
                  backgroundColor: "rgba(30,41,59,0.4)",
                }}
              >
                <div className="p-4 space-y-3">
                  {/* Ledger Lines */}
                  <div className="h-2 w-3/4 rounded" style={{ backgroundColor: "rgba(51,65,85,0.5)" }} />
                  <div className="h-2 w-1/2 rounded" style={{ backgroundColor: "rgba(51,65,85,0.5)" }} />
                  <div className="h-2 w-2/3 rounded" style={{ backgroundColor: "rgba(51,65,85,0.5)" }} />
                  <div className="flex justify-between text-[10px] font-mono-jb text-slate-500 mt-4">
                    <span>MAT-001</span>
                    <span>$4,250.00</span>
                  </div>
                </div>
              </div>

              {/* Paper 2 (Front) */}
              <div
                className="relative rounded-lg shadow-2xl"
                style={{
                  border: "1px solid rgba(30,41,59,0.6)",
                  backgroundColor: "#111827",
                }}
              >
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: "1px solid rgba(30,41,59,0.4)" }}
                >
                  <span className="text-[10px] font-mono-jb text-slate-400 tracking-wider">ESTIMATE #8492</span>
                  <span className="text-sm font-bold text-white">$42,850.00</span>
                </div>

                {/* Table headers */}
                <div
                  className="grid grid-cols-3 gap-2 px-4 py-2 text-[9px] font-mono-jb text-slate-500 uppercase tracking-wider"
                  style={{ borderBottom: "1px solid rgba(30,41,59,0.3)" }}
                >
                  <span>DESCRIPTION</span>
                  <span className="text-center">QTY</span>
                  <span className="text-right">TOTAL</span>
                </div>

                {/* Line Items */}
                <div className="divide-y" style={{ borderColor: "rgba(30,41,59,0.2)" }}>
                  {[
                    { desc: "Premium LVP Flooring", qty: "1200", total: "$8,400" },
                    { desc: "Labor & Prep", qty: "--", total: "$12,000" },
                    { desc: "Subfloor Repair", qty: "Lot", total: "$3,500" },
                  ].map((row) => (
                    <div
                      key={row.desc}
                      className="grid grid-cols-3 gap-2 px-4 py-2.5 text-[11px] text-slate-300"
                    >
                      <span>{row.desc}</span>
                      <span className="text-center text-slate-500">{row.qty}</span>
                      <span className="text-right font-mono-jb">{row.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Callout Chips (Ping in staggered) */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Chip 1: Hidden Fee */}
              {isVisible && (
                <div
                  className="animate-chip absolute -right-2 sm:right-0 top-4 rounded-lg p-3 backdrop-blur-sm max-w-[200px]"
                  style={{
                    backgroundColor: "rgba(69,10,10,0.8)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    animationDelay: "200ms",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[11px] font-semibold text-red-300">Hidden Fee Detected</span>
                  </div>
                  <p className="text-[10px] text-red-200/70">Labor &amp; Prep is 30% above market.</p>
                  <p className="text-[10px] font-semibold text-emerald-400 mt-1">Potential Save: $3,600</p>
                </div>
              )}

              {/* Chip 2: Warranty */}
              {isVisible && (
                <div
                  className="animate-chip absolute -left-2 sm:left-0 bottom-24 rounded-lg p-3 backdrop-blur-sm max-w-[200px]"
                  style={{
                    backgroundColor: "rgba(69,26,3,0.8)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    animationDelay: "500ms",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-300">Warranty Clause Missing</span>
                  </div>
                  <p className="text-[10px] text-amber-200/70">No material defect guarantee found.</p>
                </div>
              )}

              {/* Chip 3: Scope */}
              {isVisible && (
                <div
                  className="animate-chip absolute -right-2 sm:right-0 bottom-4 rounded-lg p-3 backdrop-blur-sm max-w-[200px]"
                  style={{
                    backgroundColor: "rgba(7,89,133,0.8)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    animationDelay: "800ms",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[11px] font-semibold text-sky-300">Scope Vague</span>
                  </div>
                  <p className="text-[10px] text-sky-200/70">"Subfloor Repair" lacks specific footage.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function Signup3() {
  return (
    <>
      <Helmet>
        <title>Free AI Quote Scanner | Window Truth Engine</title>
        <meta
          name="description"
          content="Upload your window replacement estimate and get an instant AI audit of pricing, scope, warranties, and hidden fees."
        />
      </Helmet>

      <style>{styleSheet}</style>

      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-terminal)" }}>
         <Signup3Header />
         <HeroSection />
         <HowItWorksSteps />
         <FeatureSection />
      </div>
    </>
  );
}
