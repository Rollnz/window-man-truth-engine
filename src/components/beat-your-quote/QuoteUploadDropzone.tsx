import { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useQuoteUpload } from '@/hooks/useQuoteUpload';

interface QuoteUploadDropzoneProps {
  onSuccess?: (fileId: string, filePath: string) => void;
  onError?: (error: string) => void;
  className?: string;
  /** Source page for attribution */
  sourcePage?: string;
}

export function QuoteUploadDropzone({
  onSuccess,
  onError,
  className,
  sourcePage = 'beat-your-quote',
}: QuoteUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    isUploading,
    progress,
    error,
    lastUpload,
    uploadFile,
    validateFile,
    reset,
    clearError,
    allowedTypes,
    maxFileSizeMB,
  } = useQuoteUpload();

  const isComplete = lastUpload?.success === true;

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
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        clearError();
      }
    }
  }, [validateFile, clearError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        clearError();
      }
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [validateFile, clearError]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadFile(selectedFile, { sourcePage });
    
    if (result.success && result.file_id && result.file_path) {
      onSuccess?.(result.file_id, result.file_path);
    } else if (!result.success) {
      onError?.(result.message || 'Upload failed');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    reset();
  };

  const handleClickZone = () => {
    if (!isUploading && !isComplete) {
      fileInputRef.current?.click();
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-6 h-6 text-primary" />;
    }
    return <FileText className="w-6 h-6 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      {!selectedFile && !isComplete && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickZone}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
            "min-h-[200px] flex flex-col items-center justify-center gap-4",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 bg-card/50 hover:bg-card/80"
          )}
        >
          {/* Classified stamp watermark */}
          <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground/30 uppercase tracking-widest rotate-12">
            CLASSIFIED
          </div>

          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>

          <div>
            <p className="font-semibold text-lg mb-1">
              Drop Your Contractor Quote Here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse your files
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>PDF, JPG, PNG • Max {maxFileSizeMB}MB • Encrypted & Secure</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload contractor quote"
          />
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !isComplete && (
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="flex items-center gap-4">
            {/* File Icon */}
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {getFileIcon(selectedFile)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Remove Button (when not uploading) */}
            {!isUploading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading securely...
                </span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !isUploading && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={handleRemoveFile}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Quote
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {isComplete && lastUpload && (
        <div className="border border-primary/30 rounded-xl p-6 bg-primary/5 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg font-semibold mb-1">Quote Uploaded Successfully!</p>
          <p className="text-sm text-muted-foreground mb-4">
            Your document is secured and ready for analysis.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              reset();
            }}
          >
            Upload Another Quote
          </Button>
        </div>
      )}

      {/* Trust indicators */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          256-bit encryption
        </span>
        <span>•</span>
        <span>Never shared with contractors</span>
      </div>
    </div>
  );
}
