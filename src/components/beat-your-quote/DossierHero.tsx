import { Shield, ChevronDown, HelpCircle } from 'lucide-react';
import { StampBadge } from './StampBadge';
import { QuoteUploadDropzone } from './QuoteUploadDropzone';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface DossierHeroProps {
  onUploadSuccess?: (fileId: string, filePath: string) => void;
}
export function DossierHero({
  onUploadSuccess
}: DossierHeroProps) {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0F14]">
      {/* Background Image - z-0, LCP candidate for this page */}
      <img src="/images/beat-your-quote/hero-dossier.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" fetchPriority="high" loading="eager" decoding="async" width={1920} height={1080} />

      {/* Dark Overlay - z-[1] */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F14]/70 via-[#0A0F14]/50 to-[#0A0F14] z-[1]" />

      {/* Scan Line Effect - z-[2] */}
      <div className="scanline-overlay z-[2]" />

      {/* Content - z-10 */}
      <div className="relative z-10 container px-4 text-center max-w-4xl pt-24 pb-16">
        {/* Classified Stamp */}
        <div className="mb-8 animate-fade-in">
          <StampBadge variant="red">Classified</StampBadge>
        </div>

        {/* Shield Icon with Logo */}
        <div className="relative w-20 h-20 mx-auto mb-6 animate-fade-in">
          <Shield className="w-20 h-20 text-primary" strokeWidth={1.5} />
          <img src="/favicon.png" alt="Window Man Your Hurricane Hero - Florida Protection Expert" width={40} height={40} className="absolute inset-0 w-10 h-10 m-auto object-contain" />
        </div>

        {/* Main Title */}
        <h1 className="font-typewriter text-4xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in">
          <span className="text-primary">THE </span>
          <span className="glow-cyan text-primary-foreground">WINDOW MAN</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white mb-4 animate-fade-in">
          Florida's Impact Window Homeowner Advocate
        </p>

        {/* Description */}
        <p className="text-white/90 max-w-2xl mx-auto mb-10 animate-fade-in">
          Upload your contractor's quote below and let our AI expose hidden fees instantly.
        </p>

        {/* Quote Upload Dropzone - Replaces old CTA buttons */}
        <div className="max-w-xl mx-auto animate-fade-in">
          <QuoteUploadDropzone onSuccess={onUploadSuccess} sourcePage="beat-your-quote" className="mb-4" />

          {/* Trust indicators with tooltip */}
          <div className="flex items-center justify-center gap-2 text-sm text-white/90">
            <Shield className="w-4 h-4 text-primary" />
            <span>Your quote is encrypted and analyzed by AI. We never share your data.</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex items-center justify-center rounded-full hover:bg-muted/50 p-0.5" aria-label="Learn more about upload security">
                    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>Uploading allows our AI to find hidden fees instantly. Your document is encrypted and never shared with contractors.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-12 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary opacity-60 mx-auto" />
        </div>
      </div>
    </section>;
}