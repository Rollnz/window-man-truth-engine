import { ToolReference } from '@/data/evidenceData';
import { Calculator, Zap, Shield, GitCompare, AlertTriangle, ArrowRight } from 'lucide-react';
import { getToolIconColors } from '@/lib/toolIconColors';

interface ToolsUsedSectionProps {
  tools: ToolReference[];
  onNavigate: (path: string) => void;
}

const toolIcons: Record<string, React.ReactNode> = {
  'cost-calculator': <Calculator className="w-5 h-5 text-primary" />,
  'fast-win': <Zap className="w-5 h-5 text-primary" />,
  'risk-diagnostic': <Shield className="w-5 h-5 text-primary" />,
  'comparison': <GitCompare className="w-5 h-5 text-primary" />,
  'reality-check': <AlertTriangle className="w-5 h-5 text-primary" />,
};

export function ToolsUsedSection({ tools, onNavigate }: ToolsUsedSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        🔧 Tools Used to Verify
      </h3>
      
      <div className="space-y-2">
        {tools.map((tool) => {
          const colors = getToolIconColors(tool.toolId);
          return (
            <button
              key={tool.toolId}
              onClick={() => onNavigate(tool.toolPath)}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border/50 
                         bg-card shadow-sm hover:shadow-md hover:border-primary/50 
                         hover:bg-primary/5 transition-all duration-200 text-left group"
            >
              <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                {toolIcons[tool.toolId] || <Zap className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{tool.toolName}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">{tool.context}</div>
              </div>
              <ArrowRight className="w-4 h-4 mt-1 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
