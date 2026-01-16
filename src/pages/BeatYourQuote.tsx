import { useState, useCallback } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useSessionData } from '@/hooks/useSessionData';
import { Navbar } from '@/components/home/Navbar';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { DossierHero } from '@/components/beat-your-quote/DossierHero';
import { ConceptSection } from '@/components/beat-your-quote/ConceptSection';
import { ManipulationTactics } from '@/components/beat-your-quote/ManipulationTactics';
import { AnatomySection } from '@/components/beat-your-quote/AnatomySection';
import { ToolsSection } from '@/components/beat-your-quote/ToolsSection';
import { MissionOutcomes } from '@/components/beat-your-quote/MissionOutcomes';
import { InterrogationFAQ } from '@/components/beat-your-quote/InterrogationFAQ';
import { MissionInitiatedModal } from '@/components/beat-your-quote/MissionInitiatedModal';
import { AnalysisSuccessScreen } from '@/components/beat-your-quote/AnalysisSuccessScreen';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';

export default function BeatYourQuote() {
  usePageTracking('beat-your-quote');
  const { sessionData } = useSessionData();

  // State to trigger modal from hero buttons (legacy, now used by AnatomySection)
  const [modalTriggerCount, setModalTriggerCount] = useState(0);

  // Track uploaded file for lead capture modal
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  
  // Track captured lead for success screen
  const [capturedLeadName, setCapturedLeadName] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  const handleUploadSuccess = useCallback((fileId: string, _filePath: string) => {
    setUploadedFileId(fileId);
    setIsLeadModalOpen(true);
  }, []);

  const handleLeadCaptured = useCallback((leadId: string, leadName?: string) => {
    setCapturedLeadName(leadName || null);
    setIsLeadModalOpen(false);
    setShowSuccessScreen(true);
  }, []);

  const handleCloseLeadModal = useCallback(() => {
    setIsLeadModalOpen(false);
  }, []);

  const handleCloseSuccessScreen = useCallback(() => {
    setShowSuccessScreen(false);
    // Reset state for next upload
    setUploadedFileId(null);
    setCapturedLeadName(null);
  }, []);

  const handleUploadAnother = useCallback(() => {
    setShowSuccessScreen(false);
    setUploadedFileId(null);
    setCapturedLeadName(null);
    // Scroll to top where dropzone is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen dossier-bg">
      <Navbar />
      <main>
        <DossierHero onUploadSuccess={handleUploadSuccess} />
        <ConceptSection />
        <ManipulationTactics />
        <AnatomySection modalTriggerCount={modalTriggerCount} />
        {/* Mission Outcomes - Testimonials */}
        <MissionOutcomes />
        {/* Interrogation FAQ */}
        <InterrogationFAQ />
        {/* Your Arsenal */}
        <ToolsSection />

        {/* Related Tools */}
        <RelatedToolsGrid
          title={getFrameControl('beat-your-quote').title}
          description={getFrameControl('beat-your-quote').description}
          tools={getSmartRelatedTools('beat-your-quote', sessionData.toolsCompleted)}
        />
      </main>
      <MinimalFooter onGetQuoteClick={scrollToTop} />

      {/* Mission Initiated Lead Capture Modal */}
      {uploadedFileId && (
        <MissionInitiatedModal
          isOpen={isLeadModalOpen}
          onClose={handleCloseLeadModal}
          quoteFileId={uploadedFileId}
          onLeadCaptured={handleLeadCaptured}
        />
      )}

      {/* Success Screen with Confetti */}
      {showSuccessScreen && (
        <AnalysisSuccessScreen
          leadName={capturedLeadName || undefined}
          onClose={handleCloseSuccessScreen}
          onUploadAnother={handleUploadAnother}
        />
      )}
    </div>
  );
}