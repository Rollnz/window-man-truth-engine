import { cn } from '@/lib/utils';

interface SampleQuoteDocumentProps {
  className?: string;
}

export function SampleQuoteDocument({ className }: SampleQuoteDocumentProps) {
  return (
    <div 
      className={cn(
        "absolute inset-3 md:inset-4 rounded-lg overflow-hidden",
        "bg-transparent",
        "font-mono text-muted-foreground/50",
        "p-3 md:p-5 space-y-2.5",
        className
      )}
    >
      {/* Company Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="space-y-0.5">
          <p className="text-[10px] md:text-xs font-bold tracking-tight">Impact Window Solutions LLC</p>
          <p className="text-[8px] md:text-[10px]">License #CGC-04928 · Deerfield Beach, FL</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[9px] md:text-[10px] font-semibold">Project Estimate #2847</p>
          <p className="text-[8px] md:text-[9px]">Date: 01/15/2025</p>
        </div>
      </div>

      {/* Project Summary */}
      <div className="space-y-1">
        <p className="text-[9px] md:text-[10px] uppercase tracking-wider font-semibold">Project Summary</p>
        <div className="flex gap-4 md:gap-8 text-[8px] md:text-[9px]">
          <span>Customer: John Smith</span>
          <span>Date: May 28, 2025</span>
          <span>Windows: 5</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-1 pt-1 border-t border-border/30">
        <div className="flex justify-between text-[8px] md:text-[9px] uppercase tracking-wider font-semibold pb-0.5">
          <span>Description</span>
          <span>Amount</span>
        </div>
        
        <div className="space-y-1 text-[9px] md:text-[10px]">
          <div className="flex justify-between">
            <span>SWI Single Hung Window (24×48)</span>
            <span>$3,500</span>
          </div>
          <div className="flex justify-between">
            <span>Picture Window — Fixed (60×48)</span>
            <span>$3,600</span>
          </div>
          <div className="flex justify-between">
            <span>Horizontal Roller (36×24)</span>
            <span>$1,561</span>
          </div>
          <div className="flex justify-between">
            <span>Permit & Inspection Fees</span>
            <span>$485</span>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="pt-1.5 border-t border-border/40 flex justify-between text-[10px] md:text-xs font-bold">
        <span>Project Cost</span>
        <span>$8,661</span>
      </div>

      {/* Fine Print */}
      <div className="pt-1.5 space-y-0.5 text-[7px] md:text-[8px] opacity-60 leading-tight">
        <p>* Subject to final measurement. Pricing may vary.</p>
        <p>* 20-year product warranty. 1-year labor warranty.</p>
        <p>* "Subject to remeasure" clause applies to all line items.</p>
      </div>
    </div>
  );
}
