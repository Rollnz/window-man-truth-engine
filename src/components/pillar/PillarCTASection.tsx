import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface PillarCTASectionProps {
  heading: string;
  description: string;
  buttonLabel: string;
  buttonIcon: LucideIcon;
  to: string;
  microcopy?: string;
}

export function PillarCTASection({
  heading,
  description,
  buttonLabel,
  buttonIcon: Icon,
  to,
  microcopy,
}: PillarCTASectionProps) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[hsl(var(--surface-1))] border-t border-border/30">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-secondary/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />

      <div className="container px-4 relative z-10">
        <AnimateOnScroll duration={700}>
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              {heading}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
            <Button asChild variant="cta" size="lg" className="rounded-lg text-base px-10 h-12">
              <Link to={to}>
                <Icon className="mr-2 h-5 w-5" />
                {buttonLabel}
              </Link>
            </Button>
            {microcopy && (
              <p className="text-xs text-muted-foreground">{microcopy}</p>
            )}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
