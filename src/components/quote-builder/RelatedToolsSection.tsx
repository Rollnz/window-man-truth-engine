import { getSmartRelatedTools, getFrameControl } from "@/config/toolRegistry";
import { RelatedToolsGrid } from "@/components/ui/RelatedToolsGrid";

export const RelatedToolsSection = () => {
  const frameControl = getFrameControl('quote-builder');
  const smartTools = getSmartRelatedTools('quote-builder');
  
  return (
    <RelatedToolsGrid
      title={frameControl.title}
      description={frameControl.description}
      tools={smartTools}
      columns={3}
      variant="muted"
      className="py-16"
    />
  );
};
