import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

import step1 from "@/assets/step1_upload_your_quote.webp";
import step2 from "@/assets/step2_ai_analyzes_5_pillars.webp";
import step3 from "@/assets/step3_get_your_instant_gradecard.webp";
import step4 from "@/assets/step4_connect_with_contractors.webp";

type Step = {
  title: string;
  desc: string;
  image: string;
};

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

function StepImageUnit({
  step,
  index,
  revealed,
  reducedMotion,
  isMobile,
  mobileActive,
}: {
  step: Step;
  index: number;
  revealed: boolean;
  reducedMotion: boolean;
  isMobile: boolean;
  mobileActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isActive = isMobile ? mobileActive : hovered;

  // Symmetrical assembly: edges fly in, center pops in.
  const entranceClass =
    index === 0 ? "animate-fly-in-left" : index === 3 ? "animate-fly-in-right" : "animate-pop-up";

  return (
    <div
      className={`stepCard relative group ${revealed || reducedMotion ? entranceClass : "opacity-0"}`}
      style={{
        animationDelay: index === 1 || index === 2 ? "220ms" : "0ms",
        animationFillMode: "forwards",
      }}
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
    >
      <div
        className="relative rounded-xl transition-[transform,filter,box-shadow] duration-500 ease-out"
        style={{
          // "Tactile Assembly" hover: lift up, brighten, enlarge shadow underneath.
          transform: isActive ? "translateY(-20px)" : "translateY(0)",
          filter: isActive ? "brightness(1.12) contrast(1.05)" : "brightness(1)",
          boxShadow: isActive
            ? "0 30px 60px rgba(15,23,42,0.28), 0 0 20px rgba(0,217,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.22)"
            : "0 10px 22px rgba(15,23,42,0.14)",
        }}
      >
        <img
          src={step.image}
          alt={step.title}
          width={480}
          height={360}
          className="w-full h-auto rounded-xl block"
          decoding="async"
          loading="lazy"
        />

        {/* Beam stays asleep until active. When active, it orbits and softly color-shifts. */}
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div
            className={`borderBeam absolute inset-0 rounded-xl transition-opacity duration-500 ${
              isActive ? "opacity-100 animate-beam-tint" : "opacity-0"
            }`}
            style={{
              background:
                "conic-gradient(from var(--orbit-angle, 0deg), transparent 0deg, transparent 338deg, rgba(0,217,255,0.88) 346deg, rgba(16,185,129,0.85) 352deg, rgba(59,130,246,0.88) 358deg, transparent 360deg)",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "xor",
              WebkitMaskComposite: "xor",
              padding: "1px",
            }}
          />
        </div>

        <div
          className={`absolute inset-0 p-5 flex flex-col justify-end rounded-xl bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity duration-500 pointer-events-none ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
        >
          <h3 className="text-white font-semibold text-sm leading-tight">{step.title}</h3>
          <p className="text-white/75 text-xs mt-1">{step.desc}</p>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksSteps() {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const mobileCardsRef = useRef<Array<HTMLDivElement | null>>([]);

  const [revealed, setRevealed] = useState(false);
  const [mobileActiveIndex, setMobileActiveIndex] = useState<number>(-1);

  const steps = useMemo<Step[]>(
    () => [
      { title: "1. Upload Your Quote", desc: "PDF, JPG, or PNG. Any format works.", image: step1 },
      { title: "2. AI Analyzes 5 Pillars", desc: "Pricing, safety, scope, and more.", image: step2 },
      { title: "3. Get Your Instant Grade", desc: "A–F letter grade + breakdown.", image: step3 },
      { title: "4. Connect with Pros", desc: "Match with fair-priced pros.", image: step4 },
    ],
    []
  );

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
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!isMobile) {
      setMobileActiveIndex(-1);
      return;
    }

    const updateActiveByViewportCenter = () => {
      const cards = mobileCardsRef.current;
      const vh = window.innerHeight;
      const centerY = vh * 0.5;
      const activeBand = vh * 0.15; // Center 30% of viewport = +/- 15% around midpoint.

      let nextIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;

      cards.forEach((card, index) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - centerY);

        if (distance <= activeBand && distance < nearestDistance) {
          nearestDistance = distance;
          nextIndex = index;
        }
      });

      setMobileActiveIndex(nextIndex);
    };

    window.addEventListener("scroll", updateActiveByViewportCenter, { passive: true });
    window.addEventListener("resize", updateActiveByViewportCenter);
    updateActiveByViewportCenter();

    return () => {
      window.removeEventListener("scroll", updateActiveByViewportCenter);
      window.removeEventListener("resize", updateActiveByViewportCenter);
    };
  }, [isMobile]);

  const setMobileCardRef = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      mobileCardsRef.current[index] = node;
    },
    []
  );

  return (
    <section ref={sectionRef} className="relative py-24" aria-label="How it works - tactile assembly sequence">
      <div className="mx-auto max-w-7xl px-6">
        <div className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-4 gap-10"}`}>
          {steps.map((step, index) => (
            <div key={step.title} ref={isMobile ? setMobileCardRef(index) : undefined}>
              <StepImageUnit
                step={step}
                index={index}
                revealed={revealed}
                reducedMotion={reducedMotion}
                isMobile={isMobile}
                mobileActive={mobileActiveIndex === index}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
