import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Scale, ShieldAlert, FileSearch, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { relatedTools } from '@/data/claimSurvivalData';

const iconMap: Record<string, { 
  icon: React.ElementType; 
  iconColor: string; 
  bgColor: string; 
  borderColor: string;
}> = {
  comparison: {
    icon: Scale,
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    borderColor: 'border-cyan-500/30'
  },
  'risk-diagnostic': {
    icon: ShieldAlert,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10 dark:bg-orange-500/20',
    borderColor: 'border-orange-500/30'
  },
  evidence: {
    icon: FileSearch,
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
    borderColor: 'border-violet-500/30'
  },
  expert: {
    icon: MessageSquareText,
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-500/10 dark:bg-sky-500/20',
    borderColor: 'border-sky-500/30'
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
            bgColor: 'bg-primary/10',
            borderColor: 'border-primary/30'
          };
          const Icon = toolConfig.icon;
          return (
            <Card key={tool.id} className="p-5 hover:border-primary/50 transition-colors">
              <div className="mb-4">
                <div className={`w-10 h-10 rounded-lg ${toolConfig.bgColor} border ${toolConfig.borderColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${toolConfig.iconColor}`} />
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{tool.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{tool.description}</p>
              <Link to={tool.path}>
                <Button variant="cta" size="sm" className="w-full justify-between">
                  Use Tool
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
