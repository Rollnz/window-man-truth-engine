import { useNavigate } from 'react-router-dom';
import { FileSearch, Calculator, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
import { StampBadge } from './StampBadge';
import { ROUTES } from '@/config/navigation';
import { ImpactWindowCard } from '@/components/ui/ImpactWindowCard';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';

const TOOLS = [
  {
    id: 'quote-scanner',
    title: 'Quote Scanner',
    description: 'Upload your quote. Get a forensic analysis of hidden markups, inflated pricing, and negotiation leverage points.',
    icon: FileSearch,
    path: ROUTES.QUOTE_SCANNER,
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/40',
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
  },
];

export function ToolsSection() {
  const navigate = useNavigate();

  const handleToolClick = (tool: typeof TOOLS[0]) => {
    trackEvent('tool_card_clicked', {
      tool_id: tool.id,
      source: 'beat-your-quote',
    });
    navigate(tool.path);
  };

  return (
    <section className="py-20 px-4 bg-dossier-page">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
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

        {/* Tool Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {TOOLS.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <AnimateOnScroll key={tool.id} delay={index * 100}>
                <ImpactWindowCard className="h-full">
                  <div className="p-6 flex flex-col h-full">
                    {/* Icon Badge */}
                    <div className={`w-12 h-12 rounded-lg ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wide drop-shadow-md">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-white/80 mb-4 flex-grow">
                      {tool.description}
                    </p>
                    
                    <Button 
                      onClick={() => handleToolClick(tool)} 
                      variant="cta" 
                      className="w-full justify-between"
                    >
                      <span>Launch Tool</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </ImpactWindowCard>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
