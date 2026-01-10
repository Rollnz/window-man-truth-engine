import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/lib/gtm';
import { StampBadge } from './StampBadge';
import { BEAT_YOUR_QUOTE_ARSENAL } from '@/config/toolRegistry';
import { RelatedToolsGrid, ToolConfig } from '@/components/ui/RelatedToolsGrid';

export function ToolsSection() {
  const navigate = useNavigate();

  // Map registry tools to include custom CTAs for this section
  const tools: ToolConfig[] = BEAT_YOUR_QUOTE_ARSENAL.map(tool => ({
    ...tool,
    cta: 'Launch Tool',
  }));

  const handleToolClick = (tool: ToolConfig) => {
    trackEvent('tool_card_clicked', {
      tool_id: tool.id,
      source: 'beat-your-quote',
    });
    navigate(tool.path);
  };

  return (
    <section className="py-20 px-4 bg-dossier-page">
      <div className="container max-w-6xl mx-auto">
        {/* Custom Header for Dossier Theme */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <StampBadge variant="cyan">Intelligence Assets</StampBadge>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">
            <span className="text-white">YOUR </span>
            <span className="text-tools-truth-engine">ARSENAL</span>
          </h2>
          
          <p className="max-w-2xl mx-auto text-primary-foreground text-xl">
            Every tool you need to expose the truth, protect your wallet, and negotiate from a position of power.
          </p>
        </div>

        {/* Use RelatedToolsGrid without its own header */}
        <RelatedToolsGrid
          title=""
          tools={tools}
          columns={3}
          onToolClick={handleToolClick}
          variant="dossier"
          className="py-0"
        />
      </div>
    </section>
  );
}
