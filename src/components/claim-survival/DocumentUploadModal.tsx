import { useState, useRef, useCallback } from 'react';
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
import { Upload, X, FileText, Image, Loader2, CheckCircle } from 'lucide-react';
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
  leadId?: string; // Existing lead ID for identity persistence (Golden Thread)
  sourceTool?: SourceTool; // Source tool for attribution tracking
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp'];

export function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  documentId,
  sessionId,
  leadId: leadIdProp,
  sourceTool,
}: DocumentUploadModalProps) {
  const { toast } = useToast();
  const { sessionData } = useSessionData();
  const { leadId: hookLeadId } = useLeadIdentity();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Golden Thread: Use prop if provided, otherwise fallback to hook
  const effectiveLeadId = leadIdProp || hookLeadId;
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const document = documentId ? claimDocuments.find(d => d.id === documentId) : null;

  const resetState = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsComplete(false);
    setIsDragging(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      resetState();
      onClose();
    }
  };

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

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sessionId', sessionId);
      formData.append('documentType', documentId);
      if (effectiveLeadId) formData.append('leadId', effectiveLeadId);
      if (sourceTool) formData.append('sourceTool', sourceTool);

      setUploadProgress(30);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadProgress(100);

      if (data.success && data.signedUrl) {
        setIsComplete(true);
        
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
          }).then(({ error }) => {
            if (error) {
              console.error('Email notification error:', error);
            } else {
              console.log('Upload confirmation email triggered');
            }
          });
        }
        
        // Delay before calling success to show completion state
        setTimeout(() => {
          onSuccess(documentId, data.signedUrl);
          resetState();
        }, 1000);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-primary" />;
    }
    return <FileText className="w-8 h-8 text-primary" />;
  };

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
          {!selectedFile && !isComplete && (
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
          {selectedFile && !isComplete && (
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
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
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
          {selectedFile && !isComplete && (
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
