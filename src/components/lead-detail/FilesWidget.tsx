import { FileText, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { LeadFile } from '@/hooks/useLeadDetail';
import { supabase } from '@/integrations/supabase/client';

interface FilesWidgetProps {
  files: LeadFile[];
}

export function FilesWidget({ files }: FilesWidgetProps) {
  const handleViewFile = async (file: LeadFile) => {
    try {
      const { data } = await supabase.storage
        .from('quotes')
        .createSignedUrl(file.file_path, 60 * 10, { download: false });

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'MMM d')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleViewFile(file)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
