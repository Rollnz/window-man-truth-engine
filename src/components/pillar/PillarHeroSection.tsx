import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface HeroCTA {
  label: string;
  to: string;
  icon: LucideIcon;
  variant?: "default" | "cta" | "outline" | "secondary-action";
}

interface PillarHeroSectionProps {
  icon: LucideIcon;
  badgeText?: string;
  title: string;
  description: string;
  ctas: HeroCTA[];
}

export function PillarHeroSection({
  icon: Icon,
  badgeText = "Truth Pillar",
  title,
  description,
  ctas,
}: PillarHeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className="max-w-4xl space-y-8">
          <AnimateOnScroll duration={500}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                {badgeText}
              </span>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll duration={600} delay={100}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
          </AnimateOnScroll>

          <AnimateOnScroll duration={600} delay={200}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll duration={600} delay={300}>
            <div className="flex flex-wrap gap-4 pt-2">
              {ctas.map((cta, i) => {
                const CtaIcon = cta.icon;
                return (
                  <Button
                    key={i}
                    asChild
                    variant={cta.variant || (i === 0 ? "cta" : "secondary-action")}
                    size="lg"
                    className="rounded-lg"
                  >
                    <Link to={cta.to}>
                      <CtaIcon className="mr-2 h-4 w-4" />
                      {cta.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
