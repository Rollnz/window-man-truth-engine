import { useState, useCallback, lazy, Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useSessionData } from '@/hooks/useSessionData';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { Navbar } from '@/components/home/Navbar';

import { DossierHero } from '@/components/beat-your-quote/DossierHero';
import { ConceptSection } from '@/components/beat-your-quote/ConceptSection';
import { ManipulationTactics } from '@/components/beat-your-quote/ManipulationTactics';
import { AnatomySection } from '@/components/beat-your-quote/AnatomySection';
import { ToolsSection } from '@/components/beat-your-quote/ToolsSection';
import { MissionOutcomes } from '@/components/beat-your-quote/MissionOutcomes';
import { InterrogationFAQ } from '@/components/beat-your-quote/InterrogationFAQ';
import { QuoteCheckerSection } from '@/components/beat-your-quote/QuoteCheckerSection';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { FAQSection } from '@/components/sample-report/FAQSection';
import { useToast } from '@/hooks/use-toast';

// Gated scanner system (matching /audit architecture)
import { useGatedScanner } from '@/hooks/audit';
import { QuoteUploadGateModal } from '@/components/audit/QuoteUploadGateModal';
import { PreQuoteLeadModalV2 } from '@/components/LeadModalV2/PreQuoteLeadModalV2';
import { AnalyzingState, FullResultsPanel } from '@/components/audit/scanner-modal';
import { PreGateInterstitial } from '@/components/audit/PreGateInterstitial';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

// Lazy load expert chat for post-reveal engagement
const AuditExpertChat = lazy(() => import('@/components/audit/AuditExpertChat').then(m => ({ default: m.AuditExpertChat })));

export default function BeatYourQuote() {
  usePageTracking('beat-your-quote');
  const { sessionData, updateFields } = useSessionData();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Sync chat context to session on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref === 'wm_chat') {
      const fields: Record<string, unknown> = {};
      const count = searchParams.get('count');
      const zip = searchParams.get('zip');
      if (count) {
        const parsed = parseInt(count, 10);
        if (parsed > 0 && Number.isFinite(parsed)) fields.windowCount = parsed;
      }
      if (zip) fields.zipCode = zip;
      if (Object.keys(fields).length > 0) updateFields(fields);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const resultsRef = useRef<HTMLDivElement>(null);

  // State to trigger modal from hero buttons (legacy, now used by AnatomySection)
  const [modalTriggerCount, setModalTriggerCount] = useState(0);

  // Gated scanner - dual-path system matching /audit
  const scanner = useGatedScanner();

  // "No quote yet?" modal state
  const [isNoQuoteModalOpen, setIsNoQuoteModalOpen] = useState(false);
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Handle file select from hero or QuoteCheckerSection
  const handleFileSelect = useCallback((file: File) => {
    scanner.handleFileSelect(file);
    // Scroll to results area after a short delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, [scanner]);

  const handleNoQuoteClick = useCallback(() => {
    setIsNoQuoteModalOpen(true);
  }, []);

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

  // Render the results panel based on scanner phase
  const renderResultsSection = () => {
    if (scanner.phase === 'idle') return null;

    return (
      <section className="relative py-16 overflow-hidden" style={{ backgroundColor: '#0A0F14' }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <div ref={resultsRef}>
            {/* Pre-gate interstitial */}
            {scanner.phase === 'pre-gate' && (
              <Card className="relative bg-slate-900/80 border-slate-700/50 p-8 min-h-[400px] overflow-hidden flex items-center justify-center">
                {scanner.scanAttemptId ? (
                  <PreGateInterstitial
                    scanAttemptId={scanner.scanAttemptId}
                    onComplete={scanner.completePreGate}
                  />
                ) : (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-[#efefef] text-sm">Preparing analysis...</p>
                  </div>
                )}
              </Card>
            )}

            {/* Waiting for lead capture */}
            {scanner.phase === 'uploaded' && (
              <Card className="relative bg-slate-900/80 border-slate-700/50 p-8 min-h-[400px] overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/20 border-2 border-orange-500/30 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Your Gradecard is Ready</h3>
                  <p className="text-[#efefef] text-sm mb-6">Complete the form to reveal your AI analysis</p>
                  <Button
                    onClick={scanner.reopenModal}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Unlock My Report
                  </Button>
                </div>
              </Card>
            )}

            {/* Analyzing */}
            {scanner.phase === 'analyzing' && (
              <Card className="relative bg-slate-900/80 border-slate-700/50 p-8 min-h-[400px] overflow-hidden flex items-center justify-center">
                <AnalyzingState />
              </Card>
            )}

            {/* Revealed - Full Results */}
            {scanner.phase === 'revealed' && scanner.result && (
              <Card className="relative bg-slate-900/80 border-slate-700/50 p-6 min-h-[400px] overflow-visible">
                <FullResultsPanel result={scanner.result} />
              </Card>
            )}

            {/* Error display */}
            {scanner.error && (
              <div className="mt-6">
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
                  <p className="text-destructive font-medium">{scanner.error}</p>
                  <Button variant="outline" className="mt-2" onClick={scanner.reset}>
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen dossier-bg dossier-page">
      <SEO 
        title="Beat Your Quote - Free Quote Analysis"
        description="Upload your window replacement quote for a free expert analysis. Identify hidden markups and learn how to negotiate a better price with our AI-powered scanner."
        canonicalUrl="https://itswindowman.com/beat-your-quote"
        jsonLd={[...beatYourQuoteSchema, getBreadcrumbSchema('beat-your-quote')]}
      />
      <Navbar funnelMode={true} />
      <main>
        <div className="pt-20">
          <DossierHero
            onFileSelect={handleFileSelect}
            onNoQuoteClick={handleNoQuoteClick}
          />
        </div>

        {/* Results section - renders based on scanner phase */}
        {renderResultsSection()}

        {/* Expert chat Q&A - only when results are revealed */}
        {scanner.phase === 'revealed' && scanner.result && (
          <Suspense fallback={<div className="h-48 bg-slate-950" />}>
            <AuditExpertChat
              onAsk={scanner.askQuestion}
              isAsking={scanner.isAskingQuestion}
              latestAnswer={scanner.qaAnswer}
              analysisResult={scanner.result}
            />
          </Suspense>
        )}

        <ConceptSection />
        <ManipulationTactics />
        <AnatomySection modalTriggerCount={modalTriggerCount} />
        
        {/* Quote Submission Options - 3 Cards */}
        <QuoteCheckerSection
          onFileSelect={handleFileSelect}
          onOpenBookingModal={() => setIsBookingModalOpen(true)}
        />
        
        {/* Mission Outcomes - Testimonials */}
        <MissionOutcomes />

        {/* PRD-Compliant FAQ Section */}
        <FAQSection />

        {/* Legacy Interrogation FAQ */}
        <InterrogationFAQ />
        {/* Your Arsenal */}
        <ToolsSection />
      </main>

      {/* Quote Upload Gate Modal - fires after pre-gate interstitial */}
      <QuoteUploadGateModal
        isOpen={scanner.isModalOpen}
        onClose={scanner.closeModal}
        onSubmit={scanner.captureLead}
        isLoading={scanner.isLoading}
        scanAttemptId={scanner.scanAttemptId ?? undefined}
      />

      {/* "No quote yet?" PreQuoteLeadModalV2 */}
      <PreQuoteLeadModalV2
        isOpen={isNoQuoteModalOpen}
        onClose={() => setIsNoQuoteModalOpen(false)}
        ctaSource="beat-your-quote-no-quote"
      />

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
