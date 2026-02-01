// ═══════════════════════════════════════════════════════════════════════════
// AnalyzingState - Static checklist during API analysis
// Shows 5 rubric categories with check icons (no timers/animations)
// ═══════════════════════════════════════════════════════════════════════════

import { 
  ShieldCheck, 
  FileSearch, 
  DollarSign, 
  FileWarning, 
  BadgeCheck,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyzingStateProps {
  /** Optional callback when analysis should be considered complete */
  className?: string;
}

const RUBRIC_CATEGORIES = [
  { id: 'safety', label: 'Safety & Code', icon: ShieldCheck },
  { id: 'scope', label: 'Install & Scope Clarity', icon: FileSearch },
  { id: 'price', label: 'Price Fairness', icon: DollarSign },
  { id: 'fineprint', label: 'Fine Print Transparency', icon: FileWarning },
  { id: 'warranty', label: 'Warranty & Long-Term Value', icon: BadgeCheck },
] as const;

/**
 * Static analyzing state shown during API call.
 * Displays a checklist of the 5 rubric categories being analyzed.
 * No timers or animations - transitions when API returns.
 */
export function AnalyzingState({ className }: AnalyzingStateProps) {
  return (
    <div className={cn("flex flex-col items-center py-8 px-6", className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
          <h2 className="text-2xl font-bold text-white">
            Analyzing Your Quote…
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md">
          Checking safety, scope, pricing, fine print, and warranty coverage.
        </p>
      </div>

      {/* Checklist */}
      <div className="w-full max-w-sm space-y-4">
        {RUBRIC_CATEGORIES.map((category, index) => {
          const Icon = category.icon;
          return (
            <div 
              key={category.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg",
                "bg-slate-800/50 border border-slate-700/50",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-white">
                {category.label}
              </span>
              <div className="ml-auto">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500/50 border-t-orange-500 animate-spin" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Processing indicator */}
      <div className="mt-8 flex items-center gap-2 text-slate-500">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <span className="text-xs">Processing document...</span>
      </div>
    </div>
  );
}

export default AnalyzingState;
