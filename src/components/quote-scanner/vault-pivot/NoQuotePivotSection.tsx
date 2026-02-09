import { Link } from 'react-router-dom';
import { CheckCircle, Vault } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VaultAdvantageGrid } from './VaultAdvantageGrid';
import { VaultCTABlock } from './VaultCTABlock';
interface NoQuotePivotSectionProps {
  /** Mock handler for Google auth - will be wired to real Supabase later */
  onGoogleAuth?: () => void;
  onEmailSubmit?: (data: {
    firstName: string;
    lastName: string;
    email: string;
  }) => void;
  /** Loading state for submission - prevents double-submit */
  isLoading?: boolean;
  /** Success state - shows Vault ready message instead of form */
  isSubmitted?: boolean;
}

/**
 * NoQuotePivotSection
 * "The War Room" - Tactical Command Center conversion engine.
 * Light mode: Stone/cream with topographic contours
 * Dark mode: Dark stone with green radar grid
 */
export function NoQuotePivotSection({
  onGoogleAuth,
  onEmailSubmit,
  isLoading,
  isSubmitted
}: NoQuotePivotSectionProps) {
  // SUCCESS STATE - Mission Accepted
  if (isSubmitted) {
    return <section className="relative py-16 md:py-24 bg-stone-50 dark:bg-stone-950 overflow-hidden">
        {/* Tactical grid background */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(120,113,108,0.03)_0%,transparent_50%)] dark:bg-[linear-gradient(90deg,rgba(34,197,94,0.06)_1px,transparent_1px),linear-gradient(rgba(34,197,94,0.06)_1px,transparent_1px)] dark:bg-[size:40px_40px]" />
        
        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            {/* Success Icon - Tactical Checkmark */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            {/* Success Message */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-white mb-3">
              Mission Accepted. Your War Room is Ready.
            </h2>
            
            <p className="text-stone-600 dark:text-stone-300 mb-8">
              I just saved your place. When you get your first quote, 
              upload it here and I'll tell you if it's worth signing.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 uppercase tracking-wider">
                <Link to="/vault">
                  <Vault className="w-5 h-5 mr-2" />
                  Open My War Room
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-stone-300 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white h-12">
                <Link to="/spec-checklist-guide">
                  Get Quote Checklist
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>;
  }

  // DEFAULT FORM STATE - War Room Briefing
  return <section className="relative py-16 md:py-24 bg-stone-50 dark:bg-stone-950 overflow-hidden">
      {/* Tactical grid background */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(120,113,108,0.03)_0%,transparent_50%)] dark:bg-[linear-gradient(90deg,rgba(34,197,94,0.06)_1px,transparent_1px),linear-gradient(rgba(34,197,94,0.06)_1px,transparent_1px)] dark:bg-[size:40px_40px]" />
      
      <div className="container relative z-10 max-w-6xl mx-auto px-4">
        {/* Headline + Intro Copy */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 dark:text-white mb-6">
            Perfect. You Don't Have a Quote Yet.
          </h2>
          
          <p className="text-xl md:text-2xl text-emerald-600 dark:text-emerald-400 font-medium mb-4">
            That's actually the best time to find me.
          </p>
          
          <p className="text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            I'm WindowMan — and I try to meet homeowners{' '}
            <em className="text-stone-900 dark:text-white">before</em> they get quotes, not after.
            This is when I can be the most helpful to you.
          </p>
        </div>

        {/* Story + Fear Injection Block */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="text-sm md:text-base text-stone-500 dark:text-stone-400 leading-loose">
            I see this pattern all the time.
            <br />
            Someone gets door-knocked on a Friday… presentation Saturday… paperwork Sunday.
          </p>
          
          <p className="text-sm md:text-base text-stone-600 dark:text-stone-300 mt-4 leading-loose italic">
            A month later they're staring at their bank statement thinking,
            <br />
            <span className="text-stone-900 dark:text-white">"What the hell just happened?"</span>
          </p>
          
          <p className="text-sm text-stone-500 mt-4">
            It moves fast when you're not prepared.
          </p>
        </div>

        {/* Advantage Grid (Tactical Dossiers) */}
        <VaultAdvantageGrid />

        {/* Regret Micro-Injection */}
        <p className="text-center text-sm italic text-stone-500 mt-10">
          Almost every homeowner I work with says later,
          <br />
          <span className="text-stone-600 dark:text-stone-400">"I wish I had saved this before my first quote."</span>
        </p>

        {/* Vault CTA Block (War Room Entry) */}
        <VaultCTABlock onGoogleAuth={onGoogleAuth} onEmailSubmit={onEmailSubmit} isLoading={isLoading} />
      </div>
    </section>;
}