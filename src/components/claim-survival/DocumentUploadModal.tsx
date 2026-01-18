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
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
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

// ============= Constants =============
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];
const UPLOAD_TIMEOUT_MS = 25000; // 25 second watchdog
const SESSION_STORAGE_KEY = 'wm-session-id';

// ============= Types =============
type UploadStage = 'idle' | 'validating' | 'sending' | 'processing' | 'done' | 'error';

// ============= Error Messages =============
const ERROR_MESSAGES: Record<string, string> = {
  'RATE_LIMITED': 'Too many uploads. Please wait and try again.',
  'FILE_TOO_LARGE': 'File is too large (max 10MB).',
  'INVALID_MIME': 'Invalid file type. Use PDF, JPG, PNG, HEIC, or WebP.',
  'INVALID_FILE_CONTENT': 'File appears corrupted or misnamed.',
  'INVALID_SESSION': 'Session expired. Please refresh the page.',
  'INVALID_DOC_TYPE': 'Invalid document type.',
  'SERVICE_UNAVAILABLE': 'Upload service is temporarily unavailable. Please try again.',
  'UPLOAD_FAILED': 'Failed to store file. Please try again.',
  'INTERNAL_ERROR': 'An unexpected error occurred. Please try again.',
  'METHOD_NOT_ALLOWED': 'Invalid request method.',
  'MISSING_FILE': 'No file was provided.',
  'TIMEOUT': 'Upload timed out. Please check your connection and try again.',
  'NETWORK_ERROR': 'Network error. Please check your connection.',
};

function getErrorMessage(errorCode: string | undefined, fallback: string): string {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }
  return fallback || 'Upload failed. Please try again.';
}

// ============= Session ID Helper =============
function ensureSessionId(providedSessionId: string | undefined): string {
  // If valid UUID provided, use it
  if (providedSessionId && isValidUUID(providedSessionId)) {
    return providedSessionId;
  }
  
  // Check localStorage
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && isValidUUID(stored)) {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  
  // Generate new UUID and persist
  const newId = crypto.randomUUID();
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
  } catch {
    console.warn('[DocumentUploadModal] Failed to persist sessionId');
  }
  
  return newId;
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Golden Thread: Use prop if provided, otherwise fallback to hook
  const effectiveLeadId = leadIdProp || hookLeadId;
  
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<UploadStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const document = documentId ? claimDocuments.find(d => d.id === documentId) : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStage('idle');
    setErrorMessage(null);
    setIsDragging(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (uploadStage !== 'sending' && uploadStage !== 'processing') {
      resetState();
      onClose();
    }
  }, [uploadStage, resetState, onClose]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a PDF or image (JPG, PNG, HEIC, WebP).';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Invalid File',
        description: error,
        variant: 'destructive',
      });
      return;
    }
    setSelectedFile(file);
    setUploadStage('idle');
    setErrorMessage(null);
  }, [toast]);

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

  const handleUpload = async () => {
    if (!selectedFile || !documentId) return;

    // Hard guard: ensure valid sessionId
    const uploadSessionId = ensureSessionId(propSessionId);

    // Reset error state
    setErrorMessage(null);
    setUploadStage('validating');
    setUploadProgress(10);

    // Create abort controller for timeout
    abortControllerRef.current = new AbortController();

    // Set up timeout watchdog
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setUploadStage('error');
      setErrorMessage(ERROR_MESSAGES['TIMEOUT']);
      setUploadProgress(0);
    }, UPLOAD_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sessionId', uploadSessionId);
      formData.append('documentType', documentId);
      if (effectiveLeadId) formData.append('leadId', effectiveLeadId);
      if (sourceTool) formData.append('sourceTool', sourceTool);

      setUploadStage('sending');
      setUploadProgress(30);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`,
        {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        }
      );

      // Clear timeout on response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setUploadProgress(70);

      // Parse response
      const data = await response.json();
      
      setUploadStage('processing');
      setUploadProgress(85);

      if (!response.ok) {
        const errorCode = data?.error_code || 'UPLOAD_FAILED';
        const message = getErrorMessage(errorCode, data?.message);
        throw new Error(message);
      }

      if (!data.success) {
        const errorCode = data?.error_code || 'UPLOAD_FAILED';
        const message = getErrorMessage(errorCode, data?.message);
        throw new Error(message);
      }

      setUploadProgress(100);
      setUploadStage('done');
      
      // Track successful upload for GTM/analytics
      trackEvent('document_uploaded', {
        document_type: documentId,
        file_type: selectedFile.type,
        lead_id: effectiveLeadId,
        source_tool: sourceTool || 'claim-survival',
      });
      
      // Send upload confirmation email (fire and forget)
      const userEmail = sessionData?.email;
      if (userEmail) {
        supabase.functions.invoke('send-email-notification', {
          body: {
            email: userEmail,
            type: 'claim-vault-upload-confirmation',
            data: {
              documentName: document?.title || selectedFile.name,
            },
          },
        }).catch((err) => {
          console.error('[DocumentUploadModal] Email notification error:', err);
        });
      }
      
      // Delay before calling success to show completion state
      setTimeout(() => {
        // Use file_path as the identifier (signed URL can be generated on-demand)
        onSuccess(documentId, data.file_path);
        resetState();
      }, 1000);

    } catch (error) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.error('[DocumentUploadModal] Upload error:', error);
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage(ERROR_MESSAGES['TIMEOUT']);
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage(ERROR_MESSAGES['NETWORK_ERROR']);
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      }
      
      setUploadStage('error');
      setUploadProgress(0);
    }
  };

  const handleRetry = () => {
    setUploadStage('idle');
    setErrorMessage(null);
    setUploadProgress(0);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-primary" />;
    }
    return <FileText className="w-8 h-8 text-primary" />;
  };

  const isUploading = uploadStage === 'validating' || uploadStage === 'sending' || uploadStage === 'processing';
  const isComplete = uploadStage === 'done';
  const isError = uploadStage === 'error';

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
                accept=".pdf,.jpg,.jpeg,.png,.heic,.webp"
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
                {!isUploading && (
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
              {isUploading && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {uploadStage === 'validating' && 'Validating...'}
                    {uploadStage === 'sending' && 'Uploading...'}
                    {uploadStage === 'processing' && 'Processing...'}
                    {' '}{uploadProgress}%
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
                {errorMessage}
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
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
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
