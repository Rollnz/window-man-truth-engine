import React from "react";

/* ----------------------------- Types ---------------------------------- */

interface Step {
  id: number;
  title: string;
  desc: string;
  Icon: React.FC<{ className?: string }>;
}

/* ----------------------------- Inline SVGs ---------------------------- */

/* Step 1: Document Scanner / Upload */
const UploadIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
  >
    <defs>
      <linearGradient id="u-grad" x1="0" x2="1">
        <stop offset="0" stopColor="#00D9FF" stopOpacity="1" />
        <stop offset="1" stopColor="#00A8E6" stopOpacity="1" />
      </linearGradient>
      <filter id="u-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="8" y="8" width="48" height="48" rx="6" fill="rgba(255,255,255,0.03)" stroke="url(#u-grad)" strokeWidth="1.6" />
    <path d="M44 8v12a2 2 0 0 0 2 2h12" transform="translate(-12 0)" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />
    <g filter="url(#u-glow)">
      <rect x="16" y="22" width="32" height="2" rx="1" fill="#0B1A1F" />
      <rect x="16" y="28" width="24" height="2" rx="1" fill="#0B1A1F" />
      <rect x="16" y="34" width="20" height="2" rx="1" fill="#0B1A1F" />
      <rect x="16" y="40" width="28" height="2" rx="1" fill="#0B1A1F" />
    </g>
    <g transform="translate(0,0)">
      <path d="M32 18v16" stroke="url(#u-grad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 24l6-6 6 6" stroke="url(#u-grad)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
    <rect x="10" y="10" width="44" height="44" rx="6" fill="url(#u-grad)" opacity="0.03" />
  </svg>
);

/* Step 2: Brain with tech nodes + magnifying glass */
const BrainIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
  >
    <defs>
      <linearGradient id="b-grad" x1="0" x2="1">
        <stop offset="0" stopColor="#00D9FF" />
        <stop offset="1" stopColor="#00A8E6" />
      </linearGradient>
      <filter id="b-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path d="M20 36c-2-6 2-12 8-14 4-1 6-1 10 0 6 2 10 8 8 14-1 4-4 6-8 6H28c-4 0-7-2-8-6z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <g filter="url(#b-glow)">
      <circle cx="24" cy="30" r="2.6" fill="#0B1A1F" stroke="url(#b-grad)" strokeWidth="1.6" />
      <path d="M24 30 L18 24" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="18" cy="24" r="1.6" fill="#00D9FF" />
      <circle cx="28" cy="26" r="1.6" fill="#00D9FF" />
      <path d="M28 26 L32 22" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeLinecap="round" />
    </g>
    <g filter="url(#b-glow)">
      <circle cx="40" cy="30" r="2.6" fill="#0B1A1F" stroke="url(#b-grad)" strokeWidth="1.6" />
      <path d="M40 30 L46 24" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="46" cy="24" r="1.6" fill="#00D9FF" />
      <circle cx="36" cy="26" r="1.6" fill="#00D9FF" />
    </g>
    <path d="M26 22c2-2 6-2 8 0" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M22 34c3-3 9-3 14 0" stroke="rgba(255,255,255,0.04)" strokeWidth="1.2" strokeLinecap="round" />
    <g transform="translate(36,34)">
      <circle cx="6" cy="6" r="6" fill="rgba(255,255,255,0.02)" stroke="url(#b-grad)" strokeWidth="1.6" />
      <path d="M10 10 L14 14" stroke="url(#b-grad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="6" cy="6" r="2.2" fill="#00D9FF" opacity="0.95" />
    </g>
  </svg>
);

/* Step 3: Shield with 'A' grade */
const ShieldIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
  >
    <defs>
      <linearGradient id="s-grad" x1="0" x2="1">
        <stop offset="0" stopColor="#00D9FF" />
        <stop offset="1" stopColor="#00A8E6" />
      </linearGradient>
      <filter id="s-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path d="M32 10c8 0 14 6 14 14v8c0 10-8 18-14 22-6-4-14-12-14-22v-8c0-8 6-14 14-14z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
    <path d="M32 14c6 0 10 4 10 10v6c0 8-6 14-10 18-4-4-10-10-10-18v-6c0-6 4-10 10-10z" fill="url(#s-grad)" opacity="0.06" />
    <g transform="translate(22,22)">
      <path d="M6 18 L10 6 L14 18" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8.5 12h5" stroke="#00D9FF" strokeWidth="1.6" strokeLinecap="round" />
    </g>
    <path d="M32 10c8 0 14 6 14 14v8c0 10-8 18-14 22-6-4-14-12-14-22v-8c0-8 6-14 14-14z" stroke="url(#s-grad)" strokeWidth="1.6" fill="none" style={{ filter: "drop-shadow(0 8px 20px rgba(0,217,255,0.08))" }} />
  </svg>
);

/* Step 4: Handshake graphic */
const HandshakeIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
  >
    <defs>
      <linearGradient id="h-grad" x1="0" x2="1">
        <stop offset="0" stopColor="#00D9FF" />
        <stop offset="1" stopColor="#00A8E6" />
      </linearGradient>
      <filter id="h-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#h-glow)">
      <path d="M18 36c2-4 6-6 10-6h4" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M18 36c2-4 6-6 10-6h4" stroke="url(#h-grad)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
    </g>
    <g filter="url(#h-glow)">
      <path d="M46 36c-2-4-6-6-10-6h-4" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M46 36c-2-4-6-6-10-6h-4" stroke="url(#h-grad)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
    </g>
    <path d="M26 36c2 2 6 2 10 0" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />
    <rect x="14" y="38" width="12" height="6" rx="1.2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
    <rect x="38" y="38" width="12" height="6" rx="1.2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" />
    <circle cx="32" cy="30" r="1.6" fill="#00D9FF" />
  </svg>
);

/* ----------------------------- Steps Data ------------------------------ */

const STEPS: Step[] = [
  { id: 1, title: "Upload Your Quote", desc: "Take a photo or upload PDF. Any format.", Icon: UploadIcon },
  { id: 2, title: "AI Analyzes 5 Pillars", desc: "Safety, scope, price, fine print, warranty.", Icon: BrainIcon },
  { id: 3, title: "Get Your Instant Grade", desc: "A-F letter grade + detailed breakdown.", Icon: ShieldIcon },
  { id: 4, title: "Connect with Contractors", desc: "Match with fair-priced pros or negotiate.", Icon: HandshakeIcon },
];

/* ----------------------------- StepCard -------------------------------- */

const StepCard: React.FC<{ step: Step }> = ({ step }) => {
  const { Icon, title, desc } = step;
  return (
    <article
      role="group"
      aria-labelledby={`step-${step.id}-title`}
      className="relative rounded-[20px] p-7 bg-white/5 backdrop-blur-xl border border-cyan-400/30
                 hover:-translate-y-2 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
    >
      <div className="w-14 h-14 mb-4 flex items-center justify-center">
        <Icon className="w-14 h-14" />
      </div>
      <h3 id={`step-${step.id}-title`} className="text-white text-[18px] font-semibold leading-tight mb-2">
        {title}
      </h3>
      <p className="text-[13px] text-[#A6B0BD] leading-[1.4] m-0">{desc}</p>
    </article>
  );
};

/* ------------------------- Continuous Beam SVG ------------------------- */

const ContinuousBeam: React.FC = () => {
  return (
    <svg
      className="hidden md:block absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none"
      width="100%"
      height="160"
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="beam-grad" x1="0" x2="1">
          <stop offset="0" stopColor="#00D9FF" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#00D9FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#00A8E6" stopOpacity="0.4" />
        </linearGradient>
        <filter id="beam-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="68" width="1200" height="24" rx="12" fill="url(#beam-grad)" opacity="0.18" filter="url(#beam-blur)" />
      <rect x="0" y="74" width="1200" height="12" rx="6" fill="url(#beam-grad)" opacity="0.95" />
      <g opacity="0.12">
        <rect x="0" y="74" width="1200" height="2" fill="#00D9FF" />
        <rect x="0" y="84" width="1200" height="2" fill="#00D9FF" />
      </g>
    </svg>
  );
};

/* --------------------------- ProcessSteps ------------------------------ */

const ProcessSteps: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <section className={`w-full max-w-[1200px] mx-auto px-6 py-16 ${className}`} aria-label="Four step process">
      <div className="relative">
        <ContinuousBeam />
        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-7 md:items-center">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="col-span-1">
                <div className="shadow-[0_0_20px_rgba(0,217,255,0.2)]">
                  <StepCard step={s} />
                </div>
              </div>
              {idx < STEPS.length - 1 && <div className="hidden md:block col-span-1" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;