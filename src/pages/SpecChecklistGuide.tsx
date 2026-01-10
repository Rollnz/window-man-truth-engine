import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Scale, ScanSearch, Calculator, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
import { Navbar } from '@/components/home/Navbar';
import { ROUTES } from '@/config/navigation';

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
import ExitIntentModal from '@/components/spec-checklist/ExitIntentModal';

const CONVERSION_STORAGE_KEY = 'spec_checklist_converted';

const SpecChecklistGuide = () => {
  usePageTracking('spec-checklist-guide');
  const navigate = useNavigate();
  const [hasConverted, setHasConverted] = useState(() => {
    return localStorage.getItem(CONVERSION_STORAGE_KEY) === 'true';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainCtaRef = useRef<HTMLDivElement>(null);

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
      <Navbar />

      {/* Page Sections */}
      <div className="pt-14">
      <SpecChecklistHero onCtaClick={scrollToMainCta} />
      <ProblemAgitation />
      <PacketCardsGrid />
      <AuthoritySection />
      
      {/* Primary CTA Gate */}
      <div ref={mainCtaRef}>
        <MainCTASection id="main-cta" onSuccess={handleConversionSuccess} hasConverted={hasConverted} />
      </div>
      
      <SocialProofSection />
      <ObjectionHandling />
      <UrgencySection />
      <ValueStackSection />
      <FAQSection />
      
      {/* Secondary CTA Gate */}
      <SecondaryCTASection id="secondary-cta" onSuccess={handleConversionSuccess} hasConverted={hasConverted} />

      {/* Related Tools Section */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-12">
            Related Tools
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-cyan-500" />
                </div>
                <h3 className="font-semibold text-foreground">Comparison Tool</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Input your specs and see 10-year true costs side-by-side.
              </p>
              <Button variant="cta" size="sm" className="w-full gap-2" onClick={() => navigate(ROUTES.COMPARISON)}>
                Compare Options <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                  <ScanSearch className="w-5 h-5 text-sky-500" />
                </div>
                <h3 className="font-semibold text-foreground">Quote Scanner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your quote and get instant AI analysis of red flags.
              </p>
              <Button variant="cta" size="sm" className="w-full gap-2" onClick={() => navigate(ROUTES.QUOTE_SCANNER)}>
                Scan My Quote <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-foreground">Cost Calculator</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                See the true 10-year cost of waiting vs. acting now.
              </p>
              <Button variant="cta" size="sm" className="w-full gap-2" onClick={() => navigate(ROUTES.COST_CALCULATOR)}>
                Calculate Now <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Its Window Man. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate(ROUTES.PRIVACY)} className="hover:text-foreground transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => navigate(ROUTES.TERMS)} className="hover:text-foreground transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
      </div>

      {/* Exit Intent Modal */}
      <ExitIntentModal hasConverted={hasConverted} onSuccess={handleConversionSuccess} />
    </div>
  );
};

export default SpecChecklistGuide;
