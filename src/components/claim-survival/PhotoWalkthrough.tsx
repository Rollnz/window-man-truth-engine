import { useIsMobile } from '@/hooks/use-mobile';
import { PhotoStepper } from './PhotoStepper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle } from 'lucide-react';
import { photoSteps } from '@/data/claimSurvivalData';

interface PhotoWalkthroughProps {
  onUploadClick: (docId: string) => void;
  isUnlocked: boolean;
}

export function PhotoWalkthrough({ onUploadClick, isUnlocked }: PhotoWalkthroughProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <PhotoStepper onUploadClick={onUploadClick} />;
  }

  // Desktop: Vertical card list
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {photoSteps.map((step, index) => (
        <Card key={step.id} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Step {index + 1}</span>
              <h3 className="font-semibold">{step.title}</h3>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {step.description}
          </p>

          <ul className="space-y-2 mb-4">
            {step.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onUploadClick(`photo-${step.id}`)}
          >
            <Camera className="mr-2 h-4 w-4" />
            Upload {step.title} Photos
          </Button>
        </Card>
      ))}
    </div>
  );
}
