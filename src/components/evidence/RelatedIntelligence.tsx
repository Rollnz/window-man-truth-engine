import { Link } from 'react-router-dom';
import { GitCompare, Zap, Shield, ArrowRight } from 'lucide-react';
import { getToolIconColors } from '@/lib/toolIconColors';

const relatedTools = [
  {
    id: 'comparison',
    title: 'Comparison Engine',
    description: 'Validate a price with side-by-side spec comparison',
    icon: <GitCompare className="w-6 h-6 text-cyan-500" />,
    path: '/comparison',
    cta: 'Compare Specs',
  },
  {
    id: 'fast-win',
    title: 'Fast Win Detector',
    description: 'Find your highest-ROI upgrade in 45 seconds',
    icon: <Zap className="w-6 h-6 text-amber-500" />,
    path: '/fast-win',
    cta: 'Find My #1 Upgrade',
  },
  {
    id: 'risk-diagnostic',
    title: 'Risk Diagnostic',
    description: 'Assess your protection gaps and insurance savings',
    icon: <Shield className="w-6 h-6 text-orange-500" />,
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
            const colors = getToolIconColors(tool.id);
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className="group flex flex-col p-5 rounded-xl bg-card border border-border card-hover"
              >
                <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  {tool.icon}
                </div>
                
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  {tool.description}
                </p>
                
                <div className="flex items-center text-sm text-primary font-medium">
                  <span>{tool.cta}</span>
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
