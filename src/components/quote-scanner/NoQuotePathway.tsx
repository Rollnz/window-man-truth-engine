import { Link } from 'react-router-dom';
import { Calculator, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/navigation';

const pathways = [
  {
    icon: FileText,
    title: 'Get a Free Estimate',
    description: 'Build your own estimate before talking to contractors.',
    path: ROUTES.FREE_ESTIMATE,
    cta: 'Build My Estimate',
    iconColor: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    icon: Calculator,
    title: 'Calculate True Costs',
    description: 'See how much waiting is really costing you.',
    path: ROUTES.COST_CALCULATOR,
    cta: 'Calculate Now',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
];

export function NoQuotePathway() {
  return (
    <section className="py-12 md:py-16 bg-muted/20">
      <div className="container px-4 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Don't Have a Quote Yet?
          </h2>
          <p className="text-muted-foreground">
            No problem. Start with these tools and come back when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pathways.map((pathway) => (
            <Link
              key={pathway.path}
              to={pathway.path}
              className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${pathway.bgColor}`}>
                <pathway.icon className={`w-6 h-6 ${pathway.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {pathway.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pathway.description}
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                {pathway.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
