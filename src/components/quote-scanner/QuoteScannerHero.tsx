import { ScanSearch } from 'lucide-react';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';

export function QuoteScannerHero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <ShimmerBadge className="mb-6" />
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ScanSearch className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Is Your Window Quote Fair?{' '}
            <span className="text-primary">AI Analysis in 60 Seconds</span>
          </h1>
          
          {/* Subtext */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            Stop guessing. Upload a photo of your contractor's quote and let our AI flag hidden risks, 
            missing scope, and overpricing — in seconds.
          </p>

          {/* Before/After context line */}
          <p className="text-sm text-muted-foreground/70 font-medium tracking-wide uppercase">
            See what our AI finds in seconds ↓
          </p>
        </div>
      </div>
    </section>
  );
}
