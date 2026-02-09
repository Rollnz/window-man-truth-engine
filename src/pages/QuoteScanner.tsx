import { useState, useRef, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { QuoteScannerHero } from '@/components/quote-scanner/QuoteScannerHero';
import { QuoteUploadZone } from '@/components/quote-scanner/QuoteUploadZone';
import { QuoteAnalysisResults } from '@/components/quote-scanner/QuoteAnalysisResults';
import { QuoteQA } from '@/components/quote-scanner/QuoteQA';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';

import { useQuoteScanner } from '@/hooks/useQuoteScanner';
import type { SourceTool } from '@/types/sourceTool';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { trackScannerUploadCompleted } from '@/lib/secondarySignalEvents';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { ErrorBoundary } from '@/components/error';
import { AIErrorFallback, getAIErrorType } from '@/components/error';
import { getToolPageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ToolFAQSection } from '@/components/seo';
import { getToolFAQs } from '@/data/toolFAQs';
// New supporting sections
import { ScannerSocialProof } from '@/components/quote-scanner/ScannerSocialProof';
import { AIComparisonSection } from '@/components/quote-scanner/AIComparisonSection';
import { ScannerFAQSection } from '@/components/quote-scanner/ScannerFAQSection';
import { NoQuotePathway } from '@/components/quote-scanner/NoQuotePathway';
import { WindowCalculatorTeaser } from '@/components/quote-scanner/WindowCalculatorTeaser';
import { QuoteSafetyChecklist } from '@/components/quote-scanner/QuoteSafetyChecklist';
// Vault Pivot Conversion Engine
import { SoftInterceptionAnchor, NoQuotePivotSection } from '@/components/quote-scanner/vault-pivot';
import { UrgencyTicker } from '@/components/social-proof';
import { TestimonialCards } from '@/components/TestimonialCards';
// Attribution & tracking for NoQuotePivotSection handler
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateClientId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { trackLeadCapture, trackLeadSubmissionSuccess } from '@/lib/gtm';
// Session registration for database FK compliance
import { getSessionId as getRegisteredSessionId } from '@/lib/windowTruthClient';

export default function QuoteScanner() {
  usePageTracking('quote-scanner');
  const { toast } = useToast();
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
  const { leadId, setLeadId } = useLeadIdentity();
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [hasUnlockedResults, setHasUnlockedResults] = useState(!!sessionData.email);
  const [isNoQuoteSubmitting, setIsNoQuoteSubmitting] = useState(false);
  const [isNoQuoteSubmitted, setIsNoQuoteSubmitted] = useState(false);
  const [registeredSessionId, setRegisteredSessionId] = useState<string>('');
  
  // Ref for scroll-to-upload functionality
  const uploadRef = useRef<HTMLDivElement>(null);

  // CRITICAL: Register session with wm_sessions table on mount
  // This ensures the sessionId exists in the database before save-lead is called
  useEffect(() => {
    getRegisteredSessionId().then((id) => {
      if (id) setRegisteredSessionId(id);
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    const startTime = Date.now();
    await analyzeQuote(file);
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Track secondary signal: Scanner Upload Completed (Phase 4)
    trackScannerUploadCompleted({
      leadId: leadId || undefined,
      file_size: file.size,
      upload_duration: duration * 1000, // convert to milliseconds
    });

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
      <Navbar funnelMode={true} />
      
      <main className="pt-20">
        <QuoteScannerHero />

        <div className="container px-4 pb-6 -mt-6">
          <UrgencyTicker />
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
                    <QuoteQA
                      answer={qaAnswer}
                      isAsking={isAskingQuestion}
                      onAsk={askQuestion}
                      disabled={!analysisResult}
                    />
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

        {/* Vault Pivot Conversion Engine - Primary lead capture for no-quote visitors */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <SoftInterceptionAnchor />
            <NoQuotePivotSection 
              isLoading={isNoQuoteSubmitting}
              isSubmitted={isNoQuoteSubmitted}
              onGoogleAuth={() => {
                // TODO: Wire to real Supabase Google OAuth
                console.log('Google OAuth clicked - will redirect to /vault');
              }}
              onEmailSubmit={async (data) => {
                setIsNoQuoteSubmitting(true);
                try {
                  // Use the registered session ID (from wm_sessions table) to avoid FK violations
                  const sessionId = registeredSessionId || await getRegisteredSessionId();
                  
                  const { data: result, error } = await supabase.functions.invoke('save-lead', {
                    body: {
                      email: data.email,
                      firstName: data.firstName,
                      lastName: data.lastName,
                      sourceTool: 'quote-scanner',
                      sessionId,
                      sessionData: {
                        clientId: getOrCreateClientId(),
                      },
                      attribution: getAttributionData(),
                    },
                  });
                  
                  if (error) throw error;
                  
                  if (result?.leadId) {
                    updateField('leadId', result.leadId);
                    setLeadId(result.leadId);

                    // CRITICAL: Track lead capture for attribution (EMQ 9.5+)
                    await trackLeadCapture(
                      {
                        leadId: result.leadId,
                        sourceTool: 'quote_scanner',
                        conversionAction: 'form_submit',
                      },
                      data.email,
                      undefined, // No phone in NoQuote flow
                      {
                        hasName: !!(data.firstName || data.lastName),
                        hasPhone: false,
                      }
                    );

                    // Track enhanced conversion with value-based bidding ($100)
                    await trackLeadSubmissionSuccess({
                      leadId: result.leadId,
                      email: data.email,
                      firstName: data.firstName,
                      lastName: data.lastName,
                      sourceTool: 'quote-scanner',
                      eventId: `lead_captured:${result.leadId}`,
                      value: 100,
                    });

                    // Trigger success state instead of toast
                    setIsNoQuoteSubmitted(true);
                  }
                } catch (err) {
                  console.error('[QuoteScanner] NoQuote submit error:', err);
                  toast({
                    title: "Something went wrong",
                    description: "Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsNoQuoteSubmitting(false);
                }
              }}
            />
          </div>
        </section>

        {/* Supporting Content Sections */}
        <ScannerSocialProof />
        <AIComparisonSection uploadRef={uploadRef} />
        <TestimonialCards variant="default" />
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
