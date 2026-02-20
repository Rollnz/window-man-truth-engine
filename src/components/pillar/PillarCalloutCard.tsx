import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { AlertTriangle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface PillarCalloutCardProps {
  text: string;
  icon?: LucideIcon;
}

export function PillarCalloutCard({ text, icon: Icon = AlertTriangle }: PillarCalloutCardProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="container px-4">
        <AnimateOnScroll duration={700}>
          <div className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20 p-8 md:p-10 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <blockquote className="text-lg md:text-xl font-semibold text-foreground leading-relaxed italic">
                "{text}"
              </blockquote>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
