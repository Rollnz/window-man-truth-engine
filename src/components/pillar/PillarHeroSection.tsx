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

interface HeroImage {
  src: string;
  alt: string;
}

interface PillarHeroSectionProps {
  icon: LucideIcon;
  badgeText?: string;
  title: string;
  description: string;
  ctas: HeroCTA[];
  heroImage?: HeroImage;
}

export function PillarHeroSection({
  icon: Icon,
  badgeText = "Truth Pillar",
  title,
  description,
  ctas,
  heroImage,
}: PillarHeroSectionProps) {
  const hasImage = !!heroImage;

  return (
    <section className="relative overflow-hidden py-20 md:py-28 bg-[hsl(var(--surface-1))] border-b border-border/30">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 relative z-10">
        <div className={hasImage ? "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" : ""}>
          <div className="max-w-4xl space-y-8">
            <AnimateOnScroll duration={500}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-border/20 backdrop-blur-sm">
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

          {hasImage && (
            <AnimateOnScroll duration={700} delay={200} direction="right">
              <div className="flex justify-center lg:justify-end">
                <img
                  src={heroImage.src}
                  alt={heroImage.alt}
                  width={480}
                  height={480}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] h-auto drop-shadow-xl"
                />
              </div>
            </AnimateOnScroll>
          )}
        </div>
      </div>
    </section>
  );
}