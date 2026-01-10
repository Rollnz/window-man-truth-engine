import { Button } from '@/components/ui/button';
import { ArrowRight, Scale, ShieldAlert, FileSearch, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { relatedTools } from '@/data/claimSurvivalData';
import { ImpactWindowCard } from '@/components/ui/ImpactWindowCard';

const iconMap: Record<string, { 
  icon: React.ElementType; 
  iconColor: string; 
  bgColor: string; 
  borderColor: string;
}> = {
  comparison: {
    icon: Scale,
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40'
  },
  'risk-diagnostic': {
    icon: ShieldAlert,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40'
  },
  evidence: {
    icon: FileSearch,
    iconColor: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/40'
  },
  expert: {
    icon: MessageSquareText,
    iconColor: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/40'
  },
};

export function ToolEcosystem() {
  return (
    <div className="container px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Related Protection Tools</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Complete your home protection strategy with these complementary tools.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
        {relatedTools.map((tool) => {
          const toolConfig = iconMap[tool.id] || {
            icon: FileSearch,
            iconColor: 'text-primary',
            bgColor: 'bg-primary/20',
            borderColor: 'border-primary/40'
          };
          const Icon = toolConfig.icon;
          return (
            <ImpactWindowCard key={tool.id}>
              <div className="p-5 flex flex-col h-full">
                <div className="mb-4">
                  <div className={`w-10 h-10 rounded-lg ${toolConfig.bgColor} border ${toolConfig.borderColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${toolConfig.iconColor}`} />
                  </div>
                </div>
                <h3 className="font-semibold text-sm mb-1 text-white drop-shadow-md">{tool.name}</h3>
                <p className="text-xs text-white/80 mb-4 flex-grow">{tool.description}</p>
                <Link to={tool.path}>
                  <Button variant="cta" size="sm" className="w-full justify-between">
                    Use Tool
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ImpactWindowCard>
          );
        })}
      </div>
    </div>
  );
}
