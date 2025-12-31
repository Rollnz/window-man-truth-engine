import { useState } from 'react';
import { Lock, Unlock, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntelResource } from '@/data/intelData';
import { ResourcePreview } from './ResourcePreview';
import { FloatingBookImage } from './FloatingBookImage';
import { GenerateCoverButton } from './GenerateCoverButton';
import { CoverSkeleton } from './CoverSkeleton';

interface ResourceCardProps {
  resource: IntelResource;
  isUnlocked: boolean;
  isRecommended?: boolean;
  coverUrl?: string;
  isGenerating?: boolean;
  onUnlock: () => void;
  onDownload: () => void;
  onGenerateCover?: (regenerate: boolean) => void;
}

export function ResourceCard({ 
  resource, 
  isUnlocked, 
  isRecommended,
  coverUrl,
  isGenerating = false,
  onUnlock, 
  onDownload,
  onGenerateCover,
}: ResourceCardProps) {
  const [mobileBookEnlarged, setMobileBookEnlarged] = useState(false);
  const Icon = resource.icon;

  // Use provided coverUrl or fallback to static bookImageUrl
  const displayCoverUrl = coverUrl || resource.bookImageUrl;
  const hasFloatingImage = !!displayCoverUrl || isGenerating;

  return (
    <div className={`group relative flex flex-col p-6 rounded-xl bg-white transition-all duration-300 border-2 sm:border-[6px] sm:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.08)] ${
      isUnlocked 
        ? 'border-gray-200 sm:border-gray-400 glow-sm' 
        : 'border-gray-100 sm:border-gray-300 hover:border-primary/50'
    } ${hasFloatingImage ? 'overflow-visible' : ''}`}>
      {/* Loading skeleton while generating */}
      {isGenerating && !displayCoverUrl && (
        <CoverSkeleton position={resource.imagePosition} />
      )}

      {/* Floating book image */}
      {displayCoverUrl && !isGenerating && (
        <FloatingBookImage
          imageUrl={displayCoverUrl}
          position={resource.imagePosition}
          alt={resource.title}
        />
      )}

      {/* Generate/Regenerate cover button */}
      {onGenerateCover && (
        <GenerateCoverButton
          resource={resource}
          hasExistingCover={!!coverUrl && !resource.bookImageUrl}
          isGenerating={isGenerating}
          onGenerate={onGenerateCover}
        />
      )}

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
          : 'bg-gray-100 text-gray-500'
      }`}>
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
          isLocked={!isUnlocked} 
        />
      </div>

      {/* Mobile: Centered book replaces preview */}
      {displayCoverUrl && (
        <div 
          className="mb-6 flex-grow flex items-center justify-center sm:hidden cursor-pointer"
          onClick={() => setMobileBookEnlarged(!mobileBookEnlarged)}
        >
          <img 
            src={displayCoverUrl} 
            alt={resource.title}
            className={`h-auto drop-shadow-lg transition-all duration-300 ease-out ${
              mobileBookEnlarged 
                ? 'w-36 shadow-[0_0_20px_rgba(0,212,255,0.3)]' 
                : 'w-28 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
            }`}
          />
        </div>
      )}

      {/* Page count */}
      <p className="text-xs text-gray-500 mb-4">
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
