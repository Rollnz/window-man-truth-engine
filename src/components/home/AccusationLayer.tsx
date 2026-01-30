/**
 * AccusationLayer - Section 2
 * Creates tension by exposing how quotes are structured to mislead.
 * Tone: Factual, uncomfortable, non-hyperbolic
 */
export function AccusationLayer() {
  const accusations = [
    'Line items that hide downgraded glass or reinforcement packages',
    'Structural and permitting requirements quietly excluded',
    '"Apples to apples" comparisons made impossible by design',
    'Compliance language used to signal authority — not ensure protection',
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
            Most Impact Window Quotes Are Technically Legal — and Still Misleading
          </h2>

          {/* Supporting Copy */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Homeowners don't lose money because they ignore their estimates.
            They lose money because estimates are structured to conceal risk, 
            obscure comparisons, and quietly downgrade protection.
          </p>

          {/* Bullet List */}
          <ul className="space-y-4 mb-10">
            {accusations.map((item, index) => (
              <li 
                key={index} 
                className="flex items-start gap-3 text-muted-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-2.5 flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          {/* Closing Line - Emphasized */}
          <div className="border-l-2 border-primary/30 pl-6">
            <p className="text-foreground font-medium leading-relaxed">
              The problem isn't that homeowners don't read quotes.
              <br />
              <span className="text-primary">It's that quotes aren't written to be read.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
