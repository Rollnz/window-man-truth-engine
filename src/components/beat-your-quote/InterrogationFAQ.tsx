import { useEffect, useRef, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/gtm';
import { StampBadge } from './StampBadge';

interface FAQItem {
  id: string;
  agentQuestion: string;
  windowManAnswer: string;
}

const faqData: FAQItem[] = [
  {
    id: "001",
    agentQuestion: "How can you beat my quote? What's the catch?",
    windowManAnswer: "It's Window Man. That's like asking Superman if he can fly. I can offer this service because of my extensive network of reliable and motivated contractors. No hidden fees, no obligation—just results."
  },
  {
    id: "002",
    agentQuestion: "Is this really free? What do you get out of it?",
    windowManAnswer: "Yes, the analysis is completely free. We make money if we match you with a contractor and you move forward with our recommendation. If we can't beat your quote, we tell you honestly—and you owe us nothing."
  },
  {
    id: "003",
    agentQuestion: "What if you can't beat my quote?",
    windowManAnswer: "We'll tell you honestly if your quote is fair and priced competitively without any gotchas. Or we'll identify issues and arm you with questions your estimate didn't clearly explain. You'll gain peace of mind knowing you're not being ripped off. Either way, you win."
  },
  {
    id: "004",
    agentQuestion: "How long does this take?",
    windowManAnswer: "Upload is just a click away. You can create a free vault account and view all the information inside your dashboard. You'll receive your analysis within 24 hours. No 3-hour kitchen table sit required."
  },
  {
    id: "005",
    agentQuestion: "Are you licensed and insured in Florida?",
    windowManAnswer: "ItsWindowMan is not a contractor or licensed for work. We're a referral service working to earn your business by finding you the best contractor for your job. All contractors in our network are fully licensed, insured, and vetted."
  },
  {
    id: "006",
    agentQuestion: "What happens after I upload my quote?",
    windowManAnswer: "Step 1: We analyze your quote for bloat and red flags. Step 2: We prepare a comparison if we can beat it. Step 3: You decide—no pressure, no follow-up calls unless you want them. You're always in control."
  }
];

// Custom hook for typing animation
function useTypingEffect(text: string, isActive: boolean, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setIsTyping(true);
    setIsComplete(false);
    let index = 0;

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [isActive, text, speed]);

  return { displayedText, isTyping, isComplete };
}

function TranscriptEntry({
  item,
  index
}: {
  item: FAQItem;
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [startTyping, setStartTyping] = useState(false);
  const entryRef = useRef<HTMLDivElement>(null);

  const { displayedText, isTyping, isComplete } = useTypingEffect(
    item.windowManAnswer,
    startTyping,
    18
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Start typing after fade-in animation
          setTimeout(() => setStartTyping(true), 400 + index * 100);
          trackEvent('faq_entry_viewed', { entry_id: item.id });
        }
      },
      { threshold: 0.3, rootMargin: "-50px" }
    );

    if (entryRef.current) {
      observer.observe(entryRef.current);
    }
    return () => observer.disconnect();
  }, [item.id, index]);

  return (
    <div
      ref={entryRef}
      className={`relative dossier-entry-divider py-8 last:border-b-0 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Transcript Number */}
      <div className="absolute left-0 md:left-2 top-8 text-xs font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
        [{item.id}]
      </div>

      {/* Agent Question */}
      <div className="pl-12 md:pl-16 mb-6">
        <div className="flex items-start gap-3">
          <span className="agent-badge px-2 py-0.5 rounded text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider shrink-0">
            AGENT
          </span>
          <p className="font-mono text-base leading-relaxed md:text-lg text-slate-800 font-medium">
            {item.agentQuestion}
          </p>
        </div>
      </div>

      {/* Window Man Answer with Typing Effect */}
      <div className="pl-12 md:pl-16 relative">
        <div className="flex items-start gap-3">
          <span className="windowman-badge px-2 py-0.5 rounded text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider shrink-0">
            WINDOW MAN
          </span>
          <div className="relative flex-1">
            <p className="font-mono text-sm md:text-base text-slate-600 leading-relaxed pr-4 md:pr-20 min-h-[3rem]">
              {startTyping ? displayedText : ''}
              {isTyping && <span className="typing-cursor" />}
            </p>

            {/* DECLASSIFIED Stamp - appears after typing completes */}
            <div
              className={`absolute -right-2 md:right-0 -bottom-2 md:-bottom-4 pointer-events-none select-none transition-all duration-500 ${
                isComplete ? 'opacity-40 scale-100 rotate-[-12deg]' : 'opacity-0 scale-150 rotate-0'
              }`}
            >
              <div className="border-2 border-red-600 px-2 py-1 text-[10px] md:text-xs font-mono text-red-600 font-bold uppercase tracking-widest">
                DECLASSIFIED
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InterrogationFAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          trackEvent('faq_section_viewed');
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="py-20 md:py-32 paper-texture relative overflow-hidden"
    >
      {/* Vignette overlay for aged effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.06) 100%)'
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px"
        }}
      />

      <div className="container relative">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <StampBadge variant="cyan" className="mb-6">
            Intelligence Debrief
          </StampBadge>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-typewriter text-slate-800">
            INTERROGATION TRANSCRIPT
          </h2>

          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600">
            The questions every homeowner asks before uploading their quote.
            Here are the answers—straight from Window Man.
          </p>
        </div>

        {/* Transcript Document Container */}
        <div className="max-w-4xl mx-auto">
          <div className="transcript-document rounded-lg relative overflow-hidden">
            {/* Corner bracket decorations */}
            <div className="absolute top-2 left-2 w-5 h-5 border-l-2 border-t-2 border-slate-400 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-5 h-5 border-r-2 border-t-2 border-slate-400 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-l-2 border-b-2 border-slate-400 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-r-2 border-b-2 border-slate-400 rounded-br-sm" />

            {/* DECLASSIFIED watermark - red, more visible */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              <span className="text-6xl md:text-8xl font-bold text-red-600/[0.12] uppercase tracking-[0.3em] rotate-[-15deg] whitespace-nowrap">
                DECLASSIFIED
              </span>
            </div>

            {/* Transcript Header Bar */}
            <div className="transcript-header-bar px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <span className="text-xs font-mono text-slate-300">
                  TRANSCRIPT ID: WM-FAQ-2024
                </span>
                <span className="hidden md:inline text-slate-500">|</span>
                {/* Classification Badge */}
                <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  PUBLIC RELEASE
                </span>
              </div>
              <div className="text-xs font-mono text-cyan-400 font-bold">
                {faqData.length} ENTRIES
              </div>
            </div>

            {/* Transcript Entries */}
            <div className="px-4 md:px-8 py-4 relative">
              {faqData.map((item, index) => (
                <TranscriptEntry key={item.id} item={item} index={index} />
              ))}
            </div>

            {/* Transcript Footer Bar */}
            <div className="transcript-footer-bar px-4 md:px-6 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <span className="text-xs font-mono text-slate-400 tracking-widest">
                  — END OF TRANSCRIPT —
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Still have questions? Upload your quote and we'll answer them personally.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
