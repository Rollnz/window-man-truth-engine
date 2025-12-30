import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { CaseDebriefContent } from './CaseDebriefContent';
import { CaseStudy } from '@/data/evidenceData';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CaseDebriefModalProps {
  isOpen: boolean;
  caseStudy: CaseStudy | null;
  onClose: () => void;
  onToolNavigate: (path: string) => void;
  onDownload: () => void;
  onConsultation: () => void;
}

export function CaseDebriefModal({ 
  isOpen, 
  caseStudy, 
  onClose,
  onToolNavigate,
  onDownload,
  onConsultation,
}: CaseDebriefModalProps) {
  const isMobile = useIsMobile();
  
  if (!caseStudy) return null;
  
  const content = (
    <CaseDebriefContent 
      caseStudy={caseStudy} 
      onToolNavigate={onToolNavigate}
      onDownload={onDownload}
      onConsultation={onConsultation}
    />
  );
  
  // Mobile: Bottom drawer with swipe-to-close
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <ScrollArea className="h-[calc(90vh-2rem)] px-4 pb-8">
            <div className="pt-4">
              {content}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }
  
  // Desktop: Centered dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[85vh] p-6">
          {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
