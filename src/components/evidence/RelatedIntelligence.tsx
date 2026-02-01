import { getSmartRelatedTools, getFrameControl } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';

export function RelatedIntelligence() {
  const frameControl = getFrameControl('evidence');
  const smartTools = getSmartRelatedTools('evidence');
  
  return (
    <RelatedToolsGrid
      title={frameControl.title}
      description={frameControl.description}
      tools={smartTools}
      columns={3}
      variant="muted"
      className="border-t border-border mt-8"
    />
  );
}
