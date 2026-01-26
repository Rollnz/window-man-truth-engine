/**
 * PillarBreadcrumb - Upward Linking Component
 * 
 * Implements the "Linking Law" from the SEO PRD:
 * - Tools link UP to their parent pillar
 * - Shows a subtle badge/breadcrumb connecting this tool to its authority pillar
 * - Dossier variant for dark pages like /beat-your-quote
 */

import { Link } from 'react-router-dom';
import { ChevronRight, BookOpen } from 'lucide-react';
import { getParentPillar } from '@/config/pillarMapping';
import { cn } from '@/lib/utils';
interface PillarBreadcrumbProps {
  toolPath: string;
  variant?: 'badge' | 'inline' | 'minimal' | 'dossier';
  className?: string;
}
export function PillarBreadcrumb({
  toolPath,
  variant = 'badge',
  className
}: PillarBreadcrumbProps) {
  const parentPillar = getParentPillar(toolPath);
  if (!parentPillar) {
    return null;
  }

  // Dossier variant - white text for dark backgrounds
  if (variant === 'dossier') {
    return <Link to={parentPillar.url} className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full", "bg-white/10 border border-white/20 hover:border-white/40", "text-xs font-medium text-white/90 hover:text-white", "transition-all duration-200", className)}>
        <BookOpen className="w-3.5 h-3.5" />
        <span>Part of {parentPillar.shortTitle}</span>
        <ChevronRight className="w-3 h-3" />
      </Link>;
  }
  if (variant === 'minimal') {
    return <Link to={parentPillar.url} className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors", className)}>
        <span>Part of</span>
        <span className="text-primary font-medium">{parentPillar.shortTitle}</span>
        <ChevronRight className="w-3 h-3" />
      </Link>;
  }
  if (variant === 'inline') {
    return <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        <Link to={parentPillar.url} className="text-muted-foreground hover:text-foreground transition-colors">
          {parentPillar.shortTitle}
        </Link>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        <span className="text-foreground font-medium">Current Tool</span>
      </div>;
  }

  // Default badge variant
  return <Link to={parentPillar.url} className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3E8FDA] text-xs font-medium transition-all duration-200 bg-[#3E8FDA] text-white hover:bg-[#3E8FDA]/90", className)}>
      <BookOpen className="w-3.5 h-3.5" />
      <span>Part of {parentPillar.shortTitle}</span>
      <ChevronRight className="w-3 h-3" />
    </Link>;
}