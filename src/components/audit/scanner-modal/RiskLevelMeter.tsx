// ═══════════════════════════════════════════════════════════════════════════
// RiskLevelMeter - Visual traffic light gauge for forensic risk level
// Shows Critical → High → Moderate → Acceptable with active node glow
// ═══════════════════════════════════════════════════════════════════════════

import { cn } from "@/lib/utils";

type RiskLevel = 'critical' | 'high' | 'moderate' | 'acceptable';

interface RiskLevelMeterProps {
  riskLevel: RiskLevel;
  className?: string;
}

const RISK_CONFIG: Record<RiskLevel, {
  index: number;
  color: string;
  glowColor: string;
  label: string;
  description: string;
}> = {
  critical: {
    index: 0,
    color: 'bg-rose-500',
    glowColor: 'shadow-rose-500/50',
    label: 'CRITICAL',
    description: 'Critical compliance violations detected',
  },
  high: {
    index: 1,
    color: 'bg-amber-500',
    glowColor: 'shadow-amber-500/50',
    label: 'HIGH',
    description: 'Significant concerns require attention',
  },
  moderate: {
    index: 2,
    color: 'bg-yellow-400',
    glowColor: 'shadow-yellow-400/50',
    label: 'MODERATE',
    description: 'Some issues to address before signing',
  },
  acceptable: {
    index: 3,
    color: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/50',
    label: 'SAFE',
    description: 'Quote meets safety standards',
  },
};

const LEVELS: RiskLevel[] = ['critical', 'high', 'moderate', 'acceptable'];

export function RiskLevelMeter({ riskLevel, className }: RiskLevelMeterProps) {
  const activeConfig = RISK_CONFIG[riskLevel];
  const activeIndex = activeConfig.index;

  return (
    <div 
      className={cn("rounded-lg border border-slate-700/50 bg-slate-800/50 p-4", className)}
      aria-label={`Risk Assessment: ${activeConfig.label} - ${activeConfig.description}`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-4 font-medium">
        Risk Assessment
      </p>

      {/* Gauge Track */}
      <div className="relative flex items-center justify-between mb-3">
        {/* Connecting Line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-700 mx-4" />
        
        {/* Progress Fill */}
        <div 
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-0.5 mx-4 transition-all duration-500",
            activeConfig.color
          )}
          style={{ 
            left: 0, 
            width: `${(activeIndex / 3) * 100}%`,
          }}
        />

        {/* Nodes */}
        {LEVELS.map((level, idx) => {
          const config = RISK_CONFIG[level];
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;
          
          return (
            <div key={level} className="relative z-10 flex flex-col items-center">
              {/* Node Circle */}
              <div
                className={cn(
                  "w-4 h-4 rounded-full transition-all duration-300 border-2",
                  isActive && [
                    config.color,
                    "border-transparent",
                    "shadow-lg",
                    config.glowColor,
                    "animate-pulse",
                  ],
                  isPast && [config.color, "border-transparent"],
                  !isActive && !isPast && "bg-slate-700 border-slate-600"
                )}
              />
              
              {/* Active Indicator Triangle */}
              {isActive && (
                <div className="absolute -bottom-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] font-medium tracking-wide mb-4">
        {LEVELS.map((level, idx) => {
          const config = RISK_CONFIG[level];
          const isActive = idx === activeIndex;
          
          return (
            <span
              key={level}
              className={cn(
                "transition-colors duration-300",
                isActive ? "text-white" : "text-slate-500"
              )}
            >
              {config.label}
            </span>
          );
        })}
      </div>

      {/* Description */}
      <p className={cn(
        "text-sm text-center transition-colors duration-300",
        activeIndex === 0 && "text-rose-400",
        activeIndex === 1 && "text-amber-400",
        activeIndex === 2 && "text-yellow-400",
        activeIndex === 3 && "text-emerald-400",
      )}>
        {activeConfig.description}
      </p>
    </div>
  );
}

export default RiskLevelMeter;
