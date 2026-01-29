import { 
  ShieldCheck, 
  FileSearch, 
  DollarSign, 
  FileWarning, 
  BadgeCheck,
  AlertTriangle,
  XCircle,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuoteAnalysisResult } from '@/hooks/useQuoteScanner';
import { Progress } from '@/components/ui/progress';

interface QuoteAnalysisResultsProps {
  result: QuoteAnalysisResult | null;
  isLocked: boolean;
  hasImage: boolean;
}

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

interface ScoreRowProps {
  label: string;
  score: number | string;
  icon: React.ReactNode;
  description: string;
}

function ScoreRow({ label, score, icon, description }: ScoreRowProps) {
  const isPlaceholder = typeof score === 'string';
  const numScore = isPlaceholder ? 0 : score;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={cn("font-mono font-bold", isPlaceholder ? "text-muted-foreground" : getScoreColor(numScore))}>
          {isPlaceholder ? score : `${score}/100`}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", isPlaceholder ? "bg-muted-foreground/30" : getScoreBarColor(numScore))}
          style={{ width: `${isPlaceholder ? 30 : numScore}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function QuoteAnalysisResults({ result, isLocked, hasImage }: QuoteAnalysisResultsProps) {
  // Placeholder data for locked/empty states
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
    summary: 'Upload your quote to reveal hidden risks and missing scope items...',
  };

  const showBlur = !hasImage || isLocked;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span className="font-bold text-primary">After: Your AI Quote Gradecard</span>
      </div>

      {/* Results Card */}
      <div className="relative rounded-xl border bg-card overflow-hidden">
        {/* Blur/Lock Overlay */}
        {showBlur && (
          <div className="absolute inset-0 backdrop-blur-md bg-background/60 z-10 flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">
              {hasImage ? 'Results Locked' : 'Upload to Reveal'}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-xs mt-1">
              {hasImage 
                ? 'Your quote has been analyzed. Enter your email to unlock your full report.'
                : 'See your instant Safety Score, Price Check, and Risk Analysis.'
              }
            </p>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Timestamp */}
          {result?.analyzedAt && (
            <div className="text-center text-xs text-muted-foreground font-mono">
              LAST ANALYZED: {new Date(result.analyzedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}

          {/* Overall Score */}
          <div className={cn(
            "rounded-lg border-2 p-6 text-center",
            result ? getOverallBorderColor(result.overallScore) : "border-muted bg-muted/5"
          )}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Overall Assessment
            </p>
            <p className="text-sm font-medium mb-2">Quote Safety Score</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              {displayData.summary}
            </p>
            <div className="flex items-baseline justify-center gap-1">
              <span className={cn(
                "text-5xl font-bold font-mono",
                result ? getScoreColor(result.overallScore) : "text-muted-foreground"
              )}>
                {result ? result.overallScore : '?'}
              </span>
              <span className="text-muted-foreground">out of 100</span>
            </div>
          </div>

          {/* Category Scores */}
          <div className="space-y-5">
            <ScoreRow
              label="Safety"
              score={result?.safetyScore ?? '?'}
              icon={<ShieldCheck className="w-4 h-4 text-primary" />}
              description="Checks for impact ratings and design pressures."
            />
            <ScoreRow
              label="Scope"
              score={result?.scopeScore ?? '?'}
              icon={<FileSearch className="w-4 h-4 text-primary" />}
              description={result?.missingItems.length ? `Missing: ${result.missingItems.slice(0, 2).join(', ')}` : "Scope appears comprehensive."}
            />
            <ScoreRow
              label="Price"
              score={result?.priceScore ?? '?'}
              icon={<DollarSign className="w-4 h-4 text-primary" />}
              description={`Est. price per opening: ${displayData.pricePerOpening}`}
            />
            <ScoreRow
              label="Fine Print"
              score={result?.finePrintScore ?? '?'}
              icon={<FileWarning className="w-4 h-4 text-primary" />}
              description={result?.warnings.length ? `Warning: ${result.warnings[0]}` : "No major red flags found."}
            />
            <ScoreRow
              label="Warranty"
              score={result?.warrantyScore ?? '?'}
              icon={<BadgeCheck className="w-4 h-4 text-primary" />}
              description="Evaluates product vs. labor coverage duration."
            />
          </div>

          {/* Warnings & Missing Items */}
          {result && (result.warnings.length > 0 || result.missingItems.length > 0) && (
            <div className="space-y-4 pt-4 border-t">
              {result.warnings.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Warnings
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
                    <XCircle className="w-3 h-3" />
                    Missing Items
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
        </div>
      </div>
    </div>
  );
}
