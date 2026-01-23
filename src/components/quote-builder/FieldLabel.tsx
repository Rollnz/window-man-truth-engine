// ============================================
// Quote Builder - Field Label Component
// ============================================

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FieldLabelProps } from "@/types/quote-builder";

export const FieldLabel = ({ label, tooltip }: FieldLabelProps) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-sm font-semibold text-foreground">{label}</span>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-popover border border-border text-popover-foreground text-xs p-3 shadow-xl">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </div>
);