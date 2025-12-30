import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { caseStudies, MissionType } from '@/data/evidenceData';
import { useSessionData } from '@/hooks/useSessionData';
import { EvidenceHero } from '@/components/evidence/EvidenceHero';
import { FilterBar } from '@/components/evidence/FilterBar';
import { CaseFileGrid } from '@/components/evidence/CaseFileGrid';
import { CaseDebriefModal } from '@/components/evidence/CaseDebriefModal';
import { RelatedIntelligence } from '@/components/evidence/RelatedIntelligence';
import { StickyCTA } from '@/components/evidence/StickyCTA';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Evidence() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionData, updateFields, markToolCompleted } = useSessionData();
  
  // Modals state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  
  // URL-synced case selection
  const activeCaseId = searchParams.get('case');
  const activeCase = useMemo(() => 
    activeCaseId ? caseStudies.find(c => c.id === activeCaseId) : null,
    [activeCaseId]
  );
  
  // URL-synced filter
  const urlFilter = (searchParams.get('filter') as MissionType | 'all') || 'all';
  
  // Track page view
  useState(() => {
    if (!sessionData.evidenceLockerViewed) {
      updateFields({ evidenceLockerViewed: true });
      markToolCompleted('evidence-locker');
    }
  });
  
  const handleOpenCase = (caseId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('case', caseId);
    setSearchParams(params);
    
    // Track case view
    const viewedCases = sessionData.caseStudiesViewed || [];
    if (!viewedCases.includes(caseId)) {
      updateFields({ 
        caseStudiesViewed: [...viewedCases, caseId],
        lastCaseViewed: caseId,
      });
    }
  };
  
  const handleCloseCase = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('case');
    setSearchParams(params);
  };
  
  const handleFilterChange = (filter: MissionType | 'all') => {
    const params = new URLSearchParams(searchParams);
    if (filter === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', filter);
    }
    params.delete('case'); // Close modal when filtering
    setSearchParams(params);
  };
  
  // Navigate directly to preserve modal state in history
  const handleToolNavigation = (toolPath: string) => {
    navigate(toolPath);
  };
  
  const handleDownload = () => {
    setShowLeadCapture(true);
  };
  
  const handleConsultation = () => {
    setShowConsultation(true);
  };
  
  const handleLeadSuccess = (leadId: string) => {
    updateFields({ leadId });
    setShowLeadCapture(false);
  };
  
  const handleConsultationSuccess = () => {
    updateFields({ consultationRequested: true });
    setShowConsultation(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <EvidenceHero />

      {/* Main Content */}
      <section className="py-8">
        <div className="container px-4 space-y-8">
          {/* Filter Bar */}
          <FilterBar 
            activeFilter={urlFilter} 
            onFilterChange={handleFilterChange}
          />

          {/* Case Grid */}
          <CaseFileGrid 
            caseStudies={caseStudies}
            activeFilter={urlFilter}
            onOpenCase={handleOpenCase}
          />
        </div>
      </section>

      {/* Related Intelligence */}
      <RelatedIntelligence />

      {/* Case Debrief Modal */}
      <CaseDebriefModal
        isOpen={!!activeCase}
        caseStudy={activeCase}
        onClose={handleCloseCase}
        onToolNavigate={handleToolNavigation}
        onDownload={handleDownload}
        onConsultation={handleConsultation}
      />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={handleLeadSuccess}
        sourceTool="evidence-locker"
        sessionData={{
          ...sessionData,
          lastCaseViewed: activeCase?.id,
        }}
      />

      {/* Consultation Modal */}
      <ConsultationBookingModal
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
        onSuccess={handleConsultationSuccess}
        sessionData={sessionData}
        leadId={sessionData.leadId}
      />

      {/* Sticky CTA (Mobile) */}
      <StickyCTA 
        onConsultation={handleConsultation}
        isModalOpen={!!activeCase || showLeadCapture || showConsultation}
      />
    </div>
  );
}
