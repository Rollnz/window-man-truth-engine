import { useEffect, useState } from 'react';
import { CaseStudy, MissionType } from '@/data/evidenceData';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseFileCardProps {
  caseStudy: CaseStudy;
  onOpenCase: (caseId: string) => void;
  /** Whether this card is highlighted from a deep link */
  isHighlighted?: boolean;
}

// Semantic colors based on mission type
const missionColors: Record<MissionType, { bg: string; border: string; text: string; glow: React.CSSProperties }> = {
  heat: { 
    bg: 'bg-orange-500/10', 
    border: 'border-orange-500/20', 
    text: 'text-orange-500',
    glow: { textShadow: '0 0 16px rgba(249, 115, 22, 0.4)' }
  },
  hurricane: { 
    bg: 'bg-sky-500/10', 
    border: 'border-sky-500/20', 
    text: 'text-sky-500',
    glow: { textShadow: '0 0 16px rgba(14, 165, 233, 0.4)' }
  },
  noise: { 
    bg: 'bg-purple-500/10', 
    border: 'border-purple-500/20', 
    text: 'text-purple-500',
    glow: { textShadow: '0 0 16px rgba(168, 85, 247, 0.4)' }
  },
  security: { 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20', 
    text: 'text-amber-500',
    glow: { textShadow: '0 0 16px rgba(245, 158, 11, 0.4)' }
  },
  cost: { 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20', 
    text: 'text-emerald-500',
    glow: { textShadow: '0 0 16px rgba(16, 185, 129, 0.4)' }
  },
};

export function CaseFileCard({ caseStudy, onOpenCase, isHighlighted = false }: CaseFileCardProps) {
  const primaryStat = caseStudy.verifiedStats[0];
  const colors = missionColors[caseStudy.missionType] || missionColors.cost;
  
  // Animate highlight effect - pulse then fade
  const [showHighlight, setShowHighlight] = useState(isHighlighted);
  
  useEffect(() => {
    if (isHighlighted) {
      setShowHighlight(true);
      // Keep highlight for 3 seconds, then fade
      const timer = setTimeout(() => {
        setShowHighlight(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  return (
    <div 
      className={cn(
        "group relative flex flex-col rounded-xl bg-card border card-hover frame-card cursor-pointer transition-all duration-500",
        showHighlight 
          ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20 scale-[1.02]" 
          : "border-border"
      )}
      onClick={() => onOpenCase(caseStudy.id)}
    >
      {/* Highlight badge */}
      {showHighlight && (
        <div className="absolute -top-3 -right-3 z-10 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full animate-pulse">
          {caseStudy.evidenceId}
        </div>
      )}
      
      {/* Folder tab effect */}
      <div className="absolute -top-0 left-4 w-2/5 h-3 bg-muted rounded-t-md" />
      
      {/* Header */}
      <div className="relative pt-5 px-4 pb-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {caseStudy.caseNumber} • {caseStudy.evidenceId}
            </div>
            <div className="text-sm font-medium text-foreground">
              {caseStudy.location}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 space-y-4">
        {/* Mission Objective */}
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Objective
          </div>
          <div className="font-semibold text-foreground">
            {caseStudy.missionObjective}
          </div>
        </div>

        {/* Primary Stat Highlight */}
        <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{primaryStat.icon}</span>
            <span className="text-sm text-muted-foreground">{primaryStat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${colors.text}`} style={colors.glow}>
            {primaryStat.change}
          </div>
          <div className="text-xs text-muted-foreground">
            {primaryStat.before} → {primaryStat.after}
          </div>
        </div>

        {/* Quote Preview */}
        <p className="text-sm text-muted-foreground italic line-clamp-2">
          "{caseStudy.testimonialQuote}"
        </p>

        {/* CTA */}
        <button className="flex items-center text-sm text-primary font-medium group-hover:underline">
          <span>Read Full Debrief</span>
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Footer - Status */}
      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-500 font-medium uppercase tracking-wider">
            {caseStudy.status}
          </span>
        </div>
      </div>
    </div>
  );
}
