import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Scale, ScanSearch, Calculator, ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
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
      {/* Navigation */}
      <nav className="bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                W
              </div>
              <span className="font-semibold text-foreground">Windowman Vault</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => navigate(ROUTES.COMPARISON)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Compare Windows
              </button>
              <button 
                onClick={() => navigate(ROUTES.INTEL)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Intel Library
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-4 py-3 space-y-1">
              <button
                onClick={() => {
                  navigate(ROUTES.COMPARISON);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                Compare Windows
              </button>
              <button
                onClick={() => {
                  navigate('/intel');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                Intel Library
              </button>
              <button
                onClick={() => {
                  navigate('/tools');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                All Tools
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Sections */}
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
                <Scale className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-foreground">Comparison Tool</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Input your specs and see 10-year true costs side-by-side.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate(ROUTES.COMPARISON)}>
                Compare Options <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <ScanSearch className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-foreground">Quote Scanner</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your quote and get instant AI analysis of red flags.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate(ROUTES.QUOTE_SCANNER)}>
                Scan My Quote <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-foreground">Cost Calculator</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                See the true 10-year cost of waiting vs. acting now.
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate('/cost-calculator')}>
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
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Modal */}
      <ExitIntentModal hasConverted={hasConverted} onSuccess={handleConversionSuccess} />
    </div>
  );
};

export default SpecChecklistGuide;
