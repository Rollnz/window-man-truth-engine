import { Link } from 'react-router-dom';
import { CheckCircle, Vault } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultAdvantageGrid } from './VaultAdvantageGrid';
import { VaultCTABlock } from './VaultCTABlock';

interface NoQuotePivotSectionProps {
  /** Mock handler for Google auth - will be wired to real Supabase later */
  onGoogleAuth?: () => void;
  onEmailSubmit?: (data: { firstName: string; lastName: string; email: string }) => void;
  /** Loading state for submission - prevents double-submit */
  isLoading?: boolean;
  /** Success state - shows Vault ready message instead of form */
  isSubmitted?: boolean;
}

/**
 * NoQuotePivotSection
 * Main conversion engine for users without quotes.
 * WindowMan voice, fear injection, advantage cards, and CTA.
 */
export function NoQuotePivotSection({ onGoogleAuth, onEmailSubmit, isLoading, isSubmitted }: NoQuotePivotSectionProps) {
  // SUCCESS STATE - User has submitted and is ready for Vault
  if (isSubmitted) {
    return (
      <div className="max-w-[680px] mx-auto p-8 md:p-10 rounded-xl border border-border/40 bg-background relative overflow-hidden">
        {/* Optional: Very subtle grid texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        
        <div className="relative z-10 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          
          {/* Success Message */}
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            You're In. Your Vault is Ready.
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            I just saved your place. When you get your first quote, 
            upload it here and I'll tell you if it's worth signing.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/vault">
                <Vault className="w-5 h-5 mr-2" />
                Open My Vault
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/spec-checklist-guide">
                Get Quote Checklist
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT FORM STATE
  return (
    <div className="max-w-[680px] mx-auto p-8 md:p-10 rounded-xl border border-border/40 bg-background relative overflow-hidden">
      {/* Optional: Very subtle grid texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      
      <div className="relative z-10">
        {/* Headline + Intro Copy */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Perfect. You don't have a quote yet.
          </h2>
          
          <p className="text-lg text-foreground mb-3">
            That's actually the best time to find me.
          </p>
          
          <p className="text-foreground leading-relaxed mb-3">
            I'm WindowMan — and I try to meet homeowners{' '}
            <em className="text-primary">before</em> they get quotes, not after.
            <br />
            This is when I can be the most helpful to you.
          </p>
          
          <p className="text-muted-foreground text-sm">
            Once prices are on paper, the game changes.
            <br />
            Before that? You still control the conversation.
          </p>
        </div>

        {/* Story + Fear Injection Block */}
        <div className="text-center mb-8 px-4">
          <p className="text-sm md:text-base text-muted-foreground leading-loose">
            I see this pattern all the time.
            <br />
            Someone gets door-knocked on a Friday… presentation Saturday… paperwork Sunday.
          </p>
          
          <p className="text-sm md:text-base text-foreground/80 mt-4 leading-loose italic">
            A month later they're staring at their bank statement thinking,
            <br />
            <span className="text-foreground">"What the hell just happened?"</span>
          </p>
          
          <p className="text-sm text-muted-foreground mt-4">
            It moves fast when you're not prepared.
          </p>
        </div>

        {/* Advantage Grid (Achilles Heel Stack) */}
        <VaultAdvantageGrid />

        {/* Regret Micro-Injection */}
        <p className="text-center text-sm italic text-muted-foreground/80 mt-8">
          Almost every homeowner I work with says later,
          <br />
          <span className="text-foreground/70">"I wish I had saved this before my first quote."</span>
        </p>

        {/* Vault CTA Block */}
        <VaultCTABlock 
          onGoogleAuth={onGoogleAuth}
          onEmailSubmit={onEmailSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
