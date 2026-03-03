import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { HowItWorksRegistry, useHowItWorksEngine, CardHandle } from "./useHowItWorksEngine";
import { useIsMobile } from "@/hooks/use-mobile";

import step1 from "@/assets/step1_upload_your_quote.webp";
import step2 from "@/assets/step2_ai_analyzes_5_pillars.webp";
import step3 from "@/assets/step3_get_your_instant_gradecard.webp";
import step4 from "@/assets/step4_connect_with_contractors.webp";

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

/* ── Interactive Image Unit (no extra card container) ── */
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
  const rootRef = useRef<HTMLDivElement>(null);
  const imageUnitRef = useRef<HTMLDivElement>(null);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      (rootRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      register(node);
    },
    [register]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !rootRef.current || !imageUnitRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();

      // Normalized pointer coordinates across the image unit.
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (y - 0.5) * -15;
      const rotateY = (x - 0.5) * 15;
      // Shadow moves opposite the pointer to feel physically "lifted".
      const shadowX = (x - 0.5) * -30;
      const shadowY = (y - 0.5) * -30;

      imageUnitRef.current.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      imageUnitRef.current.style.filter = `drop-shadow(${shadowX.toFixed(2)}px ${shadowY.toFixed(2)}px 25px rgba(0,0,0,0.15))`;
    },
    [reducedMotion]
  );

  const resetTransform = useCallback(() => {
    if (!imageUnitRef.current) return;
    imageUnitRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    imageUnitRef.current.style.filter = "drop-shadow(0 0 0 rgba(0,0,0,0))";
  }, []);

  return (
    <div
      ref={setRefs}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTransform}
      className={`stepCard relative group ${revealed || reducedMotion ? "animate-scan-reveal" : "opacity-0"}`}
      style={{
        perspective: "1000px",
        contain: "layout style paint",
        animationDelay: `${index * 300}ms`,
        animationFillMode: "forwards",
      }}
    >
      <div
        ref={imageUnitRef}
        className="relative transition-[transform,filter] duration-200 ease-out"
        style={{
          transform: "rotateX(0deg) rotateY(0deg)",
          filter: "drop-shadow(0 0 0 rgba(0,0,0,0))",
        }}
      >
        <img
          src={step.image}
          alt={step.title}
          width={480}
          height={360}
          className="w-full h-auto rounded-xl block border border-transparent group-hover:border-cyan-400/30 transition-colors"
          decoding="async"
          loading="lazy"
        />

        {/* Engine/hover beam tracks the image edge directly (no outer card shell). */}
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div
            className="borderBeam absolute inset-0 rounded-xl opacity-0 animate-border-orbit transition-opacity duration-300"
            style={{
              animationDelay: `${index * 0.9}s`,
              background:
                "conic-gradient(from var(--orbit-angle, 0deg), transparent 0deg, transparent 338deg, rgba(0,217,255,0.72) 350deg, transparent 360deg)",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "xor",
              WebkitMaskComposite: "xor",
              padding: "2px",
            }}
          />
        </div>

        {/* Optional hover-only info: no always-on duplicate text below the image. */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none">
          <h3 className="text-white font-semibold text-sm">{step.title}</h3>
          <p className="text-white/80 text-xs leading-relaxed">{step.desc}</p>
        </div>
      </div>
    </div>
  );
}

function MobileImageUnit({ step }: { step: Step }) {
  return (
    <div className="group relative">
      <img
        src={step.image}
        alt={step.title}
        width={480}
        height={360}
        className="w-full h-auto rounded-xl block border border-transparent group-active:border-cyan-400/30"
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}

export default function HowItWorksSteps() {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  const steps = useMemo<Step[]>(
    () => [
      { title: "1. Upload Your Quote", desc: "PDF, JPG, or PNG. Any format works.", image: step1 },
      { title: "2. AI Analyzes 5 Pillars", desc: "Pricing, safety, scope, and more.", image: step2 },
      { title: "3. Get Your Instant Grade", desc: "A–F letter grade + breakdown.", image: step3 },
      { title: "4. Connect with Pros", desc: "Match with fair-priced pros.", image: step4 },
    ],
    []
  );

  const registryRef = useRef<HowItWorksRegistry>({
    section: null,
    track: null,
    pulse: null,
    cards: new Array(steps.length).fill(null),
    thresholds: [0, 0.3, 0.6, 0.85],
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
    thresholds: [0, 0.3, 0.6, 0.85],
    reducedMotion,
    pulseEasing: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),
  });

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section ref={setSection} className="relative py-24" aria-label="How it works - floating step images">
      <div className="mx-auto max-w-7xl px-6">
        {isMobile ? (
          <div className="grid grid-cols-1 gap-6">
            {steps.map((step) => (
              <MobileImageUnit key={step.title} step={step} />
            ))}
          </div>
        ) : (
          <div ref={setTrack} className="relative grid grid-cols-4 gap-8">
            {/* Subtle, container-less lane linking image units. */}
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,217,255,0.08), transparent)" }}
            />

            <div
              ref={setPulse}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-16 rounded-full opacity-80 blur-[1px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,217,255,0.6), transparent 70%)" }}
            />

            {steps.map((step, index) => (
              <StepImageUnit
                key={step.title}
                step={step}
                index={index}
                revealed={revealed}
                reducedMotion={reducedMotion}
                register={registerCard(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
