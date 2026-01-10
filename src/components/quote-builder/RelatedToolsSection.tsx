import { QUOTE_BUILDER_RELATED } from "@/config/toolRegistry";
import { RelatedToolsGrid } from "@/components/ui/RelatedToolsGrid";

export const RelatedToolsSection = () => {
  return (
    <RelatedToolsGrid
      title="Related Tools"
      description="Explore more resources to help you make informed decisions about your impact window project."
      tools={QUOTE_BUILDER_RELATED}
      columns={3}
      variant="muted"
      className="py-16"
    />
  );
};
