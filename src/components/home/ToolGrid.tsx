import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { ImpactWindowCard } from '@/components/ui/ImpactWindowCard';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { HOMEPAGE_TOOLS, getDifficultyConfig, type ToolDefinition } from '@/config/toolRegistry';

function DifficultyBadge({ difficulty }: { difficulty?: 'easy' | 'medium' | 'advanced' }) {
  if (!difficulty) return null;
  const config = getDifficultyConfig(difficulty);
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function ToolCard({
  tool,
  index
}: {
  tool: ToolDefinition;
  index: number;
}) {
  const Icon = tool.icon;
  
  return (
    <AnimateOnScroll delay={index * 80}>
      <ImpactWindowCard className="h-full">
        <Link 
          to={tool.path} 
          className="group relative flex flex-col h-full p-6"
        >
          {/* Top badges row */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            {tool.badge && (
              <div className="text-xs px-2 py-1 rounded font-medium text-primary bg-white/90 border border-primary/30">
                {tool.badge}
              </div>
            )}
            {tool.gated && (
              <div className="text-xs px-2 py-1 rounded text-white/70 bg-black/30">
                Email to save
              </div>
            )}
          </div>

          {/* Icon with themed background */}
          <div className={`w-12 h-12 rounded-lg ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
            <Icon className={`w-6 h-6 ${tool.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.6)]">
            {tool.title}
          </h3>

          {/* Metadata row: time + difficulty */}
          {(tool.estimatedTime || tool.difficulty) && (
            <div className="flex items-center gap-3 mb-3">
              {tool.estimatedTime && (
                <span className="flex items-center gap-1 text-[11px] text-white/70">
                  <Clock className="w-3 h-3" />
                  {tool.estimatedTime}
                </span>
              )}
              <DifficultyBadge difficulty={tool.difficulty} />
            </div>
          )}

          {/* Description */}
          <p className="text-sm mb-4 flex-grow text-white/80">
            {tool.description}
          </p>

          {/* CTA */}
          <div className="flex items-center text-sm text-primary font-medium">
            <span>{tool.cta}</span>
            <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </div>
        </Link>
      </ImpactWindowCard>
    </AnimateOnScroll>
  );
}

export function ToolGrid() {
  return (
    <section className="py-20 md:py-32 relative bg-secondary/30">
      <div className="container px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            12 Tools to <span className="text-primary">Discover the Truth</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore our interactive tools designed to help you make an informed decision. 
            No pressure, no sales calls unless you ask.
          </p>
        </div>

        {/* Control message */}
        <div className="text-center text-sm mb-12">
          <span className="inline-flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border-2 border-border bg-background/50 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.3)]">
            <span className="text-foreground font-bold">✓ You're in control</span>
            <span className="text-foreground font-semibold">Explore any tool in any order</span>
          </span>
        </div>

        {/* Tools grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOMEPAGE_TOOLS.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
