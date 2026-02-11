import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/home/Navbar';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { trackEvent } from '@/lib/gtm';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/navigation';

import { SampleReportHeader } from '@/components/sample-report/SampleReportHeader';
import { HeroSection } from '@/components/sample-report/HeroSection';
import { ComparisonSection } from '@/components/sample-report/ComparisonSection';
import { ScoreboardSection } from '@/components/sample-report/ScoreboardSection';
import { PillarAccordionSection } from '@/components/sample-report/PillarAccordionSection';
import { HowItWorksSection } from '@/components/sample-report/HowItWorksSection';
import { LeverageOptionsSection } from '@/components/sample-report/LeverageOptionsSection';
import { CloserSection } from '@/components/sample-report/CloserSection';
import { FAQSection } from '@/components/sample-report/FAQSection';
import { SampleReportLeadModal } from '@/components/sample-report/SampleReportLeadModal';
import { UrgencyTicker } from '@/components/social-proof';
import { PreQuoteLeadModal } from '@/components/sample-report/PreQuoteLeadModal';
import { FairPriceImageSection } from '@/components/sample-report/FairPriceImageSection';

const SampleReport = () => {
  usePageTracking('sample-report');
  const navigate = useNavigate();
  const location = useLocation();
  const firstNameFromNav = (location.state as any)?.firstName as string | undefined;
  
  const { leadId, hasIdentity } = useLeadIdentity();
  const anchorId = getLeadAnchor();
  const hasLead = hasIdentity || !!anchorId;

  // Lead capture modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [modalCtaSource, setModalCtaSource] = useState('');
  
  
  // Pre-quote (no quote) modal state
  const [showPreQuoteModal, setShowPreQuoteModal] = useState(false);
  const [preQuoteCtaSource, setPreQuoteCtaSource] = useState('');

  // Loading state check
  const [isCheckingLead, setIsCheckingLead] = useState(true);

  // Check lead status after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsCheckingLead(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track page view once lead check completes
  useEffect(() => {
    if (!isCheckingLead) {
      trackEvent('sample_report_view', {
        has_lead: hasLead,
        lead_id: leadId || anchorId || undefined,
        referrer: document.referrer || 'direct',
        utm_source: new URLSearchParams(window.location.search).get('utm_source')
      });
    }
  }, [isCheckingLead, hasLead, leadId, anchorId]);

  // Handler for opening lead modal (passed to child components)
  const handleOpenLeadModal = (ctaSource: string) => {
    const existingLead = getLeadAnchor();
    
    if (existingLead) {
      // Already captured - skip modal, go straight to scanner
      trackEvent('sample_report_cta_click', {
        cta_source: ctaSource,
        lead_id: existingLead,
        skipped_modal: true,
      });
      navigate(`${ROUTES.QUOTE_SCANNER}?lead=${existingLead}#upload`);
    } else {
      // Need to capture - show modal
      setModalCtaSource(ctaSource);
      setShowLeadModal(true);
    }
  };

  // Handle modal success (navigation happens in modal Step 2)
  const handleLeadModalSuccess = (newLeadId: string) => {
    setShowLeadModal(false);
    navigate(`${ROUTES.QUOTE_SCANNER}?lead=${newLeadId}#upload`);
  };

  // Handler for opening pre-quote modal (for users without quotes)
  const handleOpenPreQuoteModal = (ctaSource: string) => {
    trackEvent('sample_report_prequote_modal_open', { cta_source: ctaSource });
    setPreQuoteCtaSource(ctaSource);
    setShowPreQuoteModal(true);
  };

  // Handle pre-quote modal success
  const handlePreQuoteSuccess = (newLeadId: string) => {
    // Modal handles its own success state, just close after a delay
    setTimeout(() => setShowPreQuoteModal(false), 5000);
  };

  // Loading state (prevents content flash)
  if (isCheckingLead) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Sample AI Report - See What Your Audit Looks Like | Window Man" description="View a real example of our AI window quote audit." canonicalUrl="https://itswindowman.com/sample-report" />
        <Navbar funnelMode={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Sample AI Report - See What Your Audit Looks Like | Window Man" description="View a real example of our AI window quote audit. See the scorecard, risk flags, and plain-English findings before you upload your own estimate. 100% free, no obligation." canonicalUrl="https://itswindowman.com/sample-report" />
      <Navbar funnelMode={true} />
      <SampleReportHeader firstName={firstNameFromNav} onOpenLeadModal={handleOpenLeadModal} onOpenPreQuoteModal={handleOpenPreQuoteModal} />
      
      <div className="container px-4 py-6">
        <UrgencyTicker variant="minimal" />
      </div>

      {/* Lead Capture Modal (2-step flow) - for users with quotes */}
      <SampleReportLeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadModalSuccess}
        ctaSource={modalCtaSource}
      />
      
      {/* Pre-Quote Lead Modal - for users without quotes */}
      <PreQuoteLeadModal
        isOpen={showPreQuoteModal}
        onClose={() => setShowPreQuoteModal(false)}
        onSuccess={handlePreQuoteSuccess}
        ctaSource={preQuoteCtaSource}
      />

      {/* Main Content */}
      <main className="pt-28">
        <HeroSection firstName={firstNameFromNav} onOpenLeadModal={handleOpenLeadModal} onOpenPreQuoteModal={handleOpenPreQuoteModal} />
        <ComparisonSection />
        <ScoreboardSection />
        <PillarAccordionSection />
        <HowItWorksSection />
        <LeverageOptionsSection onOpenLeadModal={handleOpenLeadModal} onOpenPreQuoteModal={handleOpenPreQuoteModal} />
        <FairPriceImageSection />
        <CloserSection onOpenLeadModal={handleOpenLeadModal} onOpenPreQuoteModal={handleOpenPreQuoteModal} />
        <FAQSection onOpenPreQuoteModal={handleOpenPreQuoteModal} />
      </main>
    </div>
  );
};

export default SampleReport;
