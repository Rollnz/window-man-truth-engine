import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface SystemReframeProps {
  id?: string;
  onUploadClick: () => void;
}

/**
 * SystemReframe - Section 3
 * Reframes the scanner as a cross-examination system, not a tool demo.
 * This is where the scanner CTA is "earned" after building tension.
 */
export function SystemReframe({ id, onUploadClick }: SystemReframeProps) {
  const capabilities = [
    'Flags unexplained price jumps and vague line items',
    'Identifies missing or downgraded protection components',
    "Compares what's promised vs what's actually specified",
    'Grades risk exposure, not aesthetics or brand names',
  ];

  return (
    <section id={id} className="py-16 md:py-24 bg-secondary/30 scroll-mt-20">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 leading-tight">
            This Is Not a Quote Scanner
            <br />
            <span className="text-primary">It's a Cross-Examination</span>
          </h2>

          {/* Subheader / Explanation */}
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            Instead of telling you whether a quote "looks good," this system interrogates 
            what's missing, what's downgraded, and where risk is quietly transferred to you.
          </p>

          {/* Capability Bullets */}
          <ul className="space-y-4 mb-10">
            {capabilities.map((item, index) => (
              <li 
                key={index} 
                className="flex items-start gap-3 text-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          {/* Explicit Clarifier */}
          <p className="text-sm text-muted-foreground/70 mb-8 italic">
            This system does not recommend contractors. It evaluates estimates.
          </p>

          {/* CTA - Earned, Not Pushy */}
          <Button 
            size="lg" 
            className="group"
            onClick={onUploadClick}
          >
            Upload Your Quote for Interrogation
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
