import { useState, useRef } from 'react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { QuoteScannerHero } from '@/components/quote-scanner/QuoteScannerHero';
import { QuoteUploadZone } from '@/components/quote-scanner/QuoteUploadZone';
import { QuoteAnalysisResults } from '@/components/quote-scanner/QuoteAnalysisResults';
import { NegotiationTools } from '@/components/quote-scanner/NegotiationTools';
import { QuoteQA } from '@/components/quote-scanner/QuoteQA';
import { GenerateProposalButton } from '@/components/quote-scanner/GenerateProposalButton';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConversionBar } from '@/components/conversion/ConversionBar';
import { useQuoteScanner } from '@/hooks/useQuoteScanner';
import type { SourceTool } from '@/types/sourceTool';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ErrorBoundary } from '@/components/error';
import { AIErrorFallback, getAIErrorType } from '@/components/error';
import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';
import { getToolPageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ToolFAQSection, PillarBreadcrumb } from '@/components/seo';
import { getToolFAQs } from '@/data/toolFAQs';
// New supporting sections
import { ScannerSocialProof } from '@/components/quote-scanner/ScannerSocialProof';
import { ScannerFAQSection } from '@/components/quote-scanner/ScannerFAQSection';
import { NoQuotePathway } from '@/components/quote-scanner/NoQuotePathway';
import { WindowCalculatorTeaser } from '@/components/quote-scanner/WindowCalculatorTeaser';
import { QuoteSafetyChecklist } from '@/components/quote-scanner/QuoteSafetyChecklist';

export default function QuoteScanner() {
  usePageTracking('quote-scanner');
  const {
    isAnalyzing,
    isDraftingEmail,
    isDraftingPhoneScript,
    isAskingQuestion,
    analysisResult,
    emailDraft,
    phoneScript,
    qaAnswer,
    imageBase64,
    analyzeQuote,
    generateEmailDraft,
    generatePhoneScript,
    askQuestion,
  } = useQuoteScanner();

  const { sessionData, updateField } = useSessionData();
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [hasUnlockedResults, setHasUnlockedResults] = useState(!!sessionData.email);
  
  // Ref for scroll-to-upload functionality
  const uploadRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (file: File) => {
    await analyzeQuote(file);
    // Show lead capture after analysis if user hasn't provided email
    if (!sessionData.email) {
      setShowLeadCapture(true);
    }
  };

  const handleLeadCaptureSuccess = (leadId: string) => {
    setHasUnlockedResults(true);
    setShowLeadCapture(false);
    updateField('leadId', leadId);
  };

  const isUnlocked = hasUnlockedResults || !!sessionData.email;
  const hasImage = !!imageBase64;

  // Get hook error for inline display
  const hookError = useQuoteScanner().error;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="AI Quote Scanner - Instant Quote Analysis"
        description="Upload your window replacement quote for instant AI-powered analysis. Identify red flags, compare fair pricing, and get negotiation scripts."
        canonicalUrl="https://itswindowman.com/quote-scanner"
        jsonLd={[...getToolPageSchemas('quote-scanner'), getBreadcrumbSchema('quote-scanner')]}
      />
      <Navbar />
      
      <main className="pt-20">
        {/* Pillar Breadcrumb */}
        <div className="container px-4 mb-2">
          <PillarBreadcrumb toolPath="/ai-scanner" variant="badge" />
        </div>

        <QuoteScannerHero />

        <div className="container px-4 mt-6">
          {/* Keep a persistent path to the estimate flow so scanner visitors don't stall */}
          <ConversionBar
            headline="Scan your quote, then jump straight into a verified estimate."
            subheadline="Our team double-checks pricing, red flags, and negotiates the best numbers for you."
          />
        </div>
        
        <section className="py-12 md:py-20">
          <div className="container px-4">
            <ErrorBoundary
              title="Quote Analysis Error"
              description="We encountered an issue with the quote scanner. Please try uploading your quote again."
              onReset={() => window.location.reload()}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left column - Upload */}
                <div className="space-y-6">
                  <QuoteUploadZone
                    ref={uploadRef}
                    onFileSelect={handleFileSelect}
                    isAnalyzing={isAnalyzing}
                    hasResult={!!analysisResult}
                    imagePreview={imageBase64}
                  />
                </div>

                {/* Right column - Results */}
                <div className="space-y-6">
                  {/* Show error fallback if there's an error */}
                  {hookError && !isAnalyzing && (
                    <AIErrorFallback
                      errorType={getAIErrorType(hookError)}
                      message={hookError}
                      onRetry={() => window.location.reload()}
                      compact
                    />
                  )}

                  <QuoteAnalysisResults 
                    result={analysisResult} 
                    isLocked={!isUnlocked}
                    hasImage={hasImage}
                  />

                  {isUnlocked && analysisResult && (
                    <>
                      <GenerateProposalButton 
                        analysisResult={analysisResult}
                        homeownerName={sessionData.name}
                      />

                      <NegotiationTools
                        emailDraft={emailDraft}
                        phoneScript={phoneScript}
                        isDraftingEmail={isDraftingEmail}
                        isDraftingPhoneScript={isDraftingPhoneScript}
                        onGenerateEmail={generateEmailDraft}
                        onGeneratePhoneScript={generatePhoneScript}
                        disabled={!analysisResult}
                      />

                      <QuoteQA
                        answer={qaAnswer}
                        isAsking={isAskingQuestion}
                        onAsk={askQuestion}
                        disabled={!analysisResult}
                      />
                    </>
                  )}

                  {/* Unlock button when locked with results */}
                  {!isUnlocked && hasImage && analysisResult && (
                    <button
                      onClick={() => setShowLeadCapture(true)}
                      className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Unlock Full Report
                    </button>
                  )}
                </div>
              </div>
            </ErrorBoundary>
          </div>
        </section>

        {/* Supporting Content Sections */}
        <ScannerSocialProof />
        <QuoteSafetyChecklist uploadRef={uploadRef} />
        <WindowCalculatorTeaser />
        <NoQuotePathway />

        {/* PRD-Compliant FAQ Section */}
        <ToolFAQSection
          toolPath="/ai-scanner"
          faqs={getToolFAQs('quote-scanner')}
          title="AI Quote Scanner FAQs"
          description="How our AI analyzes your window quotes"
        />

        {/* Legacy FAQ section - can be removed later */}
        <ScannerFAQSection uploadRef={uploadRef} />

        {/* Related Tools - "Enforce Your Rights" section */}
        <RelatedToolsGrid
          title={getFrameControl('quote-scanner').title}
          description={getFrameControl('quote-scanner').description}
          tools={getSmartRelatedTools('quote-scanner', sessionData.toolsCompleted)}
        />
      </main>

      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={handleLeadCaptureSuccess}
        sourceTool={'quote-scanner' satisfies SourceTool}
        sessionData={sessionData}
      />
    </div>
  );
}
