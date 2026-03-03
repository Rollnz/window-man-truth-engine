import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { HowItWorksRegistry, useHowItWorksEngine, CardHandle } from "./useHowItWorksEngine";
import { useIsMobile } from "@/hooks/use-mobile";

import step1 from "@/assets/step1_upload_your_quote.webp";
import step2 from "@/assets/step2_ai_analyzes_5_pillars.webp";
import step3 from "@/assets/step3_get_your_instant_gradecard.webp";
import step4 from "@/assets/step4_connect_with_contractors.webp";

/* ── Reduced motion helper ── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

type Step = {
  title: string;
  desc: string;
  image: string;
};

const GRADES = ["F", "D", "C", "B", "A"] as const;

/* ── Grade Roulette Badge (Step 3 overlay) ── */
function GradeRoulette({ active }: { active: boolean }) {
  const [gradeIdx, setGradeIdx] = useState(0);
  const [settled, setSettled] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setGradeIdx(0);
      setSettled(false);
      return;
    }
    let i = 0;
    const tick = () => {
      i++;
      if (i >= GRADES.length) {
        setGradeIdx(GRADES.length - 1);
        setSettled(true);
        return;
      }
      setGradeIdx(i);
      timerRef.current = window.setTimeout(tick, 120);
    };
    timerRef.current = window.setTimeout(tick, 120);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active]);

  const grade = GRADES[gradeIdx];
  const color = settled
    ? "#10b981"
    : grade === "A" || grade === "B"
    ? "#10b981"
    : grade === "C"
    ? "#f59e0b"
    : "#ef4444";

  return (
    <div
      className="absolute top-4 right-4 z-20 flex items-center justify-center w-12 h-12 rounded-xl font-bold text-2xl transition-all duration-150"
      style={{
        color,
        backgroundColor: settled ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.4)",
        boxShadow: settled ? `0 0 20px ${color}40` : "none",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {grade}
    </div>
  );
}

/* ── Leverage Counter (Step 4 overlay) ── */
function LeverageCounter({ active }: { active: boolean }) {
  const [slashed, setSlashed] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlashed(false);
      return;
    }
    const t = setTimeout(() => setSlashed(true), 600);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <div className="absolute bottom-4 right-4 z-20 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <div className="relative inline-block">
        <span
          className="text-lg transition-opacity duration-300"
          style={{ color: slashed ? "rgba(255,255,255,0.4)" : "#fff", textDecoration: slashed ? "line-through" : "none" }}
        >
          $14,200
        </span>
        {slashed && (
          <div
            className="absolute left-0 top-1/2 w-full h-[2px] origin-left"
            style={{
              background: "#00D9FF",
              animation: "laserSlash 0.4s ease-out forwards",
              transform: "scaleX(0)",
            }}
          />
        )}
      </div>
      {slashed && (
        <div className="mt-1 animate-fade-up" style={{ animationDuration: "0.4s" }}>
          <span className="text-lg font-bold" style={{ color: "#10b981" }}>$11,800</span>
          <span className="block text-xs" style={{ color: "#00D9FF" }}>Save $2,400</span>
        </div>
      )}
    </div>
  );
}

/* ── Desktop Card ── */
function StepCard({
  step,
  index,
  register,
  revealed,
  reducedMotion,
  children,
}: {
  step: Step;
  index: number;
  register: (node: HTMLDivElement | null) => void;
  revealed: boolean;
  reducedMotion: boolean;
  children?: React.ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Micro-parallax (desktop only, effect 5)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !imgRef.current || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = ((e.clientX - cx) / (rect.width / 2)) * 6;
      const ny = ((e.clientY - cy) / (rect.height / 2)) * 4;
      imgRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
      imgRef.current.style.filter = `drop-shadow(${-nx * 0.5}px ${-ny * 0.5}px 8px rgba(0,0,0,0.5))`;
    },
    [reducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    if (!imgRef.current) return;
    imgRef.current.style.transform = "translate(0,0)";
    imgRef.current.style.filter = "none";
  }, []);

  const combineRef = useCallback(
    (node: HTMLDivElement | null) => {
      (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      register(node);
    },
    [register]
  );

  return (
    <div
      ref={combineRef}
      className={`stepCard relative p-1 rounded-2xl ${
        revealed && !reducedMotion ? "animate-scan-reveal" : ""
      }`}
      style={{
        contain: "layout style paint",
        animationDelay: reducedMotion ? "0ms" : `${index * 400}ms`,
        ...(reducedMotion ? { clipPath: "inset(0 0 0 0)", opacity: 1 } : {}),
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(0,217,255,0.04), 8px 8px 20px rgba(0,0,0,0.5)",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Layer 0: glass */}
      <div className="absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5" />

      {/* Layer 1: content */}
      <div className="relative z-10 rounded-2xl p-6">
        <img
          ref={imgRef}
          src={step.image}
          alt={step.title}
          width={480}
          height={360}
          className="w-full h-auto rounded-xl"
          style={{ transition: "transform 0.15s ease-out, filter 0.15s ease-out" }}
          decoding="async"
        />
        <h3 id={`step-title-${index}`} className="mt-4 text-white font-semibold">
          {step.title}
        </h3>
        <p className="mt-1 text-slate-300/80 text-sm leading-relaxed">{step.desc}</p>
        {children}
      </div>

      {/* Layer 2: border beam */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
        <div
          className="borderBeam absolute inset-0 rounded-2xl opacity-30 animate-border-orbit"
          style={{
            animationDelay: `${index * 0.9}s`,
            background: `conic-gradient(from var(--orbit-angle, 0deg), transparent 0deg, transparent 340deg, rgba(0,217,255,0.6) 350deg, transparent 360deg)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMaskComposite: "xor",
            padding: "2px",
          }}
        />
      </div>

      {/* Scan line pseudo-element via ::after would be CSS; we approximate with a div */}
      {revealed && !reducedMotion && (
        <div
          className="absolute top-0 bottom-0 w-[2px] z-20 pointer-events-none rounded-full"
          style={{
            background: "#ef4444",
            boxShadow: "0 0 8px #ef4444",
            animation: `scanReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards`,
            animationDelay: `${index * 400}ms`,
            left: "0%",
            opacity: 0,
          }}
        />
      )}
    </div>
  );
}

/* ── Mobile Card with timeline dot ── */
function MobileStepCard({
  step,
  index,
  filled,
  children,
}: {
  step: Step;
  index: number;
  filled: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
        <div
          className="w-3 h-3 rounded-full border-2 transition-all duration-500 mt-2"
          style={{
            borderColor: filled ? "#00D9FF" : "rgba(100,116,139,0.4)",
            backgroundColor: filled ? "#00D9FF" : "transparent",
            boxShadow: filled ? "0 0 10px rgba(0,217,255,0.4)" : "none",
          }}
        />
        {index < 3 && <div className="flex-1 w-[2px] bg-slate-700/40" />}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-2xl p-4 mb-6"
        style={{
          contain: "layout style paint",
          backgroundColor: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(4px)",
        }}
      >
        <img
          src={step.image}
          alt={step.title}
          width={480}
          height={360}
          className="w-full h-auto rounded-xl"
          decoding="async"
          loading="lazy"
        />
        <h3 className="mt-3 text-white font-semibold text-sm">{step.title}</h3>
        <p className="mt-1 text-slate-300/80 text-xs leading-relaxed">{step.desc}</p>
        {children}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function HowItWorksSteps() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const steps: Step[] = useMemo(
    () => [
      { title: "1. Upload Your Quote", desc: "Take a photo or upload PDF. Any format.", image: step1 },
      { title: "2. AI Analyzes 5 Pillars", desc: "Safety, scope, price, fine print, warranty.", image: step2 },
      { title: "3. Get Your Instant Grade", desc: "A–F letter grade + detailed breakdown.", image: step3 },
      { title: "4. Connect with Contractors", desc: "Match with fair-priced pros or negotiate.", image: step4 },
    ],
    []
  );

  // Section visibility for scan entrance
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  // Director's cut state
  const [gradeRouletteActive, setGradeRouletteActive] = useState(false);
  const [leverageActive, setLeverageActive] = useState(false);

  // Engine registry (desktop)
  const registryRef = useRef<HowItWorksRegistry>({
    section: null,
    track: null,
    pulse: null,
    cards: new Array(steps.length).fill(null),
    thresholds: [0, 0.3, 0.6, 0.85],
    centers: [],
  });

  const setSection = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      registryRef.current.section = el;
    },
    []
  );
  const setTrack = useCallback((el: HTMLElement | null) => {
    registryRef.current.track = el;
  }, []);
  const setPulse = useCallback((el: HTMLElement | null) => {
    registryRef.current.pulse = el;
  }, []);

  const registerCard = useCallback(
    (idx: number) => (node: HTMLDivElement | null) => {
      if (!node) {
        registryRef.current.cards[idx] = null;
        return;
      }
      const handle: CardHandle = {
        root: node,
        borderBeam: node.querySelector(".borderBeam") as HTMLDivElement | null,
      };
      registryRef.current.cards[idx] = handle;
    },
    []
  );

  // Engine (drives pulse + burst classes)
  useHowItWorksEngine(registryRef, {
    cycleMs: 3500,
    thresholds: [0, 0.3, 0.6, 0.85],
    reducedMotion,
    pulseEasing: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
    onBurst: (cardIndex) => {
      if (cardIndex === 2) {
        setGradeRouletteActive(false);
        // Reset then re-trigger
        requestAnimationFrame(() => setGradeRouletteActive(true));
      }
      if (cardIndex === 3) {
        setLeverageActive(false);
        requestAnimationFrame(() => setLeverageActive(true));
      }
    },
  });

  // Mobile scroll progress
  const [mobileProgress, setMobileProgress] = useState(0);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile) return;
    const el = mobileTrackRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      const scrolled = vh - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      setMobileProgress(p);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [isMobile]);

  // Pre-warm images
  useEffect(() => {
    steps.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, [steps]);

  return (
    <section
      ref={setSection}
      className="relative overflow-hidden py-20"
      style={{ backgroundColor: "#070A0F" }}
      aria-label="How it works - four step process"
    >
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-white text-3xl font-semibold">How it works</h2>
        <p className="mt-2 text-slate-300/80 max-w-2xl">
          Upload → analyze → grade → connect. Four steps to window quote clarity.
        </p>

        {isMobile ? (
          /* ── Mobile: Vertical Timeline ── */
          <div ref={mobileTrackRef} className="relative mt-10">
            {/* Timeline fill line */}
            <div
              className="absolute left-[11px] top-0 bottom-0 w-[2px]"
              style={{ backgroundColor: "rgba(100,116,139,0.2)" }}
            >
              <div
                className="absolute inset-x-0 top-0 origin-top transition-transform duration-100"
                style={{
                  backgroundColor: "#00D9FF",
                  height: "100%",
                  transform: `scaleY(${mobileProgress})`,
                  boxShadow: "0 0 8px rgba(0,217,255,0.4)",
                }}
              />
            </div>

            {steps.map((step, i) => (
              <MobileStepCard
                key={step.title}
                step={step}
                index={i}
                filled={mobileProgress > (i + 0.5) / steps.length}
              >
                {i === 2 && <GradeRoulette active={mobileProgress > 0.6} />}
                {i === 3 && <LeverageCounter active={mobileProgress > 0.85} />}
              </MobileStepCard>
            ))}
          </div>
        ) : (
          /* ── Desktop: Grid + Data Pulse Beam ── */
          <div ref={setTrack} className="relative mt-10">
            {/* Data Pulse Beam (Effect 1) */}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] z-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.15), transparent)",
              }}
            >
              {/* Traveling packet */}
              <div
                className="absolute top-1/2 -translate-y-1/2 animate-data-pulse"
                style={{
                  width: 40,
                  height: 12,
                  background: "radial-gradient(ellipse at center, rgba(0,217,255,0.8), transparent 70%)",
                  mixBlendMode: "screen",
                  filter: "blur(1px)",
                }}
              />
            </div>

            {/* Pulse tracker (engine drives this) */}
            <div
              ref={setPulse}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-16 rounded-full opacity-80 blur-[1px] z-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,217,255,0.6), transparent 70%)",
              }}
            />

            <div className="grid grid-cols-4 gap-6 relative z-10">
              {steps.map((step, i) => (
                <StepCard
                  key={step.title}
                  step={step}
                  index={i}
                  register={registerCard(i)}
                  revealed={revealed}
                  reducedMotion={reducedMotion}
                >
                  {i === 2 && <GradeRoulette active={gradeRouletteActive} />}
                  {i === 3 && <LeverageCounter active={leverageActive} />}
                </StepCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
