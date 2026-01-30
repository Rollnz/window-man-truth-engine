import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import {
  ScannerHeroWindow,
  AnimatedStatsBar,
  UploadZoneXRay,
  HowItWorksXRay,
  BeatOrValidateSection,
  RedFlagGallery,
  NoQuoteEscapeHatch,
  VaultSection,
} from '@/components/audit';

export default function Audit() {
  const navigate = useNavigate();
  const uploadRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFileSelect = (file: File) => {
    // Navigate to existing /ai-scanner with file in state
    navigate('/ai-scanner', { state: { file } });
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
      
      <ScannerHeroWindow onScanClick={scrollToUpload} />
      <AnimatedStatsBar />
      <div ref={uploadRef}>
        <UploadZoneXRay onFileSelect={handleFileSelect} />
      </div>
      <HowItWorksXRay onScanClick={scrollToUpload} />
      <BeatOrValidateSection />
      <RedFlagGallery />
      <NoQuoteEscapeHatch />
      <VaultSection />
    </div>
  );
}
