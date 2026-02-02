import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Phone, FileText } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { ROUTES } from '@/config/navigation';

export function SampleReportHeader() {
  const handleUploadClick = () => {
    trackEvent('sample_report_upload_click', {
      location: 'sticky_header',
    });
  };

  const handleTalkClick = () => {
    trackEvent('sample_report_talk_click', {
      location: 'sticky_header',
    });
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
        </div>

        {/* Right: CTAs */}
        <div className="flex items-center gap-3">
          {/* Secondary: Talk to Window Man */}
          <Link 
            to={ROUTES.CONSULTATION}
            onClick={handleTalkClick}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Talk to Window Man</span>
          </Link>

          {/* Primary: Upload My Estimate */}
          <Button 
            asChild 
            variant="cta" 
            size="sm"
            className="group"
            onClick={handleUploadClick}
          >
            <Link to={`${ROUTES.QUOTE_SCANNER}#upload`}>
              <Upload className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Upload My Estimate</span>
              <span className="sm:hidden">Upload</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
