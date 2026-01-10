import { CLAIM_SURVIVAL_RELATED } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';

export function ToolEcosystem() {
  return (
    <RelatedToolsGrid
      title="Related Protection Tools"
      description="Complete your home protection strategy with these complementary tools."
      tools={CLAIM_SURVIVAL_RELATED}
      columns={4}
    />
  );
}
