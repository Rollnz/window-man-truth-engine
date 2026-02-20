import { useState } from 'react';
import { FileText, ExternalLink, Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { LeadFile } from '@/hooks/useLeadDetail';

interface FilesWidgetProps {
  files: LeadFile[];
  onTriggerFileAnalysis?: (quoteFileId: string) => Promise<boolean>;
  getQuoteFileUrl?: (fileId: string) => Promise<string | null>;
}

export function FilesWidget({ files, onTriggerFileAnalysis, getQuoteFileUrl }: FilesWidgetProps) {
  const [triggeringFileId, setTriggeringFileId] = useState<string | null>(null);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);

  const handleViewFile = async (file: LeadFile) => {
    if (!getQuoteFileUrl || viewingFileId) return;
    setViewingFileId(file.id);
    try {
      const url = await getQuoteFileUrl(file.id);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setViewingFileId(null);
    }
  };

  const handleTriggerAnalysis = async (file: LeadFile) => {
    if (!onTriggerFileAnalysis || triggeringFileId) return;
    setTriggeringFileId(file.id);
    try {
      await onTriggerFileAnalysis(file.id);
    } finally {
      setTriggeringFileId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileAnalysisStatus = (file: LeadFile): string => {
    return file.ai_pre_analysis?.status || 'none';
  };

  const canTriggerAnalysis = (file: LeadFile): boolean => {
    const status = getFileAnalysisStatus(file);
    return status === 'none' || status === 'failed' || status === 'pending';
  };

  const getStatusIcon = (file: LeadFile) => {
    const status = getFileAnalysisStatus(file);
    switch (status) {
      case 'completed':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>AI Analysis Complete</TooltipContent>
          </Tooltip>
        );
      case 'pending':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Analysis in Progress</TooltipContent>
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Analysis Failed</TooltipContent>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-3 w-3" />
            Uploaded Files ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2 px-4">
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No files uploaded
            </p>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {onTriggerFileAnalysis && canTriggerAnalysis(file) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleTriggerAnalysis(file)}
                              disabled={triggeringFileId === file.id}
                            >
                              {triggeringFileId === file.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getFileAnalysisStatus(file) === 'failed' ? 'Retry AI Scan' : 'Run AI Scan'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleViewFile(file)}
                            disabled={viewingFileId === file.id || !getQuoteFileUrl}
                          >
                            {viewingFileId === file.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View file</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
