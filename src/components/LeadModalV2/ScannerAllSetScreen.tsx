import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';
import type { ResultScreenRenderProps } from './types';

export function ScannerAllSetScreen({
  firstName,
  onClose,
}: ResultScreenRenderProps) {
  const navigate = useNavigate();

  const handleViewSampleReport = () => {
    onClose();
    navigate(ROUTES.SAMPLE_REPORT, {
      state: {
        firstName: firstName || '',
        ctaSource: 'scanner_download_sample',
      },
    });
  };

  return (
    <div className="p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        You're All Set, {firstName}!
      </h2>

      <p className="text-muted-foreground mb-6">
        We just sent a link to your phone. Bookmark it so you're ready when the
        first quote lands in your hands.
      </p>

      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
        <p className="text-sm font-medium text-foreground mb-2">💡 Pro Tip</p>
        <p className="text-sm text-muted-foreground">
          Upload your quote while the contractor is still in your living room.
          Nothing keeps them honest like watching you fact-check their numbers in
          real time.
        </p>
      </div>

      <div className="border border-border rounded-lg p-4 mb-6 text-left">
        <p className="text-sm font-medium text-foreground mb-1">
          📥 Bonus: Download our "7 Red Flags" cheat sheet
        </p>
        <p className="text-xs text-muted-foreground">
          Keep it on your phone during contractor visits.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            window.open('/downloads/7-red-flags-cheatsheet.pdf', '_blank')
          }
        >
          <Download className="w-4 h-4 mr-2" />
          Download Cheat Sheet (PDF)
        </Button>

        <Button className="w-full" onClick={handleViewSampleReport}>
          View Sample Report
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
