import { useState, useRef, useCallback, forwardRef } from 'react';
import { Upload, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SampleQuoteDocument } from './SampleQuoteDocument';
import { EnhancedFloatingCallout, EnhancedCalloutType } from './EnhancedFloatingCallout';
import type { QuoteAnalysisResult } from '@/hooks/useQuoteScanner';

interface QuoteUploadZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  imagePreview: string | null;
  analysisResult?: QuoteAnalysisResult | null;
}

export const QuoteUploadZone = forwardRef<HTMLDivElement, QuoteUploadZoneProps>(function QuoteUploadZone({
  onFileSelect,
  isAnalyzing,
  hasResult,
  imagePreview,
  analysisResult,
}, ref) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const showBeforeUploadOverlay = !imagePreview && !isAnalyzing;

  return (
    <div ref={ref} className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold text-rose-600 dark:text-rose-400 text-base">
          Before: Just a Confusing Estimate
        </span>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-2xl border transition-all duration-300 overflow-visible shadow-xl",
          "aspect-square",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border/40 bg-card/50",
          isAnalyzing && "pointer-events-none"
        )}
      >
        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-lg font-semibold mb-2">Analyzing Contract...</p>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Scanning for impact ratings, hidden fees, and scope gaps.
            </p>
            <div className="mt-4 w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ animation: 'progress 3s ease-out forwards' }} />
            </div>
            <style>{`
              @keyframes progress {
                0% { width: 0%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        )}

        {/* Preview State */}
        {imagePreview && !isAnalyzing && (
          <div className="absolute inset-0">
            <img src={`data:image/jpeg;base64,${imagePreview}`} alt="Preview of your uploaded window replacement quote" className="w-full h-full object-contain opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        {/* Before Upload Overlay - Sample Quote + Floating Callouts */}
        {showBeforeUploadOverlay && !analysisResult && (
          <>
            <SampleQuoteDocument />

            {/* Enhanced Floating Callouts — repositioned per reference */}
            <EnhancedFloatingCallout 
              type="price" 
              heading="Price Warning" 
              description="Price per opening looks high for the market."
              className="top-[15%] -right-3 z-[5]"
              fromRight
              animationDelay="200ms"
              rotation={-2}
            />
            <EnhancedFloatingCallout 
              type="warning" 
              heading="Warranty Issue" 
              description="20 years on product... but 1 year on labor."
              className="top-[38%] -left-2 z-[5]"
              animationDelay="400ms"
              rotation={2}
            />
            <EnhancedFloatingCallout 
              type="missing" 
              heading="Missing Scope" 
              description="No mention of stucco repair or debris removal."
              className="-bottom-2 -left-3 z-[5]"
              animationDelay="600ms"
              rotation={-1}
            />
            <EnhancedFloatingCallout 
              type="legal" 
              heading="Legal Clause" 
              description='"Subject to remeasure" — surprise charges later.'
              className="-bottom-2 -right-3 z-[5]"
              fromRight
              animationDelay="800ms"
              rotation={1}
            />
          </>
        )}

        {/* Dynamic callouts from analysis results */}
        {imagePreview && !isAnalyzing && analysisResult && analysisResult.warnings.length > 0 && (
          <>
            {analysisResult.warnings.slice(0, 4).map((warning, i) => {
              const positions = [
                { className: 'top-[15%] -right-3 z-[5]', fromRight: true, rotation: -2 },
                { className: 'top-[38%] -left-2 z-[5]', fromRight: false, rotation: 2 },
                { className: '-bottom-2 -left-3 z-[5]', fromRight: false, rotation: -1 },
                { className: '-bottom-2 -right-3 z-[5]', fromRight: true, rotation: 1 },
              ];
              const types: EnhancedCalloutType[] = ['warning', 'price', 'missing', 'legal'];
              const pos = positions[i % positions.length];
              return (
                <EnhancedFloatingCallout
                  key={i}
                  type={types[i % types.length]}
                  heading="AI Detected"
                  description={warning.length > 60 ? warning.slice(0, 60) + '...' : warning}
                  className={pos.className}
                  fromRight={pos.fromRight}
                  rotation={pos.rotation}
                  animationDelay={`${200 + i * 200}ms`}
                />
              );
            })}
          </>
        )}

        {/* Upload CTA Overlay — Prominent Card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
          {!imagePreview && !isAnalyzing && (
            <div className="bg-card/95 backdrop-blur-sm shadow-xl rounded-2xl p-5 md:p-6 max-w-xs w-full text-center border border-border/50">
              <h3 className="text-lg font-bold text-primary mb-1">Analyze Quote</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Take a photo or upload a screenshot. Supports JPG, PNG, and PDF. Max 10MB.
              </p>

              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp" onChange={handleFileChange} className="hidden" />

              <Button onClick={handleClick} className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90" size="lg" disabled={isAnalyzing}>
                <Upload className="w-4 h-4" />
                Upload Your Quote
              </Button>
            </div>
          )}

          {imagePreview && !isAnalyzing && (
            <div className="text-center backdrop-blur-sm bg-background/60 px-4 py-3 rounded-lg">
              <p className="font-medium text-foreground mb-2">Analyze Another Quote</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp" onChange={handleFileChange} className="hidden" />
              <Button onClick={handleClick} variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm" disabled={isAnalyzing}>
                <RefreshCw className="w-4 h-4" />
                Select Different File
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      <p className="text-center text-muted-foreground text-sm md:text-base">
        Contractors often hand you numbers, jargon, and tiny fine print. 
        You're expected to just trust it.
      </p>
    </div>
  );
});
