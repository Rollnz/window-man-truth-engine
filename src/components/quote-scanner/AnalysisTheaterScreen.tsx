import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, FileSearch, BarChart3, FileText } from 'lucide-react';
import { FilePreviewCard } from '@/components/ui/FilePreviewCard';

interface AnalysisTheaterScreenProps {
  previewUrl?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

const STAGES = [
  { label: 'Extracting Text', icon: FileSearch, durationMs: 4000 },
  { label: 'Scoring Categories', icon: BarChart3, durationMs: 6000 },
  { label: 'Building Report', icon: FileText, durationMs: 0 },
] as const;

export function AnalysisTheaterScreen({ previewUrl, fileName, fileType, fileSize }: AnalysisTheaterScreenProps) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;

    STAGES.forEach((stage, i) => {
      if (i === 0) return;
      elapsed += STAGES[i - 1].durationMs;
      timers.push(setTimeout(() => setActiveStage(i), elapsed));
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8">
      {/* Blurred preview */}
      {(previewUrl || fileName) && (
        <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-border/40">
          <FilePreviewCard
            previewUrl={previewUrl}
            fileName={fileName}
            fileType={fileType}
            fileSize={fileSize}
            className="w-full h-full object-cover blur-lg scale-110"
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>
      )}

      <h2 className="text-xl font-bold text-foreground">Analyzing Your Report</h2>

      {/* Stepper */}
      <div className="w-full max-w-sm space-y-3">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i === activeStage;
          const isComplete = i < activeStage;

          return (
            <div
              key={stage.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 border border-primary/30'
                  : isComplete
                  ? 'bg-muted/50'
                  : 'opacity-40'
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              ) : (
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">Please keep this tab open</p>
    </div>
  );
}
