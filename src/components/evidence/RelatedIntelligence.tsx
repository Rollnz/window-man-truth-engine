import { EVIDENCE_RELATED } from '@/config/toolRegistry';
import { RelatedToolsGrid } from '@/components/ui/RelatedToolsGrid';

export function RelatedIntelligence() {
  return (
    <RelatedToolsGrid
      title="Related Intelligence"
      description="Not sure where to start? Use the tools our agents use."
      tools={EVIDENCE_RELATED}
      columns={3}
    />
  );
}
