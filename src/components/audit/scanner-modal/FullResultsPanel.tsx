// ═══════════════════════════════════════════════════════════════════════════
// FullResultsPanel - All explanations unlocked
// Shows complete analysis with "Why this matters" sections
// ═══════════════════════════════════════════════════════════════════════════

import {
  ShieldCheck,
  FileSearch,
  DollarSign,
  FileWarning,
  BadgeCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuditAnalysisResult } from "@/types/audit";

interface FullResultsPanelProps {
  result: AuditAnalysisResult;
  onScheduleConsultation?: () => void;
  onAskQuestion?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  return "bg-rose-400";
}

function getOverallBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-400/50 bg-emerald-400/5";
  if (score >= 60) return "border-amber-400/50 bg-amber-400/5";
  return "border-rose-400/50 bg-rose-400/5";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Concern";
  return "Critical";
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL SCORE ROW COMPONENT (UNLOCKED)
// ═══════════════════════════════════════════════════════════════════════════

interface FullScoreRowProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  whyItMatters: string;
}

function FullScoreRow({ label, score, icon, description, whyItMatters }: FullScoreRowProps) {
  const isGood = score >= 60;

  return (
    <div className="space-y-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {icon}
          <span className="font-medium text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isGood ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
          <span className={cn("font-mono font-bold", getScoreColor(score))}>{score}/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getScoreBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Description - fully visible */}
      <p className="text-sm text-slate-300">{description}</p>

      {/* Why it matters - the unlocked value */}
      <div className="pt-2 border-t border-slate-700/50">
        <p className="text-xs text-primary font-medium mb-1">Why this matters in Florida:</p>
        <p className="text-xs text-slate-400 leading-relaxed">{whyItMatters}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FullResultsPanel({ result, onScheduleConsultation, onAskQuestion }: FullResultsPanelProps) {
  const missingCount = result.missingItems?.length || 0;
  const warningsCount = result.warnings?.length || 0;

  return (
    <div className="space-y-6 px-4 py-6 overflow-y-auto max-h-[70vh]">
      {/* Success Banner */}
      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-400">Full Report Unlocked</p>
          <p className="text-xs text-slate-100">Your analysis has been saved to your WindowMan Vault.</p>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className={cn("rounded-lg border-2 p-6 text-center", getOverallBorderColor(result.overallScore))}>
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Quote Safety Score</p>
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className={cn("text-5xl font-bold font-mono", getScoreColor(result.overallScore))}>
            {result.overallScore}
          </span>
          <span className="text-slate-400">/ 100</span>
        </div>
        <p className={cn("text-sm font-medium mb-3", getScoreColor(result.overallScore))}>
          {getScoreLabel(result.overallScore)}
        </p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">{result.summary}</p>
      </div>

      {/* Full Category Breakdown (UNLOCKED) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Detailed Breakdown</h3>

        <FullScoreRow
          label="Safety & Code"
          score={result.safetyScore}
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          description="Checks for impact ratings and design pressures meeting Florida building code."
          whyItMatters="Florida requires windows to meet specific impact ratings and design pressures for hurricane zones. Missing certifications can mean your windows won't protect your home during a storm—and your insurance may not cover damage."
        />

        <FullScoreRow
          label="Install & Scope"
          score={result.scopeScore}
          icon={<FileSearch className="w-4 h-4 text-primary" />}
          description={
            result.missingItems.length ? `Missing: ${result.missingItems.join(", ")}` : "Scope appears comprehensive."
          }
          whyItMatters="Incomplete scope often leads to surprise change orders. Common Florida issues include improper flashing around stucco, missing NOA documentation, and permit fees not included in quotes."
        />

        <FullScoreRow
          label="Price Fairness"
          score={result.priceScore}
          icon={<DollarSign className="w-4 h-4 text-primary" />}
          description={`Est. price per opening: ${result.pricePerOpening}`}
          whyItMatters="Florida window pricing varies significantly by region and product. We compare against thousands of local quotes to identify if you're paying a fair market rate or being overcharged."
        />

        <FullScoreRow
          label="Fine Print"
          score={result.finePrintScore}
          icon={<FileWarning className="w-4 h-4 text-primary" />}
          description={result.warnings.length ? `Warnings: ${result.warnings.join("; ")}` : "No major red flags found."}
          whyItMatters="Watch for clauses that allow price increases after signing, require full payment upfront, or limit your ability to hold contractors accountable for delays or defects."
        />

        <FullScoreRow
          label="Warranty Coverage"
          score={result.warrantyScore}
          icon={<BadgeCheck className="w-4 h-4 text-primary" />}
          description="Evaluates product vs. labor coverage duration and transferability."
          whyItMatters="In Florida's climate, warranty coverage is critical. Product warranties should be 20+ years; labor warranties should be 5+ years. Transferable warranties add resale value to your home."
        />
      </div>

      {/* Warnings Section (if any) */}
      {warningsCount > 0 && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium text-rose-400">Red Flags Found ({warningsCount})</span>
          </div>
          <ul className="space-y-2">
            {result.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Items (expanded) */}
      {missingCount > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Missing from Quote ({missingCount})</span>
          </div>
          <ul className="space-y-2">
            {result.missingItems.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Escalation CTAs */}
      <div className="space-y-3 pt-4 border-t border-slate-700/50">
        <p className="text-sm text-slate-400 text-center">Want expert guidance on your specific situation?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onScheduleConsultation && (
            <Button
              onClick={onScheduleConsultation}
              className="h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Free Review
            </Button>
          )}

          {onAskQuestion && (
            <Button
              onClick={onAskQuestion}
              variant="outline"
              className="h-11 border-primary/30 text-primary hover:bg-primary/10"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FullResultsPanel;
