import { lazy, Suspense } from 'react';
import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema, getPillarHasPartReferences, generateLocalBusinessSchema } from '@/lib/seoSchemas/index';
import { getReviewBoardSchema } from '@/config/expertIdentity';
import { Skeleton } from '@/components/ui/skeleton';

// ═══════════════════════════════════════════════════════════════════════════════
// BELOW-FOLD LAZY LOADING
// Only Hero and Navbar are critical for LCP. Everything else is deferred.
// ═══════════════════════════════════════════════════════════════════════════════

const MarketRealitySection = lazy(() => 
  import('@/components/home/MarketRealitySection').then(m => ({ default: m.MarketRealitySection }))
);
const FailurePointsSection = lazy(() => 
  import('@/components/home/FailurePointsSection').then(m => ({ default: m.FailurePointsSection }))
);
const WhoIsWindowManSection = lazy(() => 
  import('@/components/home/WhoIsWindowManSection').then(m => ({ default: m.WhoIsWindowManSection }))
);
const SecretPlaybookSection = lazy(() => 
  import('@/components/home/SecretPlaybookSection').then(m => ({ default: m.SecretPlaybookSection }))
);
const SampleReportSection = lazy(() => 
  import('@/components/home/SampleReportSection').then(m => ({ default: m.SampleReportSection }))
);
const WeaponizeAuditSection = lazy(() => 
  import('@/components/home/WeaponizeAuditSection').then(m => ({ default: m.WeaponizeAuditSection }))
);
const FinalDecisionSection = lazy(() => 
  import('@/components/home/FinalDecisionSection').then(m => ({ default: m.FinalDecisionSection }))
);
const UrgencyTicker = lazy(() => 
  import('@/components/social-proof').then(m => ({ default: m.UrgencyTicker }))
);

/**
 * Lightweight skeleton for below-fold sections
 * Prevents CLS by reserving approximate space
 */
function SectionSkeleton() {
  return (
    <div className="w-full py-20 md:py-32 flex items-center justify-center">
      <div className="container px-4 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function TickerSkeleton() {
  return (
    <div className="flex justify-center">
      <Skeleton className="h-12 w-64 rounded-lg" />
    </div>
  );
}

const Index = () => {
  usePageTracking('homepage');

  const homepageSchema = [
    generateLocalBusinessSchema(),
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://itswindowman.com/#organization",
      "name": "Window Man Your Hurricane Hero",
      "url": "https://itswindowman.com/",
      "logo": "https://itswindowman.com/icon-512.webp",
      "description": "Free pro-consumer protection service that uses AI to audit window estimates before you sign anything.",
      "sameAs": [
        "https://www.facebook.com/its.windowman",
        "https://twitter.com/itswindowman"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-561-468-5571",
        "contactType": "customer service"
      },
      "knowsAbout": [
        "Florida Building Code",
        "Impact Window Cost Analysis",
        "Hurricane Mitigation",
        "Miami-Dade NOA Certification"
      ],
      "member": getReviewBoardSchema()
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://itswindowman.com/#website",
      "name": "Window Man Truth Engine",
      "url": "https://itswindowman.com/",
      "publisher": {
        "@id": "https://itswindowman.com/#organization"
      },
      "hasPart": getPillarHasPartReferences(),
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://itswindowman.com/tools?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much do impact windows cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Impact window costs vary from $500-$1,500+ per window depending on size, frame material, and features. Our free calculator helps you get an accurate estimate for your specific project."
          }
        },
        {
          "@type": "Question",
          "name": "How do I know if a window quote is fair?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use our free Quote Scanner tool to upload your quote and get an instant analysis comparing it to market rates. We identify red flags and hidden fees."
          }
        },
        {
          "@type": "Question",
          "name": "What should I look for in a window replacement quote?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Key items include itemized pricing, window specifications (DP rating, glass type), installation details, warranty terms, and permit information. Our Spec Checklist helps you verify all critical details."
          }
        }
      ]
    },
    getReviewBoardSchema()
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Window Man - Free AI Quote Audit for Impact Windows | Stop Overpaying"
        description="Don't sign that window quote. Our free AI audit reveals hidden risks, code-compliance gaps, and pricing issues contractors hope you'll miss. Protect yourself before you sign."
        canonicalUrl="https://itswindowman.com/"
        jsonLd={[...homepageSchema, getBreadcrumbSchema('home')]}
      />
      <Navbar funnelMode={true} />
      <div className="pt-14">
        {/* CRITICAL PATH: Hero loads immediately for LCP */}
        <HeroSection />
        
        {/* UrgencyTicker - deferred but above main content */}
        <div className="container px-4 py-8 -mt-16 relative z-10">
          <Suspense fallback={<TickerSkeleton />}>
            <UrgencyTicker variant="homepage" size="lg" />
          </Suspense>
        </div>
        
        {/* BELOW-FOLD: All sections lazy-loaded */}
        <Suspense fallback={<SectionSkeleton />}>
          <MarketRealitySection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <FailurePointsSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <WhoIsWindowManSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <SecretPlaybookSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <SampleReportSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <WeaponizeAuditSection />
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          <FinalDecisionSection />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
