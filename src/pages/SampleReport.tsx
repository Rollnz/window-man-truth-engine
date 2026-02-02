import { useState, useEffect } from 'react';
import { Navbar } from '@/components/home/Navbar';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { trackEvent } from '@/lib/gtm';

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
  const [showAccessGate, setShowAccessGate] = useState(!hasLead);
  const [gateCompleted, setGateCompleted] = useState(hasLead);

  useEffect(() => { trackEvent('sample_report_view', { has_lead: hasLead, lead_id: leadId || anchorId || undefined }); }, [hasLead, leadId, anchorId]);

  const handleGateComplete = (newLeadId: string) => { setShowAccessGate(false); setGateCompleted(true); trackEvent('sample_report_gate_complete', { lead_id: newLeadId }); };
  const handleGateClose = () => { if (hasLead) { setShowAccessGate(false); setGateCompleted(true); } };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Sample AI Report - See What Your Audit Looks Like | Window Man" description="View a real example of our AI window quote audit. See the scorecard, risk flags, and plain-English findings before you upload your own estimate. 100% free, no obligation." canonicalUrl="https://itswindowman.com/sample-report" />
      <Navbar />
      <SampleReportHeader />
      <SampleReportAccessGate isOpen={showAccessGate} onClose={handleGateClose} onSuccess={handleGateComplete} />
      <main className={`pt-28 ${!gateCompleted ? 'blur-sm pointer-events-none' : ''}`}>
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
