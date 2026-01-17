import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getParentPillar } from '@/config/pillarMapping';
import { TOOL_REGISTRY } from '@/config/toolRegistry';
import { EvidenceCitation } from './EvidenceCitation';
import { cn } from '@/lib/utils';

// Evidence mapping for each tool (links tool path to most relevant case study)
const EVIDENCE_MAP: Record<string, string> = {
  '/reality-check': 'E-492',
  '/cost-calculator': 'E-445',
  '/comparison': 'E-387',
  '/risk-diagnostic': 'E-512',
  '/vulnerability-test': 'E-541',
  '/ai-scanner': 'E-387',
  '/beat-your-quote': 'E-541',
  '/fair-price-quiz': 'E-492',
  '/roleplay': 'E-387',
};

// Custom CTA text for next step (overrides default tool CTA)
const NEXT_STEP_CTA: Record<string, string> = {
  '/reality-check': 'See exactly how much you\'re losing',
  '/cost-calculator': 'Compare budget vs premium windows',
  '/comparison': 'Scan your quote for hidden fees',
  '/risk-diagnostic': 'Get your claim documentation ready',
  '/vulnerability-test': 'Get your full protection score',
  '/ai-scanner': 'Get a better quote from our network',
  '/beat-your-quote': 'Chat with our AI window expert',
  '/fair-price-quiz': 'Scan your actual quote document',
  '/roleplay': 'Ready to analyze a real quote?',
};

interface NextStepCardProps {
  /** Current tool path to determine parent pillar and next tools */
  currentToolPath: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show evidence citation (default: true) */
  showEvidence?: boolean;
}

/**
 * NextStepCard Component
 * 
 * Prevents traffic leaks by providing a clear forward path after tool completion.
 * Shows:
 * 1. Primary CTA to next logical tool (based on toolRegistry.nextLogicTools)
 * 2. Upward link to parent pillar (semantic hierarchy)
 * 3. Evidence citation for trust signal (optional)
 */
export function NextStepCard({
  currentToolPath,
  className,
  showEvidence = true,
}: NextStepCardProps) {
  const parentPillar = getParentPillar(currentToolPath);
  
  // Find current tool in registry to get nextLogicTools
  const currentToolId = Object.keys(TOOL_REGISTRY).find(
    id => TOOL_REGISTRY[id].path === currentToolPath
  );
  const currentTool = currentToolId ? TOOL_REGISTRY[currentToolId] : null;
  
  // Get the first next logic tool
  const nextToolId = currentTool?.nextLogicTools?.[0];
  const nextTool = nextToolId ? TOOL_REGISTRY[nextToolId] : null;
  
  // Get evidence ID for this tool
  const evidenceId = EVIDENCE_MAP[currentToolPath];
  
  // If no parent pillar found, don't render
  if (!parentPillar) return null;
  
  const customCTA = NEXT_STEP_CTA[currentToolPath];
  const NextToolIcon = nextTool?.icon;

  return (
    <Card className={cn(
      "bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20",
      className
    )}>
      <CardContent className="p-6 space-y-4">
        {/* Section Header */}
        <div className="text-center">
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
            What's Next
          </p>
          <h3 className="text-lg font-bold text-foreground">
            Continue Your Window Truth Journey
          </h3>
        </div>

        {/* Next Logical Tool CTA */}
        {nextTool && (
          <Link to={nextTool.path} className="block">
            <Button 
              size="lg" 
              className="w-full glow hover:glow-lg transition-all group"
            >
              {NextToolIcon && <NextToolIcon className="w-5 h-5 mr-2" />}
              {customCTA || nextTool.cta}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}

        {/* Upward Pillar Link */}
        <Link 
          to={parentPillar.url}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Read the full guide: {parentPillar.shortTitle}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>

        {/* Evidence Citation */}
        {showEvidence && evidenceId && (
          <div className="flex justify-center pt-2">
            <EvidenceCitation 
              evidenceId={evidenceId} 
              variant="inline"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NextStepCard;
