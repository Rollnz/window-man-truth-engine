import { useRef, useCallback, useState } from 'react';
import { Shield, ChevronDown, HelpCircle, Upload } from 'lucide-react';
import { StampBadge } from './StampBadge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';
import { cn } from '@/lib/utils';

interface DossierHeroProps {
  onFileSelect: (file: File) => void;
  onNoQuoteClick: () => void;
}

export function DossierHero({
  onFileSelect,
  onNoQuoteClick,
}: DossierHeroProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  }, [onFileSelect]);

  const handleClickZone = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0F14]">
      {/* Background Image - z-0, LCP candidate for this page */}
      <img src="/images/beat-your-quote/hero-dossier.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" fetchPriority="high" loading="eager" decoding="async" width={1920} height={1080} />

      {/* Dark Overlay - z-[1] */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F14]/70 via-[#0A0F14]/50 to-[#0A0F14] z-[1]" />

      {/* Scan Line Effect - z-[2] */}
      <div className="scanline-overlay z-[2]" />

      {/* Content - z-10 */}
      <div className="relative z-10 container px-4 text-center max-w-4xl pt-24 pb-16">
        {/* AI Badge with Dossier Theme */}
        <div className="mb-4 animate-fade-in">
          <ShimmerBadge 
            text="AI Quote Intelligence" 
            variant="dossier"
          />
        </div>
        
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

        {/* Direct File Select Dropzone (matching /audit pattern) */}
        <div className="max-w-xl mx-auto animate-fade-in">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickZone}
            className={cn(
              "relative border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200",
              "flex flex-col items-center justify-center p-8 gap-4 min-h-[180px]",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-white/30 hover:border-primary/50 bg-white/5 hover:bg-white/10"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-1">
                Drop Your Contractor Quote Here
              </p>
              <p className="text-sm text-white/70">
                or click to browse your files
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Shield className="w-3 h-3" />
              <span>PDF, JPG, PNG • Max 6MB • Encrypted & Secure</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileInput}
              className="hidden"
              aria-label="Upload contractor quote"
            />
          </div>

          {/* "No quote yet?" escape hatch */}
          <button
            type="button"
            onClick={onNoQuoteClick}
            className="mt-4 text-sm text-primary/80 hover:text-primary underline underline-offset-4 transition-colors"
          >
            Don't have a quote yet? Get started here →
          </button>

          {/* Trust indicators with tooltip */}
          <div className="flex items-center justify-center gap-2 text-sm text-white/90 mt-4">
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
    </section>
  );
}
