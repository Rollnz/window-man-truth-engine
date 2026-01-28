import { useState, useRef, useCallback, forwardRef } from 'react';
import { Upload, FileImage, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuoteUploadZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  imagePreview: string | null;
}

export const QuoteUploadZone = forwardRef<HTMLDivElement, QuoteUploadZoneProps>(
  function QuoteUploadZone({
    onFileSelect,
    isAnalyzing,
    hasResult,
    imagePreview,
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

    // Determine if we should show the "before upload" overlay
    const showBeforeUploadOverlay = !imagePreview && !isAnalyzing;

    return (
      <div ref={ref} className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold text-destructive">
            Before: Just a Confusing Estimate
          </span>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          "min-h-[200px] md:min-h-[240px]",
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
                {/* Scanning animation rings */}
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
              {/* Progress bar */}
              <div className="mt-4 w-48 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    animation: 'progress 3s ease-out forwards',
                  }}
                />
              </div>
              <style>{`
                @keyframes progress {
                  0% { width: 0%; }
                  100% { width: 100%; }
                }
              `}</style>
            </div>
          )}

          {/* Preview State (after upload, not analyzing) */}
          {imagePreview && !isAnalyzing && (
            <div className="absolute inset-0">
              <img
                src={`data:image/jpeg;base64,${imagePreview}`}
                alt="Preview of your uploaded window replacement quote"
                className="w-full h-full object-contain opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
          )}

          {/* Before Upload Overlay - Simplified for compact view */}
          {showBeforeUploadOverlay && (
            <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/40" />
          )}

          {/* Upload CTA Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10">
            {!imagePreview && !isAnalyzing && (
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            )}
            
            <div className="text-center mb-4 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
              <p className="font-medium text-foreground">
                {imagePreview ? 'Analyze Another Quote' : 'Upload Your Estimate'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG, or PDF up to 10MB
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              onClick={handleClick}
              variant="outline"
              className="gap-2 bg-background/80 backdrop-blur-sm"
              disabled={isAnalyzing}
            >
              {imagePreview ? <RefreshCw className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
              {imagePreview ? 'Select Different File' : 'Select File'}
            </Button>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground text-center">
          Contractors often hand you numbers, jargon, and tiny fine print. 
          You're expected to just trust it.
        </p>
      </div>
    );
  }
);
