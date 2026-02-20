import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { FindingCard, type Finding } from "./FindingCard";

interface EvidenceModuleProps {
  title: string;
  subtitle?: string;
  findings: Finding[];
  columns?: 2 | 3;
}

export function EvidenceModule({ title, subtitle, findings, columns = 2 }: EvidenceModuleProps) {
  const gridCols = columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <section className="py-16 md:py-24 bg-[hsl(var(--surface-2))]">
      <div className="container px-4">
        <AnimateOnScroll duration={500}>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
            {subtitle && <p className="mt-3 text-muted-foreground text-base md:text-lg">{subtitle}</p>}
          </div>
        </AnimateOnScroll>

        <div className={`grid gap-6 ${gridCols} max-w-4xl mx-auto`}>
          {findings.map((f, i) => (
            <AnimateOnScroll key={i} delay={i * 120} duration={600}>
              <FindingCard {...f} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
