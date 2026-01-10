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
    <div className={`group relative flex flex-col p-6 rounded-xl bg-card transition-all duration-300 
      border-2 hover:border-[3px] border-slate-400/80 hover:border-slate-500
      shadow-md hover:shadow-xl hover:-translate-y-1
      ${hasFloatingImage ? 'overflow-visible' : 'overflow-hidden'}`}>
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

      {/* Icon - blue mutes on hover */}
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-primary/20 text-primary group-hover:bg-primary/10 group-hover:text-primary/50 transition-colors duration-300">
        <Icon className="w-6 h-6" />
      </div>

      {/* Tagline - blue mutes on hover, text stays crisp */}
      <span className="text-xs text-primary font-semibold uppercase tracking-wider mb-1 group-hover:text-primary/50 transition-colors duration-300">
        {resource.tagline}
      </span>

      {/* Title - pops above shimmer on hover */}
      <h3 className="text-lg font-bold mb-2 text-foreground relative z-20 group-hover:drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">{resource.title}</h3>

      {/* Description - stays crisp above shimmer */}
      <p className="text-sm text-muted-foreground mb-4 relative z-20 group-hover:text-foreground/90 transition-colors duration-200">
        {resource.description}
      </p>

      {/* Preview points - hidden on mobile, text stays focused */}
      <div className="mb-6 flex-grow hidden sm:block relative z-20">
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

      {/* Page count - stays crisp */}
      <p className="text-xs text-muted-foreground mb-4 relative z-20 group-hover:text-foreground/80 transition-colors duration-200">
        {resource.pageCount} pages • PDF format
      </p>

      {/* Action button - blue mutes on hover, text stays visible */}
      <Button 
        onClick={onAccess} 
        variant="default" 
        className="w-full relative z-10 group-hover:bg-primary/60 transition-colors duration-300"
      >
        {buttonText}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
