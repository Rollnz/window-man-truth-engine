import { Link } from 'react-router-dom';
import { FolderOpen, ExternalLink, FileCheck } from 'lucide-react';
import { getCaseStudyByEvidenceId } from '@/data/evidenceData';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EvidenceCitationProps {
  /** Evidence ID in format E-### */
  evidenceId: string;
  /** Optional override for displayed title */
  title?: string;
  /** Display variant */
  variant?: 'inline' | 'block';
  /** Additional CSS classes */
  className?: string;
}

/**
 * EvidenceCitation Component
 * 
 * Displays a citable reference to a verified case study from the Evidence Locker.
 * Used to establish authority and trust through verifiable claims.
 * 
 * - inline: Small badge for embedding in text
 * - block: Full citation card with source details
 */
export function EvidenceCitation({
  evidenceId,
  title,
  variant = 'inline',
  className,
}: EvidenceCitationProps) {
  const caseStudy = getCaseStudyByEvidenceId(evidenceId);
  
  if (!caseStudy) {
    console.warn(`EvidenceCitation: No case study found for evidenceId "${evidenceId}"`);
    return null;
  }

  const displayTitle = title || caseStudy.missionObjective;
  const deepLink = `/evidence?highlight=${evidenceId}`;

  if (variant === 'inline') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={deepLink}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                "text-xs font-medium",
                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                "border border-amber-500/20",
                "hover:bg-amber-500/20 hover:border-amber-500/40",
                "transition-colors cursor-pointer",
                className
              )}
            >
              <FileCheck className="w-3 h-3" />
              <span>{evidenceId}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">{displayTitle}</p>
              <p className="text-xs text-muted-foreground">{caseStudy.source}</p>
              <p className="text-xs text-muted-foreground">{caseStudy.jurisdiction}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Block variant - full citation card
  return (
    <Link
      to={deepLink}
      className={cn(
        "block p-4 rounded-lg",
        "bg-gradient-to-br from-amber-500/5 to-amber-700/5",
        "border border-amber-500/20",
        "hover:border-amber-500/40 hover:from-amber-500/10 hover:to-amber-700/10",
        "transition-all group",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {evidenceId}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{caseStudy.datePublished}</span>
          </div>
          <p className="font-semibold text-sm text-foreground mb-1 truncate">
            {displayTitle}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            Source: {caseStudy.source}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            Jurisdiction: {caseStudy.jurisdiction}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}

export default EvidenceCitation;
