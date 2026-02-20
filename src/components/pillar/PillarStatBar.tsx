import { LucideIcon } from "lucide-react";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface Stat {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface PillarStatBarProps {
  stats: Stat[];
}

export function PillarStatBar({ stats }: PillarStatBarProps) {
  return (
    <section className="py-12 md:py-16 bg-card/50 border-y border-border/50">
      <div className="container px-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <AnimateOnScroll key={index} delay={index * 120} duration={600}>
                <div className="relative rounded-2xl bg-card border border-border/50 p-6 shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-b-full bg-primary" />
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
