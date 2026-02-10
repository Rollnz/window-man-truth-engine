import { Button } from '@/components/ui/button';
import { Upload, Phone, FileText } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';

interface SampleReportHeaderProps {
  firstName?: string;
  onOpenLeadModal?: (ctaSource: string) => void;
  onOpenPreQuoteModal?: (ctaSource: string) => void;
}

export function SampleReportHeader({ firstName, onOpenLeadModal, onOpenPreQuoteModal }: SampleReportHeaderProps) {
  const safeFirstName = firstName?.trim().slice(0, 24);
  const handleUploadClick = () => {
    trackEvent('sample_report_upload_click', {
      location: 'sticky_header',
    });
    onOpenPreQuoteModal?.('header_upload');
  };

  const handleTalkClick = () => {
    trackEvent('sample_report_talk_click', {
      location: 'sticky_header',
      action: 'phone_call',
    });
    onOpenPreQuoteModal?.('header_talk');
  };

  return (
    <header className="fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Logo + Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground hidden sm:inline">
              Sample AI Report
            </span>
            <span className="font-semibold text-foreground sm:hidden">
              Sample Report
            </span>
          </div>
          {safeFirstName && safeFirstName.length >= 2 && (
            <span className="shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden sm:inline">
              Hi, {safeFirstName}
            </span>
          )}
        </div>

        {/* Right: CTAs */}
        <div className="flex items-center gap-3">
          {/* Secondary: Talk to Window Man - Direct Phone Call */}
          <button 
            onClick={handleTalkClick}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Talk to Window Man</span>
          </button>

          {/* Primary: Upload My Estimate - Opens Lead Modal */}
          <Button 
            variant="cta" 
            size="sm"
            className="group"
            onClick={handleUploadClick}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Upload My Estimate</span>
            <span className="sm:hidden">Upload</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
