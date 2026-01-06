import { useNavigate } from 'react-router-dom';
import { FileSearch, Calculator, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
import { StampBadge } from './StampBadge';

const TOOLS = [
  {
    id: 'quote-scanner',
    title: 'Quote Scanner',
    description: 'Upload your quote. Get a forensic analysis of hidden markups, inflated pricing, and negotiation leverage points.',
    icon: FileSearch,
    path: '/quote-scanner',
    image: '/images/beat-your-quote/quote-scanner.webp',
    accentColor: '#00D4FF'
  },
  {
    id: 'cost-calculator',
    title: 'True Cost Calculator',
    description: 'Calculate what windows actually cost in your area. See the real numbers contractors don\'t want you to know.',
    icon: Calculator,
    path: '/cost-calculator',
    image: '/images/beat-your-quote/manipulation-tactics.webp',
    accentColor: '#22C55E'
  },
  {
    id: 'claim-survival',
    title: 'Claim Survival Kit',
    description: 'Preparing an insurance claim? Get organized with our step-by-step guide to maximize your coverage.',
    icon: Shield,
    path: '/claim-survival',
    image: '/images/beat-your-quote/claimsurvivalkit.webp',
    accentColor: '#F59E0B'
  }
];

export function ToolsSection() {
  const navigate = useNavigate();

  const handleToolClick = (tool: typeof TOOLS[0]) => {
    trackEvent('tool_card_clicked', { 
      tool_id: tool.id, 
      source: 'beat-your-quote' 
    });
    navigate(tool.path);
  };

  return (
    <section className="py-20 px-4 bg-[#0A0F14]">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <StampBadge variant="cyan">Intelligence Assets</StampBadge>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">
            <span className="text-white">YOUR </span>
            <span className="text-[#00D4FF]">ARSENAL</span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every tool you need to expose the truth, protect your wallet, and negotiate from a position of power.
          </p>
        </div>

        {/* Tool Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <div 
              key={tool.id}
              className="group relative rounded-xl border border-border/40 bg-background/5 
                         overflow-hidden transition-all duration-300
                         hover:border-[#00D4FF]/40 hover:shadow-lg hover:shadow-[#00D4FF]/10"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={tool.image}
                  alt={tool.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F14] via-[#0A0F14]/50 to-transparent" />
                
                {/* Icon Badge */}
                <div 
                  className="absolute bottom-4 left-4 w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tool.accentColor}20` }}
                >
                  <tool.icon className="w-6 h-6" style={{ color: tool.accentColor }} />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wide">
                  {tool.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {tool.description}
                </p>
                
                <Button 
                  onClick={() => handleToolClick(tool)}
                  variant="ghost"
                  className="w-full justify-between text-[#00D4FF] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
