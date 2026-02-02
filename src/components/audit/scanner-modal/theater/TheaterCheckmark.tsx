// ═══════════════════════════════════════════════════════════════════════════
// TheaterCheckmark
// Individual step indicator with animation
// ═══════════════════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { TheaterCheckmarkProps } from '@/types/audit';

/**
 * Individual checkmark step in the analysis theater.
 * Animates from inactive → active (spinning) → complete (checkmark).
 */
export function TheaterCheckmark({ 
  step, 
  isComplete, 
  isActive, 
  index 
}: TheaterCheckmarkProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2 transition-all duration-500",
        isComplete ? "opacity-100" : isActive ? "opacity-100" : "opacity-40",
        // Slide in animation
        "transform",
        isActive || isComplete ? "translate-x-0" : "translate-x-4"
      )}
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Status indicator */}
      <div 
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
          isComplete 
            ? "bg-emerald-500/20 border border-emerald-500/50" 
            : isActive 
              ? "bg-orange-500/20 border border-orange-500/50" 
              : "bg-slate-700/50 border border-slate-600/50"
        )}
      >
        {isComplete ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : isActive ? (
          <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        )}
      </div>
      
      {/* Labels */}
      <div className="flex-1 min-w-0">
        <p 
          className={cn(
            "text-sm font-medium transition-colors duration-300",
            isComplete 
              ? "text-emerald-400" 
              : isActive 
                ? "text-white" 
                : "text-slate-500"
          )}
        >
          {step.label}
        </p>
        {step.sublabel && (
          <p 
            className={cn(
              "text-xs transition-colors duration-300",
              isComplete 
                ? "text-emerald-400/70" 
                : isActive 
                  ? "text-slate-400" 
                  : "text-slate-600"
            )}
          >
            {step.sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
