import { useState, useRef } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerBadge } from "@/components/ui/ShimmerBadge";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { UrgencyTicker } from "@/components/social-proof/UrgencyTicker";
import { useCountUp } from "@/components/social-proof/useCountUp";
import { ROUTES } from "@/config/navigation";

/* ── scoped keyframes & utility classes ───────────────────── */
const scopedStyles = `
  .s3-grid-pattern {
    background-image:
      linear-gradient(to right, rgba(30,41,59,0.3) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(30,41,59,0.3) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  @keyframes s3SlowDrift {
    0%   { transform: translateY(0)    rotate(0deg); }
    50%  { transform: translateY(-15px) rotate(1deg); }
    100% { transform: translateY(0)    rotate(0deg); }
  }
  .s3-drift { animation: s3SlowDrift 8s ease-in-out infinite; }
`;

/* ── trust-row dots ───────────────────────────────────────── */
const TrustDot = () => (
  <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-500" aria-hidden="true" />
);

/* ══════════════════════════════════════════════════════════
   SCENE 1 — HERO
   ══════════════════════════════════════════════════════════ */
function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x: x * 15, y: y * 15 });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#070B14" }}
      onMouseMove={handleMouseMove}
    >
      {/* parallax grid */}
      <div
        className="s3-grid-pattern absolute inset-0 pointer-'none opacity-60"
        style={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
          transition: "transform 0.15s ease-out'",
        }}
      />

      {/* radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, #070B14 80%)',
        }}
      />

      {/* glow spot */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,80,216,0.08), transparent 70%)',
        }}
      />

      {/* content */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6 py-20 sm:py-28">
        {/* badge */}
        <AnimateOnScroll duration={500}>
          <ShimmerBadge
            text="Free AI Quote Scan"
            icon={Search}
            className="mx-auto mb-6 text-sky-300 bg-sky-500/10 border-sky-400/20"
          />
        </AnimateOnScroll>

        {/* h1 */}
        <AnimateOnScroll duration={600} delay={100}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-white">
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
        </AnimateOnScroll>

        {/* sub */}
        <AnimateOnScroll duration={600} delay={200}>
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload your estimate and let the AI check pricing, scope,
            warranties, and contract terms in seconds. Stop overpaying on hidden
            clauses.
          </p>
        </AnimateOnScroll>

        {/* CTAs */}
        <AnimateOnScroll duration={600} delay={300}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="cta" size="lg" className="w-full sm:w-auto bg-[#0050D8] shadow-[0_8px_24px_rgba(0,80,216,0.25)] hover:shadow-[0_12px_32px_rgba(0,80,216,0.35)]">
              <Link to={ROUTES.QUOTE_SCANNER}>
                <Upload className="w-4 h-4" />
                Run Free AI Scan
              </Link>
            </Button>
            <Button asChild variant="frame" size="lg" className="w-full sm:w-auto border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white bg-transparent">
              <Link to="/signup">
                Create Free Account
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>

        {/* trust row */}
        <AnimateOnScroll duration={600} delay={450}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              No credit card
            </span>
            <TrustDot />
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              Private report
            </span>
            <TrustDot />
            <span className="flex items-center gap-1.5">⏱ 30–60 seconds</span>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SCENE 2 — FEATURES
   ══════════════════════════════════════════════════════════ */
function FeatureSection() {
  return (
    <section
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{ backgroundColor: "#0D1321" }}
    >
      <div className="container px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* left — copy */}
          <div>
            <AnimateOnScroll duration={500}>
              <ShimmerBadge
                text="Audit Intelligence"
                icon={Search}
                className="mb-6 text-sky-300 bg-sky-500/10 border-sky-400/20"
              />
            </AnimateOnScroll>

            <AnimateOnScroll duration={600} delay={100}>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-white">
                AI Finds What{" "}
                <span className="text-sky-400">Humans Miss.</span>
              </h2>
            </AnimateOnScroll>

            <AnimateOnScroll duration={600} delay={200}>
              <p className="mt-4 text-slate-400 leading-relaxed max-w-lg">
                Contractors bury markups in vague line items. Our
                ledger-matching system cross-references your estimate against
                thousands of verified market rates, instantly flagging risks and
                highlighting exact dollar amounts you can negotiate down.
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll duration={600} delay={300}>
              <ul className="mt-8 space-y-4 text-sm text-slate-300">
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
            </AnimateOnScroll>
          </div>

          {/* right — floating paper visual */}
          <div className="relative min-h-[420px] flex items-center justify-center">
            {/* glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(56,189,248,0.06), transparent 70%)',
              }}
            />

            {/* papers container */}
            <div className="relative w-full max-w-sm mx-auto s3-drift">
              {/* paper 1 — back */}
              <div
                className="absolute top-6 left-4 w-[90%] h-56 rounded-lg border border-slate-700/40 bg-slate-800/40"
                style={{ transform: "rotate(-3deg)" }}
              >
                <div className="p-4 space-y-3">
                  <div className="h-2 w-3/4 rounded bg-slate-700/50" />
                  <div className="h-2 w-1/2 rounded bg-slate-700/50" />
                  <div className="h-2 w-2/3 rounded bg-slate-700/50" />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-4">
                    <span>MAT-001</span>
                    <span>$4,250.00</span>
                  </div>
                </div>
              </div>

              {/* paper 2 — front */}
              <div className="relative rounded-lg border border-slate-700/60 bg-[#111827] shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-slate-700/40">
                  <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                    ESTIMATE #8492
                  </span>
                  <span className="text-sm font-bold text-white">
                    $42,850.00
                  </span>
                </div>

                {/* table header */}
                <div className="grid grid-cols-3 gap-2 px-4 py-2 text-[9px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-700/30">
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Total</span>
                </div>

                {/* rows */}
                <div className="divide-y divide-slate-700/20">
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
                      <span className="text-right font-mono">{row.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* callout chips */}
            <div className="absolute inset-0 pointer-events-none">
              {/* chip 1 — hidden fee */}
              <AnimateOnScroll delay={600} duration={500}>
                <div className="absolute -right-2 sm:right-0 top-4 bg-red-950/80 border border-red-500/30 rounded-lg p-3 backdrop-blur-sm max-w-[200px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[11px] font-semibold text-red-300">
                      Hidden Fee Detected
                    </span>
                  </div>
                  <p className="text-[10px] text-red-200/70">
                    Labor &amp; Prep is 30% above market.
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-400 mt-1">
                    Potential Save: $3,600
                  </p>
                </div>
              </AnimateOnScroll>

              {/* chip 2 — warranty */}
              <AnimateOnScroll delay={800} duration={500}>
                <div className="absolute -left-2 sm:left-0 bottom-24 bg-amber-950/80 border border-amber-500/30 rounded-lg p-3 backdrop-blur-sm max-w-[200px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-300">
                      Warranty Clause Missing
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-200/70">
                    No material defect guarantee found.
                  </p>
                </div>
              </AnimateOnScroll>

              {/* chip 3 — scope */}
              <AnimateOnScroll delay={1000} duration={500}>
                <div className="absolute -right-2 sm:right-0 bottom-4 bg-sky-950/80 border border-sky-500/30 rounded-lg p-3 backdrop-blur-sm max-w-[200px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[11px] font-semibold text-sky-300">
                      Scope Vague
                    </span>
                  </div>
                  <p className="text-[10px] text-sky-200/70">
                    "Subfloor Repair" lacks specific footage.
                  </p>
                </div>
              </AnimateOnScroll>
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

      <style>{scopedStyles}</style>

      <div className="min-h-screen" style={{ backgroundColor: "#070B14" }}>
        <HeroSection />

        {/* social proof break */}
        <div className="py-6" style={{ backgroundColor: "#0A0F1C" }}>
          <UrgencyTicker variant="cyberpunk" size="md" />
        </div>

        <FeatureSection />
      </div>
    </>
  );
}
