import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelResource } from '@/data/intelData';
import { ResourcePreview } from './ResourcePreview';
import { FloatingBookImage } from './FloatingBookImage';

interface ResourceCardProps {
  resource: IntelResource;
  isRecommended?: boolean;
  onAccess: () => void;
}

export function ResourceCard({ 
  resource, 
  isRecommended,
  onAccess,
}: ResourceCardProps) {
  const Icon = resource.icon;
  const displayCoverUrl = resource.bookImageUrl;
  const hasFloatingImage = !!displayCoverUrl;

  // Button text: "Access System" for claim-survival, "Access Guide" for all others
  const buttonText = resource.id === 'claim-survival' ? 'Access System' : 'Access Guide';

  return (
    <div className={`group relative flex flex-col p-6 rounded-xl bg-white transition-all duration-300 border-2 sm:border-[6px] sm:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.08)] border-gray-200 sm:border-gray-400 hover:border-primary/50 ${hasFloatingImage ? 'overflow-visible' : ''}`}>
      {/* Floating book image */}
      {displayCoverUrl && (
        <FloatingBookImage
          imageUrl={displayCoverUrl}
          position={resource.imagePosition}
          alt={resource.title}
        />
      )}

      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-warning text-warning-foreground text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3" />
          Recommended
        </div>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/20 text-primary">
        <Icon className="w-6 h-6" />
      </div>

      {/* Tagline */}
      <span className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
        {resource.tagline}
      </span>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{resource.title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4">
        {resource.description}
      </p>

      {/* Preview points - hidden on mobile */}
      <div className="mb-6 flex-grow hidden sm:block">
        <ResourcePreview 
          previewPoints={resource.previewPoints} 
          isLocked={false} 
        />
      </div>

      {/* Mobile: Centered book replaces preview */}
      {displayCoverUrl && (
        <div className="mb-6 flex-grow flex items-center justify-center sm:hidden">
          <img 
            src={displayCoverUrl} 
            alt={resource.title}
            className="w-28 h-auto drop-shadow-lg"
          />
        </div>
      )}

      {/* Page count */}
      <p className="text-xs text-gray-500 mb-4">
        {resource.pageCount} pages • PDF format
      </p>

      {/* Action button - direct navigation */}
      <Button onClick={onAccess} variant="default" className="w-full">
        {buttonText}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
