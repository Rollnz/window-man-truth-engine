// ═══════════════════════════════════════════════════════════════════════════
// FullResultsPanel - All explanations unlocked
// Shows complete analysis with forensic sections and "Why this matters"
// Features: Staggered entrance, laser scan, animated score, risk meter
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  ShieldCheck,
  FileSearch,
  DollarSign,
  FileWarning,
  BadgeCheck,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Award,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Scale } from
"lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AuditAnalysisResult } from "@/types/audit";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { RiskLevelMeter } from "./RiskLevelMeter";
import {
  parseCitation,
  MY_FLORIDA_LICENSE_URL,
  FLORIDA_BUILDING_URL } from
"@/lib/statuteLinks";
import { toast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════════
// STAGGER DELAY CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STAGGER_DELAYS = {
  successBanner: 0,
  hardCapAlert: 100,
  identityCard: 200,
  riskMeter: 300,
  scoreCard: 400,
  statuteCard: 500,
  questionsCard: 600,
  breakdown: 700,
  positiveFindings: 800,
  warnings: 850,
  missingItems: 900,
  cta: 950,
  disclaimer: 1000
} as const;

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
          {isGood ?
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :

          <AlertTriangle className="w-4 h-4 text-amber-400" />
          }
          <span className={cn("font-mono font-bold", getScoreColor(score))}>{score}/100</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getScoreBarColor(score))}
          style={{ width: `${score}%` }} />

      </div>

      {/* Description - fully visible */}
      <p className="text-sm text-slate-300">{description}</p>

      {/* Why it matters - the unlocked value */}
      <div className="pt-2 border-t border-slate-700/50">
        <p className="text-xs text-primary font-medium mb-1">Why this matters in Florida:</p>
        <p className="text-xs text-slate-400 leading-relaxed">{whyItMatters}</p>
      </div>
    </div>);

}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FullResultsPanel({ result }: FullResultsPanelProps) {
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const missingCount = result.missingItems?.length || 0;
  const warningsCount = result.warnings?.length || 0;
  const forensic = result.forensic;
  const identity = result.extractedIdentity;

  // Copy questions to clipboard
  const handleCopyQuestions = async () => {
    if (!forensic?.questionsToAsk?.length) return;

    const questionsText = forensic.questionsToAsk.
    map((q, i) => `${i + 1}. ${q}`).
    join('\n');

    try {
      await navigator.clipboard.writeText(questionsText);
      setCopiedQuestions(true);
      toast({
        title: "Copied to clipboard",
        description: "Questions ready to paste into your notes or email."
      });
      setTimeout(() => setCopiedQuestions(false), 3000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 overflow-y-auto max-h-[70vh]">
      {/* Success Banner */}
      <div
        className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3 animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.successBanner}ms`, animationFillMode: 'forwards' }}>

        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-400">Full Report Unlocked</p>
          <p className="text-xs text-slate-100">Your analysis has been saved to your WindowMan Vault.</p>
        </div>
      </div>

      {/* Hard Cap Alert Banner */}
      {forensic?.hardCapApplied &&
      <div
        className="animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.hardCapAlert}ms`, animationFillMode: 'forwards' }}>

          <Alert className="border-rose-500/50 bg-rose-500/10 [&>svg]:text-rose-400">
            <Scale className="h-5 w-5" />
            <AlertTitle className="text-rose-400 font-semibold">
              Score Limited to {result.overallScore}
            </AlertTitle>
            <AlertDescription className="text-slate-100 text-sm mt-1">
              <span className="font-medium">Reason:</span> {forensic.hardCapReason}
              {forensic.hardCapStatute &&
            <span className="block sm:inline sm:ml-1 text-rose-300 font-mono text-xs">
                  ({forensic.hardCapStatute})
                </span>
            }
            </AlertDescription>
          </Alert>
        </div>
      }

      {/* Contractor Identity Card - WITH LASER SCAN */}
      {identity && (identity.contractorName || identity.licenseNumber || identity.noaNumbers?.length > 0) &&
      <div
        className="animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.identityCard}ms`, animationFillMode: 'forwards' }}>

          <Card className="border-slate-600/50 bg-slate-800/50 identity-card-scanner">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Contractor Identified
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {identity.contractorName &&
            <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white font-medium">{identity.contractorName}</span>
                </div>
            }
              {identity.licenseNumber &&
            <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-slate-400">License:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-xs">{identity.licenseNumber}</span>
                    <a
                  href={MY_FLORIDA_LICENSE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">

                      Verify <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
            }
              {identity.noaNumbers?.length > 0 &&
            <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-slate-400">NOA:</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {identity.noaNumbers.map((noa, idx) =>
                <span key={idx} className="text-white font-mono text-xs">{noa}</span>
                )}
                    <a
                  href={FLORIDA_BUILDING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">

                      Check <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
            }
            </CardContent>
          </Card>
        </div>
      }

      {/* Risk Level Meter */}
      {forensic?.riskLevel &&
      <div
        className="animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.riskMeter}ms`, animationFillMode: 'forwards' }}>

          <RiskLevelMeter riskLevel={forensic.riskLevel as 'critical' | 'high' | 'moderate' | 'acceptable'} />
        </div>
      }

      {/* Overall Score Card - WITH ANIMATED NUMBER */}
      <div
        className={cn(
          "rounded-lg border-2 p-6 text-center animate-fade-in opacity-0",
          getOverallBorderColor(result.overallScore)
        )}
        style={{ animationDelay: `${STAGGER_DELAYS.scoreCard}ms`, animationFillMode: 'forwards' }}>

        <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Quote Safety Score</p>
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <AnimatedNumber
            value={result.overallScore}
            duration={1500}
            className={cn("text-5xl font-bold font-mono", getScoreColor(result.overallScore))} />

          <span className="text-slate-400">/ 100</span>
        </div>
        <p className={cn("text-sm font-medium mb-3", getScoreColor(result.overallScore))}>
          {getScoreLabel(result.overallScore)}
        </p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          {forensic?.headline || result.summary}
        </p>
      </div>

      {/* Statute Citations Card - Clickable Links */}
      {forensic?.statuteCitations && forensic.statuteCitations.length > 0 &&
      <div
        className="animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.statuteCard}ms`, animationFillMode: 'forwards' }}>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                Florida Law References
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {forensic.statuteCitations.map((citation, idx) => {
                const parsed = parseCitation(citation);
                return (
                  <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0">
                        {idx + 1}.
                      </span>
                      <span>
                        {parsed.url ?
                      <>
                            <a
                          href={parsed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium transition-colors">

                              {parsed.statuteRef || 'View Source'}
                            </a>
                            {parsed.description &&
                        <span className="text-slate-300"> - {parsed.description}</span>
                        }
                          </> :

                      citation
                      }
                      </span>
                    </li>);

              })}
              </ul>
            </CardContent>
          </Card>
        </div>
      }

      {/* Questions to Ask Card - Copy Button */}
      {forensic?.questionsToAsk && forensic.questionsToAsk.length > 0 &&
      <div
        className="animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.questionsCard}ms`, animationFillMode: 'forwards' }}>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Questions to Ask Before Signing
                </CardTitle>
                <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyQuestions}
                className="h-8 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50">

                  {copiedQuestions ?
                <>
                      <Check className="w-3 h-3 mr-1 text-emerald-400" />
                      Copied
                    </> :

                <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy All
                    </>
                }
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="space-y-2">
                {forensic.questionsToAsk.map((question, idx) =>
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-primary font-semibold min-w-[20px] shrink-0">
                      {idx + 1}.
                    </span>
                    <span>{question}</span>
                  </li>
              )}
              </ol>
            </CardContent>
          </Card>
        </div>
      }

      {/* Full Category Breakdown (UNLOCKED) */}
      <div
        className="space-y-4 animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.breakdown}ms`, animationFillMode: 'forwards' }}>

        <h3 className="text-sm font-semibold text-white">Detailed Breakdown</h3>

        <FullScoreRow
          label="Safety & Code"
          score={result.safetyScore}
          icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          description="Checks for impact ratings and design pressures meeting Florida building code."
          whyItMatters="Florida requires windows to meet specific impact ratings and design pressures for hurricane zones. Missing certifications can mean your windows won't protect your home during a storm—and your insurance may not cover damage." />


        <FullScoreRow
          label="Install & Scope"
          score={result.scopeScore}
          icon={<FileSearch className="w-4 h-4 text-primary" />}
          description={
          result.missingItems.length ? `Missing: ${result.missingItems.join(", ")}` : "Scope appears comprehensive."
          }
          whyItMatters="Incomplete scope often leads to surprise change orders. Common Florida issues include improper flashing around stucco, missing NOA documentation, and permit fees not included in quotes." />


        <FullScoreRow
          label="Price Fairness"
          score={result.priceScore}
          icon={<DollarSign className="w-4 h-4 text-primary" />}
          description={`Est. price per opening: ${result.pricePerOpening}`}
          whyItMatters="Florida window pricing varies significantly by region and product. We compare against thousands of local quotes to identify if you're paying a fair market rate or being overcharged." />


        <FullScoreRow
          label="Fine Print"
          score={result.finePrintScore}
          icon={<FileWarning className="w-4 h-4 text-primary" />}
          description={result.warnings.length ? `Warnings: ${result.warnings.join("; ")}` : "No major red flags found."}
          whyItMatters="Watch for clauses that allow price increases after signing, require full payment upfront, or limit your ability to hold contractors accountable for delays or defects." />


        <FullScoreRow
          label="Warranty Coverage"
          score={result.warrantyScore}
          icon={<BadgeCheck className="w-4 h-4 text-primary" />}
          description="Evaluates product vs. labor coverage duration and transferability."
          whyItMatters="In Florida's climate, warranty coverage is critical. Product warranties should be 20+ years; labor warranties should be 5+ years. Transferable warranties add resale value to your home." />

      </div>

      {/* Positive Findings Card - After breakdown for B+ quotes */}
      {forensic?.positiveFindings && forensic.positiveFindings.length > 0 &&
      <div
        className="animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.positiveFindings}ms`, animationFillMode: 'forwards' }}>

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                What This Quote Does Well
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {forensic.positiveFindings.map((finding, idx) =>
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{finding}</span>
                  </li>
              )}
              </ul>
            </CardContent>
          </Card>
        </div>
      }

      {/* Warnings Section (if any) */}
      {warningsCount > 0 &&
      <div
        className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.warnings}ms`, animationFillMode: 'forwards' }}>

          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium text-rose-400">Red Flags Found ({warningsCount})</span>
          </div>
          <ul className="space-y-2">
            {result.warnings.map((warning, idx) =>
          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">•</span>
                {warning}
              </li>
          )}
          </ul>
        </div>
      }

      {/* Missing Items (expanded) */}
      {missingCount > 0 &&
      <div
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.missingItems}ms`, animationFillMode: 'forwards' }}>

          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Missing from Quote ({missingCount})</span>
          </div>
          <ul className="space-y-2">
            {result.missingItems.map((item, idx) =>
          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {item}
              </li>
          )}
          </ul>
        </div>
      }

      {/* Simple Click-to-Call CTA */}
      <div
        className="pt-6 border-t border-slate-700/50 animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.cta}ms`, animationFillMode: 'forwards' }}>

        <div className="text-center space-y-4">
          <div>
            <p className="text-lg font-semibold text-white mb-1">
              Want a better quote? Talk to an expert.
            </p>
            <p className="text-sm text-slate-400">
              Our Florida window specialists are standing by.
            </p>
          </div>
          
          <a
            href="tel:5614685571"
            className="inline-flex items-center justify-center w-full sm:w-auto px-8 h-14 rounded-lg bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl">

            <Phone className="w-5 h-5 mr-3" />
            Call Window Man: 561-468-5571
          </a>
          
          <p className="text-xs text-primary-foreground">
            Free consultation • No obligation
          </p>
        </div>
      </div>

      {/* Legal Disclaimer - P0 Compliance Requirement */}
      <div
        className="pt-4 border-t border-slate-700/30 animate-fade-in opacity-0"
        style={{ animationDelay: `${STAGGER_DELAYS.disclaimer}ms`, animationFillMode: 'forwards' }}>

        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="text-slate-400">⚖️ Disclaimer:</span> This analysis is an educational guide, not legal or professional advice. 
          Always verify contractor license numbers at{' '}
          <a
            href={MY_FLORIDA_LICENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary underline underline-offset-2">

            myfloridalicense.com
          </a>
          {' '}and product approvals at{' '}
          <a
            href={FLORIDA_BUILDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary underline underline-offset-2">

            floridabuilding.org
          </a>
          {' '}before signing any contract.
        </p>
      </div>
    </div>);

}

export default FullResultsPanel;