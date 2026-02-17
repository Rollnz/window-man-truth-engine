import { lazy, Suspense } from 'react';
import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema, getPillarHasPartReferences, generateLocalBusinessSchema } from '@/lib/seoSchemas/index';
import { getReviewBoardSchema } from '@/config/expertIdentity';
import { UrgencyTicker } from '@/components/social-proof';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load all below-fold sections to reduce initial JS and improve LCP
const MarketRealitySection = lazy(() => import('@/components/home/MarketRealitySection').then(m => ({ default: m.MarketRealitySection })));
const FailurePointsSection = lazy(() => import('@/components/home/FailurePointsSection').then(m => ({ default: m.FailurePointsSection })));
const WhoIsWindowManSection = lazy(() => import('@/components/home/WhoIsWindowManSection').then(m => ({ default: m.WhoIsWindowManSection })));
const SecretPlaybookSection = lazy(() => import('@/components/home/SecretPlaybookSection').then(m => ({ default: m.SecretPlaybookSection })));
const SampleReportSection = lazy(() => import('@/components/home/SampleReportSection').then(m => ({ default: m.SampleReportSection })));
const WeaponizeAuditSection = lazy(() => import('@/components/home/WeaponizeAuditSection').then(m => ({ default: m.WeaponizeAuditSection })));
const FinalDecisionSection = lazy(() => import('@/components/home/FinalDecisionSection').then(m => ({ default: m.FinalDecisionSection })));

function SectionFallback() {
  return (
    <div className="w-full h-96 flex items-center justify-center bg-secondary/20">
      <div className="space-y-4 w-full max-w-4xl px-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-32 w-full mt-8" />
      </div>
    </div>
  );
}

const Index = () => {
  usePageTracking('homepage');
  const homepageSchema = [
  // Organization schema for statewide service business (not LocalBusiness)
  generateLocalBusinessSchema(),
  // Organization schema for brand identity
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://itswindowman.com/#organization",
    "name": "Window Man Your Hurricane Hero",
    "url": "https://itswindowman.com/",
    "logo": "https://itswindowman.com/icon-512.webp",
    "description": "Free pro-consumer protection service that uses AI to audit window estimates before you sign anything.",
    "sameAs": ["https://www.facebook.com/its.windowman", "https://twitter.com/itswindowman"],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-561-468-5571",
      "contactType": "customer service"
    },
    "knowsAbout": ["Florida Building Code", "Impact Window Cost Analysis", "Hurricane Mitigation", "Miami-Dade NOA Certification"],
    "member": getReviewBoardSchema()
  }, {
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
  }, {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "How much do impact windows cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Impact window costs vary from $500-$1,500+ per window depending on size, frame material, and features. Our free calculator helps you get an accurate estimate for your specific project."
      }
    }, {
      "@type": "Question",
      "name": "How do I know if a window quote is fair?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use our free Quote Scanner tool to upload your quote and get an instant analysis comparing it to market rates. We identify red flags and hidden fees."
      }
    }, {
      "@type": "Question",
      "name": "What should I look for in a window replacement quote?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Key items include itemized pricing, window specifications (DP rating, glass type), installation details, warranty terms, and permit information. Our Spec Checklist helps you verify all critical details."
      }
    }]
  }, getReviewBoardSchema()];
  return <div className="min-h-screen bg-background">
      <SEO title="Window Man - Free AI Quote Audit for Impact Windows | Stop Overpaying" description="Don't sign that window quote. Our free AI audit reveals hidden risks, code-compliance gaps, and pricing issues contractors hope you'll miss. Protect yourself before you sign." canonicalUrl="https://itswindowman.com/" jsonLd={[...homepageSchema, getBreadcrumbSchema('home')]} />
      <Navbar funnelMode={true} />
      <div className="pt-14 border-secondary"> {/* Padding for fixed navbar */}
        <HeroSection />
        <div className="container px-4 py-8 -mt-16 relative z-10 border-secondary">
          <UrgencyTicker variant="homepage" size="lg" />
        </div>
        <Suspense fallback={<SectionFallback />}>
          <MarketRealitySection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FailurePointsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <WhoIsWindowManSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <SecretPlaybookSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <SampleReportSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <WeaponizeAuditSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FinalDecisionSection />
        </Suspense>
      </div>
    </div>;
};
export default Index;
