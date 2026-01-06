import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, ArrowRight, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';

interface OutcomeFoldersProps {
  isVisible: boolean;
}

export function OutcomeFolders({ isVisible }: OutcomeFoldersProps) {
  const navigate = useNavigate();
  const [activeOutcome, setActiveOutcome] = useState<'alpha' | 'bravo' | null>(null);

  const handleOutcomeClick = (outcome: 'alpha' | 'bravo') => {
    setActiveOutcome(activeOutcome === outcome ? null : outcome);
    trackEvent('outcome_folder_opened', { outcome });
  };

  const handleStartMission = () => {
    trackEvent('start_mission_clicked');
    navigate('/quote-scanner');
  };

  return (
    <div className={`
      space-y-8 transition-all duration-700
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
    `}>
      {/* Section Divider */}
      <div className="flex items-center justify-center gap-4 py-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00D4FF]/30" />
        <Zap className="w-5 h-5 text-[#00D4FF]" />
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00D4FF]/30" />
      </div>

      {/* Header Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10">
          <ClipboardCheck className="w-4 h-4 text-[#00D4FF]" />
          <span className="text-sm font-mono tracking-wider text-[#00D4FF]">
            MISSION OUTCOME BRIEFING
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-bold text-center font-mono">
        <span className="text-white">TWO POSSIBLE </span>
        <span className="text-[#00D4FF]">OUTCOMES</span>
      </h3>
      
      <p className="text-center text-muted-foreground">
        Tap each folder to reveal what happens next.
      </p>

      {/* Outcome Folders */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Outcome Alpha - We Beat It */}
        <div 
          className={`
            cursor-pointer rounded-lg border transition-all duration-300
            ${activeOutcome === 'alpha' 
              ? 'border-green-500/60 bg-green-950/20' 
              : 'border-border/40 bg-background/5 hover:border-green-500/40'
            }
          `}
          onClick={() => handleOutcomeClick('alpha')}
        >
          <div className="p-4 flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${activeOutcome === 'alpha' ? 'bg-green-500/20' : 'bg-green-500/10'}
            `}>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-400 uppercase tracking-wide font-mono">
                WE BEAT IT
              </h4>
              <p className="text-sm text-muted-foreground">We beat your quote</p>
            </div>
            {activeOutcome === 'alpha' && (
              <span className="text-xs font-mono text-green-400/60 tracking-wider">OUTCOME ALPHA</span>
            )}
          </div>
          
          {/* Expanded Content */}
          {activeOutcome === 'alpha' && (
            <div className="px-4 pb-6 animate-fade-in">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <ClipboardCheck className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide font-mono">Mission Successful</span>
              </div>
              
              <div className="p-4 rounded-lg bg-green-900/30 border border-green-500/20 mb-4">
                <div className="text-sm text-muted-foreground mb-1">Average Savings</div>
                <div className="text-3xl font-bold text-green-400 font-mono">$4,200</div>
              </div>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Receive a verified quote from our contractor network
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Same materials, same quality, less markup
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Proceed to contract with confidence
                </li>
              </ul>
              
              <p className="text-center text-sm text-green-400/60 italic mt-4">
                "You just saved enough for a family vacation."
              </p>
            </div>
          )}
        </div>

        {/* Outcome Bravo - Quote Validated */}
        <div 
          className={`
            cursor-pointer rounded-lg border transition-all duration-300
            ${activeOutcome === 'bravo' 
              ? 'border-[#00D4FF]/60 bg-[#00D4FF]/5' 
              : 'border-border/40 bg-background/5 hover:border-[#00D4FF]/40'
            }
          `}
          onClick={() => handleOutcomeClick('bravo')}
        >
          <div className="p-4 flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${activeOutcome === 'bravo' ? 'bg-[#00D4FF]/20' : 'bg-[#00D4FF]/10'}
            `}>
              <Shield className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#00D4FF] uppercase tracking-wide font-mono">
                QUOTE VALIDATED
              </h4>
              <p className="text-sm text-muted-foreground">We can't beat it</p>
            </div>
            {activeOutcome === 'bravo' && (
              <span className="text-xs font-mono text-[#00D4FF]/60 tracking-wider">OUTCOME BRAVO</span>
            )}
          </div>
          
          {/* Expanded Content */}
          {activeOutcome === 'bravo' && (
            <div className="px-4 pb-6 animate-fade-in">
              <div className="flex items-center gap-2 text-[#00D4FF] mb-4">
                <Shield className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide font-mono">Intel Confirmed</span>
              </div>
              
              <div className="p-4 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 mb-4">
                <div className="text-sm text-muted-foreground mb-1">Your Quote Status</div>
                <div className="text-2xl font-bold text-[#00D4FF] font-mono">COMPETITIVE</div>
              </div>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span>
                  Your original quote is confirmed as fair market value
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span>
                  No hidden markups detected
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span>
                  Proceed with your contractor confidently
                </li>
              </ul>
              
              <p className="text-center text-sm text-[#00D4FF]/60 italic mt-4">
                "We'll even tell you to take it."
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Win-Win Message */}
      <div className="max-w-lg mx-auto p-6 rounded-lg border border-border/30 bg-background/5 text-center">
        <p className="text-lg">
          Either way, <span className="text-[#00D4FF] font-bold">you win.</span>
        </p>
        <p className="text-sm text-[#00D4FF]/60 italic mt-2">
          "The only failed mission is the one you never start."
        </p>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button 
          onClick={handleStartMission}
          className="bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold px-8 py-6 text-lg uppercase tracking-wider"
        >
          Start Your Mission
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          Upload your quote. Get results in 24 hours.
        </p>
      </div>
    </div>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
