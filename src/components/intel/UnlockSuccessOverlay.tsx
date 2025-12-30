import { Check, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelResource } from '@/data/intelData';

interface UnlockSuccessOverlayProps {
  resource: IntelResource;
  onDownload: () => void;
  onClose: () => void;
}

export function UnlockSuccessOverlay({ resource, onDownload, onClose }: UnlockSuccessOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center animate-scale-in">
        {/* Declassified stamp */}
        <div className="relative mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary font-bold text-2xl tracking-widest rotate-[-15deg] opacity-20"
            style={{ textShadow: '0 0 10px hsl(var(--primary))' }}
          >
            DECLASSIFIED
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Document Declassified!</h2>
        <p className="text-muted-foreground mb-6">
          <span className="text-foreground font-medium">{resource.title}</span> is now unlocked. 
          A backup copy has been sent to your email.
        </p>

        {/* Download button - requires manual click */}
        <Button 
          onClick={onDownload} 
          size="lg" 
          className="w-full mb-4 glow-sm"
        >
          <Download className="mr-2 h-5 w-5" />
          Download Now ({resource.pageCount} pages)
        </Button>

        <Button 
          variant="ghost" 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          Continue Browsing
        </Button>

        <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Opens in new tab
        </p>
      </div>
    </div>
  );
}
