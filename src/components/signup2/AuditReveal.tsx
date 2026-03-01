import { useEffect, useState } from 'react';
import { NOIR, EASE_EXPO_OUT, DURATION, gradeGlow } from '@/lib/motion-tokens';
import { Button } from '@/components/ui/button';
import { Download, Mail, Upload, Phone } from 'lucide-react';

interface AuditRevealProps {
  analysisJson: {
    finalGrade?: string;
    pillarScores?: Record<string, number>;
    overallScore?: number;
    summary?: string;
    [key: string]: unknown;
  };
  hasEmail: boolean;
  onUploadNew: () => void;
}

const PILLAR_LABELS: Record<string, string> = {
  safety: 'Safety & Code Match',
  scope: 'Install & Scope Clarity',
  price: 'Price Fairness',
  finePrint: 'Fine Print Transparency',
  warranty: 'Warranty Value',
};

export function AuditReveal({ analysisJson, hasEmail, onUploadNew }: AuditRevealProps) {
  const [vaultOpen, setVaultOpen] = useState(false);
  const [pillarsVisible, setPillarsVisible] = useState(false);

  const grade = String(analysisJson?.finalGrade ?? '—');
  const glow = gradeGlow(grade);
  const pillars = analysisJson?.pillarScores ?? {};

  // Vault unseal sequence
  useEffect(() => {
    const t1 = window.setTimeout(() => setVaultOpen(true), 100);
    const t2 = window.setTimeout(() => setPillarsVisible(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Grade Monolith */}
      <div className="relative flex flex-col items-center py-10">
        {/* Seal ring (before unseal) */}
        <div
          className="absolute"
          style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: `2px solid ${NOIR.cyan}`,
            opacity: vaultOpen ? 0 : 0.4,
            transition: `opacity ${DURATION.med}s ${EASE_EXPO_OUT}`,
          }}
        />

        {/* Cyan radial pulse */}
        {vaultOpen && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${NOIR.cyan}22 0%, transparent 70%)`,
              animation: `vaultPulse 600ms ${EASE_EXPO_OUT} forwards`,
            }}
          />
        )}

        {/* Horizontal seam */}
        <div
          className="absolute left-1/2 -translate-x-1/2 h-px"
          style={{
            width: vaultOpen ? '100%' : 0,
            background: `linear-gradient(90deg, transparent, ${NOIR.cyan}, transparent)`,
            transition: `width 400ms ${EASE_EXPO_OUT}`,
            transitionDelay: '200ms',
          }}
        />

        {/* Grade */}
        <div
          className="relative z-10"
          style={{
            opacity: vaultOpen ? 1 : 0,
            transform: vaultOpen ? 'scale(1)' : 'scale(0.92)',
            transition: `all 240ms ${EASE_EXPO_OUT}`,
            transitionDelay: '300ms',
          }}
        >
          <p
            className="text-7xl font-black"
            style={{ color: glow, textShadow: `0 0 40px ${glow}40` }}
          >
            {grade}
          </p>
        </div>

        {/* Microcopy */}
        <p
          className="mt-3 text-[10px] font-mono tracking-[0.25em]"
          style={{
            color: NOIR.cyan,
            opacity: vaultOpen ? 1 : 0,
            transition: `opacity ${DURATION.med}s ${EASE_EXPO_OUT}`,
            transitionDelay: '500ms',
          }}
        >
          ACCESS GRANTED • AUDIT UNSEALED
        </p>
      </div>

      {/* Pillar Score Cards */}
      {pillarsVisible && (
        <div className="space-y-2">
          {Object.entries(pillars).map(([key, score], i) => {
            const numScore = typeof score === 'number' ? score : 0;
            const barColor = numScore >= 70 ? '#10b981' : numScore >= 50 ? '#f59e0b' : '#ef4444';
            return (
              <div
                key={key}
                className="rounded-lg p-3 flex items-center gap-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: 0,
                  animation: `pillarIn ${DURATION.med}s ${EASE_EXPO_OUT} forwards`,
                  animationDelay: `${i * 70}ms`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80">
                    {PILLAR_LABELS[key] ?? key}
                  </p>
                  <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${numScore}%`,
                        background: barColor,
                        transition: `width ${DURATION.slow}s ${EASE_EXPO_OUT}`,
                        transitionDelay: `${i * 70 + 200}ms`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: barColor }}>
                  {numScore}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {analysisJson?.summary && (
        <p className="text-sm text-white/60 leading-relaxed">{String(analysisJson.summary)}</p>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button variant="outline" className="gap-2 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10">
          <Download className="w-3.5 h-3.5" /> Download PDF
        </Button>
        {hasEmail && (
          <Button variant="outline" className="gap-2 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10">
            <Mail className="w-3.5 h-3.5" /> Email Report
          </Button>
        )}
        <Button variant="outline" className="gap-2 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={onUploadNew}>
          <Upload className="w-3.5 h-3.5" /> Upload New
        </Button>
        <Button className="gap-2 text-xs" style={{ background: NOIR.cyan, color: NOIR.void }}>
          <Phone className="w-3.5 h-3.5" /> Request Quotes
        </Button>
      </div>

      <style>{`
        @keyframes vaultPulse {
          from { transform: scale(0.7); opacity: 0.22; }
          to { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pillarIn {
          from { opacity: 0; transform: translateY(14px); filter: blur(6px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  );
}
