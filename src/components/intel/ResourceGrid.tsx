import { IntelResource } from '@/data/intelData';
import { ResourceCard } from './ResourceCard';

interface ResourceGridProps {
  resources: IntelResource[];
  highlightedResourceId?: string;
  onAccess: (resource: IntelResource) => void;
}

export function ResourceGrid({ 
  resources, 
  highlightedResourceId,
  onAccess,
}: ResourceGridProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        {/* Extra padding to prevent floating images from being clipped */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 pb-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isRecommended={resource.id === highlightedResourceId || resource.recommended}
              onAccess={() => onAccess(resource)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
