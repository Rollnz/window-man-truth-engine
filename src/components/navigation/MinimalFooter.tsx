import { Link } from 'react-router-dom';
import { Calculator, ScanSearch, Home, Grid3x3 } from 'lucide-react';

export function MinimalFooter() {
  return (
    <footer className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4 z-40">
      <div className="container px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {/* Primary Actions */}
          <Link
            to="/calculate-estimate"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>Get Quote</span>
          </Link>

          <Link
            to="/quote-scanner"
            className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ScanSearch className="w-4 h-4" />
            <span>Scan Quote</span>
          </Link>

          <span className="text-muted-foreground/30">|</span>

          {/* Navigation */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            <span>All Tools</span>
          </Link>

          <span className="text-muted-foreground/30">|</span>

          {/* Legal */}
          <Link
            to="/privacy"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
