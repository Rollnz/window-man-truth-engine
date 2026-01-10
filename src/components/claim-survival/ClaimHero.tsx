import { Shield, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClaimHeroProps {
  onCreateVaultClick: () => void;
  onEmergencyToggle: () => void;
  isEmergencyMode: boolean;
  isUnlocked: boolean;
}

export function ClaimHero({ 
  onCreateVaultClick, 
  onEmergencyToggle,
  isEmergencyMode,
  isUnlocked 
}: ClaimHeroProps) {
  return (
    <section className="py-12 md:py-20">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            The Impact Window{' '}
            <span className="text-primary">Claim Survival System</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The documentation framework Florida insurers expect. Gather proof now—before adjusters ask for it.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Badge variant="secondary" className="px-3 py-1.5 text-sm">
              <CheckCircle className="w-4 h-4 mr-1.5 text-primary" />
              7 Critical Documents
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5 text-sm">
              <FileText className="w-4 h-4 mr-1.5 text-primary" />
              Photo Protocol Included
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5 text-sm">
              <Shield className="w-4 h-4 mr-1.5 text-primary" />
              Adjuster-Ready Format
            </Badge>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={onCreateVaultClick}
              className="w-full sm:w-auto glow"
            >
              <Shield className="mr-2 h-5 w-5" />
              {isUnlocked ? 'View My Vault' : 'Create My Free Claim Vault'}
            </Button>
            
            <Button 
              size="lg" 
              variant="destructive"
              onClick={onEmergencyToggle}
              className={`w-full sm:w-auto ${!isEmergencyMode ? 'animate-pulse' : ''}`}
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              {isEmergencyMode ? 'Viewing Crisis Protocol' : 'I Have Damage NOW'}
            </Button>
          </div>

          {/* Emergency Mode Indicator */}
          {isEmergencyMode && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-medium">
                Crisis Mode Active — Scroll down for 24-hour action plan
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
