import { GitCompare, Zap, Shield } from 'lucide-react';
import { RelatedToolsGrid, ToolConfig } from '@/components/ui/RelatedToolsGrid';

const tools: ToolConfig[] = [
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
    <RelatedToolsGrid
      title="Related Intelligence"
      description="Not sure where to start? Use the tools our agents use."
      tools={tools}
      columns={3}
    />
  );
}
