import { useEffect, useRef, useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';
import { WarningCard } from './WarningCard';

type ThreatCard = {
  round: 1 | 2 | 3;
  severity: 'critical' | 'warning';
  label: string;
  detail: string;
  x: number;
  y: number;
};

const WARNING_DATA: ThreatCard[] = [
  // Round 1
  { round: 1, severity: 'critical', label: 'PRICE ALERT',   detail: '15% Over Market',       x: 72, y: 18 },
  { round: 1, severity: 'warning',  label: 'WARRANTY GAP',  detail: 'Labor Not Covered',      x: 10, y: 48 },
  { round: 1, severity: 'critical', label: 'FINE PRINT',    detail: 'Hidden Disposal Fees',   x: 68, y: 80 },
  // Round 2
  { round: 2, severity: 'critical', label: 'MISSING',       detail: 'Permit Fees',            x: 10, y: 18 },
  { round: 2, severity: 'warning',  label: 'SCOPE',         detail: 'Stucco Repair Excluded', x: 64, y: 52 },
  { round: 2, severity: 'critical', label: 'UNVERIFIED',    detail: 'License # Invalid',      x: 40, y: 84 },
  // Round 3
  { round: 3, severity: 'critical', label: 'NON-COMPLIANT', detail: 'Wrong Wind Zone',        x: 40, y: 14 },
  { round: 3, severity: 'critical', label: 'BAD CLAUSE',    detail: 'Subject to Remeasure',   x: 30, y: 42 },
  { round: 3, severity: 'warning',  label: 'DELAY RISK',    detail: 'No Completion Date',     x: 10, y: 78 },
];

const ROUND_DURATION = 8000; // ms per round
const TOTAL_CYCLE = ROUND_DURATION * 3; // 24000ms for 3 rounds

export function QuoteScannerHero() {
  const [scanProgress, setScanProgress] = useState(0);
  const [scanRound, setScanRound] = useState(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const scanStartRef = useRef(0);
  const rafRef = useRef(0);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // rAF-driven scanner engine
  useEffect(() => {
    if (prefersReducedMotion) return;

    scanStartRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - scanStartRef.current) % TOTAL_CYCLE;
      const round = Math.floor(elapsed / ROUND_DURATION) + 1;
      const progress = (elapsed % ROUND_DURATION) / ROUND_DURATION;

      setScanRound(round);
      setScanProgress(progress);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [prefersReducedMotion]);

  // Log round transitions
  useEffect(() => {
    console.log(`[ScannerHero] Round ${scanRound} (progress: ${scanProgress.toFixed(2)})`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanRound]);

  const progressPct = scanProgress * 100;

  return (
    <section className="relative overflow-hidden min-h-[600px]">
      {/* Layer 1: Dark Grid Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: '#0a0a0f',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Threat Container — cards revealed by scan line */}
      <div className="absolute inset-0 z-[5]" aria-hidden="true">
        {WARNING_DATA
          .filter(card => card.round === scanRound)
          .map(card => {
            const clampedX = Math.max(6, Math.min(94, card.x));
            const clampedY = Math.max(10, Math.min(90, card.y));
            return (
              <WarningCard
                key={`${card.round}-${card.label}`}
                severity={card.severity}
                label={card.label}
                detail={card.detail}
                visible={scanProgress >= card.y / 100}
                reducedMotion={prefersReducedMotion}
                style={{
                  position: 'absolute',
                  top: `${clampedY}%`,
                  left: `${clampedX}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            );
          })}
      </div>

      {/* Layer 3: Frosted Window (clip-path driven by scanProgress) */}
      <div
        className="absolute inset-0 z-[10]"
        style={{
          backgroundImage: 'url(/images/hero/window_background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: prefersReducedMotion
            ? 'inset(0 0 0 0)'
            : `inset(${progressPct}% 0 0 0)`,
          willChange: prefersReducedMotion ? 'auto' : 'clip-path',
        }}
        aria-hidden="true"
      />

      {/* Layer 4: Dark Overlay */}
      <div className="absolute inset-0 z-[20] bg-black/40" aria-hidden="true" />

      {/* Layer 5: Scan Line */}
      {!prefersReducedMotion && (
        <div
          className="absolute left-0 right-0 z-[30] h-[2px] pointer-events-none"
          style={{
            top: `${progressPct}%`,
            background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
            boxShadow: '0 0 20px #ef4444, 0 0 40px #ef444480',
          }}
          aria-hidden="true"
        />
      )}

      {/* Layer 6: Content (unchanged) */}
      <div className="relative z-[40] container px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <ShimmerBadge className="mb-6" />

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
              <ScanSearch className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Is Your Window Quote Fair?{' '}
            <span className="text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              AI Analysis in 60 Seconds
            </span>
          </h1>

          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            Stop guessing. Upload a photo of your contractor's quote and let our AI flag hidden risks,
            missing scope, and overpricing — in seconds.
          </p>

          <p className="text-sm text-orange-400 font-bold tracking-wide uppercase drop-shadow-md">
            See what our AI finds in seconds ↓
          </p>
        </div>
      </div>
    </section>
  );
}
