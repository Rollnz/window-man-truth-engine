import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface ContentSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface PillarContentBlockProps {
  sections: ContentSection[];
}

export function PillarContentBlock({ sections }: PillarContentBlockProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto space-y-16">
          {sections.map((section, index) => (
            <AnimateOnScroll key={index} delay={index * 100} duration={700}>
              <div className="relative pl-6 border-l-2 border-primary/30">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-6">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((p, pi) => (
                    <p key={pi} className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <div className="mt-6 rounded-xl bg-card/50 border border-border/50 p-6 shadow-sm">
                    <ul className="space-y-3">
                      {section.bullets.map((bullet, bi) => (
                        <li key={bi} className="flex items-start gap-3 text-muted-foreground">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span dangerouslySetInnerHTML={{ __html: bullet }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
