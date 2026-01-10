import { Scale, ShieldAlert, FileSearch, MessageSquareText } from 'lucide-react';
import { relatedTools } from '@/data/claimSurvivalData';
import { RelatedToolsGrid, ToolConfig } from '@/components/ui/RelatedToolsGrid';

const iconMap: Record<string, {
  icon: typeof Scale;
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
  const tools: ToolConfig[] = relatedTools.map((tool) => {
    const config = iconMap[tool.id] || {
      icon: FileSearch,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/20',
      borderColor: 'border-primary/40'
    };
    
    return {
      id: tool.id,
      title: tool.name,
      description: tool.description,
      path: tool.path,
      icon: config.icon,
      iconColor: config.iconColor,
      bgColor: config.bgColor,
      borderColor: config.borderColor,
      cta: 'Use Tool',
    };
  });

  return (
    <RelatedToolsGrid
      title="Related Protection Tools"
      description="Complete your home protection strategy with these complementary tools."
      tools={tools}
      columns={4}
    />
  );
}
