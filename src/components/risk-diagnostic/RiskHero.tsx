import { Shield, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { SessionData } from '@/hooks/useSessionData';
import { ROUTES } from '@/config/navigation';

interface RiskHeroProps {
  sessionData: SessionData;
  onStart: () => void;
  hasStarted: boolean;
}

export function RiskHero({ sessionData, onStart, hasStarted }: RiskHeroProps) {
  const hasPersonalization = sessionData.homeSize || sessionData.windowCount || sessionData.windowAge;

  if (hasStarted) {
    return null;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-radial opacity-50" />

      <div className="relative px-4 py-8 sm:py-12 text-center max-w-2xl mx-auto">
        {/* Back link */}
        <Link 
          to={ROUTES.HOME} 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Tools
        </Link>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 relative">
          <Shield className="w-8 h-8 text-primary opacity-40" />
          <img 
  src="/favicon.png" 
  alt="Logo" 
  className="absolute w-4 h-4 object-contain" 
  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
/>
        </div>

        {/* Badge */}
        <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
          Tool #6: Protection Gap Analysis
        </Badge>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Discover Your{' '}
          <span className="text-primary text-glow">Protection Gaps</span>
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg mb-6 max-w-lg mx-auto">
          Answer 12 quick questions to identify vulnerabilities in your home's 
          window protection and unlock potential insurance savings.
        </p>

        {/* Personalization banner */}
        {hasPersonalization && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border mb-6 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-medium">Personalized for you: </span>
              {sessionData.homeSize && `${sessionData.homeSize.toLocaleString()} sq ft home`}
              {sessionData.windowCount && ` • ${sessionData.windowCount} windows`}
              {sessionData.windowAge && ` • ${sessionData.windowAge} old`}
            </p>
          </div>
        )}

        {/* CTA */}
        <Button size="lg" onClick={onStart} className="glow-sm">
          Start My Protection Analysis
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>

        {/* Time estimate */}
        <p className="text-sm text-muted-foreground mt-4">
          Takes about 2-3 minutes
        </p>
      </div>
    </div>
  );
}