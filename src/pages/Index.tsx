import { lazy, Suspense } from 'react';
import { Navbar } from '@/components/home/Navbar';
import { ErrorBoundary } from '@/components/error';
import { HeroSection } from '@/components/home/HeroSection';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema, getPillarHasPartReferences, generateLocalBusinessSchema } from '@/lib/seoSchemas/index';
import { getReviewBoardSchema } from '@/config/expertIdentity';
import { UrgencyTicker } from '@/components/social-proof';

// Below-fold sections — lazy loaded to reduce initial bundle
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
      <div className="pt-14 border-secondary">
        <HeroSection />
        <div className="container px-4 -mt-16 relative z-10 border-secondary my-0 py-0 min-h-[56px]">
          <UrgencyTicker variant="homepage" size="lg" />
        </div>
        <ErrorBoundary
          title="Market Reality Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[600px]" />}>
            <MarketRealitySection />
          </Suspense>
        </ErrorBoundary>
        {/* Edge glow divider */}
        <div className="h-[clamp(52px,7vw,84px)]" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 60%), linear-gradient(to bottom, hsl(var(--surface-1)), hsl(var(--muted)))' }} aria-hidden="true" />
        <ErrorBoundary
          title="Failure Points Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[500px]" />}>
            <FailurePointsSection />
          </Suspense>
        </ErrorBoundary>
        <div className="h-[clamp(52px,7vw,84px)]" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--secondary) / 0.08) 0%, transparent 60%), linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--surface-3)))' }} aria-hidden="true" />
        <ErrorBoundary
          title="Who Is Window Man Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <WhoIsWindowManSection />
          </Suspense>
        </ErrorBoundary>
        <div className="h-[clamp(52px,7vw,84px)]" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 60%), linear-gradient(to bottom, hsl(var(--surface-3)), hsl(var(--muted)))' }} aria-hidden="true" />
        <ErrorBoundary
          title="Secret Playbook Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[500px]" />}>
            <SecretPlaybookSection />
          </Suspense>
        </ErrorBoundary>
        <div className="h-[clamp(52px,7vw,84px)]" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--secondary) / 0.08) 0%, transparent 60%), linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--surface-2)))' }} aria-hidden="true" />
        <ErrorBoundary
          title="Sample Report Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <SampleReportSection />
          </Suspense>
        </ErrorBoundary>
        <div className="h-[clamp(52px,7vw,84px)]" style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 60%), linear-gradient(to bottom, hsl(var(--surface-2)), hsl(var(--muted)))' }} aria-hidden="true" />
        <ErrorBoundary
          title="Weaponize Audit Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <WeaponizeAuditSection />
          </Suspense>
        </ErrorBoundary>
        <ErrorBoundary
          title="Final Decision Section Error"
          description="We encountered an issue loading this section."
          onReset={() => window.location.reload()}
        >
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <FinalDecisionSection />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>;
};
export default Index;