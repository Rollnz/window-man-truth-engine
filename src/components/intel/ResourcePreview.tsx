import { Lock } from 'lucide-react';

interface ResourcePreviewProps {
  previewPoints: string[];
  isLocked: boolean;
}

export function ResourcePreview({ previewPoints, isLocked }: ResourcePreviewProps) {
  return (
    <div className="relative">
      {/* Blur overlay for locked state */}
      {isLocked && (
        <div className="absolute inset-0 bg-card/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Lock className="w-4 h-4" />
            <span>Unlock to reveal</span>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {previewPoints.map((point, index) => (
          <li 
            key={index} 
            className={`text-sm flex items-start gap-2 ${
              isLocked ? 'text-muted-foreground/50' : 'text-muted-foreground'
            }`}
          >
            <span className="text-primary mt-0.5">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
