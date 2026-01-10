import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SessionData } from '@/hooks/useSessionData';
import { convertBillRangeToNumber } from '@/lib/calculations';
import { ROUTES } from '@/config/navigation';

interface ComparisonHeroProps {
  sessionData: SessionData;
}

export function ComparisonHero({ sessionData }: ComparisonHeroProps) {
  const hasData = sessionData.currentEnergyBill || sessionData.windowCount;
  const monthlyBill = convertBillRangeToNumber(sessionData.currentEnergyBill);
  const windowCount = sessionData.windowCount || 10;

  return (
    <section className="relative py-12 md:py-16 border-b border-border overflow-hidden">
      <div className="container px-4">
        {/* Back button */}
        <Link 
          to={ROUTES.HOME} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tools</span>
        </Link>

        {/* Title */}
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Window <span className="text-primary text-glow">Comparison Engine</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            See the real cost of "cheap" windows over 10 years. 
            The numbers don't lie — cheap upfront often means expensive over time.
          </p>

          {/* Personalization banner */}
          {hasData ? (
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30">
              <Info className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                Personalized for your <span className="font-semibold text-primary">${monthlyBill}/month</span> energy bill 
                and <span className="font-semibold text-primary">{windowCount} windows</span>
              </p>
            </div>
          ) : (
            <Link 
              to={ROUTES.COST_CALCULATOR}
              className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-muted border border-border hover:border-primary/50 transition-colors"
            >
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">Want personalized results?</span> 
                {' '}Enter your details in the Cost Calculator first.
              </p>
            </Link>
          )}
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 pointer-events-none gradient-radial opacity-50" />
    </section>
  );
}