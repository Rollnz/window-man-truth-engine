import { useState, useEffect, useRef } from 'react';
import { FileSearch, Brain, ShieldAlert, type LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Types ────────────────────────────────────────────────────────────────────
interface StepMetric {
  target: number;
  label: string;
}

interface PipelineStep {
  label: string;
  desc: string;
  metric: StepMetric;
  icon: LucideIcon;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CYAN = 'hsl(var(--primary))';
const CYAN_DIM = 'hsl(var(--primary) / 0.15)';
const CYAN_MID = 'hsl(var(--primary) / 0.4)';
const CYAN_GLOW = 'hsl(var(--primary) / 0.6)';
const RED_FLAG = '#ff3d5a';
const BG_DARK = 'hsl(var(--background))';
const BG_CARD = 'hsl(var(--card) / 0.85)';
const BORDER = 'hsl(var(--primary) / 0.12)';

const STEPS: PipelineStep[] = [
  {
    label: 'OCR Extraction',
    desc: 'We read every line of your quote',
    metric: { target: 847, label: 'line items scanned' },
    icon: FileSearch,
  },
  {
    label: 'AI Analysis',
    desc: 'Cross-checked against 50+ pricing signals',
    metric: { target: 53, label: 'pricing signals checked' },
    icon: Brain,
  },
  {
    label: 'Red Flag Report',
    desc: 'Risks + savings identified',
    metric: { target: 3, label: 'red flags found' },
    icon: ShieldAlert,
  },
];

// ─── Scoped Keyframes ─────────────────────────────────────────────────────────
const SCOPED_STYLES = `
@keyframes sp-particleX {
  0% { left: 0; opacity: 0; }
  8% { opacity: 0.9; }
  85% { opacity: 0.9; }
  100% { left: calc(100% - 5px); opacity: 0; }
}
@keyframes sp-particleY {
  0% { top: 0; opacity: 0; }
  8% { opacity: 0.9; }
  85% { opacity: 0.9; }
  100% { top: calc(100% - 5px); opacity: 0; }
}
@keyframes sp-sonarPing {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes sp-iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.5px); }
}
@keyframes sp-sheenSweep {
  0% { background-position: -100% 0; }
  50% { background-position: 200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes sp-scanLine {
  0% { transform: translateX(-110%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(110%); opacity: 0; }
}
@keyframes sp-gridPulse {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.06; }
}
@keyframes sp-borderGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
@keyframes sp-vpFadeOut {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-8px); }
}
@keyframes sp-vpFadeIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .sp-pipeline-root * {
    animation: none !important;
    transition: none !important;
  }
}
`;

// ─── Animated Counter Hook ────────────────────────────────────────────────────
function useAnimatedCounter(target: number, active: boolean, duration = 1200): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target, duration]);

  return value;
}

// ─── Particle Stream ──────────────────────────────────────────────────────────
function ParticleStream({ active, orientation = 'horizontal', variant = 1 }: {
  active: boolean;
  orientation?: 'horizontal' | 'vertical';
  variant?: number;
}) {
  const count = 6;
  const particles = Array.from({ length: count }, (_, i) => i);
  const isH = orientation === 'horizontal';

  return (
    <div
      style={{
        position: 'relative',
        width: isH ? '100%' : 2,
        height: isH ? 2 : '100%',
        minWidth: isH ? 40 : undefined,
        minHeight: isH ? undefined : 40,
        overflow: 'visible',
      }}
    >
      {/* Dashed baseline */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isH
            ? `repeating-linear-gradient(90deg, ${CYAN_DIM} 0, ${CYAN_DIM} 6px, transparent 6px, transparent 12px)`
            : `repeating-linear-gradient(180deg, ${CYAN_DIM} 0, ${CYAN_DIM} 6px, transparent 6px, transparent 12px)`,
          opacity: 0.5,
        }}
      />

      {/* Glowing beam */}
      <div
        style={{
          position: 'absolute',
          inset: isH ? '-1px 0' : '0 -1px',
          background: isH
            ? `linear-gradient(90deg, transparent 0%, ${CYAN_MID} 40%, ${CYAN_GLOW} 50%, ${CYAN_MID} 60%, transparent 100%)`
            : `linear-gradient(180deg, transparent 0%, ${CYAN_MID} 40%, ${CYAN_GLOW} 50%, ${CYAN_MID} 60%, transparent 100%)`,
          backgroundSize: isH ? '200% 100%' : '100% 200%',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.6s ease',
          animation: active
            ? isH
              ? 'sp-sheenSweep 2.5s ease-in-out infinite'
              : 'sp-sheenSweep 2.5s ease-in-out infinite'
            : 'none',
        }}
      />

      {/* Particles */}
      {particles.map((i) => {
        const delay = (i * (1.4 + variant * 0.15)) / count;
        const totalDuration = 1.2 + variant * 0.1;
        const animName = isH ? 'sp-particleX' : 'sp-particleY';
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: CYAN,
              boxShadow: `0 0 6px ${CYAN_GLOW}`,
              opacity: 0,
              top: isH ? '50%' : 0,
              left: isH ? 0 : '50%',
              transform: isH ? 'translateY(-50%)' : 'translateX(-50%)',
              animation: active
                ? `${animName} ${totalDuration}s linear ${delay}s infinite`
                : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Pipeline Node ────────────────────────────────────────────────────────────
function PipelineNode({ step, index, active, phase, compact }: {
  step: PipelineStep;
  index: number;
  active: boolean;
  phase: number;
  compact: boolean;
}) {
  const counterValue = useAnimatedCounter(
    step.metric.target,
    active,
    index === 2 ? 800 : 1200
  );
  const isRedFlag = index === 2;
  const Icon = step.icon;
  const accentColor = isRedFlag ? RED_FLAG : CYAN;

  return (
    <div
      style={{
        position: 'relative',
        width: compact ? '100%' : 180,
        maxWidth: compact ? 320 : undefined,
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: 16,
          background: `radial-gradient(ellipse at center, ${isRedFlag ? 'rgba(255,61,90,0.15)' : 'hsl(var(--primary) / 0.15)'} 0%, transparent 70%)`,
          opacity: active ? 1 : 0,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none' as const,
        }}
      />

      <div
        style={{
          position: 'relative',
          background: BG_CARD,
          border: `1px solid ${active ? (isRedFlag ? 'rgba(255,61,90,0.35)' : 'hsl(var(--primary) / 0.35)') : BORDER}`,
          borderRadius: 12,
          padding: compact ? '16px 14px' : '20px 16px',
          overflow: 'hidden',
          transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
          boxShadow: active
            ? `0 0 20px ${isRedFlag ? 'rgba(255,61,90,0.2)' : 'hsl(var(--primary) / 0.2)'}`
            : 'none',
        }}
      >
        {/* Active sheen overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 0%, ${isRedFlag ? 'rgba(255,61,90,0.04)' : 'hsl(var(--primary) / 0.04)'} 50%, transparent 100%)`,
            backgroundSize: '200% 100%',
            animation: active ? 'sp-sheenSweep 4s ease-in-out infinite' : 'none',
            pointerEvents: 'none' as const,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Icon container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: 12,
            }}
          >
            {/* Icon glow */}
            <div
              style={{
                position: 'absolute',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${isRedFlag ? 'rgba(255,61,90,0.25)' : 'hsl(var(--primary) / 0.25)'} 0%, transparent 70%)`,
                opacity: active ? 1 : 0,
                transition: 'opacity 0.6s ease',
              }}
            />

            {/* Sonar ping */}
            <div
              style={{
                position: 'absolute',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1.5px solid ${accentColor}`,
                opacity: 0,
                animation: active ? 'sp-sonarPing 2s ease-out infinite' : 'none',
                animationDelay: `${index * 0.3}s`,
              }}
            />

            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${isRedFlag ? 'rgba(255,61,90,0.15)' : 'hsl(var(--primary) / 0.15)'} 0%, transparent 100%)`,
                border: `1px solid ${isRedFlag ? 'rgba(255,61,90,0.3)' : 'hsl(var(--primary) / 0.3)'}`,
                animation: active ? 'sp-iconFloat 3s ease-in-out infinite' : 'none',
              }}
            >
              <Icon
                size={20}
                style={{ color: accentColor }}
              />
            </div>

            {/* Step number badge */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                right: compact ? 'calc(50% - 28px)' : 'calc(50% - 28px)',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
                boxShadow: `0 0 8px ${isRedFlag ? 'rgba(255,61,90,0.4)' : 'hsl(var(--primary) / 0.4)'}`,
              }}
            >
              {index + 1}
            </div>
          </div>

          {/* Text content */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: compact ? 13 : 14,
                fontWeight: 600,
                color: accentColor,
                marginBottom: 4,
                letterSpacing: '0.02em',
              }}
            >
              {step.label}
            </div>
            <div
              style={{
                fontSize: compact ? 11 : 12,
                color: 'hsl(var(--muted-foreground))',
                lineHeight: 1.4,
                marginBottom: 10,
              }}
            >
              {step.desc}
            </div>

            {/* LIVE METRIC COUNTER */}
            <div style={{ minHeight: 32 }}>
              <span
                style={{
                  fontSize: compact ? 20 : 22,
                  fontWeight: 700,
                  color: isRedFlag ? RED_FLAG : CYAN,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {counterValue.toLocaleString()}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 10,
                  color: 'hsl(var(--muted-foreground))',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                {step.metric.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Value Propositions ───────────────────────────────────────────────────────
const VALUE_PROPS = [
  "⚠️ {80%} of quotes contain hidden errors. Find yours before you sign.",
  "🔒 100% {Private} Analysis — Your contractor will never know.",
  "💪 Shift the power dynamic. Negotiate with {facts}, not feelings.",
  "🧐 See exactly what your contractor is hoping you won't notice.",
  "🧠 Translates 'Contractor Jargon' into plain English warnings.",
  "⏱️ Faster (and more accurate) than getting a {second opinion}.",
  "⚖️ The only {unbiased}, non-commissioned review in the industry.",
];

function renderHighlighted(text: string) {
  return text.split(/\{(.*?)\}/g).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ─── Rotating Value Prop ──────────────────────────────────────────────────────
function RotatingValueProp({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);
  const [animClass, setAnimClass] = useState<'in' | 'out' | 'none'>('in');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      if (prefersReducedMotion) {
        setIndex((prev) => (prev + 1) % VALUE_PROPS.length);
        return;
      }
      setAnimClass('out');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % VALUE_PROPS.length);
        setAnimClass('in');
      }, 300);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, prefersReducedMotion]);

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: 16,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: active ? 1 : 0,
        transform: active ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: 'hsl(var(--muted-foreground))',
          margin: 0,
          lineHeight: 1.5,
          animation:
            prefersReducedMotion || animClass === 'none'
              ? 'none'
              : animClass === 'out'
              ? 'sp-vpFadeOut 0.3s ease forwards'
              : 'sp-vpFadeIn 0.3s ease forwards',
        }}
      >
        {renderHighlighted(VALUE_PROPS[index])}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ScanPipelineStrip() {
  const [phase, setPhase] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Reduced motion check
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // IntersectionObserver
  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      setPhase(3);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [prefersReducedMotion]);

  // Phase sequencer
  useEffect(() => {
    if (!isVisible || prefersReducedMotion) return;
    setPhase(1);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 2200);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isVisible, prefersReducedMotion]);

  const stepActive = (idx: number) => phase >= idx + 1;
  const beam1Active = phase >= 1;
  const beam2Active = phase >= 2;

  return (
    <div ref={containerRef} className="sp-pipeline-root">
      <style>{SCOPED_STYLES}</style>

      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: isMobile ? '24px 16px' : '32px 24px',
        }}
      >
        {/* Section header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: isMobile ? 20 : 28,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              color: CYAN,
              marginBottom: 8,
            }}
          >
            <span style={{ width: 16, height: 1, background: CYAN, opacity: 0.5 }} />
            AI-Powered Analysis
            <span style={{ width: 16, height: 1, background: CYAN, opacity: 0.5 }} />
          </div>
          <h3
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              color: 'hsl(var(--foreground))',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            How We Scan Your Quote
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--muted-foreground))',
              margin: 0,
            }}
          >
            Three-stage pipeline. Zero guesswork.
          </p>
        </div>

        {/* Main pipeline card */}
        <div
          style={{
            position: 'relative',
            background: BG_DARK,
            borderRadius: 16,
            padding: isMobile ? '24px 12px' : '28px 24px',
            overflow: 'hidden',
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* Animated border glow */}
          <div
            style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 17,
              border: `1px solid ${CYAN}`,
              opacity: 0.3,
              animation: 'sp-borderGlow 3s ease-in-out infinite',
              pointerEvents: 'none' as const,
            }}
          />

          {/* Grid pattern bg */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(hsl(var(--primary) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.08) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: 0.03,
              animation: 'sp-gridPulse 4s ease-in-out infinite',
              pointerEvents: 'none' as const,
            }}
          />

          {/* Scan line effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none' as const,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '30%',
                height: '100%',
                background: `linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.04) 50%, transparent 100%)`,
                animation: phase >= 1 ? 'sp-scanLine 4s ease-in-out infinite' : 'none',
              }}
            />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {isMobile ? (
              /* MOBILE: Vertical layout */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0,
                }}
              >
                <PipelineNode step={STEPS[0]} index={0} active={stepActive(0)} phase={phase} compact />
                <div style={{ height: 32, display: 'flex', justifyContent: 'center' }}>
                  <ParticleStream active={beam1Active} orientation="vertical" variant={1} />
                </div>
                <PipelineNode step={STEPS[1]} index={1} active={stepActive(1)} phase={phase} compact />
                <div style={{ height: 32, display: 'flex', justifyContent: 'center' }}>
                  <ParticleStream active={beam2Active} orientation="vertical" variant={2} />
                </div>
                <PipelineNode step={STEPS[2]} index={2} active={stepActive(2)} phase={phase} compact />
              </div>
            ) : (
              /* DESKTOP: Horizontal layout */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0,
                }}
              >
                <PipelineNode step={STEPS[0]} index={0} active={stepActive(0)} phase={phase} compact={false} />
                <div style={{ flex: 1, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                  <ParticleStream active={beam1Active} orientation="horizontal" variant={1} />
                </div>
                <PipelineNode step={STEPS[1]} index={1} active={stepActive(1)} phase={phase} compact={false} />
                <div style={{ flex: 1, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                  <ParticleStream active={beam2Active} orientation="horizontal" variant={2} />
                </div>
                <PipelineNode step={STEPS[2]} index={2} active={stepActive(2)} phase={phase} compact={false} />
              </div>
            )}
          </div>
        </div>

        <RotatingValueProp active={phase >= 3} />
      </div>
    </div>
  );
}
