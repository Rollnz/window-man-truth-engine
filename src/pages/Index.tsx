import { Navbar } from '@/components/home/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { MarketRealitySection } from '@/components/home/MarketRealitySection';
import { FailurePointsSection } from '@/components/home/FailurePointsSection';
import { WhoIsWindowManSection } from '@/components/home/WhoIsWindowManSection';
import { SecretPlaybookSection } from '@/components/home/SecretPlaybookSection';
import { SampleReportSection } from '@/components/home/SampleReportSection';
import { WeaponizeAuditSection } from '@/components/home/WeaponizeAuditSection';
import { FinalDecisionSection } from '@/components/home/FinalDecisionSection';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema, getPillarHasPartReferences, generateLocalBusinessSchema } from '@/lib/seoSchemas/index';
import { getReviewBoardSchema } from '@/config/expertIdentity';
import { UrgencyTicker } from '@/components/social-proof';

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
        <div className="container px-4 py-8 -mt-16 relative z-10 border-secondary">
          <UrgencyTicker variant="homepage" size="lg" />
        </div>
        <MarketRealitySection />
        {/* Edge glow divider */}
        <div className="h-[clamp(52px,7vw,84px)] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18)_0%,transparent_68%)]" aria-hidden="true" />
        <FailurePointsSection />
        {/* Edge glow divider */}
        <div className="h-[clamp(52px,7vw,84px)] bg-[radial-gradient(ellipse_at_center,hsl(var(--secondary)/0.16)_0%,transparent_68%)]" aria-hidden="true" />
        <WhoIsWindowManSection />
        {/* Edge glow divider */}
        <div className="h-[clamp(52px,7vw,84px)] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18)_0%,transparent_68%)]" aria-hidden="true" />
        <SecretPlaybookSection />
        {/* Edge glow divider */}
        <div className="h-[clamp(52px,7vw,84px)] bg-[radial-gradient(ellipse_at_center,hsl(var(--secondary)/0.16)_0%,transparent_68%)]" aria-hidden="true" />
        <SampleReportSection />
        {/* Edge glow divider */}
        <div className="h-[clamp(52px,7vw,84px)] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.18)_0%,transparent_68%)]" aria-hidden="true" />
        <WeaponizeAuditSection />
        <FinalDecisionSection />
      </div>
    </div>;
};
export default Index;
