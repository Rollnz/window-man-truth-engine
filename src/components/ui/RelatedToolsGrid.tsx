import { Link } from 'react-router-dom';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImpactWindowCard } from '@/components/ui/ImpactWindowCard';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ToolDefinition } from '@/config/toolRegistry';

/**
 * ToolConfig - accepts either a full ToolDefinition or a minimal config
 */
export interface ToolConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  cta?: string;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
}

interface RelatedToolsGridProps {
  /** Section heading */
  title: string;
  /** Section subheading */
  description?: string;
  /** Array of tool configurations */
  tools: (ToolConfig | ToolDefinition)[];
  /** Grid columns: 2, 3, or 4 */
  columns?: 2 | 3 | 4;
  /** Stagger delay between card animations (ms) */
  staggerDelay?: number;
  /** Optional click handler (overrides default navigation) */
  onToolClick?: (tool: ToolConfig) => void;
  /** Additional container className */
  className?: string;
  /** Section background variant */
  variant?: 'default' | 'muted' | 'dossier';
}

const columnClasses = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

const variantClasses = {
  default: '',
  muted: 'bg-muted/30 border-t border-border',
  dossier: 'bg-dossier-page',
};

/**
 * RelatedToolsGrid
 * A reusable grid of tool cards using the ImpactWindowCard design pattern.
 * Each card has a scroll-triggered entrance animation with staggered delays.
 */
export function RelatedToolsGrid({
  title,
  description,
  tools,
  columns = 3,
  staggerDelay = 100,
  onToolClick,
  className,
  variant = 'default',
}: RelatedToolsGridProps) {
  // Don't render header section if title is empty
  const showHeader = title.length > 0;

  return (
    <TooltipProvider>
      <section className={cn('py-12', variantClasses[variant], className)}>
      <div className="container px-4 mx-auto">
        {/* Header */}
        {showHeader && (
          <div className="text-center mb-8">
            <h2 className={cn(
              'text-xl md:text-2xl font-bold mb-2',
              variant === 'dossier' ? 'text-white' : 'text-foreground'
            )}>
              {title}
            </h2>
            {description && (
              <p className={cn(
                'max-w-2xl mx-auto',
                variant === 'dossier' ? 'text-white/70' : 'text-muted-foreground'
              )}>
                {description}
              </p>
            )}
          </div>
        )}

        {/* Tool Cards Grid */}
        <div className={cn(
          'grid grid-cols-1 gap-4 max-w-5xl mx-auto',
          columnClasses[columns]
        )}>
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            const iconColor = tool.iconColor || 'text-primary';
            const bgColor = tool.bgColor || 'bg-primary/20';
            const borderColor = tool.borderColor || 'border-primary/40';
            const ctaText = tool.cta || 'Use Tool';
            // Get tooltip from ToolDefinition if available
            const tooltipText = 'tooltip' in tool ? tool.tooltip : undefined;

            const cardContent = (
              <ImpactWindowCard className="h-full">
                <div className="p-5 flex flex-col h-full">
                  {/* Icon Badge */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                    bgColor,
                    'border',
                    borderColor
                  )}>
                    <Icon className={cn('w-6 h-6', iconColor)} />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold mb-1 text-white drop-shadow-md">
                    {tool.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/80 mb-4 flex-grow">
                    {tool.description}
                  </p>

                  {/* CTA Button */}
                  {onToolClick ? (
                    <Button
                      variant="cta"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => onToolClick(tool)}
                    >
                      <span>{ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Link to={tool.path}>
                      <Button variant="cta" size="sm" className="w-full justify-between">
                        <span>{ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </ImpactWindowCard>
            );

            return (
              <AnimateOnScroll key={tool.id} delay={index * staggerDelay}>
                {tooltipText ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      {cardContent}
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="max-w-xs bg-slate-900 text-white border-slate-700 px-4 py-3 text-sm leading-relaxed shadow-xl"
                    >
                      {tooltipText}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  cardContent
                )}
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
      </section>
    </TooltipProvider>
  );
}
