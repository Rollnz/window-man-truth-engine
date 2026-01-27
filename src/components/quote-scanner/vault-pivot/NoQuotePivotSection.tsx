import { VaultAdvantageGrid } from './VaultAdvantageGrid';
import { VaultCTABlock } from './VaultCTABlock';

interface NoQuotePivotSectionProps {
  /** Mock handler for Google auth - will be wired to real Supabase later */
  onGoogleAuth?: () => void;
  onEmailSubmit?: (data: { firstName: string; lastName: string; email: string }) => void;
}

/**
 * NoQuotePivotSection
 * Main conversion engine for users without quotes.
 * WindowMan voice, fear injection, advantage cards, and CTA.
 */
export function NoQuotePivotSection({ onGoogleAuth, onEmailSubmit }: NoQuotePivotSectionProps) {
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
        />
      </div>
    </div>
  );
}
