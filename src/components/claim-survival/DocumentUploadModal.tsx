import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, Image, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { claimDocuments } from '@/data/claimSurvivalData';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { trackEvent } from '@/lib/gtm';
import type { SourceTool } from '@/types/sourceTool';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (docId: string, fileUrl: string) => void;
  documentId: string | null;
  sessionId: string;
  leadId?: string;
  sourceTool?: SourceTool;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  documentId,
  sessionId: propSessionId,
  leadId: leadIdProp,
  sourceTool,
}: DocumentUploadModalProps) {
  const { toast } = useToast();
  const { sessionData } = useSessionData();
  const { leadId: hookLeadId } = useLeadIdentity();
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the unified upload hook
  const { 
    state: uploadState, 
    upload, 
    reset: resetUpload,
    validateFile,
    allowedTypes,
  } = useDocumentUpload();
  
  // Golden Thread: Use prop if provided, otherwise fallback to hook
  const effectiveLeadId = leadIdProp || hookLeadId;
  
  // Local UI state (file selection only)
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const document = documentId ? claimDocuments.find(d => d.id === documentId) : null;

  // Reset local state when modal closes
  const resetLocalState = useCallback(() => {
    setSelectedFile(null);
    setIsDragging(false);
  }, []);

  // Handle close - block during upload
  const handleClose = useCallback(() => {
    if (!uploadState.isUploading) {
      resetUpload();
      resetLocalState();
      onClose();
    }
  }, [uploadState.isUploading, resetUpload, resetLocalState, onClose]);

  // File selection with validation
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.ok) {
      toast({
        title: 'Invalid File',
        description: validation.errorMessage || 'Please select a valid file.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedFile(file);
    // Reset upload state if there was a previous error
    if (uploadState.stage === 'error') {
      resetUpload();
    }
  }, [validateFile, toast, uploadState.stage, resetUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Main upload handler using the hook
  const handleUpload = async () => {
    if (!selectedFile || !documentId) return;

    const result = await upload({
      file: selectedFile,
      documentType: documentId,
      leadId: effectiveLeadId || undefined,
      sourceTool: sourceTool || 'claim-survival',
    });

    if (result.success && result.filePath) {
      // Track successful upload for GTM/analytics
      trackEvent('document_uploaded', {
        document_type: documentId,
        file_type: selectedFile.type,
        lead_id: effectiveLeadId,
        source_tool: sourceTool || 'claim-survival',
      });
      
      // Send upload confirmation email ONLY if user is authenticated
      // This prevents 401 errors for anonymous users
      if (session?.access_token) {
        const userEmail = sessionData?.email;
        if (userEmail) {
          invokeEdgeFunction('send-email-notification', {
            body: {
              email: userEmail,
              type: 'claim-vault-upload-confirmation',
              data: {
                documentName: document?.title || selectedFile.name,
              },
            },
          }).catch((err) => {
            console.info('[DocumentUploadModal] Email notification skipped or failed:', err);
          });
        }
      } else {
        console.info('[DocumentUploadModal] Skipping email notification for anonymous user');
      }
      
      // Delay before calling success to show completion state
      setTimeout(() => {
        onSuccess(documentId, result.filePath!);
        resetUpload();
        resetLocalState();
      }, 1000);
    }
    // Error state is handled by the hook and rendered via uploadState
  };

  // Retry handler
  const handleRetry = () => {
    resetUpload();
    // Keep the selected file so user can retry
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-primary" />;
    }
    return <FileText className="w-8 h-8 text-primary" />;
  };

  const isComplete = uploadState.stage === 'done';
  const isError = uploadState.stage === 'error';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            {document?.title || 'Upload your document'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          {!selectedFile && !isComplete && !isError && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drag & drop your file here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, JPG, PNG, HEIC, WebP • Max 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,.webp"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File */}
          {selectedFile && !isComplete && !isError && (
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFile.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploadState.isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {uploadState.isUploading && (
                <div className="mt-3">
                  <Progress value={uploadState.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {uploadState.stage === 'validating' && 'Validating...'}
                    {uploadState.stage === 'sending' && 'Uploading...'}
                    {uploadState.stage === 'processing' && 'Processing...'}
                    {' '}{uploadState.progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-lg font-semibold text-destructive">Upload Failed</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {uploadState.errorMessage}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Complete State */}
          {isComplete && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">Upload Complete!</p>
              <p className="text-sm text-muted-foreground">
                Your document has been saved to your vault.
              </p>
            </div>
          )}

          {/* Actions */}
          {selectedFile && !isComplete && !isError && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploadState.isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadState.isUploading}
                className="flex-1"
              >
                {uploadState.isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
