import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
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

type Step = { title: string; desc: string; image: string };

type TiltState = { rotateX: number; rotateY: number; shadowX: number; shadowY: number };

const THRESHOLDS = [0, 0.3, 0.6, 0.85] as const;

/* ── Interactive Image Unit (transparent 3D — no card box) ── */
function StepImageUnit({
  step,
  index,
  register,
  revealed,
  reducedMotion,
}: {
  step: Step;
  index: number;
  register: (node: HTMLDivElement | null) => void;
  revealed: boolean;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateX: (y - 0.5) * -15,
      rotateY: (x - 0.5) * 15,
      shadowX: (x - 0.5) * -30,
      shadowY: (y - 0.5) * -30,
    });
  };

  const resetTilt = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0 });
  }, []);

  // Combine refs for engine and local hover logic
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      register(node);
    },
    [register]
  );

  return (
    <div
      ref={setRefs}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      onFocus={() => setTilt({ rotateX: -4, rotateY: 4, shadowX: -12, shadowY: -12 })}
      onBlur={resetTilt}
      tabIndex={0}
      className={`stepCard relative group outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl ${
        revealed && !reducedMotion ? "animate-scan-reveal" : ""
      }`}
      style={{
        contain: "layout style paint",
        animationDelay: reducedMotion ? "0ms" : `${index * 400}ms`,
        ...(reducedMotion ? { clipPath: "inset(0 0 0 0)", opacity: 1 } : {}),
      }}
    >
      {/* Image with 3D tilt + counter-dynamic shadow — no box wrapper */}
      <div
        className="relative rounded-2xl overflow-hidden w-full aspect-video"
        style={{
          perspective: "1000px",
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          boxShadow: `${tilt.shadowX}px ${tilt.shadowY}px 40px rgba(0, 0, 0, 0.4)`,
          transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
        }}
      >
        <img
          src={step.image}
          alt={step.title}
          width={480}
          height={270}
          className="w-full h-full object-cover"
          decoding="async"
          loading="lazy"
        />

        {/* Orbiting border beam directly on the image */}
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
      </div>

      {/* Text floats below the image on the section background — no box */}
      <div className="mt-4 px-1">
        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
          Step {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-white font-semibold">{step.title}</h3>
        <p className="mt-1 text-slate-300/80 text-sm leading-relaxed">{step.desc}</p>
      </div>

      {/* Scan line reveal */}
      {revealed && !reducedMotion && (
        <div
          className="absolute top-0 bottom-0 w-[2px] z-20 pointer-events-none rounded-full"
          style={{
            background: "#ef4444",
            boxShadow: "0 0 8px #ef4444",
            animation: "scanReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
            animationDelay: `${index * 400}ms`,
            left: "0%",
            opacity: 0,
          }}
        />
      )}
    </div>
  );
}

/* ── Mobile Image Unit with timeline dot ── */
function MobileStepImageUnit({
  step,
  index,
  filled,
}: {
  step: Step;
  index: number;
  filled: boolean;
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

      {/* Image floats directly — no card box */}
      <div className="flex-1 mb-6">
        <img
          src={step.image}
          alt={step.title}
          width={480}
          height={270}
          className="w-full h-auto rounded-2xl"
          decoding="async"
          loading="lazy"
        />
        <h3 className="mt-3 text-white font-semibold text-sm">{step.title}</h3>
        <p className="mt-1 text-slate-300/80 text-xs leading-relaxed">{step.desc}</p>
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
      { title: "Upload Your Quote",       desc: "Take a photo or upload PDF. Any format.", image: step1 },
      { title: "AI Analyzes 5 Pillars",   desc: "Safety, scope, price, fine print, warranty.", image: step2 },
      { title: "Get Your Instant Grade",  desc: "A–F letter grade + detailed breakdown.", image: step3 },
      { title: "Connect with Contractors", desc: "Match with fair-priced pros or negotiate.", image: step4 },
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

  // Engine registry (desktop)
  const registryRef = useRef<HowItWorksRegistry>({
    section: null,
    track: null,
    pulse: null,
    cards: new Array(steps.length).fill(null),
    thresholds: [...THRESHOLDS],
    centers: [],
  });

  const setSection = useCallback((el: HTMLElement | null) => {
    sectionRef.current = el;
    registryRef.current.section = el;
  }, []);
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

  useHowItWorksEngine(registryRef, {
    cycleMs: 3500,
    thresholds: [...THRESHOLDS],
    reducedMotion,
    pulseEasing: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
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
      const p = Math.max(0, Math.min(1, (vh - rect.top) / rect.height));
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
              <MobileStepImageUnit
                key={step.title}
                step={step}
                index={i}
                filled={mobileProgress > (i + 0.5) / steps.length}
              />
            ))}
          </div>
        ) : (
          /* ── Desktop: Grid + Data Pulse Beam ── */
          <div ref={setTrack} className="relative mt-10">
            {/* Data Pulse Beam */}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] z-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.15), transparent)",
              }}
            >
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
                <StepImageUnit
                  key={step.title}
                  step={step}
                  index={i}
                  register={registerCard(i)}
                  revealed={revealed}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
