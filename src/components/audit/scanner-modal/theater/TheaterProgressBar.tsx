// ═══════════════════════════════════════════════════════════════════════════
// TheaterProgressBar
// Orange animated progress bar with pulse effect when paused
// ═══════════════════════════════════════════════════════════════════════════

import { cn } from '@/lib/utils';
import { TheaterProgressBarProps } from '@/types/audit';

/**
 * Animated progress bar for the analysis theater.
 * Uses Safety Orange gradient and pulses when paused at 90%.
 */
export function TheaterProgressBar({ percent, isPaused }: TheaterProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      {/* Progress bar container */}
      <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.3), transparent)',
            animation: 'shimmer 2s infinite',
          }}
        />
        
        {/* Progress fill */}
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden",
            "bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500",
            isPaused && "animate-pulse"
          )}
          style={{ width: `${percent}%` }}
        >
          {/* Shine effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: isPaused ? 'none' : 'shine 1.5s infinite',
            }}
          />
        </div>
        
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute top-0 h-full rounded-full blur-sm transition-all duration-300",
            "bg-gradient-to-r from-orange-500/50 to-amber-500/50"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      
      {/* Percentage label */}
      <div className="flex justify-between items-center text-sm">
        <span className={cn(
          "font-medium transition-colors",
          isPaused ? "text-orange-400" : "text-slate-400"
        )}>
          {isPaused ? "Almost there..." : "Analyzing..."}
        </span>
        <span className={cn(
          "font-bold tabular-nums",
          percent >= 90 ? "text-orange-400" : "text-slate-300"
        )}>
          {Math.floor(percent)}%
        </span>
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
