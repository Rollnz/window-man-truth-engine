import { useEffect, useState, useRef } from 'react';
import { Zap } from 'lucide-react';
import { ScanProgressBar } from './ScanProgressBar';
import { BloatCard } from './BloatCard';
import { BloatExposedCounter } from './BloatExposedCounter';
import { RemainsBreakdown } from './RemainsBreakdown';
import { OutcomeFolders } from './OutcomeFolders';
import { trackEvent } from '@/lib/gtm';

// Demo data for the anatomy breakdown
const ORIGINAL_QUOTE = 24500;
const BLOAT_ITEMS = [
  {
    id: 'sales-commission',
    title: 'Sales Commission',
    percentage: 15,
    amount: 3675,
    description: 'The guy who sat at your kitchen table for 3 hours? He\'s taking $3,675 of your money. For talking.'
  },
  {
    id: 'marketing-overhead',
    title: 'Marketing Overhead',
    percentage: 12,
    amount: 2940,
    description: 'You\'re paying for the TV commercials that convinced you to call them. You\'re funding your own manipulation.'
  },
  {
    id: 'binder-presentation',
    title: 'Binder Presentation Budget',
    percentage: 8,
    amount: 1960,
    description: 'That fancy laminated folder with the "good-better-best" options? You just bought 200 of them for other customers.'
  },
  {
    id: 'urgency-discount',
    title: 'Urgency Discount Recovery',
    percentage: 5,
    amount: 1225,
    description: 'Remember that "manager-approved" discount? It was never real. They just inflated the price first.'
  }
];

const TOTAL_BLOAT = BLOAT_ITEMS.reduce((sum, item) => sum + item.amount, 0);
const REAL_PRICE = ORIGINAL_QUOTE - TOTAL_BLOAT;
const BLOAT_PERCENTAGE = Math.round((TOTAL_BLOAT / ORIGINAL_QUOTE) * 100 * 10) / 10;

export function AnatomySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [visibleBloatIndex, setVisibleBloatIndex] = useState(-1);
  const [showRemains, setShowRemains] = useState(false);
  const [showOutcomes, setShowOutcomes] = useState(false);

  // Calculate exposed bloat based on visible cards
  const exposedBloat = BLOAT_ITEMS
    .slice(0, visibleBloatIndex + 1)
    .reduce((sum, item) => sum + item.amount, 0);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasEntered) {
            setHasEntered(true);
            trackEvent('anatomy_section_viewed');
            startScanSequence();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasEntered]);

  // Animated scan sequence
  const startScanSequence = () => {
    // Start progress bar
    const progressSteps = [15, 30, 50, 70, 85, 100];
    let stepIndex = 0;

    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        setScanProgress(progressSteps[stepIndex]);
        
        // Reveal bloat cards at specific progress points
        if (stepIndex < BLOAT_ITEMS.length) {
          setTimeout(() => {
            setVisibleBloatIndex(stepIndex);
            trackEvent('bloat_revealed', { 
              item: BLOAT_ITEMS[stepIndex].id 
            });
          }, 400);
        }
        
        stepIndex++;
      } else {
        clearInterval(progressInterval);
        
        // Show remains after all bloat revealed
        setTimeout(() => {
          setShowRemains(true);
        }, 800);
        
        // Show outcomes after remains
        setTimeout(() => {
          setShowOutcomes(true);
        }, 1500);
      }
    }, 1200);
  };

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 px-4 bg-[#0A0F14]"
    >
      <div className="container max-w-4xl mx-auto">
        {/* Price Intelligence Badge */}
        <div className="flex justify-center mb-6">
          <div className="px-4 py-2 border-2 border-red-500/60 bg-red-950/20">
            <span className="text-sm font-mono tracking-wider text-red-400 uppercase">
              Price Intelligence
            </span>
          </div>
        </div>

        {/* Main Title */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 font-mono">
          <span className="text-white">THE </span>
          <span className="text-red-400">ANATOMY</span>
          <span className="text-white"> OF YOUR QUOTE</span>
        </h2>

        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Every contractor quote contains hidden markups. Let's expose them.
        </p>

        {/* Forensic Price Audit Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10">
            <Zap className="w-4 h-4 text-[#00D4FF]" />
            <span className="text-sm font-mono tracking-wider text-[#00D4FF]">
              FORENSIC PRICE AUDIT
            </span>
          </div>
        </div>

        {/* Where Money Goes Title */}
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-4 font-mono">
          <span className="text-white">WHERE YOUR MONEY </span>
          <span className="text-red-400">REALLY</span>
          <span className="text-white"> GOES</span>
        </h3>

        <p className="text-center text-muted-foreground mb-8">
          Scroll to scan. Watch the hidden markups dissolve.
        </p>

        {/* Original Quote Display */}
        <div className="flex justify-between items-center mb-4 px-4">
          <span className="text-muted-foreground">Original Contractor Quote</span>
          <span className="text-2xl font-bold text-red-400 font-mono">
            ${ORIGINAL_QUOTE.toLocaleString()}
          </span>
        </div>

        {/* Scan Progress Bar */}
        <ScanProgressBar 
          progress={scanProgress} 
          isScanning={hasEntered && scanProgress < 100} 
        />

        {/* Bloat Exposed Counter - Fixed Position */}
        <BloatExposedCounter 
          amount={exposedBloat} 
          isVisible={visibleBloatIndex >= 0 && !showRemains}
        />

        {/* Bloat Cards */}
        <div className="space-y-4 mt-8">
          {BLOAT_ITEMS.map((item, index) => (
            <BloatCard
              key={item.id}
              title={item.title}
              percentage={item.percentage}
              amount={item.amount}
              description={item.description}
              isVisible={index <= visibleBloatIndex}
              delay={index * 100}
            />
          ))}
        </div>

        {/* What Remains Breakdown */}
        <div className="mt-12">
          <RemainsBreakdown
            materials={12400}
            labor={4800}
            permit={1000}
            realPrice={REAL_PRICE}
            totalBloat={TOTAL_BLOAT}
            bloatPercentage={BLOAT_PERCENTAGE}
            isVisible={showRemains}
          />
        </div>

        {/* Outcome Folders */}
        <div className="mt-16">
          <OutcomeFolders isVisible={showOutcomes} />
        </div>
      </div>
    </section>
  );
}
