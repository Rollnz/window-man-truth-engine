import { Link } from "react-router-dom";
import { type LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

const CTA_SHADOW = '0 12px 32px -8px rgba(255,198,114,0.50), 0 24px 56px -16px rgba(255,198,114,0.30)';

interface MidPageCTAProps {
  heading: string;
  description: string;
  buttonLabel: string;
  buttonIcon: LucideIcon;
  to: string;
  microcopy?: string;
}

export function MidPageCTA({ heading, description, buttonLabel, buttonIcon: Icon, to, microcopy }: MidPageCTAProps) {
  return (
    <section className="py-12 md:py-16 bg-card/90 backdrop-blur-sm border-y border-border/20">
      <AnimateOnScroll duration={700}>
        <div
          className="container px-4 max-w-3xl mx-auto text-center rounded-2xl bg-card p-8 md:p-10 border border-border/20"
          style={{ boxShadow: CTA_SHADOW }}
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mb-3">{heading}</h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-xl mx-auto">{description}</p>

          <Button asChild size="lg" className="group transition-all duration-300 hover:-translate-y-0.5">
            <Link to={to}>
              <Icon className="mr-2 h-4 w-4" />
              {buttonLabel}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          {microcopy && (
            <p className="mt-4 text-xs text-muted-foreground">{microcopy}</p>
          )}
        </div>
      </AnimateOnScroll>
    </section>
  );
}
