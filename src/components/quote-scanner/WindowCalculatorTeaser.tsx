import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/navigation';

export function WindowCalculatorTeaser() {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 border border-border/50 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          
          <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
            {/* Left: Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium mb-4">
                <Calculator className="w-3.5 h-3.5" />
                Related Tool
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Know Your Numbers Before You Negotiate
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg">
                Our True Cost Calculator shows you exactly how much you're losing each month with old windows — 
                so you can negotiate from a position of knowledge, not desperation.
              </p>
              
              <Button asChild size="lg" className="gap-2">
                <Link to={ROUTES.COST_CALCULATOR}>
                  Try the Calculator
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Right: Visual */}
            <div className="flex-shrink-0 hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-emerald-500" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-500/30 animate-pulse" />
                <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-emerald-500/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
