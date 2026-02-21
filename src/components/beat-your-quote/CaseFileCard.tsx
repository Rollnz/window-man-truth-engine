import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
interface CaseFileData {
  caseNumber: string;
  headline: string;
  homeowner: string;
  location: string;
  scenario: string;
  originalQuote?: number;
  bloatDetected?: number;
  finalPrice?: number;
  competitorSpec?: string;
  windowManSpec?: string;
  savings?: number;
  riskAnalysis?: string;
  priceCheck?: string;
  outcome?: string;
  testimonial: string;
  status: 'DEFEATED' | 'UPGRADED' | 'VALIDATED';
}
interface CaseFileCardProps {
  data: CaseFileData;
  index: number;
}
export function CaseFileCard({
  data,
  index
}: CaseFileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusColors = {
    DEFEATED: 'bg-red-500/20 text-red-400 border-red-500/40',
    UPGRADED: 'bg-primary/20 text-primary border-primary/40',
    VALIDATED: 'bg-green-500/20 text-green-400 border-green-500/40'
  };
  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState) {
      trackEvent('case_file_expanded', {
        case_number: data.caseNumber
      });
    }
  };
  return <div className={`bg-dossier-folder border border-white/5 rounded-lg overflow-hidden shadow-xl transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] hover:scale-[1.02] hover:-translate-y-1 ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'}`} style={{
    animationDelay: `${index * 150}ms`
  }}>
      {/* Header */}
      <div className="p-5 pb-4">
        {/* Case Number */}
        <div className="text-sm font-mono text-primary-foreground mb-3 tracking-declassified uppercase font-bold">
          {data.caseNumber}
        </div>

        {/* Headline - Typewriter effect */}
        <h3 className="text-lg font-bold text-primary-foreground mb-3 font-typewriter" style={{
        textDecoration: 'underline',
        textDecorationColor: 'hsl(var(--primary) / 0.4)',
        textUnderlineOffset: '4px'
      }}>
          {data.headline}
        </h3>

        {/* Homeowner Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span className="font-semibold text-primary-foreground">{data.homeowner}</span>
          <span>•</span>
          <span>{data.location}</span>
        </div>

        {/* Scenario Quote */}
        <p className="text-sm italic mb-4 text-primary-foreground">
          "{data.scenario}"
        </p>

        {/* Intel Section */}
        <div className="bg-background/50 border border-border/30 rounded p-4 mb-4">
          <div className="text-xs font-mono tracking-widest mb-3 text-foreground">
            THE INTEL
          </div>

          <div className="space-y-2 text-sm font-mono">
            {/* Contractor - Redacted */}
            <div className="flex justify-between">
              <span className="text-foreground">Contractor:</span>
              <span className="bg-muted-foreground/80 text-transparent select-none px-8 rounded">
                REDACTED
              </span>
            </div>

            {/* Type 1: Defeated Quote */}
            {data.originalQuote && <>
                <div className="flex justify-between">
                  <span className="text-foreground">Original Quote:</span>
                  <span className="text-primary">${data.originalQuote.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Bloat Detected:</span>
                  <span className="text-red-400">-${data.bloatDetected?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-2 mt-2">
                  <span className="text-foreground">Window Man Price:</span>
                  <span className="text-primary font-bold">${data.finalPrice?.toLocaleString()}</span>
                </div>
              </>}

            {/* Type 2: Upgraded Specs */}
            {data.competitorSpec && <>
                <div className="flex justify-between">
                  <span className="text-foreground">Competitor Spec:</span>
                  <span className="text-red-400 line-through">{data.competitorSpec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Window Man Spec:</span>
                  <span className="text-primary">{data.windowManSpec}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-2 mt-2">
                  <span className="text-foreground">Savings:</span>
                  <span className="text-primary font-bold">${data.savings?.toLocaleString()}</span>
                </div>
              </>}

            {/* Type 3: Validated Quote */}
            {data.riskAnalysis && <>
                <div className="flex justify-between">
                  <span className="text-foreground">Risk Analysis:</span>
                  <span className="text-green-400">{data.riskAnalysis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Price Check:</span>
                  <span className="text-green-400">{data.priceCheck}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-2 mt-2">
                  <span className="text-foreground">Outcome:</span>
                  <span className="text-green-400 font-bold">{data.outcome}</span>
                </div>
              </>}
          </div>
        </div>

        {/* Expand Toggle */}
        <button onClick={handleToggle} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
          <span>{isExpanded ? 'Hide' : 'Read'} full debrief →</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable Testimonial */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 border-t border-border/30 pt-4">
          <p className="text-sm leading-relaxed italic text-secondary-foreground">
            "{data.testimonial}"
          </p>
          <p className="text-xs mt-3 text-slate-400">
            — {data.homeowner}, {data.location}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="px-5 pb-5">
        <div className={`inline-block px-4 py-2 rounded border-2 font-mono text-xs tracking-declassified uppercase font-bold transform -rotate-2 ${statusColors[data.status]}`}>
          STATUS: {data.status}
        </div>
      </div>
    </div>;
}