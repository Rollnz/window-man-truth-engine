import { useRef, lazy, Suspense } from 'react';
import { SEO } from '@/components/SEO';
import {
  ScannerHeroWindow,
  ScannerIntelligenceBar,
} from '@/components/audit';
import { LoadingSkeleton } from '@/components/audit/LoadingSkeleton';
import { useDeterministicScanner } from '@/hooks/audit';

// Lazy load below-the-fold components
const UploadZoneXRay = lazy(() => import('@/components/audit/UploadZoneXRay').then(m => ({ default: m.UploadZoneXRay })));
const HowItWorksXRay = lazy(() => import('@/components/audit/HowItWorksXRay').then(m => ({ default: m.HowItWorksXRay })));
const BeatOrValidateSection = lazy(() => import('@/components/audit/BeatOrValidateSection').then(m => ({ default: m.BeatOrValidateSection })));
const RedFlagGallery = lazy(() => import('@/components/audit/RedFlagGallery').then(m => ({ default: m.RedFlagGallery })));
const NoQuoteEscapeHatch = lazy(() => import('@/components/audit/NoQuoteEscapeHatch').then(m => ({ default: m.NoQuoteEscapeHatch })));
const VaultSection = lazy(() => import('@/components/audit/VaultSection').then(m => ({ default: m.VaultSection })));
const TestimonialCards = lazy(() => import('@/components/TestimonialCards').then(m => ({ default: m.TestimonialCards })));

export default function Audit() {
  const uploadRef = useRef<HTMLDivElement>(null);
  
  // Initialize deterministic scanner for in-page analysis
  const scanner = useDeterministicScanner();

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFileSelect = (file: File) => {
    // Analyze in-place instead of redirecting to /ai-scanner
    scanner.analyzeFile(file);
  };

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
      <ScannerHeroWindow onScanClick={scrollToUpload} />
      <ScannerIntelligenceBar />
      
      {/* Below the fold - lazy loaded */}
      <Suspense fallback={<LoadingSkeleton />}>
        <div ref={uploadRef}>
          <UploadZoneXRay 
            onFileSelect={handleFileSelect}
            scannerPhase={scanner.phase}
            scannerResult={scanner.result}
            scannerError={scanner.error}
            isLoading={scanner.isLoading}
            onShowGate={scanner.showGate}
            onCaptureLead={scanner.captureLead}
            onReset={scanner.reset}
          />
        </div>
        <HowItWorksXRay onScanClick={scrollToUpload} />
        <BeatOrValidateSection />
        <RedFlagGallery />
        <NoQuoteEscapeHatch />
        <TestimonialCards variant="dark" />
        <VaultSection />
      </Suspense>
    </div>
  );
}
