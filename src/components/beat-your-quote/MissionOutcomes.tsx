import { useEffect, useRef, useState } from 'react';
import { CaseFileCard } from './CaseFileCard';
import { trackEvent } from '@/lib/gtm';
const caseFiles = [{
  caseNumber: 'CASE FILE #1',
  headline: "The 'Today Only' Trap Neutralized",
  homeowner: 'Sarah J.',
  location: 'Boca Raton, FL',
  scenario: "High-pressure sales. Told me the price would double if I didn't sign by midnight.",
  originalQuote: 24500,
  bloatDetected: 8200,
  finalPrice: 16300,
  testimonial: "I almost signed out of panic. The Window Man scanner stripped away the commission and 'urgency tax' in 20 minutes. I got the exact same impact rating for $8k less. They showed me exactly where the bloat was hiding—sales commission, marketing fees, the whole playbook. Now I tell everyone: never sign the same day.",
  status: 'DEFEATED' as const
}, {
  caseNumber: 'CASE FILE #2',
  headline: 'Inferior Glass Disguised as Premium',
  homeowner: 'The Martinez Family',
  location: 'Coral Gables, FL',
  scenario: "The quote was confusing. Lots of fancy names for standard glass.",
  competitorSpec: 'Aluminum / Standard Low-E',
  windowManSpec: 'Vinyl / Double-Stack Low-E',
  savings: 3400,
  testimonial: "They weren't just cheaper; they upgraded me. The analysis showed the other guy was charging Mercedes prices for a Honda. Window Man got us superior specs—vinyl frames, double-stack Low-E glass—for less money. We're still shocked. The contractor tried to blur the specs, but the scanner caught everything.",
  status: 'UPGRADED' as const
}, {
  caseNumber: 'CASE FILE #3',
  headline: 'The Honest Contractor Found',
  homeowner: 'Mark D.',
  location: 'Tampa, FL',
  scenario: "I found a local guy with a great price but was terrified it was too good to be true.",
  riskAnalysis: '0 Flags Detected',
  priceCheck: 'Fair Market Value Confirmed',
  outcome: 'Sign this quote immediately.',
  testimonial: "I uploaded my quote expecting them to try and undercut it. Instead, they told me I found a unicorn and to sign it ASAP. They didn't make a dime off me, but they earned my trust forever. When I need my next project done, I'm coming back to Window Man first. That kind of honesty is rare.",
  status: 'VALIDATED' as const
}];
export function MissionOutcomes() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        trackEvent('mission_outcomes_viewed');
        observer.disconnect();
      }
    }, {
      threshold: 0.2
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  return <section ref={sectionRef} id="mission-outcomes" className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
      backgroundSize: '40px 40px'
    }} />

      <div className="container relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-12 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Section Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-mono text-primary tracking-widest">
              MISSION OUTCOMES
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Three Homeowners. Three Quotes.
            <br />
            <span className="text-primary">Three Outcomes.</span>
          </h2>

          {/* Subhead */}
          <p className="text-lg max-w-2xl mx-auto mb-4 text-primary-foreground">
            Every case is different. Some quotes we beat. Some we upgrade.
            Some we validate as fair. Here's what that looks like.
          </p>

          {/* Disclaimer */}
          <p className="text-xs max-w-lg mx-auto text-secondary">
            Names used with permission. Competitor details redacted for legal compliance.
          </p>
        </div>

        {/* Case Files Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 px-2">
          {caseFiles.map((caseFile, index) => (
            <div key={caseFile.caseNumber} className="relative">
              {/* Subtle divider between cards on mobile */}
              {index > 0 && (
                <div className="lg:hidden absolute -top-4 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              )}
              <div 
                className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`} 
                style={{ transitionDelay: `${300 + index * 200}ms` }}
              >
                <CaseFileCard data={caseFile} index={index} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>;
}