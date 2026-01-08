import { useEffect, useState, useRef, useCallback } from 'react';
import { ScanProgressBar } from './ScanProgressBar';
import { BloatCard } from './BloatCard';
import { BloatExposedCounter } from './BloatExposedCounter';
import { RemainsBreakdown } from './RemainsBreakdown';
import { OutcomeFolders } from './OutcomeFolders';
import { StampBadge } from './StampBadge';
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

interface AnatomySectionProps {
  modalTriggerCount?: number;
}

export function AnatomySection({ modalTriggerCount = 0 }: AnatomySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [dissolvedCards, setDissolvedCards] = useState<Set<string>>(new Set());
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [hasTrackedComplete, setHasTrackedComplete] = useState(false);

  // Calculate exposed bloat based on dissolved cards
  const exposedBloat = BLOAT_ITEMS
    .filter(item => dissolvedCards.has(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const allCardsDissolved = dissolvedCards.size === BLOAT_ITEMS.length;

  // Track when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setSectionInView(entry.isIntersecting);
          
          if (entry.isIntersecting && !hasTrackedView) {
            trackEvent('anatomy_section_viewed');
            setHasTrackedView(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasTrackedView]);

  // Track when all cards are dissolved
  useEffect(() => {
    if (allCardsDissolved && !hasTrackedComplete) {
      trackEvent('anatomy_complete');
      setHasTrackedComplete(true);
    }
  }, [allCardsDissolved, hasTrackedComplete]);

  // Handle card dissolution changes
  const handleDissolveChange = useCallback((id: string, isDissolved: boolean) => {
    setDissolvedCards(prev => {
      const next = new Set(prev);
      if (isDissolved) {
        if (!prev.has(id)) {
          trackEvent('bloat_dissolved', { item: id });
        }
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  return (
    <section
      id="beat-quote"
      ref={sectionRef}
      className="relative py-20 px-4 bg-[#0A0F14]"
    >
      {/* Fixed Scan Line - Only visible when section is in view */}
      <ScanProgressBar isVisible={sectionInView} />
      
      <div className="container max-w-4xl mx-auto">
        {/* Price Intelligence Badge - Slanted */}
        <div className="flex justify-center mb-6">
          <StampBadge variant="red">Price Intelligence</StampBadge>
        </div>

        {/* Main Title */}
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 font-mono">
          <span className="text-white">THE </span>
          <span className="text-red-400">ANATOMY</span>
          <span className="text-white"> OF YOUR QUOTE</span>
        </h2>

        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Every contractor quote contains hidden markups. Scroll to dissolve the bloat.
        </p>

        {/* Original Quote Display */}
        <div className="flex justify-between items-center mb-8 px-4">
          <span className="text-muted-foreground">Original Contractor Quote</span>
          <span className="text-2xl font-bold text-red-400 font-mono">
            ${ORIGINAL_QUOTE.toLocaleString()}
          </span>
        </div>

        {/* Bloat Exposed Counter - Fixed Position */}
        <BloatExposedCounter 
          amount={exposedBloat} 
          isVisible={dissolvedCards.size > 0 && !allCardsDissolved}
        />

        {/* Bloat Cards - All rendered, each handles its own dissolution */}
        <div className="space-y-4">
          {BLOAT_ITEMS.map((item) => (
            <BloatCard
              key={item.id}
              id={item.id}
              title={item.title}
              percentage={item.percentage}
              amount={item.amount}
              description={item.description}
              onDissolveChange={handleDissolveChange}
            />
          ))}
        </div>

        {/* What Remains Breakdown - Always visible, becomes prominent after cards dissolve */}
        <div className={`mt-12 transition-all duration-700 ${allCardsDissolved ? 'scale-105' : ''}`}>
          <RemainsBreakdown
            materials={12400}
            labor={4800}
            permit={1000}
            realPrice={REAL_PRICE}
            totalBloat={TOTAL_BLOAT}
            bloatPercentage={BLOAT_PERCENTAGE}
            isVisible={true}
          />
        </div>

        {/* Outcome Folders */}
        <div className="mt-16">
          <OutcomeFolders
            isVisible={allCardsDissolved}
            triggerCount={modalTriggerCount}
          />
        </div>
      </div>
    </section>
  );
}
