import { useState, useEffect } from 'react';
import { Navbar } from '@/components/home/Navbar';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { trackEvent } from '@/lib/gtm';
import { Loader2 } from 'lucide-react';

import { ScrollLockWrapper } from '@/components/sample-report/ScrollLockWrapper';
import { SampleReportAccessGate } from '@/components/sample-report/SampleReportAccessGate';
import { SampleReportHeader } from '@/components/sample-report/SampleReportHeader';
import { HeroSection } from '@/components/sample-report/HeroSection';
import { ComparisonSection } from '@/components/sample-report/ComparisonSection';
import { ScoreboardSection } from '@/components/sample-report/ScoreboardSection';
import { PillarAccordionSection } from '@/components/sample-report/PillarAccordionSection';
import { HowItWorksSection } from '@/components/sample-report/HowItWorksSection';
import { LeverageOptionsSection } from '@/components/sample-report/LeverageOptionsSection';
import { CloserSection } from '@/components/sample-report/CloserSection';
import { FAQSection } from '@/components/sample-report/FAQSection';

const SampleReport = () => {
  usePageTracking('sample-report');
  
  const { leadId, hasIdentity } = useLeadIdentity();
  const anchorId = getLeadAnchor();
  const hasLead = hasIdentity || !!anchorId;

  // Prevent content flash on initial load
  const [isCheckingLead, setIsCheckingLead] = useState(true);
  const [showAccessGate, setShowAccessGate] = useState(false);
  const [gateCompleted, setGateCompleted] = useState(false);

  // Check lead status after mount
  useEffect(() => {
    const checkLeadStatus = () => {
      const hasExistingLead = hasIdentity || !!anchorId;
      setGateCompleted(hasExistingLead);
      setShowAccessGate(!hasExistingLead);
      setIsCheckingLead(false);
    };

    // Small delay to prevent flash
    const timer = setTimeout(checkLeadStatus, 100);
    return () => clearTimeout(timer);
  }, [hasIdentity, anchorId]);

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

  // Prevent navigation away with unsaved state (soft warning)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showAccessGate && !gateCompleted) {
        e.preventDefault();
        e.returnValue = ''; // Triggers browser warning
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showAccessGate, gateCompleted]);

  const handleGateComplete = (newLeadId: string) => {
    setShowAccessGate(false);
    setGateCompleted(true);
    trackEvent('sample_report_gate_complete', { lead_id: newLeadId });
  };

  const handleGateClose = () => {
    // Only allow close if they already have a lead
    if (hasLead) {
      setShowAccessGate(false);
      setGateCompleted(true);
    }
    // Otherwise, progressive gate logic handles it (stays open)
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
      <SampleReportHeader />

      {/* Scroll Lock Wrapper (battle-tested iOS solution) */}
      <ScrollLockWrapper enabled={showAccessGate}>
        <SampleReportAccessGate 
          isOpen={showAccessGate} 
          onClose={handleGateClose} 
          onSuccess={handleGateComplete} 
        />
      </ScrollLockWrapper>

      {/* Background Overlay (performance-optimized blur alternative) */}
      {!gateCompleted && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm pointer-events-none" 
          aria-hidden="true"
        />
      )}

      {/* Main Content (with inert for accessibility when gate is open) */}
      <main 
        className="pt-28"
        {...(!gateCompleted && { inert: '' })}
      >
        <HeroSection />
        <ComparisonSection />
        <ScoreboardSection />
        <PillarAccordionSection />
        <HowItWorksSection />
        <LeverageOptionsSection />
        <CloserSection />
        <FAQSection />
      </main>
    </div>
  );
};

export default SampleReport;
