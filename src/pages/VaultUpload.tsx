import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Shield,
  Image,
  FileCheck,
  X,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface UploadedFile {
  file: File;
  preview?: string;
  category: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const DOCUMENT_CATEGORIES = [
  {
    id: 'quotes',
    name: 'Quotes & Estimates',
    icon: FileText,
    description: 'Contractor quotes, estimates, proposals',
    color: 'blue',
  },
  {
    id: 'insurance',
    name: 'Insurance & Claims',
    icon: Shield,
    description: 'Insurance policies, claims, correspondence',
    color: 'green',
  },
  {
    id: 'warranties',
    name: 'Warranties & Manuals',
    icon: FileCheck,
    description: 'Product warranties, manuals, receipts',
    color: 'purple',
  },
  {
    id: 'photos',
    name: 'Property Photos',
    icon: Image,
    description: 'Before/after photos, damage documentation',
    color: 'orange',
  },
  {
    id: 'permits',
    name: 'Permits & Inspections',
    icon: FileText,
    description: 'Building permits, inspection reports',
    color: 'cyan',
  },
  {
    id: 'other',
    name: 'Other Documents',
    icon: FileText,
    description: 'Miscellaneous home-related documents',
    color: 'gray',
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function VaultUpload() {
  usePageTracking('vault-upload');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const preselectedCategory = searchParams.get('category') || '';

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      processFiles(droppedFiles);
    },
    [preselectedCategory]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
      }
    },
    [preselectedCategory]
  );

  const processFiles = (fileList: File[]) => {
    const validFiles: UploadedFile[] = [];

    fileList.forEach((file) => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not a supported file type.`,
          variant: 'destructive',
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds the 10MB limit.`,
          variant: 'destructive',
        });
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      validFiles.push({
        file,
        preview,
        category: preselectedCategory || 'other',
        status: 'pending',
      });
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // Revoke preview URL to prevent memory leak
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileCategory = (index: number, category: string) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index].category = category;
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      let successCount = 0;
      let errorCount = 0;

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];

        // Update status to uploading
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i].status = 'uploading';
          return newFiles;
        });

        try {
          const fileExt = uploadFile.file.name.split('.').pop();
          const fileName = `${user.id}/${uploadFile.category}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('vault-documents')
            .upload(fileName, uploadFile.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Save document metadata to database
          const { error: dbError } = await supabase.from('vault_documents').insert({
            user_id: user.id,
            file_name: uploadFile.file.name,
            file_path: fileName,
            file_type: uploadFile.file.type,
            file_size: uploadFile.file.size,
            category: uploadFile.category,
            uploaded_at: new Date().toISOString(),
          });

          if (dbError) throw dbError;

          // Update status to success
          setFiles((prev) => {
            const newFiles = [...prev];
            newFiles[i].status = 'success';
            return newFiles;
          });

          successCount++;
        } catch (error: any) {
          console.error('Upload error:', error);

          // Update status to error
          setFiles((prev) => {
            const newFiles = [...prev];
            newFiles[i].status = 'error';
            newFiles[i].error = error.message || 'Upload failed';
            return newFiles;
          });

          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: 'Upload Complete!',
          description: `Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}.`,
        });

        // Redirect to vault after 2 seconds
        setTimeout(() => {
          navigate('/vault');
        }, 2000);
      }

      if (errorCount > 0) {
        toast({
          title: 'Some Uploads Failed',
          description: `${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload. Please try again.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Upload process error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'An error occurred during upload. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = DOCUMENT_CATEGORIES.find((c) => c.id === categoryId);
    return category?.color || 'gray';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <span className="text-lg font-semibold">Horizons Vault</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/vault')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
          <p className="text-muted-foreground">
            Securely store your home protection documents with bank-level encryption
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area - Left Column */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Upload className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="text-xl font-semibold mb-2">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse your computer
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">Browse Files</span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-4">
                  Supported: PDF, JPG, PNG, HEIC, DOC, DOCX (Max 10MB per file)
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-3">
                    {files.map((uploadFile, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                      >
                        {/* Preview or Icon */}
                        <div className="shrink-0">
                          {uploadFile.preview ? (
                            <img
                              src={uploadFile.preview}
                              alt="Preview"
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-primary/20 rounded flex items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {uploadFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {/* Category Selector */}
                        <select
                          value={uploadFile.category}
                          onChange={(e) => updateFileCategory(index, e.target.value)}
                          disabled={uploadFile.status !== 'pending'}
                          className="px-3 py-1.5 rounded-md border border-border bg-background text-sm"
                        >
                          {DOCUMENT_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>

                        {/* Status or Remove */}
                        <div className="shrink-0">
                          {uploadFile.status === 'pending' ? (
                            <button
                              onClick={() => removeFile(index)}
                              className="p-2 hover:bg-muted rounded-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            getStatusIcon(uploadFile.status)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || files.every((f) => f.status !== 'pending')}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {files.filter((f) => f.status === 'pending').length} File
                        {files.filter((f) => f.status === 'pending').length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Categories Guide - Right Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Document Categories</h3>
              <div className="space-y-3">
                {DOCUMENT_CATEGORIES.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div
                      key={category.id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-${category.color}-500/20 flex items-center justify-center shrink-0`}>
                          <CategoryIcon className={`w-4 h-4 text-${category.color}-500`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-500">
                    BANK-LEVEL SECURITY
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  All files are encrypted with AES-256 encryption. Your documents are
                  secure and private.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
