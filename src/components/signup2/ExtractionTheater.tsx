import { useEffect, useState, useRef, useCallback } from 'react';
import { NOIR, EASE_EXPO_OUT, DURATION } from '@/lib/motion-tokens';

interface ExtractionTheaterProps {
  /** Real metadata from polling (null while still loading) */
  metadata: {
    contractor?: string;
    openings?: number;
    total?: string;
  } | null;
  onComplete: () => void;
}

const STEPS = [
  { label: 'Ingesting document…', endMs: 600 },
  { label: 'Identifying form type…', endMs: 1400 },
  { label: 'Extracting key values…', endMs: 2400 },
  { label: 'Hashing PII for security…', endMs: 3500 },
];

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
function randomStr(len: number) {
  return Array.from({ length: len }, () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]).join('');
}

function ScrambleValue({ value, placeholder, mono }: { value: string | null; placeholder: string; mono?: boolean }) {
  const [display, setDisplay] = useState(placeholder);
  const [locked, setLocked] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (value && !locked) {
      // Start 500ms scramble then lock
      const targetLen = value.length;
      intervalRef.current = window.setInterval(() => {
        setDisplay(randomStr(targetLen));
      }, 50);

      const timeout = window.setTimeout(() => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        setDisplay(value);
        setLocked(true);
      }, 500);

      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        window.clearTimeout(timeout);
      };
    }
  }, [value, locked]);

  return (
    <span className={mono ? 'font-mono' : ''} style={{ color: locked ? '#10b981' : NOIR.cyan }}>
      {display}
    </span>
  );
}

export function ExtractionTheater({ metadata, onComplete }: ExtractionTheaterProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showMetadata, setShowMetadata] = useState(false);
  const completedRef = useRef(false);

  // Step progression
  useEffect(() => {
    const timers: number[] = [];
    STEPS.forEach((step, i) => {
      if (i > 0) {
        timers.push(window.setTimeout(() => setStepIndex(i), step.endMs));
      }
    });
    // Show metadata cards at 2s
    timers.push(window.setTimeout(() => setShowMetadata(true), 2000));
    // Complete at 3.5s
    timers.push(
      window.setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, 3500),
    );
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="relative overflow-hidden rounded-xl p-6 space-y-6" style={{ background: NOIR.glass, border: `1px solid ${NOIR.glassBorder}` }}>
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${NOIR.cyan}11 50%, transparent 100%)`,
          backgroundSize: '100% 40px',
          animation: 'scanline 2.2s linear infinite',
        }}
      />
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        @keyframes scanline2 {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
      `}</style>
      {/* Secondary scanline */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-40"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${NOIR.cyan}08 50%, transparent 100%)`,
          backgroundSize: '100% 20px',
          animation: 'scanline2 3.1s linear infinite 0.6s',
        }}
      />

      {/* Document icon */}
      <div className="relative z-20 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${NOIR.cyan}15`, border: `1px solid ${NOIR.cyan}30` }}
        >
          <span className="text-lg" style={{ color: NOIR.cyan }}>📄</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Document Analysis</p>
          <p className="text-[10px] font-mono" style={{ color: NOIR.cyan }}>
            {STEPS[stepIndex].label}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-20">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: NOIR.cyan,
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
              transition: `width ${DURATION.med}s ${EASE_EXPO_OUT}`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {STEPS.map((s, i) => (
            <span key={i} className="text-[8px] font-mono" style={{ color: i <= stepIndex ? NOIR.cyan : 'rgba(255,255,255,0.2)' }}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Metadata cards */}
      {showMetadata && (
        <div className="relative z-20 grid grid-cols-2 gap-2">
          {[
            { label: 'Contractor', value: metadata?.contractor ?? null, placeholder: '██████████' },
            { label: 'Openings', value: metadata?.openings != null ? String(metadata.openings) : null, placeholder: '██' },
            { label: 'Total', value: metadata?.total ?? null, placeholder: '$██,███' },
            { label: 'PII Hash', value: 'f3a9...b2c1', placeholder: '████...████', mono: true },
          ].map((card, i) => (
            <div
              key={card.label}
              className="rounded-lg p-2.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: 0,
                animation: `fadeSlideUp ${DURATION.med}s ${EASE_EXPO_OUT} forwards`,
                animationDelay: `${i * 120}ms`,
              }}
            >
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{card.label}</p>
              <p className="text-sm font-semibold mt-0.5">
                <ScrambleValue value={card.value} placeholder={card.placeholder} mono={card.mono} />
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Detection brackets (flicker effect) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[
          { top: '15%', left: '8%' },
          { top: '35%', right: '12%' },
          { top: '60%', left: '20%' },
          { bottom: '20%', right: '25%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-6 h-6 border border-dashed"
            style={{
              ...pos,
              borderColor: `${NOIR.cyan}40`,
              opacity: 0,
              animation: `bracketFlicker 2.4s ease-in-out infinite`,
              animationDelay: `${i * 400}ms`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bracketFlicker {
          0%, 100% { opacity: 0; }
          15% { opacity: 0.7; }
          30% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
