import { ArrowRight, Shield, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';

interface NoQuotePivotCondensedProps {
  onStartWithoutQuote?: () => void;
}

/**
 * NoQuotePivotCondensed
 * Compact version of NoQuotePivotSection for side-by-side layout with upload zone.
 * Provides alternative path for users without quotes.
 */
export function NoQuotePivotCondensed({ onStartWithoutQuote }: NoQuotePivotCondensedProps) {
  return (
    <div className="h-full rounded-xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col">
      {/* Header Label */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-4">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold text-muted-foreground">
          No Quote Yet?
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center text-center">
        <h3 className="text-xl font-bold text-foreground mb-3">
          That's actually the best time to find me.
        </h3>
        
        <p className="text-sm text-muted-foreground mb-2">
          I'm WindowMan — I meet homeowners <em className="text-primary">before</em> they get quotes.
        </p>
        
        <p className="text-xs text-muted-foreground/80">
          Once prices are on paper, the game changes.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-6 space-y-3">
        <Link to={ROUTES.FREE_ESTIMATE} className="block">
          <Button 
            variant="outline" 
            className="w-full gap-2 bg-background/80"
            onClick={onStartWithoutQuote}
          >
            <FileText className="w-4 h-4" />
            Build My Own Estimate
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
