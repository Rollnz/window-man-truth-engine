import { Link } from 'react-router-dom';
import { GitCompare, Zap, Shield, ArrowRight } from 'lucide-react';
import { ImpactWindowCard } from '@/components/ui/ImpactWindowCard';
import { Button } from '@/components/ui/button';

const relatedTools = [
  {
    id: 'comparison',
    title: 'Comparison Engine',
    description: 'Validate a price with side-by-side spec comparison',
    icon: GitCompare,
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    path: '/comparison',
    cta: 'Compare Specs',
  },
  {
    id: 'fast-win',
    title: 'Fast Win Detector',
    description: 'Find your highest-ROI upgrade in 45 seconds',
    icon: Zap,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    path: '/fast-win',
    cta: 'Find My #1 Upgrade',
  },
  {
    id: 'risk-diagnostic',
    title: 'Risk Diagnostic',
    description: 'Assess your protection gaps and insurance savings',
    icon: Shield,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    path: '/risk-diagnostic',
    cta: 'Check My Gaps',
  },
];

export function RelatedIntelligence() {
  return (
    <section className="py-12 border-t border-border">
      <div className="container px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Related Intelligence</h2>
          <p className="text-muted-foreground">
            Not sure where to start? Use the tools our agents use.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {relatedTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <ImpactWindowCard key={tool.id}>
                <div className="p-5 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-lg ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                  </div>
                  
                  <h3 className="font-semibold mb-1 text-white drop-shadow-md">
                    {tool.title}
                  </h3>
                  
                  <p className="text-sm text-white/80 mb-4 flex-grow">
                    {tool.description}
                  </p>
                  
                  <Link to={tool.path}>
                    <Button variant="cta" size="sm" className="w-full justify-between">
                      <span>{tool.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </ImpactWindowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
