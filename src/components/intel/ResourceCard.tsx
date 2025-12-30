import { Lock, Unlock, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelResource } from '@/data/intelData';
import { ResourcePreview } from './ResourcePreview';

interface ResourceCardProps {
  resource: IntelResource;
  isUnlocked: boolean;
  isRecommended?: boolean;
  onUnlock: () => void;
  onDownload: () => void;
}

export function ResourceCard({ 
  resource, 
  isUnlocked, 
  isRecommended,
  onUnlock, 
  onDownload 
}: ResourceCardProps) {
  const Icon = resource.icon;

  return (
    <div className={`relative flex flex-col p-6 rounded-xl bg-card border transition-all duration-300 ${
      isUnlocked 
        ? 'border-primary/50 glow-sm' 
        : 'border-border hover:border-primary/30'
    }`}>
      {/* Classified/Declassified stamp */}
      <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold tracking-wider ${
        isUnlocked 
          ? 'bg-primary/20 text-primary' 
          : 'bg-destructive/20 text-destructive'
      }`}>
        {isUnlocked ? 'DECLASSIFIED' : 'CLASSIFIED'}
      </div>

      {/* Recommended badge */}
      {isRecommended && !isUnlocked && (
        <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-warning text-warning-foreground text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3" />
          Recommended
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
        isUnlocked 
          ? 'bg-primary/20 text-primary' 
          : 'bg-muted text-muted-foreground'
      }`}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Tagline */}
      <span className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
        {resource.tagline}
      </span>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">
        {resource.description}
      </p>

      {/* Preview points */}
      <div className="mb-6 flex-grow">
        <ResourcePreview 
          previewPoints={resource.previewPoints} 
          isLocked={!isUnlocked} 
        />
      </div>

      {/* Page count */}
      <p className="text-xs text-muted-foreground mb-4">
        {resource.pageCount} pages • PDF format
      </p>

      {/* Action button */}
      {isUnlocked ? (
        <Button onClick={onDownload} variant="default" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      ) : (
        <Button onClick={onUnlock} variant="outline" className="w-full group">
          <Lock className="mr-2 h-4 w-4 group-hover:hidden" />
          <Unlock className="mr-2 h-4 w-4 hidden group-hover:block" />
          Unlock File
        </Button>
      )}
    </div>
  );
}
