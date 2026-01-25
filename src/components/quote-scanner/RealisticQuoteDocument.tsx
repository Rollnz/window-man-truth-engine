import { cn } from '@/lib/utils';

interface RealisticQuoteDocumentProps {
  className?: string;
}

/**
 * RealisticQuoteDocument - A realistic-looking window replacement estimate
 * with actual text, prices, and line items to improve visual appeal and tease.
 */
export function RealisticQuoteDocument({ className }: RealisticQuoteDocumentProps) {
  return (
    <div 
      className={cn(
        "absolute inset-3 md:inset-4 rounded-lg overflow-hidden",
        "bg-card/90 border border-border/60",
        "font-mono text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground",
        "p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3",
        // Paper texture effect
        "shadow-inner",
        className
      )}
    >
      {/* Company Header */}
      <div className="flex items-start justify-between border-b border-border/50 pb-2">
        <div className="space-y-0.5">
          <div className="text-[10px] sm:text-xs md:text-sm font-bold text-foreground/80 tracking-tight">
            IMPACT WINDOW SOLUTIONS LLC
          </div>
          <div className="text-muted-foreground/60">
            123 Hurricane Way, Miami FL 33101
          </div>
        </div>
        <div className="text-right space-y-0.5">
          <div className="text-muted-foreground/50 uppercase tracking-wider">
            Est. #00247
          </div>
          <div className="text-muted-foreground/60">01/15/2026</div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex gap-4 sm:gap-6 md:gap-8 text-muted-foreground/70">
        <div className="space-y-0.5">
          <div className="text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground/40 font-semibold">
            Bill To
          </div>
          <div>John Homeowner</div>
          <div className="text-muted-foreground/50">456 Palm Street</div>
          <div className="text-muted-foreground/50">Fort Lauderdale, FL</div>
        </div>
        <div className="space-y-0.5 hidden sm:block">
          <div className="text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground/40 font-semibold">
            Install At
          </div>
          <div className="text-muted-foreground/50">Same Address</div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-1 pt-2 border-t border-border/40">
        {/* Header */}
        <div className="flex justify-between text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground/40 font-semibold pb-1">
          <span>Description</span>
          <span>Amount</span>
        </div>
        
        {/* Line items */}
        <div className="space-y-1 text-muted-foreground/70">
          <div className="flex justify-between">
            <span>Impact Windows (6) - PGT WinGuard</span>
            <span className="tabular-nums">$4,200.00</span>
          </div>
          <div className="flex justify-between">
            <span>Impact Sliding Door (1) - 8ft</span>
            <span className="tabular-nums">$1,850.00</span>
          </div>
          <div className="flex justify-between">
            <span>Installation Labor</span>
            <span className="tabular-nums">$1,400.00</span>
          </div>
          <div className="flex justify-between text-muted-foreground/50">
            <span>Permit & Inspection Fees</span>
            <span className="tabular-nums">$450.00</span>
          </div>
          <div className="flex justify-between text-muted-foreground/50">
            <span>Disposal & Cleanup</span>
            <span className="tabular-nums">$250.00</span>
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="pt-2 border-t border-border/50 space-y-1">
        <div className="flex justify-between text-muted-foreground/60">
          <span>Subtotal</span>
          <span className="tabular-nums">$8,150.00</span>
        </div>
        <div className="flex justify-between text-muted-foreground/50">
          <span>Tax (6.25%)</span>
          <span className="tabular-nums">$511.00</span>
        </div>
        <div className="flex justify-between font-bold text-foreground/80 pt-1 border-t border-border/40">
          <span>TOTAL DUE</span>
          <span className="tabular-nums text-[11px] sm:text-xs md:text-sm">$8,661.00</span>
        </div>
      </div>

      {/* Fine Print */}
      <div className="pt-2 space-y-0.5 text-[6px] sm:text-[7px] text-muted-foreground/40 leading-tight">
        <div>* Warranty terms subject to manufacturer guidelines</div>
        <div>* 50% deposit required to begin work</div>
        <div>* Final payment due upon completion</div>
      </div>
    </div>
  );
}
