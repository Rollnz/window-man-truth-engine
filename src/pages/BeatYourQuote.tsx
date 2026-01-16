import { useState, useCallback } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useSessionData } from '@/hooks/useSessionData';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema } from '@/lib/seoSchemas';
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
import { QuoteCheckerSection } from '@/components/beat-your-quote/QuoteCheckerSection';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { useToast } from '@/hooks/use-toast';

export default function BeatYourQuote() {
  usePageTracking('beat-your-quote');
  const { sessionData } = useSessionData();
  const { toast } = useToast();

  // State to trigger modal from hero buttons (legacy, now used by AnatomySection)
  const [modalTriggerCount, setModalTriggerCount] = useState(0);

  // Track uploaded file for lead capture modal
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  
  // Track captured lead for success screen
  const [capturedLeadName, setCapturedLeadName] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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

  const beatYourQuoteSchema = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Beat Your Quote - Quote Scanner",
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "description": "Upload your window replacement quote and get a free expert analysis to identify hidden markups and negotiate a better price.",
      "url": "https://itswindowman.com/beat-your-quote"
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the quote scanner work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Simply upload a photo or PDF of your window replacement quote. Our AI-powered scanner analyzes the pricing, identifies potential markups, and provides you with a detailed breakdown of fair market prices."
          }
        },
        {
          "@type": "Question",
          "name": "Is the quote analysis really free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, the quote analysis is completely free. We believe homeowners deserve transparency in window pricing without paying for it upfront."
          }
        },
        {
          "@type": "Question",
          "name": "What information do I need to submit my quote?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Just upload a clear photo or PDF of your contractor's quote. Our system will extract the relevant pricing information automatically."
          }
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen dossier-bg">
      <SEO 
        title="Beat Your Quote - Free Quote Analysis"
        description="Upload your window replacement quote for a free expert analysis. Identify hidden markups and learn how to negotiate a better price with our AI-powered scanner."
        canonicalUrl="https://itswindowman.com/beat-your-quote"
        jsonLd={[...beatYourQuoteSchema, getBreadcrumbSchema('beat-your-quote')]}
      />
      <Navbar />
      <main>
        <DossierHero onUploadSuccess={handleUploadSuccess} />
        <ConceptSection />
        <ManipulationTactics />
        <AnatomySection modalTriggerCount={modalTriggerCount} />
        
        {/* Quote Submission Options - 3 Cards */}
        <QuoteCheckerSection
          onUploadSuccess={handleUploadSuccess}
          onOpenBookingModal={() => setIsBookingModalOpen(true)}
        />
        
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

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          setIsBookingModalOpen(false);
          toast({
            title: '📞 Consultation Requested!',
            description: "We'll contact you shortly to schedule your quote review.",
          });
        }}
        sessionData={sessionData}
        sourceTool="beat-your-quote"
      />
    </div>
  );
}