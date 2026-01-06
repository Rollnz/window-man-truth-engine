import { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { StampBadge } from './StampBadge';
import { trackEvent } from '@/lib/gtm';

const TACTICS = [
  {
    id: 'binder-trap',
    number: '01',
    title: 'The Binder Trap',
    description: 'They show up with a professionally printed binder full of certifications, awards, and testimonials. It looks impressive—until you realize every contractor has the same binder from the same marketing company. The binder exists to make you feel like you\'re dealing with a premium company worth premium prices.'
  },
  {
    id: 'three-hour-sit',
    number: '02',
    title: 'The Three-Hour Sit',
    description: 'They won\'t leave. What was supposed to be a "quick estimate" turns into a marathon presentation. They\'re not being thorough—they\'re wearing you down. The longer they stay, the more likely you are to sign just to end the meeting. It\'s psychological warfare disguised as customer service.'
  },
  {
    id: 'financing-fog',
    number: '03',
    title: 'Financing Fog',
    description: 'Instead of telling you the total price, they talk about "just $189 per month." They\'re hiding a $35,000 price tag behind affordable-sounding payments. When you do the math on that 15-year loan, you\'re paying nearly double. The fog is intentional.'
  },
  {
    id: 'manager-call',
    number: '04',
    title: 'The Manager Call',
    description: 'When you hesitate, they dramatically call their "manager" to get you a "special discount." The manager was always going to approve it. The original price was inflated specifically so they could perform this theater. You\'re not getting a deal—you\'re getting manipulated.'
  },
  {
    id: 'today-only',
    number: '05',
    title: 'Today-Only Pricing',
    description: '"This price is only good if you sign tonight." False. The price will be the same tomorrow, next week, and next month. They create artificial urgency because they know if you sleep on it, you\'ll shop around and find out you\'re being overcharged by 40%.'
  },
  {
    id: 'good-better-best',
    number: '06',
    title: 'The Good-Better-Best',
    description: 'They present three options: a cheap one that sounds risky, an expensive "premium" option, and a "best value" middle option. The middle option is what they wanted to sell you all along—it just looks reasonable next to the inflated alternatives. Classic anchoring psychology.'
  },
  {
    id: 'storm-fear',
    number: '07',
    title: 'Fear of the Storm',
    description: '"Hurricane season is coming. Do you really want to wait?" They weaponize your fear of natural disasters to rush your decision. The truth? Quality window installation takes weeks to schedule anyway. Their urgency has nothing to do with protecting you and everything to do with closing you.'
  },
  {
    id: 'neighbor-drop',
    number: '08',
    title: 'The Neighbor Drop',
    description: '"We just did the Johnson\'s house down the street." Sometimes true, often fabricated. They name-drop neighbors to create social proof and make you feel like everyone is choosing them. Even when true, the Johnsons probably overpaid too.'
  },
  {
    id: 'warranty-theater',
    number: '09',
    title: 'Warranty Theater',
    description: '"Lifetime warranty!" Sounds amazing until you read the fine print. The warranty is often prorated, meaning it\'s worth almost nothing after 10 years. And it only covers the glass—not the frame, the seals, or the labor to replace it. The warranty that matters is the one they don\'t advertise.'
  },
  {
    id: 'deposit-rush',
    number: '10',
    title: 'The Deposit Rush',
    description: '"We just need a small deposit to lock in your spot." Then comes 50% upfront. Then the "materials fee." Before you know it, you\'ve paid 70% before they\'ve installed a single window. If something goes wrong, you have zero leverage.'
  },
  {
    id: 'comparison-blocking',
    number: '11',
    title: 'Comparison Blocking',
    description: 'They make their quote impossible to compare. Vague line items, proprietary product names, bundled pricing. You can\'t get an apples-to-apples comparison because they don\'t want you to. Transparency is the enemy of overpriced quotes.'
  }
];

export function ManipulationTactics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedView) {
            trackEvent('manipulation_section_viewed');
            setHasTrackedView(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasTrackedView]);

  const handleTacticOpen = (tacticId: string) => {
    if (tacticId) {
      trackEvent('tactic_expanded', { tactic_id: tacticId });
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="tactics"
      className="py-20 px-4 bg-[#0A0F14]"
    >
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <StampBadge variant="red">Declassified Intel</StampBadge>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold font-mono mb-4">
            <span className="text-white">THE 11 </span>
            <span className="text-red-400">MANIPULATION</span>
            <span className="text-white"> TACTICS</span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Contractors train for months to use these psychological weapons against you. 
            Now you can see them coming.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Image - Sticky on Desktop */}
          <div className="lg:sticky lg:top-24 order-2 lg:order-1">
            <div className="relative rounded-xl overflow-hidden border border-red-500/30">
              <img 
                src="/images/beat-your-quote/manipulation-tactics.webp"
                alt="Contractor manipulation tactics exposed"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F14] via-transparent to-transparent" />
              
              {/* Overlay Badge */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-[#0A0F14]/90 backdrop-blur-sm border border-red-500/40 rounded-lg p-4">
                  <p className="text-sm text-red-400 font-mono mb-1">THREAT LEVEL</p>
                  <p className="text-white font-bold">HIGH - Active in 94% of in-home sales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Accordion */}
          <div className="order-1 lg:order-2">
            <Accordion 
              type="single" 
              collapsible 
              className="space-y-3"
              onValueChange={handleTacticOpen}
            >
              {TACTICS.map((tactic) => (
                <AccordionItem 
                  key={tactic.id} 
                  value={tactic.id}
                  className="border border-red-500/30 rounded-lg bg-red-950/10 px-4 data-[state=open]:border-red-500/60 data-[state=open]:bg-red-950/20 transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 text-left">
                      {/* Number Badge */}
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 text-red-400 text-xs font-mono flex items-center justify-center">
                        {tactic.number}
                      </span>
                      
                      {/* Title */}
                      <span className="text-lg font-bold text-red-400 uppercase tracking-wide font-mono">
                        {tactic.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pb-4 pt-0">
                    <p className="text-muted-foreground leading-relaxed pl-12">
                      {tactic.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
