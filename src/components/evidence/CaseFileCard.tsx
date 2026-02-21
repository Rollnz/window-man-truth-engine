import { useEffect, useState } from 'react';
import { CaseStudy, MissionType } from '@/data/evidenceData';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseFileCardProps {
  caseStudy: CaseStudy;
  onOpenCase: (caseId: string) => void;
  isHighlighted?: boolean;
}

// Mission type accent colors using semantic tokens where possible
const missionAccents: Record<MissionType, { badge: string; stat: string }> = {
  heat:      { badge: 'bg-destructive/10 text-destructive border-destructive/20', stat: 'text-destructive' },
  hurricane: { badge: 'bg-primary/10 text-primary border-primary/20', stat: 'text-primary' },
  noise:     { badge: 'bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20', stat: 'text-accent-foreground' },
  security:  { badge: 'bg-warning/10 text-warning border-warning/20', stat: 'text-warning' },
  cost:      { badge: 'bg-primary/10 text-primary border-primary/20', stat: 'text-primary' },
};

export function CaseFileCard({ caseStudy, onOpenCase, isHighlighted = false }: CaseFileCardProps) {
  const primaryStat = caseStudy.verifiedStats[0];
  const accent = missionAccents[caseStudy.missionType] || missionAccents.cost;
  
  const [showHighlight, setShowHighlight] = useState(isHighlighted);
  
  useEffect(() => {
    if (isHighlighted) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  return (
    <div 
      className={cn(
        "group relative flex flex-col rounded-xl bg-card border cursor-pointer",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-primary/10",
        "backdrop-blur-sm",
        showHighlight 
          ? "border-primary ring-2 ring-primary/30 shadow-primary/20 scale-[1.02]" 
          : "border-border/50"
      )}
      onClick={() => onOpenCase(caseStudy.id)}
    >
      {/* Highlight badge */}
      {showHighlight && (
        <div className="absolute -top-3 -right-3 z-10 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full animate-pulse">
          {caseStudy.evidenceId}
        </div>
      )}
      
      {/* Folder tab */}
      <div className="absolute -top-0 left-4 w-2/5 h-3 bg-muted rounded-t-md" />
      
      {/* Header */}
      <div className="relative pt-5 px-5 pb-3 border-b border-border/50 bg-muted/30 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              {caseStudy.caseNumber} • {caseStudy.evidenceId}
            </div>
            <div className="text-sm font-medium text-foreground mt-0.5">
              {caseStudy.location}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 space-y-4">
        {/* Mission Objective */}
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Objective
          </div>
          <div className="font-semibold text-foreground leading-snug">
            {caseStudy.missionObjective}
          </div>
        </div>

        {/* Primary Stat - elevated card */}
        <div className={cn(
          "p-4 rounded-lg border shadow-md",
          accent.badge
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{primaryStat.icon}</span>
            <span className="text-sm text-muted-foreground">{primaryStat.label}</span>
          </div>
          <div className={cn("text-2xl font-bold", accent.stat)}>
            {primaryStat.change}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {primaryStat.before} → {primaryStat.after}
          </div>
        </div>

        {/* Quote Preview */}
        <p className="text-sm text-muted-foreground italic line-clamp-2">
          &ldquo;{caseStudy.testimonialQuote}&rdquo;
        </p>

        {/* CTA */}
        <button className="flex items-center text-sm text-primary font-medium group-hover:underline">
          <span>Read Full Debrief</span>
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-primary" />
          <span className="text-primary font-medium uppercase tracking-wider">
            {caseStudy.status}
          </span>
        </div>
      </div>
    </div>
  );
}
