import React, { useRef, useState } from "react";

import step1 from "@/assets/step1_upload_your_quote.webp";
import step2 from "@/assets/step2_ai_analyzes_5_pillars.webp";
import step3 from "@/assets/step3_get_your_instant_gradecard.webp";
import step4 from "@/assets/step4_connect_with_contractors.webp";

const STEPS = [
  { title: "Upload Your Quote",       desc: "PDF, JPG, or PNG. Any format works.", img: step1 },
  { title: "AI Analyzes 5 Pillars",   desc: "Pricing, safety, scope, and more.",   img: step2 },
  { title: "Get Your Instant Grade",  desc: "A-F grade + detailed breakdown.",      img: step3 },
  { title: "Connect with Pros",       desc: "Negotiate with data or find pros.",    img: step4 },
];

type TiltState = { rotateX: number; rotateY: number; shadowX: number; shadowY: number };

const StepCard = ({ step, index }: { step: (typeof STEPS)[0]; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -15;
    const rotateY = (x - 0.5) * 15;
    const shadowX = (x - 0.5) * -25;
    const shadowY = (y - 0.5) * -25;
    setTilt({ rotateX, rotateY, shadowX, shadowY });
  };

  const resetTilt = () => setTilt({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0 });

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      onFocus={() => setTilt({ rotateX: -4, rotateY: 4, shadowX: -10, shadowY: -10 })}
      onBlur={resetTilt}
      tabIndex={0}
      className="relative group p-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
      style={{ perspective: "1000px" }}
    >
      {/* 3D content layer */}
      <div
        className="light-glass-card relative z-10 p-6 rounded-2xl flex flex-col items-center text-center"
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          boxShadow: `${tilt.shadowX}px ${tilt.shadowY}px 40px rgba(0, 0, 0, 0.1)`,
        }}
      >
        <div className="w-full aspect-video mb-6 rounded-xl overflow-hidden bg-slate-100">
          <img
            src={step.img}
            alt={step.title}
            width={480}
            height={270}
            className="w-full h-full object-cover"
            decoding="async"
            loading="lazy"
          />
        </div>
        <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2">
          Step {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-slate-900 font-bold text-lg mb-2">{step.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
      </div>

      {/* Border beam on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-cyan-400/50 transition-colors pointer-events-none" />
    </div>
  );
};

export default function HowItWorksSteps() {
  return (
    <section className="relative bg-white py-32 overflow-hidden" aria-label="How it works - four step process">
      {/* Top blend from dark hero into white */}
      <div className="section-top-blend" />

      <div className="max-w-7xl mx-auto px-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
