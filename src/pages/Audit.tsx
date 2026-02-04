import { useRef, useState, useCallback, lazy, Suspense } from 'react';
import { SEO } from '@/components/SEO';
import {
  ScannerHeroWindow,
  ScannerIntelligenceBar,
  QuoteUploadGateModal,
} from '@/components/audit';
import { LoadingSkeleton } from '@/components/audit/LoadingSkeleton';
import { useGatedScanner } from '@/hooks/audit';
import { SampleReportGateModal } from '@/components/audit/SampleReportGateModal';

// Lazy load below-the-fold components
const UploadZoneXRay = lazy(() => import('@/components/audit/UploadZoneXRay').then(m => ({ default: m.UploadZoneXRay })));
const HowItWorksXRay = lazy(() => import('@/components/audit/HowItWorksXRay').then(m => ({ default: m.HowItWorksXRay })));
const BeatOrValidateSection = lazy(() => import('@/components/audit/BeatOrValidateSection').then(m => ({ default: m.BeatOrValidateSection })));
const RedFlagGallery = lazy(() => import('@/components/audit/RedFlagGallery').then(m => ({ default: m.RedFlagGallery })));
const NoQuoteEscapeHatch = lazy(() => import('@/components/audit/NoQuoteEscapeHatch').then(m => ({ default: m.NoQuoteEscapeHatch })));
const VaultSection = lazy(() => import('@/components/audit/VaultSection').then(m => ({ default: m.VaultSection })));
const TestimonialCards = lazy(() => import('@/components/TestimonialCards').then(m => ({ default: m.TestimonialCards })));
const ProblemAgitationSection = lazy(() => import('@/components/audit/ProblemAgitationSection').then(m => ({ default: m.ProblemAgitationSection })));

export default function Audit() {
  const uploadRef = useRef<HTMLDivElement>(null);
  
  // Sample gate modal state
  const [sampleGateOpen, setSampleGateOpen] = useState(false);
  const sampleGateTriggerRef = useRef<HTMLElement | null>(null);
  
  // Initialize gated scanner (CRO-optimized: gate BEFORE analysis)
  const scanner = useGatedScanner();

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Handler to open sample gate modal with focus tracking
  const openSampleGate = useCallback(() => {
    sampleGateTriggerRef.current = document.activeElement as HTMLElement;
    setSampleGateOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO 
        title="Free Quote Scanner - AI Lie Detector for Window Quotes"
        description="Upload your window replacement quote for a free, instant AI audit. We'll expose hidden fees, inflated prices, and missing scope items in 60 seconds."
        canonicalUrl="https://itswindowman.com/audit"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Window Quote AI Scanner",
          "description": "Free AI-powered quote analysis tool for Florida homeowners",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }}
      />
      
      {/* Above the fold - loads immediately */}
      <ScannerHeroWindow 
        onScanClick={scrollToUpload} 
        onViewSampleClick={openSampleGate}
      />
      <ScannerIntelligenceBar />
      
      {/* Problem Agitation - below the fold, lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-slate-950" />}>
        <ProblemAgitationSection />
      </Suspense>
      
      {/* Below the fold - lazy loaded */}
      <Suspense fallback={<LoadingSkeleton />}>
        <div ref={uploadRef}>
          <UploadZoneXRay 
            onFileSelect={scanner.handleFileSelect}
            scannerPhase={scanner.phase}
            scannerResult={scanner.result}
            scannerError={scanner.error}
            isLoading={scanner.isLoading}
            filePreviewUrl={scanner.filePreviewUrl}
            onReopenModal={scanner.reopenModal}
            onReset={scanner.reset}
          />
        </div>
        <HowItWorksXRay onScanClick={scrollToUpload} />
        <BeatOrValidateSection />
        <RedFlagGallery />
        <NoQuoteEscapeHatch onViewSampleClick={openSampleGate} />
        <TestimonialCards variant="dark" />
        <VaultSection />
      </Suspense>

      {/* Quote Upload Gate Modal - fires immediately after file upload */}
      <QuoteUploadGateModal
        isOpen={scanner.isModalOpen}
        onClose={scanner.closeModal}
        onSubmit={scanner.captureLead}
        isLoading={scanner.isLoading}
      />

      {/* Sample Report Gate Modal - for users without quotes */}
      <SampleReportGateModal
        isOpen={sampleGateOpen}
        onClose={() => setSampleGateOpen(false)}
        returnFocusRef={sampleGateTriggerRef}
      />
    </div>
  );
}
