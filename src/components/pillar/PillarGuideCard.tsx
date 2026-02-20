import { Link } from "react-router-dom";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface Guide {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  linkLabel?: string;
}

interface PillarGuideCardsProps {
  heading?: string;
  guides: Guide[];
}

export function PillarGuideCards({ heading = "Related Guides", guides }: PillarGuideCardsProps) {
  return (
    <section className="py-16 md:py-24 bg-card/30">
      <div className="container px-4">
        <AnimateOnScroll duration={600}>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-10 max-w-4xl mx-auto">
            {heading}
          </h2>
        </AnimateOnScroll>
        <div className={`grid gap-6 max-w-4xl mx-auto ${guides.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {guides.map((guide, index) => {
            const Icon = guide.icon;
            return (
              <AnimateOnScroll key={index} delay={index * 120} duration={700}>
                <div className="group relative rounded-2xl bg-card border border-border/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                  {/* Colored top accent */}
                  <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
                  <div className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {guide.description}
                    </p>
                    <Button asChild variant="outline" className="w-full rounded-lg">
                      <Link to={guide.to}>
                        {guide.linkLabel || "Read Guide"}{" "}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
