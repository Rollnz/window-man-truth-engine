import { useState, useRef, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { QuoteScannerHero } from '@/components/quote-scanner/QuoteScannerHero';
import { QuoteUploadZone } from '@/components/quote-scanner/QuoteUploadZone';
import { QuoteAnalysisResults } from '@/components/quote-scanner/QuoteAnalysisResults';
import { QuoteQA } from '@/components/quote-scanner/QuoteQA';
import { QuoteUploadGateModal } from '@/components/audit/QuoteUploadGateModal';

import { useGatedAIScanner } from '@/hooks/useGatedAIScanner';
import { useQuoteScanner } from '@/hooks/useQuoteScanner';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { ErrorBoundary } from '@/components/error';
import { AIErrorFallback, getAIErrorType } from '@/components/error';
import { getToolPageSchemas, getBreadcrumbSchema } from '@/lib/seoSchemas/index';
import { ToolFAQSection } from '@/components/seo';
import { getToolFAQs } from '@/data/toolFAQs';
// Supporting sections
import { ScannerVideoSection } from '@/components/quote-scanner/ScannerVideoSection';
import { ScannerSocialProof } from '@/components/quote-scanner/ScannerSocialProof';
import { ScannerFAQSection } from '@/components/quote-scanner/ScannerFAQSection';
import { NoQuotePathway } from '@/components/quote-scanner/NoQuotePathway';
import { WindowCalculatorTeaser } from '@/components/quote-scanner/WindowCalculatorTeaser';
import { QuoteSafetyChecklist } from '@/components/quote-scanner/QuoteSafetyChecklist';
// Vault Pivot Conversion Engine
import { SoftInterceptionAnchor, NoQuotePivotSection } from '@/components/quote-scanner/vault-pivot';
import { PreQuoteLeadModal } from '@/components/sample-report/PreQuoteLeadModal';
import { AIComparisonSection } from '@/components/quote-scanner/AIComparisonSection';
import { UrgencyTicker } from '@/components/social-proof';
import { ScanPipelineStrip } from '@/components/quote-scanner/ScanPipelineStrip';
import { TestimonialCards } from '@/components/TestimonialCards';
// New gated flow components
import { TalkToExpertCTA } from '@/components/quote-scanner/TalkToExpertCTA';
import { AnalysisTheaterScreen } from '@/components/quote-scanner/AnalysisTheaterScreen';
// Attribution & tracking for NoQuotePivotSection handler
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateClientId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { trackLeadCapture, trackLeadSubmissionSuccess } from '@/lib/gtm';
// Session registration for database FK compliance
import { getSessionId as getRegisteredSessionId } from '@/lib/windowTruthClient';
import { Lock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuoteScanner() {
  usePageTracking('quote-scanner');
  const { toast } = useToast();

  // ── Gated scanner hook (primary flow driver) ────────────────────────
  const gated = useGatedAIScanner();

  // ── Secondary hook for email draft, phone script, Q&A ───────────────
  const {
    isDraftingEmail,
    isDraftingPhoneScript,
    isAskingQuestion,
    emailDraft,
    phoneScript,
    qaAnswer,
    generateEmailDraft,
    generatePhoneScript,
    askQuestion,
  } = useQuoteScanner();

  const { sessionData, updateField } = useSessionData();
  const { leadId, setLeadId } = useLeadIdentity();
  const [isNoQuoteSubmitting, setIsNoQuoteSubmitting] = useState(false);
  const [isNoQuoteSubmitted, setIsNoQuoteSubmitted] = useState(false);
  const [preQuoteOpen, setPreQuoteOpen] = useState(false);
  const [registeredSessionId, setRegisteredSessionId] = useState<string>('');
  
  const uploadRef = useRef<HTMLDivElement>(null);

  // Register session with wm_sessions table on mount
  useEffect(() => {
    getRegisteredSessionId().then((id) => {
      if (id) setRegisteredSessionId(id);
    });
  }, []);

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

        <div className="container px-4 py-6">
          <UrgencyTicker />
        </div>

        <ScanPipelineStrip />

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
                  {/* Recovery message from Safari refresh */}
                  {gated.recoveryMessage && gated.phase === 'idle' && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                      {gated.recoveryMessage}
                    </div>
                  )}

                  {/* Upload zone: only in idle or when locked (re-upload visible behind overlay) */}
                  {(gated.phase === 'idle' || gated.phase === 'uploaded') && (
                    <QuoteUploadZone
                      ref={uploadRef}
                      onFileSelect={gated.handleFileSelect}
                      isAnalyzing={false}
                      hasResult={false}
                      imagePreview={null}
                      onNoQuoteClick={() => setPreQuoteOpen(true)}
                    />
                  )}

                  {/* Locked overlay */}
                  {gated.phase === 'locked' && (
                    <div className="relative rounded-xl border border-border overflow-hidden">
                      {/* Blurred preview */}
                      {gated.filePreviewUrl && (
                        <img
                          src={gated.filePreviewUrl}
                          alt="Uploaded quote preview"
                          className="w-full h-64 object-cover blur-xl scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-4 p-6">
                        <Lock className="w-10 h-10 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground text-center">Your report is ready to unlock</p>
                        <Button onClick={gated.reopenModal} size="lg">
                          Unlock Your Report
                        </Button>
                        <button
                          onClick={gated.reset}
                          className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 inline mr-1" />
                          Upload a Different Quote
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Analysis theater */}
                  {gated.phase === 'analyzing' && (
                    <AnalysisTheaterScreen previewUrl={gated.filePreviewUrl} />
                  )}

                  {/* Revealed: show the upload zone with preview */}
                  {gated.phase === 'revealed' && gated.analysisResult && (
                    <QuoteUploadZone
                      ref={uploadRef}
                      onFileSelect={gated.handleFileSelect}
                      isAnalyzing={false}
                      hasResult={true}
                      imagePreview={gated.imageBase64}
                      mimeType={gated.mimeType}
                      analysisResult={gated.analysisResult}
                      onWarningSelect={(key) => {
                        const el = document.getElementById(`score-row-${key}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onNoQuoteClick={() => setPreQuoteOpen(true)}
                    />
                  )}
                </div>

                {/* Right column - Results (ONLY when revealed) */}
                <div className="space-y-6">
                  {/* Error display */}
                  {gated.error && !gated.isLoading && (
                    <AIErrorFallback
                      errorType={getAIErrorType(gated.error)}
                      message={gated.error}
                      onRetry={() => window.location.reload()}
                      compact
                    />
                  )}

                  {/* Authority Report — ONLY when phase === 'revealed' */}
                  {gated.phase === 'revealed' && gated.analysisResult && (
                    <>
                      {/* Section 1: Report Header */}
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">Your Quote Intelligence Report</h2>
                        {gated.analysisResult.forensic?.headline && (
                          <p className="text-base text-muted-foreground">{gated.analysisResult.forensic.headline}</p>
                        )}
                      </div>

                      {/* Section 2: Executive Summary */}
                      {gated.analysisResult.summary && (
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <p className="text-sm text-foreground leading-relaxed">
                            {gated.analysisResult.summary}
                          </p>
                        </div>
                      )}

                      {/* Section 3: Findings */}
                      <QuoteAnalysisResults
                        result={gated.analysisResult}
                        isLocked={false}
                        hasImage={!!gated.imageBase64}
                      />

                      {/* Section 4: Primary CTA - Phone */}
                      <TalkToExpertCTA leadId={gated.leadId} />

                      {/* Section 5: Secondary CTA - Q&A */}
                      <QuoteQA
                        answer={qaAnswer}
                        isAsking={isAskingQuestion}
                        onAsk={askQuestion}
                        disabled={false}
                      />
                    </>
                  )}
                </div>
              </div>
            </ErrorBoundary>
          </div>
        </section>

        <ScannerVideoSection />

        {/* Vault Pivot Conversion Engine */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            <SoftInterceptionAnchor />
            <NoQuotePivotSection 
              isLoading={isNoQuoteSubmitting}
              isSubmitted={isNoQuoteSubmitted}
              onGoogleAuth={() => {
                console.log('Google OAuth clicked - will redirect to /vault');
              }}
              onEmailSubmit={async (data) => {
                setIsNoQuoteSubmitting(true);
                try {
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

                    await trackLeadCapture(
                      {
                        leadId: result.leadId,
                        sourceTool: 'quote_scanner',
                        conversionAction: 'form_submit',
                      },
                      data.email,
                      undefined,
                      {
                        hasName: !!(data.firstName || data.lastName),
                        hasPhone: false,
                      }
                    );

                    await trackLeadSubmissionSuccess({
                      leadId: result.leadId,
                      email: data.email,
                      firstName: data.firstName,
                      lastName: data.lastName,
                      sourceTool: 'quote-scanner',
                      eventId: result.leadId,
                      value: 100,
                    });

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

        <ToolFAQSection
          toolPath="/ai-scanner"
          faqs={getToolFAQs('quote-scanner')}
          title="AI Quote Scanner FAQs"
          description="How our AI analyzes your window quotes"
        />

        <ScannerFAQSection uploadRef={uploadRef} />
      </main>

      {/* Lead gate modal — only when phase === 'uploaded' && modal open */}
      <QuoteUploadGateModal
        isOpen={gated.phase === 'uploaded' && gated.isModalOpen}
        onClose={gated.closeModal}
        onSubmit={gated.captureLead}
        isLoading={gated.isLoading}
        returnFocusRef={uploadRef}
      />

      <PreQuoteLeadModal
        isOpen={preQuoteOpen}
        onClose={() => setPreQuoteOpen(false)}
        ctaSource="scanner_download_sample"
      />
    </div>
  );
}
