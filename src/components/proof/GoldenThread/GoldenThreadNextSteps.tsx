import { FileSearch, Calculator, CheckSquare, BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SectionFrame } from '../SectionFrame';
import { cn } from '@/lib/utils';

interface NextStepTool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  ctaId: string;
}

const nextStepTools: NextStepTool[] = [
  {
    id: 'reality-check',
    title: 'Reality Check Tool',
    description: 'Compare your home to verified outcomes',
    icon: CheckSquare,
    path: '/reality-check',
    ctaId: 'nextstep_reality_check',
  },
  {
    id: 'quote-scanner',
    title: 'AI Quote Scanner',
    description: 'Get your quote audited now',
    icon: FileSearch,
    path: '/ai-scanner',
    ctaId: 'nextstep_quote_scanner',
  },
  {
    id: 'cost-of-inaction',
    title: 'Cost of Inaction Calculator',
    description: 'Quantify delay risk',
    icon: Calculator,
    path: '/cost-calculator',
    ctaId: 'nextstep_cost_of_inaction',
  },
  {
    id: 'intel-library',
    title: 'Intel Library',
    description: 'Download the same documentation our homeowners used',
    icon: BookOpen,
    path: '/intel',
    ctaId: 'nextstep_intel_library',
  },
];

interface GoldenThreadNextStepsProps {
  onToolSelect: (tool: NextStepTool) => void;
  onSectionView?: (sectionId: string) => void;
}

/**
 * GoldenThreadNextSteps - "Ops Console" style next actions
 * Not button spam - feels like choosing your next move
 */
export function GoldenThreadNextSteps({ 
  onToolSelect,
  onSectionView,
}: GoldenThreadNextStepsProps) {
  return (
    <SectionFrame
      id="golden-thread"
      eyebrow="What To Do Next"
      title={
        <>
          Choose Your <span className="text-primary">Next Move</span>
        </>
      }
      subtitle="This page does not end in inspiration. It ends in momentum."
      onInView={onSectionView}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-4">
          {nextStepTools.map((tool) => (
            <Card 
              key={tool.id}
              className={cn(
                'group cursor-pointer overflow-hidden',
                'transition-all duration-300',
                'hover:border-primary/50 hover:shadow-md',
                'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'
              )}
              onClick={() => onToolSelect(tool)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToolSelect(tool);
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    'bg-primary/10 text-primary',
                    'transition-all duration-300',
                    'group-hover:bg-primary group-hover:text-primary-foreground'
                  )}>
                    <tool.icon className="w-6 h-6" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className={cn(
                    'flex-shrink-0 opacity-0 -translate-x-2',
                    'transition-all duration-300',
                    'group-hover:opacity-100 group-hover:translate-x-0'
                  )}>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

export type { NextStepTool };
