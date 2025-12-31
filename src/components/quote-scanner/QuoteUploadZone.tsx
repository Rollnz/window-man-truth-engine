import { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuoteUploadZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
  hasResult: boolean;
  imagePreview: string | null;
}

export function QuoteUploadZone({
  onFileSelect,
  isAnalyzing,
  hasResult,
  imagePreview,
}: QuoteUploadZoneProps) {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <FileText className="w-4 h-4" />
        <span>{hasResult ? 'The Raw Quote' : 'Before: A Confusing Estimate'}</span>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
          "min-h-[300px] md:min-h-[400px]",
          isDragOver 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border hover:border-primary/50 bg-card/50",
          isAnalyzing && "pointer-events-none"
        )}
      >
        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm z-10">
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
              alt="Uploaded quote"
              className="w-full h-full object-contain opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        {/* Mock Quote Preview (before upload) */}
        {!imagePreview && !isAnalyzing && (
          <div className="absolute inset-4 rounded-lg bg-muted/30 border border-border/50 p-6 font-mono text-xs text-muted-foreground/50 overflow-hidden">
            {/* Fake document lines */}
            <div className="h-4 w-1/3 bg-muted/50 rounded mb-4" />
            <div className="h-3 w-full bg-muted/30 rounded mb-2" />
            <div className="flex gap-4 mb-2">
              <div className="h-3 w-1/4 bg-muted/30 rounded" />
              <div className="h-3 w-1/3 bg-muted/30 rounded" />
            </div>
            <div className="flex gap-4 mb-2">
              <div className="h-3 w-1/5 bg-muted/30 rounded" />
              <div className="h-3 w-1/4 bg-muted/30 rounded" />
            </div>
            <div className="flex gap-4 mb-4">
              <div className="h-3 w-1/3 bg-muted/30 rounded" />
              <div className="h-3 w-1/4 bg-muted/30 rounded" />
            </div>
            <div className="h-3 w-2/3 bg-muted/30 rounded mb-2" />
            <div className="flex gap-4">
              <div className="h-3 w-1/4 bg-muted/30 rounded" />
              <div className="h-3 w-1/5 bg-muted/30 rounded" />
            </div>
          </div>
        )}

        {/* Upload CTA Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          {!imagePreview && !isAnalyzing && (
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          )}
          
          <div className="text-center mb-4">
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
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            onClick={handleClick}
            variant="outline"
            className="gap-2"
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
