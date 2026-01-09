// ============================================
// Quote Builder - Field Label Component
// ============================================

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FieldLabelProps } from "@/types/quote-builder";

export const FieldLabel = ({ label, tooltip }: FieldLabelProps) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-help transition-colors" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-white border border-slate-200 text-slate-600 text-xs p-3 shadow-xl">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);
