import { Upload, Scan, FileCheck, Shield } from 'lucide-react';
import { useSectionTracking } from '@/hooks/useSectionTracking';

interface Step { number: number; title: string; description: string; icon: typeof Upload; }

const steps: Step[] = [
  { number: 1, title: 'Upload your estimate', description: 'PDF, photo, or screenshot of your window quote. Takes 60 seconds.', icon: Upload },
  { number: 2, title: 'AI checks everything', description: 'We analyze specs, scope, code compliance, and contract terms automatically.', icon: Scan },
  { number: 3, title: 'You receive a score + action plan', description: 'A complete breakdown with specific questions to ask and risks to address.', icon: FileCheck },
];

export function HowItWorksSection() {
  const sectionRef = useSectionTracking('how_it_works');

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12"><h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">How the Audit Works</h2><p className="text-lg text-muted-foreground">Three simple steps to protect yourself before signing anything.</p></div>

        <div className="max-w-4xl mx-auto">
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute top-12 left-[calc(16.67%-12px)] right-[calc(16.67%-12px)] h-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary" />
              <div className="grid grid-cols-3 gap-8">
                {steps.map((step) => { const Icon = step.icon; return (
                  <div key={step.number} className="flex flex-col items-center text-center">
                    <div className="relative z-10 w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-6"><Icon className="w-10 h-10 text-primary" /><div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="text-sm font-bold text-primary-foreground">{step.number}</span></div></div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3><p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ); })}
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <div className="relative pl-8">
              <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary" />
              <div className="space-y-8">
                {steps.map((step) => { const Icon = step.icon; return (
                  <div key={step.number} className="relative flex gap-4">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-primary flex items-center justify-center"><span className="text-xs font-bold text-primary-foreground">{step.number}</span></div>
                    <div className="flex-1 bg-card border border-border/50 rounded-xl p-4"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div><h3 className="font-semibold text-foreground">{step.title}</h3></div><p className="text-sm text-muted-foreground">{step.description}</p></div>
                  </div>
                ); })}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-start gap-3"><Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" /><div><h4 className="font-semibold text-foreground text-sm mb-1">Your Privacy Matters</h4><p className="text-sm text-muted-foreground">Window Man may share project specs only with vetted partners if <span className="font-medium text-foreground">you request it</span>. Your personal contact details are never shared without permission.</p></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
