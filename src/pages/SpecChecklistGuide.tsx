import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackEvent } from '@/lib/gtm';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { useSessionData } from '@/hooks/useSessionData';
import { ROUTES } from '@/config/navigation';
import { getGuidePageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ProTipBox } from '@/components/seo';
import { ReviewedByBadge } from '@/components/authority';

// Section Components
import SpecChecklistHero from '@/components/spec-checklist/SpecChecklistHero';
import ProblemAgitation from '@/components/spec-checklist/ProblemAgitation';
import PacketCardsGrid from '@/components/spec-checklist/PacketCardsGrid';
import AuthoritySection from '@/components/spec-checklist/AuthoritySection';
import MainCTASection from '@/components/spec-checklist/MainCTASection';
import SocialProofSection from '@/components/spec-checklist/SocialProofSection';
import ObjectionHandling from '@/components/spec-checklist/ObjectionHandling';
import UrgencySection from '@/components/spec-checklist/UrgencySection';
import ValueStackSection from '@/components/spec-checklist/ValueStackSection';
import FAQSection from '@/components/spec-checklist/FAQSection';
import SecondaryCTASection from '@/components/spec-checklist/SecondaryCTASection';
import { ExitIntentModal } from '@/components/authority';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';

const CONVERSION_STORAGE_KEY = 'spec_checklist_converted';

const SpecChecklistGuide = () => {
  usePageTracking('spec-checklist-guide');
  const navigate = useNavigate();
  const [hasConverted, setHasConverted] = useState(() => {
    return localStorage.getItem(CONVERSION_STORAGE_KEY) === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const { sessionData } = useSessionData();
  const { hasIdentity } = useLeadIdentity();
  const frameControl = getFrameControl('spec-checklist-guide');
  const smartTools = getSmartRelatedTools('spec-checklist-guide', sessionData.toolsCompleted);

  // Track page view on mount
  React.useEffect(() => {
    trackEvent('virtual_pageview', {
      page_path: '/spec-checklist-guide',
      page_title: 'Pre-Installation Audit Checklist',
    });
  }, []);

  const scrollToMainCta = () => {
    mainCtaRef.current?.scrollIntoView({ behavior: 'smooth' });
    trackEvent('cta_click', { location: 'hero', destination: 'main_cta' });
  };

  const handleConversionSuccess = () => {
    setHasConverted(true);
    localStorage.setItem(CONVERSION_STORAGE_KEY, 'true');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Pre-Installation Window Audit Checklist"
        description="The complete specification checklist to verify your window installation meets all requirements. Includes NOA verification, installation specs, and warranty documentation."
        canonicalUrl="https://itswindowman.com/spec-checklist-guide"
        jsonLd={[...getGuidePageSchemas('spec-checklist-guide'), getBreadcrumbSchema('spec-checklist-guide')]}
      />
      <Navbar />

      {/* Page Sections */}
      <div className="pt-14">
      <SpecChecklistHero onCtaClick={scrollToMainCta} onSuccess={handleConversionSuccess} hasConverted={hasConverted} />
      <ProblemAgitation />
      <PacketCardsGrid />
      <AuthoritySection />
      
      {/* Primary CTA Gate */}
      <div ref={mainCtaRef}>
        <MainCTASection id="main-cta" onSuccess={handleConversionSuccess} hasConverted={hasConverted} />
      </div>
      
      <SocialProofSection />
      <ObjectionHandling />
      
      {/* Semantic ProTip linking to related tool */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProTipBox
          title="Already have a quote to verify?"
          description="The AI Quote Scanner checks your quote against spec requirements and flags missing documentation."
          linkTo="/ai-scanner"
          linkText="Scan your quote for spec issues"
          variant="default"
        />
      </div>
      
      <UrgencySection />
      <ValueStackSection />
      <FAQSection />
      
      {/* Secondary CTA Gate */}
      <SecondaryCTASection id="secondary-cta" onSuccess={handleConversionSuccess} hasConverted={hasConverted} />

      {/* Related Tools Section */}
      <RelatedToolsGrid
        title={frameControl.title}
        description={frameControl.description}
        tools={smartTools}
        className="bg-background"
      />

      {/* Reviewed By Badge */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReviewedByBadge />
        </div>
      </section>

      </div>

      {/* Exit Intent Modal - Uses authority 3-step workflow */}
      <ExitIntentModal 
        sourceTool="spec-checklist-guide" 
        hasConverted={hasIdentity} 
        onSuccess={handleConversionSuccess} 
      />
    </div>
  );
};

export default SpecChecklistGuide;
