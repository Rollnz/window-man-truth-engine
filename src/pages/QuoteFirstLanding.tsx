import { SEO } from '@/components/SEO';
import { QuoteFirstHeader, QuoteFirstStage } from '@/features/quote-first';

/**
 * /scan — Quote-First acquisition landing.
 *
 * Sprint 01A foundation. Distinct from /beat-your-quote (frozen visual donor).
 * No Navbar, no UnifiedFooter, no long-form marketing sections.
 *
 * The Hero → Flow swap happens in-place inside QuoteFirstStage — the visual
 * stage transforms rather than navigating or appending sections.
 */
export default function QuoteFirstLanding() {
  return (
    <div className="min-h-screen bg-[#0A0F14] font-sans text-white antialiased">
      <SEO
        title="Upload Your Estimate — Independent Truth Report | WindowMan"
        description="Drop your contractor's window estimate and get an independent truth report in 30 seconds. 100% free, no sales calls, keeps your quote private."
        canonicalUrl="https://itswindowman.com/scan"
      />
      <QuoteFirstHeader />
      <main>
        <QuoteFirstStage />
      </main>
    </div>
  );
}
