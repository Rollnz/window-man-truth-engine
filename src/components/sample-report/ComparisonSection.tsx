import { Eye, Scan, AlertTriangle, AlertCircle } from 'lucide-react';
import { useSectionTracking } from '@/hooks/useSectionTracking';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';

interface RiskFlag {
  text: string;
  severity: 'high' | 'medium';
}
const riskFlags: RiskFlag[] = [{
  text: 'Missing Design Pressure confirmation',
  severity: 'high'
}, {
  text: 'Scope gaps: permits, debris, repairs',
  severity: 'high'
}, {
  text: '"Equivalent materials" clause',
  severity: 'medium'
}, {
  text: 'Labor warranty unclear',
  severity: 'medium'
}];

const placeholderWidths = [45, 62, 55, 48, 70, 52];

function SeverityTag({ severity }: { severity: 'high' | 'medium' }) {
  const isHigh = severity === 'high';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${isHigh ? 'bg-[hsl(var(--secondary)/0.2)] text-[hsl(var(--secondary))]' : 'bg-amber-500/20 text-amber-500'}`}>
      {isHigh ? 'High Risk' : 'Medium Risk'}
    </span>;
}

export function ComparisonSection() {
  const sectionRef = useSectionTracking('comparison');
  return <section ref={sectionRef} className="py-16 md:py-24 bg-[hsl(var(--surface-1))]">
      <div className="container px-4">
        <AnimateOnScroll duration={600}>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              A Quote Can Look Legit
              <span className="block text-[hsl(var(--secondary))]">and Still Leave You Exposed</span>
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <AnimateOnScroll direction="left" duration={700}>
            <div className="relative group h-full">
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 h-full">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50 bg-muted/30">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Human View</span>
                </div>
                <div className="p-6">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 p-4 blur-[2px]">
                      <div className="space-y-3">
                        <div className="h-6 w-3/4 bg-muted/60 rounded" />
                        <div className="h-4 w-1/2 bg-muted/40 rounded" />
                        <div className="h-px w-full bg-border/50 my-4" />
                        {placeholderWidths.map((width, i) => <div key={i} className="flex justify-between items-center">
                            <div className="h-3 bg-muted/40 rounded" style={{ width: `${width}%` }} />
                            <div className="h-3 w-16 bg-muted/40 rounded" />
                          </div>)}
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <span className="px-4 py-2 bg-card/90 backdrop-blur border border-border/50 rounded-lg text-sm text-muted-foreground">
                        Itemized. Professional. Easy to sign.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll direction="right" duration={700} delay={150}>
            <div className="relative group h-full">
              <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 h-full">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-primary/20 bg-primary/5">
                  <Scan className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">AI View — What Gets Flagged</span>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {riskFlags.map(flag => <div key={flag.text} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        {flag.severity === 'high' ? <AlertTriangle className="w-5 h-5 text-[hsl(var(--secondary))] shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{flag.text}</p>
                          <div className="mt-1"><SeverityTag severity={flag.severity} /></div>
                        </div>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Sample shown for demonstration. Your audit is custom tailored using your details. Additionally you can save and view it in your personal vault. Then compare it with other contracts.  🔐                                                                                                                                                                    
        </p>
      </div>
    </section>;
}
