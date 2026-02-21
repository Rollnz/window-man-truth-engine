import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { AIComparisonSection } from '@/components/quote-scanner/AIComparisonSection';
import { UrgencyTicker } from '@/components/social-proof';
import { ScanPipelineStrip } from '@/components/quote-scanner/ScanPipelineStrip';
import { SectionFrame } from '@/components/proof/SectionFrame';
import aiBrainImg from '@/assets/ai_brain.webp';
import { TestimonialCards } from '@/components/TestimonialCards';
// New gated flow components
import { TalkToExpertCTA } from '@/components/quote-scanner/TalkToExpertCTA';
import { AnalysisTheaterScreen } from '@/components/quote-scanner/AnalysisTheaterScreen';
// Attribution & tracking for NoQuotePivotSection handler
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOrCreateClientId } from '@/lib/tracking';
import { getAttributionData } from '@/lib/attribution';
import { trackLeadCapture, trackEvent } from '@/lib/gtm';
import { wmLead } from '@/lib/wmTracking';
// Session registration for database FK compliance
import { getSessionId as getRegisteredSessionId } from '@/lib/windowTruthClient';
import { Lock, Upload, ShieldCheck, FileText, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilePreviewCard } from '@/components/ui/FilePreviewCard';
import { ExitIntentModal } from '@/components/authority';

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
  const [searchParams] = useSearchParams();
  const [isNoQuoteSubmitting, setIsNoQuoteSubmitting] = useState(false);

  // Sync chat context to session on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    const zip = searchParams.get('zip');
    if (ref === 'wm_chat' && zip) {
      updateField('zipCode', zip);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

        <SectionFrame
          id="forensic-pipeline"
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <img src={aiBrainImg} alt="" width={20} height={20} className="object-contain" />
              FORENSIC ALLY
            </span>
          }
          title="See Exactly How We Protect You"
          subtitle="Our AI scans every line of your quote in seconds — here's the 4-step process."
        >
          <ScanPipelineStrip />
        </SectionFrame>

        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Ambient stage glows */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 left-[15%] w-[400px] h-[400px] rounded-full bg-rose-500/[0.04] dark:bg-rose-500/[0.06] blur-3xl" />
            <div className="absolute top-1/4 right-[15%] w-[400px] h-[400px] rounded-full bg-primary/[0.05] dark:bg-primary/[0.08] blur-3xl" />
          </div>
          <div className="container px-4">
            <ErrorBoundary
              title="Quote Analysis Error"
              description="We encountered an issue with the quote scanner. Please try uploading your quote again."
              onReset={() => window.location.reload()}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* ═══ Left column — BEFORE ═══ */}
              <AnimateOnScroll direction="left" duration={400} threshold={0.2}>
                <div className="flex flex-col">
                  {/* Header — outside the card */}
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span className="font-bold text-xl text-rose-600 dark:text-rose-400">BEFORE:</span>
                    <span className="font-semibold text-lg text-foreground">Just a Confusing Estimate</span>
                  </div>

                  {/* Card — no border */}
                  <div className="group rounded-xl min-h-[520px] p-6 flex flex-col
                    bg-card dark:bg-slate-900/90
                    border border-rose-200/30 dark:border-rose-500/20
                    shadow-[0_4px_24px_-4px_rgba(159,18,57,0.06),0_1px_3px_rgba(0,0,0,0.04)]
                    dark:shadow-[0_0_1px_0_rgba(255,255,255,0.06)_inset,0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-8px_rgba(0,0,0,0.4)]
                    cursor-pointer
                    transition-[transform,box-shadow,border-color] duration-300 ease-out
                    motion-safe:hover:-translate-y-1 hover:shadow-[0_8px_32px_-4px_rgba(159,18,57,0.1),0_2px_6px_rgba(0,0,0,0.06)] hover:border-rose-200/50
                    dark:hover:shadow-[0_0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_0_rgba(255,255,255,0.06)_inset,0_12px_32px_-8px_rgba(0,0,0,0.5)] dark:hover:border-rose-500/30">
                    {/* Recovery message */}
                    {gated.recoveryMessage && gated.phase === 'idle' && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground mb-4">
                        {gated.recoveryMessage}
                      </div>
                    )}

                    {/* Inner content */}
                    <div className="flex-1">
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

                      {(gated.phase === 'locked' || gated.phase === 'analyzing') && (
                        <div className="relative rounded-xl border border-border overflow-hidden">
                          <FilePreviewCard
                            file={gated.file}
                            previewUrl={gated.filePreviewUrl}
                            fileName={gated.fileName ?? undefined}
                            fileType={gated.fileType ?? undefined}
                            fileSize={gated.fileSize ?? undefined}
                            className="w-full h-64 blur-xl scale-110"
                          />
                          <div className="absolute inset-0 bg-background/60" />
                        </div>
                      )}

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
                  </div>
                </div>
              </AnimateOnScroll>

                {/* ═══ Right column — AFTER ═══ */}
              <AnimateOnScroll direction="right" duration={400} delay={150} threshold={0.2}>
                <div className="flex flex-col">
                  {/* Header — outside the card */}
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="font-bold text-xl text-primary">AFTER:</span>
                    <span className="font-semibold text-lg text-foreground">Your AI Intelligence Report</span>
                  </div>

                  {/* Card — no border */}
                  <div className="group rounded-xl min-h-[520px] p-6 flex flex-col
                    bg-card dark:bg-slate-900/95
                    border border-primary/20 dark:border-primary/20
                    shadow-[0_6px_32px_-4px_rgba(57,147,221,0.08),0_2px_6px_rgba(0,0,0,0.04)]
                    dark:shadow-[0_0_1px_0_rgba(57,147,221,0.12)_inset,0_1px_0_0_rgba(255,255,255,0.05)_inset,0_12px_32px_-8px_rgba(0,0,0,0.45)]
                    motion-safe:-translate-y-0.5
                    cursor-pointer
                    transition-[transform,box-shadow,border-color] duration-300 ease-out
                    motion-safe:hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-4px_rgba(57,147,221,0.12),0_4px_8px_rgba(0,0,0,0.06)] hover:border-primary/30
                    dark:hover:shadow-[0_0_1px_0_rgba(57,147,221,0.15)_inset,0_1px_0_0_rgba(255,255,255,0.07)_inset,0_16px_40px_-8px_rgba(0,0,0,0.5)] dark:hover:border-primary/30">
                    {/* Error display (any phase) */}
                    {gated.error && !gated.isLoading && (
                      <AIErrorFallback
                        errorType={getAIErrorType(gated.error)}
                        message={gated.error}
                        onRetry={() => window.location.reload()}
                        compact
                      />
                    )}

                    {/* Phase: idle — benefit preview + dual CTAs */}
                    {gated.phase === 'idle' && (
                      <div className="flex-1 relative rounded-xl border border-dashed border-border/20 dark:border-border/15 overflow-hidden">
                        {/* ── Blurred ghost report background ── */}
                        <div className="absolute inset-0 flex flex-col items-center pt-10 px-8 gap-4 blur-sm opacity-25 pointer-events-none">
                          {/* Score donut placeholder */}
                          <div className="w-20 h-20 rounded-full border-[6px] border-primary/60 flex-shrink-0" />
                          <div className="h-3 w-32 rounded-full bg-foreground/40" />

                          {/* Category score rows */}
                          <div className="w-full max-w-[280px] space-y-3 mt-2">
                            {[75, 60, 90, 45, 80].map((w, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="h-2.5 w-16 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                                <div className="flex-1 h-2.5 rounded-full bg-muted-foreground/20">
                                  <div className="h-full rounded-full bg-primary/40" style={{ width: `${w}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Flagged items pills */}
                          <div className="w-full max-w-[280px] space-y-2 mt-3">
                            {[85, 70, 55].map((w, i) => (
                              <div key={i} className="h-6 rounded-full bg-destructive/15" style={{ width: `${w}%` }} />
                            ))}
                          </div>
                        </div>

                        {/* Vignette overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80 pointer-events-none" />

                        {/* ── Content layer ── */}
                        <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                            <ShieldCheck className="w-7 h-7 text-primary" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-1">Your Report Will Include</h3>
                          <p className="text-sm text-muted-foreground mb-5">Upload a quote to unlock your full analysis</p>
                          <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-xs">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              5 category safety scores
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              Missing scope items flagged
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              Fine print and red flag alerts
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              Fair price per opening comparison
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                              Negotiation email and phone scripts
                            </li>
                          </ul>

                          {/* Dual CTAs */}
                          <div className="w-full max-w-xs space-y-3 mt-6">
                            <Button
                              onClick={() => uploadRef.current?.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
                              className="w-full gap-2"
                              size="lg"
                            >
                              <Upload className="w-4 h-4" />
                              Start My Free Audit
                            </Button>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-bold text-foreground">No Quote Yet?</span>
                              <Button
                                variant="outline"
                                size="lg"
                                className="w-full gap-2"
                                onClick={() => {
                                  trackEvent('no_quote_sample_click', { location: 'after_card' });
                                  setPreQuoteOpen(true);
                                }}
                              >
                                <FileDown className="w-4 h-4" />
                                Get a Free Consultation
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Phase: uploaded — locked, modal is open */}
                    {gated.phase === 'uploaded' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-pulse">
                        <Lock className="w-10 h-10 text-muted-foreground" />
                        <p className="text-foreground font-semibold text-center">
                          Your report is being prepared...
                        </p>
                      </div>
                    )}

                    {/* Phase: locked — modal dismissed, unlock CTAs */}
                    {gated.phase === 'locked' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <Lock className="w-10 h-10 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground text-center">
                          Your report is ready to unlock
                        </p>
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
                    )}

                    {/* Phase: analyzing — theater stepper */}
                    {gated.phase === 'analyzing' && (
                      <div className="flex-1">
                        <AnalysisTheaterScreen
                          previewUrl={gated.filePreviewUrl}
                          fileName={gated.fileName ?? undefined}
                          fileType={gated.fileType ?? undefined}
                          fileSize={gated.fileSize ?? undefined}
                        />
                      </div>
                    )}

                    {/* Phase: revealed — full authority report */}
                    {gated.phase === 'revealed' && gated.analysisResult && (
                      <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-foreground">Your Quote Intelligence Report</h2>
                          {gated.analysisResult.forensic?.headline && (
                            <p className="text-base text-muted-foreground">{gated.analysisResult.forensic.headline}</p>
                          )}
                        </div>

                        {gated.analysisResult.summary && (
                          <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <p className="text-sm text-foreground leading-relaxed">
                              {gated.analysisResult.summary}
                            </p>
                          </div>
                        )}

                        <QuoteAnalysisResults
                          result={gated.analysisResult}
                          isLocked={false}
                          hasImage={!!gated.imageBase64}
                        />

                        <TalkToExpertCTA leadId={gated.leadId} />

                        <QuoteQA
                          answer={qaAnswer}
                          isAsking={isAskingQuestion}
                          onAsk={askQuestion}
                          disabled={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </AnimateOnScroll>
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

                    await wmLead(
                      { leadId: result.leadId, email: data.email, firstName: data.firstName, lastName: data.lastName },
                      { source_tool: 'quote-scanner' },
                    );

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

      <ExitIntentModal
        sourceTool="quote-scanner"
        hasConverted={!!leadId}
        resultSummary="AI-powered quote analysis and fair pricing intelligence"
      />
    </div>
  );
}
