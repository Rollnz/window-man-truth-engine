import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const SampleReport = () => {
  usePageTracking('sample-report');
  const navigate = useNavigate();
  
  const { leadId, hasIdentity } = useLeadIdentity();
  const anchorId = getLeadAnchor();
  const hasLead = hasIdentity || !!anchorId;

  // Lead capture modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [modalCtaSource, setModalCtaSource] = useState('');
  const [preCheckPartnerConsent, setPreCheckPartnerConsent] = useState(false);

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
  const handleOpenLeadModal = (ctaSource: string, preCheckConsent = false) => {
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
      setPreCheckPartnerConsent(preCheckConsent);
      setShowLeadModal(true);
    }
  };

  // Handle modal success (navigation happens in modal Step 2)
  const handleLeadModalSuccess = (newLeadId: string) => {
    setShowLeadModal(false);
    navigate(`${ROUTES.QUOTE_SCANNER}?lead=${newLeadId}#upload`);
  };

  // Loading state (prevents content flash)
  if (isCheckingLead) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Sample AI Report - See What Your Audit Looks Like | Window Man" description="View a real example of our AI window quote audit." canonicalUrl="https://itswindowman.com/sample-report" />
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Sample AI Report - See What Your Audit Looks Like | Window Man" description="View a real example of our AI window quote audit. See the scorecard, risk flags, and plain-English findings before you upload your own estimate. 100% free, no obligation." canonicalUrl="https://itswindowman.com/sample-report" />
      <Navbar />
      <SampleReportHeader onOpenLeadModal={handleOpenLeadModal} />

      {/* Lead Capture Modal (2-step flow) */}
      <SampleReportLeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleLeadModalSuccess}
        ctaSource={modalCtaSource}
        preCheckPartnerConsent={preCheckPartnerConsent}
      />

      {/* Main Content */}
      <main className="pt-28">
        <HeroSection onOpenLeadModal={handleOpenLeadModal} />
        <ComparisonSection />
        <ScoreboardSection />
        <PillarAccordionSection />
        <HowItWorksSection />
        <LeverageOptionsSection onOpenLeadModal={handleOpenLeadModal} />
        <CloserSection onOpenLeadModal={handleOpenLeadModal} />
        <FAQSection />
      </main>
    </div>
  );
};

export default SampleReport;
