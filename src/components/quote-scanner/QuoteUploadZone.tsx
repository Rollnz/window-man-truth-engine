import { useState, useRef, useCallback, forwardRef } from 'react';
import { Upload, FileImage, Loader2, RefreshCw, FileText, ScanSearch, FileDown } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SampleQuoteDocument } from './SampleQuoteDocument';
import { EnhancedFloatingCallout, type EnhancedCalloutType } from './EnhancedFloatingCallout';
import type { QuoteAnalysisResult } from '@/hooks/useQuoteScanner';

interface QuoteUploadZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  imagePreview: string | null;
  mimeType?: string | null;
  analysisResult?: QuoteAnalysisResult | null;
  onWarningSelect?: (categoryKey: string) => void;
  onNoQuoteClick?: () => void;
}

function getTopWarnings(result: QuoteAnalysisResult): Array<{
  type: EnhancedCalloutType;
  heading: string;
  description: string;
  categoryKey: string;
}> {
  const categories = [
    { score: result.safetyScore, heading: 'Safety Risk', type: 'missing' as const, desc: 'Impact ratings or design pressures missing', key: 'safety' },
    { score: result.scopeScore, heading: 'Scope Gaps', type: 'missing' as const, desc: 'Key line items missing from scope', key: 'scope' },
    { score: result.priceScore, heading: 'Price Concern', type: 'price' as const, desc: 'Pricing outside fair market range', key: 'price' },
    { score: result.finePrintScore, heading: 'Fine Print Alert', type: 'legal' as const, desc: 'Hidden clauses or risky terms found', key: 'fineprint' },
    { score: result.warrantyScore, heading: 'Warranty Issue', type: 'warning' as const, desc: 'Inadequate warranty coverage detected', key: 'warranty' },
  ];
  return categories
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(c => ({
      type: c.score < 50 ? 'missing' as const : c.type,
      heading: c.heading,
      description: `Score: ${c.score}/100 — ${c.desc}`,
      categoryKey: c.key,
    }));
}

export const QuoteUploadZone = forwardRef<HTMLDivElement, QuoteUploadZoneProps>(function QuoteUploadZone({
  onFileSelect,
  isAnalyzing,
  hasResult,
  imagePreview,
  mimeType,
  analysisResult,
  onWarningSelect,
  onNoQuoteClick,
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
  const isPdf = mimeType === 'application/pdf';

  return (
    <div ref={ref} className="space-y-4">
      {/* Header */}
      {/* Use 'flex' to control layout. 'flex-col' stacks them on mobile, 'md:flex-row' puts them side-by-side on desktop. */}
<span className="flex flex-col md:flex-row items-center font-bold text-rose-600 dark:text-rose-400 text-base text-center md:text-left">
  <span className="md:mr-1">Before:</span>
  <span>Just a Confusing Estimate</span>
</span>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          "aspect-square",
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 bg-card/50",
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

        {/* Preview State — Image */}
        {imagePreview && !isAnalyzing && !isPdf && (
          <div className="absolute inset-0">
            <img
              src={`data:${mimeType || 'image/jpeg'};base64,${imagePreview}`}
              alt="Preview of your uploaded window replacement quote"
              className="w-full h-full object-contain opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}

        {/* Preview State — PDF placeholder */}
        {imagePreview && !isAnalyzing && isPdf && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 backdrop-blur-sm">
            <FileText className="w-16 h-16 text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">PDF Document Uploaded</p>
          </div>
        )}

        {/* Dynamic Warning Bubbles — post-analysis */}
        {imagePreview && !isAnalyzing && analysisResult && (() => {
          const warnings = getTopWarnings(analysisResult);
          const positions = [
            { className: 'top-3 right-0 z-30', fromRight: true },
            { className: 'top-1/2 -translate-y-1/2 left-0 z-30', fromRight: false },
            { className: 'bottom-8 left-0 z-30', fromRight: false },
          ];
          return warnings.map((w, i) => (
            <div
              key={`dynamic-${i}`}
              className="animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500 fill-mode-forwards opacity-0"
              style={{ animationDelay: `${i * 300}ms`, animationFillMode: 'forwards' }}
            >
              <EnhancedFloatingCallout
                type={w.type}
                heading={w.heading}
                description={w.description}
                className={positions[i].className}
                fromRight={positions[i].fromRight}
                onClick={onWarningSelect ? () => onWarningSelect(w.categoryKey) : undefined}
              />
            </div>
          ));
        })()}

        {/* Before Upload Overlay - Sample Quote + Floating Callouts */}
        {showBeforeUploadOverlay && (
          <>
            <SampleQuoteDocument />

            {/* Enhanced Floating Callouts — repositioned per reference */}
            <EnhancedFloatingCallout 
              type="price" 
              heading="Price Warning" 
              description="Price per opening looks high for the market."
              className="top-3 right-0 z-[5]"
              fromRight
              animationDelay="200ms"
            />
            <EnhancedFloatingCallout 
              type="warning" 
              heading="Warranty Issue" 
              description="20 years on product... but 1 year on labor."
              className="top-1/2 -translate-y-1/2 left-0 z-[5]"
              animationDelay="400ms"
            />
            <EnhancedFloatingCallout 
              type="missing" 
              heading="Missing Scope" 
              description="No mention of stucco repair or debris removal."
              className="bottom-8 left-0 z-[5]"
              animationDelay="600ms"
            />
            <EnhancedFloatingCallout 
              type="legal" 
              heading="Legal Clause" 
              description='"Subject to remeasure" — surprise charges later.'
              className="bottom-8 right-0 z-[5]"
              fromRight
              animationDelay="800ms"
            />
          </>
        )}

        {/* Upload CTA Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
          {!imagePreview && !isAnalyzing && (
            <div className="bg-card/95 backdrop-blur-sm shadow-xl rounded-2xl p-5 md:p-6 max-w-xs w-full text-center border border-border/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                <ScanSearch className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-primary mb-1">Analyze Quote</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Take a photo or upload a screenshot. Supports JPG, PNG, and PDF. Max 10MB.
              </p>

              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp" onChange={handleFileChange} className="hidden" />

              <Button onClick={handleClick} className="w-full gap-2" size="lg" disabled={isAnalyzing}>
                <Upload className="w-4 h-4" />
                Upload Your Quote
              </Button>

              {onNoQuoteClick && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-foreground">No Quote To Analyze Yet</span>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 w-full border-none text-white font-semibold shadow-[0_4px_14px_rgba(245,158,66,0.45)]"
                    style={{ backgroundColor: '#f59e42' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent('no_quote_sample_click', { location: 'before_card' });
                      onNoQuoteClick();
                    }}
                  >
                    <FileDown className="w-4 h-4" />
                    Download Sample
                  </Button>
                </div>
              )}
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
