import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/gtm';
import { StampBadge } from './StampBadge';
interface FAQItem {
  id: string;
  agentQuestion: string;
  windowManAnswer: string;
}
const faqData: FAQItem[] = [{
  id: "001",
  agentQuestion: "How can you beat my quote? What's the catch?",
  windowManAnswer: "It's Window Man. That's like asking Superman if he can fly. I can offer this service because of my extensive network of reliable and motivated contractors. No hidden fees, no obligation—just results."
}, {
  id: "002",
  agentQuestion: "Is this really free? What do you get out of it?",
  windowManAnswer: "Yes, the analysis is completely free. We make money if we match you with a contractor and you move forward with our recommendation. If we can't beat your quote, we tell you honestly—and you owe us nothing."
}, {
  id: "003",
  agentQuestion: "What if you can't beat my quote?",
  windowManAnswer: "We'll tell you honestly if your quote is fair and priced competitively without any gotchas. Or we'll identify issues and arm you with questions your estimate didn't clearly explain. You'll gain peace of mind knowing you're not being ripped off. Either way, you win."
}, {
  id: "004",
  agentQuestion: "How long does this take?",
  windowManAnswer: "Upload is just a click away. You can create a free vault account and view all the information inside your dashboard. You'll receive your analysis within 24 hours. No 3-hour kitchen table sit required."
}, {
  id: "005",
  agentQuestion: "Are you licensed and insured in Florida?",
  windowManAnswer: "ItsWindowMan is not a contractor or licensed for work. We're a referral service working to earn your business by finding you the best contractor for your job. All contractors in our network are fully licensed, insured, and vetted."
}, {
  id: "006",
  agentQuestion: "What happens after I upload my quote?",
  windowManAnswer: "Step 1: We analyze your quote for bloat and red flags. Step 2: We prepare a comparison if we can beat it. Step 3: You decide—no pressure, no follow-up calls unless you want them. You're always in control."
}];
function TranscriptEntry({
  item,
  index
}: {
  item: FAQItem;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const entryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        setTimeout(() => setShowStamp(true), 300);
        trackEvent('faq_entry_viewed', {
          entry_id: item.id
        });
      }
    }, {
      threshold: 0.3,
      rootMargin: "-50px"
    });
    if (entryRef.current) {
      observer.observe(entryRef.current);
    }
    return () => observer.disconnect();
  }, [item.id]);
  return <div ref={entryRef} className={`relative border-b border-border/30 py-8 last:border-b-0 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} style={{
    transitionDelay: `${index * 100}ms`
  }}>
      {/* Transcript Number */}
      <div className="absolute -left-2 md:left-0 top-8 text-xs font-mono text-muted-foreground/50">
        #{item.id}
      </div>

      {/* Agent Question */}
      <div className="pl-8 md:pl-12 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xs font-mono text-red-400 uppercase tracking-wider shrink-0 pt-1">
            AGENT:
          </span>
          <p className="font-mono text-base leading-relaxed md:text-xl text-black">
            {item.agentQuestion}
          </p>
        </div>
      </div>

      {/* Window Man Answer */}
      <div className="pl-8 md:pl-12 relative">
        <div className="flex items-start gap-3">
          <span className="text-xs font-mono text-primary uppercase tracking-wider shrink-0 pt-1">
            WINDOW MAN:
          </span>
          <div className="relative flex-1">
            <p className="font-mono text-sm md:text-base text-muted-foreground leading-relaxed pr-4 md:pr-20">
              {item.windowManAnswer}
            </p>
            
            {/* DECLASSIFIED Stamp */}
            <div className={`absolute -right-2 md:right-0 -bottom-2 md:-bottom-4 pointer-events-none select-none transition-all duration-300 ${showStamp ? 'opacity-15 scale-100' : 'opacity-0 scale-150'}`} style={{
            transform: 'rotate(-12deg)'
          }}>
              <div className="border-2 border-primary/40 px-2 py-1 text-[10px] md:text-xs font-mono text-primary/40 uppercase tracking-widest">
                DECLASSIFIED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
export function InterrogationFAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        trackEvent('faq_section_viewed');
        observer.disconnect();
      }
    }, {
      threshold: 0.1
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  return <section ref={sectionRef} id="faq" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.3) 1px, transparent 1px)
          `,
      backgroundSize: "50px 50px"
    }} />

      <div className="container relative">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <StampBadge variant="cyan" className="mb-6">
            Intelligence Debrief
          </StampBadge>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-typewriter">
            INTERROGATION TRANSCRIPT
          </h2>
          
          <p className="max-w-2xl mx-auto text-base md:text-lg text-primary-foreground">
            The questions every homeowner asks before uploading their quote. 
            Here are the answers—straight from Window Man.
          </p>
        </div>

        {/* Transcript Container */}
        <div className="max-w-4xl mx-auto">
          {/* Transcript Header */}
          <div className="border border-border/50 bg-card/30 backdrop-blur-sm mb-8">
            <div className="border-b border-border/30 px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground">
                  TRANSCRIPT ID: WM-FAQ-2024
                </span>
                <span className="hidden md:inline text-xs font-mono text-muted-foreground">
                  |
                </span>
                <span className="hidden md:inline text-xs font-mono text-muted-foreground">
                  CLASSIFICATION: PUBLIC RELEASE
                </span>
              </div>
              <div className="text-xs font-mono text-primary">
                {faqData.length} ENTRIES
              </div>
            </div>

            {/* Transcript Entries */}
            <div className="px-4 md:px-6">
              {faqData.map((item, index) => <TranscriptEntry key={item.id} item={item} index={index} />)}
            </div>

            {/* Transcript Footer */}
            <div className="border-t border-border/30 px-4 md:px-6 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <span className="text-xs font-mono text-muted-foreground/70">
                  END OF TRANSCRIPT
                </span>
                <span className="text-xs font-mono text-muted-foreground/70">
                  Still have questions? Upload your quote and we'll answer them personally.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}