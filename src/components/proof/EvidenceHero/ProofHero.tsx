import { Shield, FileSearch, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { proofStats } from '@/data/proof/proofData';
import { EvidenceStat } from '../EvidenceStat';

interface ProofHeroProps {
  onWatchVoiceAgent: () => void;
  onViewCaseStudies: () => void;
}

/**
 * ProofHero - Consumer Advocate Positioning
 * Light, trust-forward design. Not dark intelligence-room.
 * Emotional arc: Curious → Safe → Informed
 * 
 * Motion: Uses wm-reveal + stagger for child-level entrance animations
 */
export function ProofHero({ onWatchVoiceAgent, onViewCaseStudies }: ProofHeroProps) {
  return (
    <section 
      className="pt-20 pb-12 md:pt-28 md:pb-20 relative overflow-hidden"
      data-inview="true" // Hero is always visible on load
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        {/* Header Block */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          {/* Eyebrow */}
          <div className="wm-reveal wm-stagger-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">The Evidence Locker</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="wm-reveal wm-stagger-1 text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Real-Time Data.{' '}
            <span className="text-primary">Verified Savings.</span>{' '}
            Homeowner Wins.
          </h1>
          
          {/* Subheadline - Trust statement */}
          <p className="wm-reveal wm-stagger-2 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            We do not ask for trust. We earn it—through transparent data, AI-audited quotes, 
            and the documented outcomes of{' '}
            <span className="font-semibold text-foreground">{proofStats.totalHomeowners}+ Florida homeowners</span>{' '}
            who beat inflated window pricing, hidden specs, and insurance blind spots.
          </p>
          
          {/* CTA Cluster */}
          <div className="wm-reveal wm-stagger-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onWatchVoiceAgent}
              className="gap-2 wm-btn-press"
            >
              <FileSearch className="w-5 h-5" />
              Watch the AI Voice Agent Expose a Quote
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={onViewCaseStudies}
              className="gap-2 wm-btn-press"
            >
              <Users className="w-5 h-5" />
              View Verified Case Studies
            </Button>
          </div>
        </div>

        {/* Live Proof Counters */}
        <div className="wm-reveal wm-stagger-4 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <EvidenceStat
            label="Florida Homeowners Helped"
            value={proofStats.totalHomeowners}
            suffix="+"
            variant="primary"
            showVerified
          />
          <EvidenceStat
            label="Avg. Overpricing Identified"
            value={proofStats.averageOverpricing}
            prefix="$"
            variant="primary"
          />
          <EvidenceStat
            label="Total Savings Found"
            value={proofStats.totalSavingsIdentified}
            variant="success"
          />
          <EvidenceStat
            label="Insurance Premium Reduction"
            value={proofStats.insurancePremiumReduction}
            variant="success"
          />
        </div>
      </div>
    </section>
  );
}
