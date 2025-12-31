import { IntelResource } from '@/data/intelData';
import { ResourceCard } from './ResourceCard';
import { useBookCoverGenerator } from '@/hooks/useBookCoverGenerator';

interface ResourceGridProps {
  resources: IntelResource[];
  unlockedResources: string[];
  highlightedResourceId?: string;
  onUnlock: (resource: IntelResource) => void;
  onDownload: (resource: IntelResource) => void;
}

export function ResourceGrid({ 
  resources, 
  unlockedResources, 
  highlightedResourceId,
  onUnlock, 
  onDownload 
}: ResourceGridProps) {
  const { generateCover, getCoverUrl, isGenerating } = useBookCoverGenerator();

  const handleGenerateCover = async (resource: IntelResource, regenerate: boolean) => {
    await generateCover(resource, regenerate);
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        {/* Extra padding to prevent floating images from being clipped */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 pb-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isUnlocked={unlockedResources.includes(resource.id)}
              isRecommended={resource.id === highlightedResourceId || resource.recommended}
              coverUrl={getCoverUrl(resource)}
              isGenerating={isGenerating(resource.id)}
              onUnlock={() => onUnlock(resource)}
              onDownload={() => onDownload(resource)}
              onGenerateCover={(regenerate) => handleGenerateCover(resource, regenerate)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
