import { NOIR } from '@/lib/motion-tokens';

type FlowPhase = 'FORM' | 'UPLOADING' | 'THEATER' | 'OTP_GATE' | 'REVEAL';

const STEPS: { key: FlowPhase; label: string }[] = [
  { key: 'FORM', label: 'INTAKE' },
  { key: 'UPLOADING', label: 'UPLOAD' },
  { key: 'THEATER', label: 'ANALYSIS' },
  { key: 'OTP_GATE', label: 'VERIFY' },
  { key: 'REVEAL', label: 'RESULTS' },
];

const ORDER: Record<FlowPhase, number> = { FORM: 0, UPLOADING: 1, THEATER: 2, OTP_GATE: 3, REVEAL: 4 };

export function SystemStatusPanel({ phase }: { phase: FlowPhase }) {
  const now = new Date();
  const ts = now.toISOString().replace('T', ' ').slice(0, 19);
  const hash = 'f3a9c1b2';

  return (
    <div
      className="rounded-xl p-4 space-y-6 border"
      style={{
        background: NOIR.glass,
        borderColor: NOIR.glassBorder,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-mono tracking-widest" style={{ color: NOIR.cyan }}>
          SYSTEM STATUS
        </p>
        <p className="text-[9px] font-mono text-white/30">{ts} UTC</p>
      </div>

      {/* Step Indicator */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const idx = ORDER[step.key];
          const currentIdx = ORDER[phase];
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: isDone
                    ? '#10b981'
                    : isActive
                      ? NOIR.cyan
                      : 'rgba(255,255,255,0.15)',
                  boxShadow: isActive ? `0 0 8px ${NOIR.cyan}` : 'none',
                }}
              />
              <span
                className="text-[10px] font-mono tracking-wider"
                style={{
                  color: isActive ? NOIR.cyan : isDone ? '#10b981' : 'rgba(255,255,255,0.35)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Data decoration */}
      <div className="pt-4 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-[8px] font-mono text-white/20">SID: {hash}...e7b1</p>
        <p className="text-[8px] font-mono text-white/20">VER: 2.0.0-rc1</p>
        <p className="text-[8px] font-mono text-white/20">NODE: us-east-1</p>
      </div>
    </div>
  );
}
