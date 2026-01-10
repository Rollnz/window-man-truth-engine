import { useNavigate } from 'react-router-dom';
import { FileSearch, Calculator, Shield } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { StampBadge } from './StampBadge';
import { ROUTES } from '@/config/navigation';
import { RelatedToolsGrid, ToolConfig } from '@/components/ui/RelatedToolsGrid';

const tools: ToolConfig[] = [
  {
    id: 'quote-scanner',
    title: 'Quote Scanner',
    description: 'Upload your quote. Get a forensic analysis of hidden markups, inflated pricing, and negotiation leverage points.',
    icon: FileSearch,
    path: ROUTES.QUOTE_SCANNER,
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/40',
    cta: 'Launch Tool',
  },
  {
    id: 'cost-calculator',
    title: 'True Cost Calculator',
    description: "Calculate what windows actually cost in your area. See the real numbers contractors don't want you to know.",
    icon: Calculator,
    path: ROUTES.COST_CALCULATOR,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    cta: 'Launch Tool',
  },
  {
    id: 'claim-survival',
    title: 'Claim Survival Kit',
    description: 'Preparing an insurance claim? Get organized with our step-by-step guide to maximize your coverage.',
    icon: Shield,
    path: ROUTES.CLAIM_SURVIVAL,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    cta: 'Launch Tool',
  },
];

export function ToolsSection() {
  const navigate = useNavigate();

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
