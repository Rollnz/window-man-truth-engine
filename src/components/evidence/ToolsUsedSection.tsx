import { ToolReference } from '@/data/evidenceData';
import { Calculator, Zap, Shield, GitCompare, AlertTriangle, ArrowRight } from 'lucide-react';

interface ToolsUsedSectionProps {
  tools: ToolReference[];
  onNavigate: (path: string) => void;
}

const toolIcons: Record<string, React.ReactNode> = {
  'cost-calculator': <Calculator className="w-5 h-5" />,
  'fast-win': <Zap className="w-5 h-5" />,
  'risk-diagnostic': <Shield className="w-5 h-5" />,
  'comparison': <GitCompare className="w-5 h-5" />,
  'reality-check': <AlertTriangle className="w-5 h-5" />,
};

export function ToolsUsedSection({ tools, onNavigate }: ToolsUsedSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        🔧 Tools Used to Verify
      </h3>
      
      <div className="space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.toolId}
            onClick={() => onNavigate(tool.toolPath)}
            className="w-full flex items-start gap-3 p-3 rounded-lg border border-border 
                       hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {toolIcons[tool.toolId] || <Zap className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">{tool.toolName}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{tool.context}</div>
            </div>
            <ArrowRight className="w-4 h-4 mt-1 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}
