import { useEffect, useState, useRef } from 'react';
import { ShieldCheck, FileSearch, DollarSign, FileWarning, BadgeCheck, AlertTriangle, XCircle, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuoteAnalysisResult } from '@/hooks/useQuoteScanner';
import { SeverityBadge } from '@/components/forensic/SeverityBadge';

interface QuoteAnalysisResultsProps {
  result: QuoteAnalysisResult | null;
  isLocked: boolean;
  hasImage: boolean;
}

// --- Helpers ---

function getSeverityLevel(score: number): 'critical' | 'warning' | 'info' {
  if (score >= 80) return 'info';
  if (score >= 60) return 'warning';
  return 'critical';
}

function getSeverityLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Caution';
  return 'Concern';
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function getOverallBorderColor(score: number): string {
  if (score >= 80) return 'border-emerald-400/50 bg-emerald-400/5';
  if (score >= 60) return 'border-amber-400/50 bg-amber-400/5';
  return 'border-rose-400/50 bg-rose-400/5';
}

// --- Animated score hook ---

function useAnimatedScore(target: number, delay: number = 0, duration: number = 1200): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    if (prefersReducedMotion || target === 0) {
      setValue(target);
      return;
    }

    setValue(0);
    const timeout = setTimeout(() => {
      const animate = (ts: number) => {
        if (startRef.current === null) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * easeOut));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      startRef.current = null;
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, delay, duration, prefersReducedMotion]);

  return value;
}

// --- ScoreRow ---

interface ScoreRowProps {
  id?: string;
  label: string;
  score: number | string;
  icon: React.ReactNode;
  description: string;
  delay?: number;
}

function ScoreRow({ id, label, score, icon, description, delay = 0 }: ScoreRowProps) {
  const isPlaceholder = typeof score === 'string';
  const numScore = isPlaceholder ? 0 : score;
  const animatedValue = useAnimatedScore(isPlaceholder ? 0 : numScore, delay);
  const displayScore = isPlaceholder ? score : animatedValue;

  return (
    <div
      id={id}
      className="space-y-2 motion-safe:animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {icon}
          <span className="font-medium">{label}</span>
          {!isPlaceholder && (
            <SeverityBadge level={getSeverityLevel(numScore)} label={getSeverityLabel(numScore)} />
          )}
        </div>
        <span className={cn("font-mono font-bold", isPlaceholder ? "text-muted-foreground" : getScoreColor(numScore))}>
          {isPlaceholder ? score : `${displayScore}/100`}
        </span>
      </div>

      {/* Gradient progress bar */}
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-700"
          style={{ width: `${isPlaceholder ? 30 : animatedValue}%` }}
        />
        {/* Triangle marker */}
        {!isPlaceholder && (
          <div
            className="absolute -top-1 transition-all duration-700"
            style={{ left: `${animatedValue}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-foreground/70" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

// --- Overall Score Icon ---

function OverallScoreIcon({ score }: { score: number }) {
  if (score >= 80) return <CheckCircle2 className="w-8 h-8 text-emerald-400" />;
  if (score >= 60) return <AlertTriangle className="w-8 h-8 text-amber-400" />;
  return <XCircle className="w-8 h-8 text-rose-400" />;
}

// --- Key Issues Block ---

function KeyIssuesBlock({ warnings, missingItems }: { warnings: string[]; missingItems: string[] }) {
  const allIssues = [
    ...warnings.map(w => ({ text: w, type: 'warning' as const })),
    ...missingItems.map(m => ({ text: m, type: 'missing' as const })),
  ];
  if (allIssues.length === 0) return null;

  const shown = allIssues.slice(0, 5);
  const remaining = allIssues.length - shown.length;

  return (
    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
          Key Issues Detected
        </span>
        <span className="inline-flex items-center justify-center min-w-[22px] h-5 rounded-full bg-rose-500/20 px-1.5 text-xs font-bold text-rose-400">
          {allIssues.length}
        </span>
      </div>
      <ol className="space-y-1.5 list-none">
        {shown.map((issue, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">{i + 1}.</span>
            {issue.type === 'warning' ? (
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-400" />
            )}
            <span className={issue.type === 'warning' ? 'text-amber-400' : 'text-rose-400'}>
              {issue.text}
            </span>
          </li>
        ))}
      </ol>
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground pl-6">...and {remaining} more</p>
      )}
    </div>
  );
}

// --- Main Component ---

export function QuoteAnalysisResults({ result, isLocked, hasImage }: QuoteAnalysisResultsProps) {
  const displayData = result || {
    overallScore: 0,
    safetyScore: 0,
    scopeScore: 0,
    priceScore: 0,
    finePrintScore: 0,
    warrantyScore: 0,
    pricePerOpening: '$ —',
    warnings: ['Hidden Risk #1', 'Hidden Risk #2'],
    missingItems: ['Missing Scope Item'],
    summary: 'Upload your quote to reveal hidden risks and missing scope items...'
  };

  const overallAnimated = useAnimatedScore(result ? result.overallScore : 0, 0, 1200);
  const showBlur = !hasImage || isLocked;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col items-center md:flex-row md:items-center gap-1 md:gap-2 text-xs uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-primary hidden md:block" />
        <span className="font-bold font-sans text-primary text-lg">After:</span>
        <span className="font-bold font-sans text-primary text-lg">Your AI Quote Gradecard</span>
      </div>

      {/* Results Card */}
      <div className="relative rounded-xl border bg-card overflow-hidden">
        {/* Blur/Lock Overlay */}
        {showBlur && (
          <div className="absolute inset-0 backdrop-blur-md bg-white/50 dark:bg-background/60 z-10 flex flex-col items-center justify-center p-6 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <p className="font-bold text-xl text-foreground">
              {hasImage ? 'Results Locked' : 'Upload to Reveal'}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-xs mt-2">
              {hasImage ? 'Your quote has been analyzed. Enter your email to unlock your full report.' : 'See your instant Safety Score & Price Check'}
            </p>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Timestamp */}
          {result?.analyzedAt && (
            <div className="text-center text-xs text-muted-foreground font-mono">
              LAST ANALYZED: {new Date(result.analyzedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </div>
          )}

          {/* Overall Score */}
          <div className={cn("rounded-lg border-2 p-6 text-center", result ? getOverallBorderColor(result.overallScore) : "border-muted bg-muted/5")}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Overall Assessment</p>
            <p className="text-sm font-medium mb-2">Quote Safety Score</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">{displayData.summary}</p>
            <div className="flex items-center justify-center gap-3">
              {result && <OverallScoreIcon score={result.overallScore} />}
              <div className="flex items-baseline gap-1">
                <span className={cn("text-5xl font-bold font-mono", result ? getScoreColor(result.overallScore) : "text-muted-foreground")}>
                  {result ? overallAnimated : '?'}
                </span>
                <span className="text-muted-foreground">out of 100</span>
              </div>
            </div>
          </div>

          {/* Key Issues Detected */}
          {result && <KeyIssuesBlock warnings={result.warnings} missingItems={result.missingItems} />}

          {/* Category Scores */}
          <div className="space-y-5">
            <ScoreRow id="score-row-safety" label="Safety" score={result?.safetyScore ?? '?'} icon={<ShieldCheck className="w-4 h-4 text-primary" />} description="Checks for impact ratings and design pressures." delay={0} />
            <ScoreRow id="score-row-scope" label="Scope" score={result?.scopeScore ?? '?'} icon={<FileSearch className="w-4 h-4 text-primary" />} description={result?.missingItems.length ? `Missing: ${result.missingItems.slice(0, 2).join(', ')}` : "Scope appears comprehensive."} delay={150} />
            <ScoreRow id="score-row-price" label="Price" score={result?.priceScore ?? '?'} icon={<DollarSign className="w-4 h-4 text-primary" />} description={`Est. price per opening: ${displayData.pricePerOpening}`} delay={300} />
            <ScoreRow id="score-row-fineprint" label="Fine Print" score={result?.finePrintScore ?? '?'} icon={<FileWarning className="w-4 h-4 text-primary" />} description={result?.warnings.length ? `Warning: ${result.warnings[0]}` : "No major red flags found."} delay={450} />
            <ScoreRow id="score-row-warranty" label="Warranty" score={result?.warrantyScore ?? '?'} icon={<BadgeCheck className="w-4 h-4 text-primary" />} description="Evaluates product vs. labor coverage duration." delay={600} />
          </div>

          {/* Warnings & Missing Items (detailed) */}
          {result && (result.warnings.length > 0 || result.missingItems.length > 0) && (
            <div className="space-y-4 pt-4 border-t">
              {result.warnings.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Warnings
                  </p>
                  <ul className="space-y-1">
                    {result.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-amber-400 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.missingItems.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Missing Items
                  </p>
                  <ul className="space-y-1">
                    {result.missingItems.map((item, i) => (
                      <li key={i} className="text-sm text-rose-400 flex items-start gap-2">
                        <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          {result && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                ⚖️ <strong>Disclaimer:</strong> This analysis is an educational guide, not legal or professional advice. Always verify contractor license numbers at{' '}
                <a href="https://www.myfloridalicense.com/wl11.asp" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">myfloridalicense.com</a>{' '}
                and product approvals at{' '}
                <a href="https://floridabuilding.org/pr/pr_app_srch.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">floridabuilding.org</a>{' '}
                before signing any contract.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
