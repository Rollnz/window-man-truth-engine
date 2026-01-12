import { cn } from '@/lib/utils';

interface SampleQuoteDocumentProps {
  className?: string;
}

export function SampleQuoteDocument({ className }: SampleQuoteDocumentProps) {
  return (
    <div 
      className={cn(
        "absolute inset-3 md:inset-4 rounded-lg overflow-hidden",
        "bg-card/80 border border-dashed border-border/60",
        "font-mono text-[10px] md:text-xs text-muted-foreground/60",
        "p-3 md:p-5 space-y-3",
        className
      )}
    >
      {/* Company Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="space-y-1">
          <div className="h-3 w-28 md:w-36 bg-muted/50 rounded" />
          <div className="h-2 w-20 md:w-24 bg-muted/30 rounded" />
        </div>
        <div className="text-right space-y-1">
          <div className="text-[9px] md:text-[10px] text-muted-foreground/40">EST. #00247</div>
          <div className="h-2 w-16 bg-muted/30 rounded" />
        </div>
      </div>

      {/* Customer Info */}
      <div className="flex gap-3 md:gap-6">
        <div className="space-y-1">
          <div className="text-[8px] md:text-[9px] uppercase tracking-wider text-muted-foreground/40">Bill To</div>
          <div className="h-2 w-20 bg-muted/30 rounded" />
          <div className="h-2 w-24 bg-muted/20 rounded" />
        </div>
        <div className="space-y-1">
          <div className="text-[8px] md:text-[9px] uppercase tracking-wider text-muted-foreground/40">Install At</div>
          <div className="h-2 w-20 bg-muted/30 rounded" />
          <div className="h-2 w-16 bg-muted/20 rounded" />
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-1.5 pt-2 border-t border-border/30">
        <div className="flex justify-between text-[8px] md:text-[9px] uppercase tracking-wider text-muted-foreground/40">
          <span>Description</span>
          <span>Amount</span>
        </div>
        
        {/* Line items */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="h-2.5 w-32 md:w-44 bg-muted/40 rounded" />
            <div className="h-2.5 w-12 md:w-16 bg-muted/30 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-2.5 w-28 md:w-36 bg-muted/35 rounded" />
            <div className="h-2.5 w-10 md:w-14 bg-muted/30 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-2.5 w-36 md:w-48 bg-muted/30 rounded" />
            <div className="h-2.5 w-14 md:w-18 bg-muted/30 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-2.5 w-24 md:w-32 bg-muted/25 rounded" />
            <div className="h-2.5 w-10 md:w-12 bg-muted/25 rounded" />
          </div>
        </div>
      </div>

      {/* Totals Section */}
      <div className="pt-2 border-t border-border/40 space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground/50">Subtotal</span>
          <div className="h-2.5 w-14 bg-muted/30 rounded" />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground/50">Permit Fees</span>
          <div className="h-2.5 w-10 bg-muted/30 rounded" />
        </div>
        <div className="flex justify-between font-medium pt-1 border-t border-border/30">
          <span className="text-muted-foreground/60">Total Due</span>
          <div className="h-3 w-16 bg-muted/50 rounded" />
        </div>
      </div>

      {/* Fine Print */}
      <div className="pt-2 space-y-1 opacity-40">
        <div className="h-1.5 w-full bg-muted/20 rounded" />
        <div className="h-1.5 w-11/12 bg-muted/20 rounded" />
        <div className="h-1.5 w-4/5 bg-muted/20 rounded" />
      </div>
    </div>
  );
}
