import React, { useEffect, useMemo, useRef } from "react";
import { HowItWorksRegistry, useHowItWorksEngine, CardHandle } from "./useHowItWorksEngine";

// Example assets (swap for your real imports)
import step1 from "@/assets/steps/step1_1.webp";
import step2 from "@/assets/steps/step2_1.webp";
import step3 from "@/assets/steps/step3_1.webp";
import step4 from "@/assets/steps/step4.webp";

// Optional: reduced motion helper
function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => (ref.current = !!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return ref.current;
}

type Step = {
  title: string;
  desc: string;
  image: string;
};

function StepCard({
  step,
  register,
}: {
  step: Step;
  register: (node: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={register}
      className="stepCard relative p-1 rounded-2xl"
      style={{ contain: "layout style paint" }}
    >
      {/* Layer 0: static blur glass (no transforms here) */}
      <div className="absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/5" />

      {/* Layer 1: content (tilt/parallax can be added here without touching blur layer) */}
      <div className="relative z-10 rounded-2xl p-6">
        <img
          src={step.image}
          alt={step.title}
          width={480}
          height={360}
          className="w-full h-auto rounded-xl"
          // Consider removing lazy for these 4 if scan reveal depends on perfect timing:
          // loading="eager"
          decoding="async"
        />
        <h3 className="mt-4 text-white font-semibold">{step.title}</h3>
        <p className="mt-1 text-slate-300/80 text-sm leading-relaxed">{step.desc}</p>
      </div>

      {/* Layer 2: effects layer (no pointer events) */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
        {/* The burst animation target. Keep class name stable: `.borderBeam` */}
        <div className="borderBeam absolute inset-0 rounded-2xl" />
      </div>
    </div>
  );
}

export default function HowItWorksSteps() {
  const reducedMotion = useReducedMotion();

  const steps: Step[] = useMemo(
    () => [
      { title: "1. Upload Your Quote", desc: "Take a photo or upload PDF. Any format.", image: step1 },
      { title: "2. AI Analyzes 5 Pillars", desc: "Safety, scope, price, fine print, warranty.", image: step2 },
      { title: "3. Get Your Instant Grade", desc: "A–F letter grade + detailed breakdown.", image: step3 },
      { title: "4. Connect with Contractors", desc: "Match with fair-priced pros or negotiate.", image: step4 },
    ],
    []
  );

  // Registry holds live nodes + derived measurements. Mutated intentionally (no state).
  const registryRef = useRef<HowItWorksRegistry>({
    section: null,
    track: null,
    pulse: null,
    cards: new Array(steps.length).fill(null),
    thresholds: [0, 0.3, 0.6, 0.85],
    centers: [],
  });

  // Callback refs: populate registry imperatively.
  const setSection = (el: HTMLElement | null) => {
    registryRef.current.section = el;
  };
  const setTrack = (el: HTMLElement | null) => {
    registryRef.current.track = el;
  };
  const setPulse = (el: HTMLElement | null) => {
    registryRef.current.pulse = el;
  };

  // Card registrar factory: stable by index
  const registerCard = (idx: number) => (node: HTMLDivElement | null) => {
    if (!node) {
      registryRef.current.cards[idx] = null;
      return;
    }
    const handle: CardHandle = {
      root: node,
      borderBeam: node.querySelector(".borderBeam") as HTMLDivElement | null,
    };
    registryRef.current.cards[idx] = handle;
  };

  // Hook: high-frequency engine
  useHowItWorksEngine(registryRef, {
    cycleMs: 3500,
    thresholds: [0, 0.3, 0.6, 0.85],
    reducedMotion,

    // Optional: “network pulse” feel (fast between, slow near cards)
    // Keep subtle; aggressive easing can look gimmicky.
    pulseEasing: (p) => 0.5 - 0.5 * Math.cos(Math.PI * p),

    onStep3: () => {
      // Imperative side-effect placeholder:
      // e.g. trigger DOM roulette via a ref-driven function
      // Avoid setState spam; if you use React state here, it's rare, not per frame.
    },
    onStep4: () => {
      // Imperative leverage slash placeholder.
    },
  });

  // Optional: pre-warm step images to avoid reveal flicker
  useEffect(() => {
    const urls = steps.map((s) => s.image);
    const imgs = urls.map((src) => {
      const im = new Image();
      im.src = src;
      return im;
    });
    return () => {
      // Allow GC (no explicit cleanup needed)
      void imgs;
    };
  }, [steps]);

  return (
    <section ref={setSection} className="relative overflow-hidden bg-[#070A0F] py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-white text-3xl font-semibold">How it works</h2>
        <p className="mt-2 text-slate-300/80 max-w-2xl">
          Upload → analyze → grade → connect. The pulse shows the engine moving through each step.
        </p>

        {/* Track: a dedicated “lane” for pulse + alignment measurements */}
        <div ref={setTrack} className="relative mt-10">
          {/* Pulse: engine controls transform translateX(%) */}
          <div
            ref={setPulse}
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-16 rounded-full opacity-80 blur-[1px]"
          />

          {/* Desktop grid (example). You can swap to your exact grid-cols-[...] layout. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {steps.map((step, i) => (
              <StepCard key={step.title} step={step} register={registerCard(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}