// ═══════════════════════════════════════════════════════════════════════════
// PartialResultsPanel - Score visible, explanations blurred/locked
// Shows overall score + category bars, gates detailed explanations
// ═══════════════════════════════════════════════════════════════════════════

import { 
  ShieldCheck, 
  FileSearch, 
  DollarSign, 
  FileWarning, 
  BadgeCheck,
  Lock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AuditAnalysisResult } from '@/types/audit';

interface PartialResultsPanelProps {
  result: AuditAnalysisResult;
  onUnlockClick: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-rose-400';
}

function getOverallBorderColor(score: number): string {
  if (score >= 80) return 'border-emerald-400/50 bg-emerald-400/5';
  if (score >= 60) return 'border-amber-400/50 bg-amber-400/5';
  return 'border-rose-400/50 bg-rose-400/5';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Concern';
  return 'Critical';
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ScoreRowProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  isLocked?: boolean;
}

function ScoreRow({ label, score, icon, description, isLocked = true }: ScoreRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {icon}
          <span className="font-medium text-white">{label}</span>
        </div>
        <span className={cn("font-mono font-bold", getScoreColor(score))}>
          {score}/100
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getScoreBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      {/* Explanation - blurred when locked */}
      <div className="relative">
        <p className={cn(
          "text-xs text-slate-400 transition-all",
          isLocked && "blur-[4px] select-none"
        )}>
          {description}
        </p>
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-3 w-3 text-slate-500" />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PartialResultsPanel({ result, onUnlockClick }: PartialResultsPanelProps) {
  const missingCount = result.missingItems?.length || 0;
  
  return (
    <div className="space-y-6 px-4 py-6">
      {/* Overall Score Card */}
      <div className={cn(
        "rounded-lg border-2 p-6 text-center",
        getOverallBorderColor(result.overallScore)
      )}>
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
          Quote Safety Score
        </p>
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className={cn(
            "text-5xl font-bold font-mono",
            getScoreColor(result.overallScore)
          )}>
            {result.overallScore}
          </span>
          <span className="text-slate-400">/ 100</span>
        </div>
        <p className={cn(
          "text-sm font-medium",
          getScoreColor(result.overallScore)
        )}>
          {getScoreLabel(result.overallScore)}
        </p>
      </div>

      {/* Category Scores (visible) with descriptions (locked) */}
      <div className="space-y-5">
        <ScoreRow
          label="Safety"
          score={result.safetyScore}
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          description="Impact ratings and design pressures meet Florida code requirements."
          isLocked={true}
        />
        <ScoreRow
          label="Scope"
          score={result.scopeScore}
          icon={<FileSearch className="w-4 h-4 text-primary" />}
          description={result.missingItems.length ? `Missing: ${result.missingItems.slice(0, 2).join(', ')}` : "Scope appears comprehensive."}
          isLocked={true}
        />
        <ScoreRow
          label="Price"
          score={result.priceScore}
          icon={<DollarSign className="w-4 h-4 text-primary" />}
          description={`Est. price per opening: ${result.pricePerOpening}`}
          isLocked={true}
        />
        <ScoreRow
          label="Fine Print"
          score={result.finePrintScore}
          icon={<FileWarning className="w-4 h-4 text-primary" />}
          description={result.warnings.length ? `Warning: ${result.warnings[0]}` : "No major red flags found."}
          isLocked={true}
        />
        <ScoreRow
          label="Warranty"
          score={result.warrantyScore}
          icon={<BadgeCheck className="w-4 h-4 text-primary" />}
          description="Product vs. labor coverage duration analysis."
          isLocked={true}
        />
      </div>

      {/* Missing Items List (visible) */}
      {missingCount > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">
              Missing from Quote ({missingCount})
            </span>
          </div>
          <ul className="space-y-1">
            {result.missingItems.slice(0, 5).map((item, idx) => (
              <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
            {missingCount > 5 && (
              <li className="text-xs text-slate-500 italic">
                + {missingCount - 5} more items...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* CTA to unlock */}
      <Button
        onClick={onUnlockClick}
        className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
      >
        Continue to Full Report
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

export default PartialResultsPanel;
