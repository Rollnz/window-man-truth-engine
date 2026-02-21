import { useState } from 'react';
import { AlertCircle, Shield, FileX, Calculator, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';

interface FailurePointProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
  patternClass?: string;
}

function FailurePoint({ number, title, description, icon, isOpen, onClick, patternClass }: FailurePointProps) {
  return (
    <div
      className={cn(
        "glow-border-secondary overflow-hidden transition-all duration-300",
        patternClass,
        isOpen ? "bg-card shadow-lg" : "bg-card/50 hover:bg-card/80"
      )}>

      <button onClick={onClick} className="w-full p-6 flex items-center gap-4 text-left relative z-10">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
          isOpen ? "bg-[hsl(var(--secondary))] text-white" : "bg-[hsl(var(--secondary)/0.1)] text-[hsl(var(--secondary))]"
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[hsl(var(--secondary))]">#{number}</span>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <div className={cn("overflow-hidden transition-all duration-300 relative z-10", isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
        <div className="px-6 pb-6 pl-[88px]">
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>);

}

export function FailurePointsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const failurePoints = [
  {
    title: 'The "Wear and Tear" Trap',
    description: 'Insurers often deny claims by classifying damage as pre-existing — even after a major storm.',
    icon: <AlertCircle className="w-6 h-6" />,
    patternClass: 'pattern-diagonal'
  },
  {
    title: 'Code-Compliance Gaps',
    description: "If windows aren't installed to the exact Design Pressure (DP) requirements for your zip code, claims can be denied regardless of product quality.",
    icon: <Shield className="w-6 h-6" />,
    patternClass: 'pattern-grid'
  },
  {
    title: 'Documentation Failures',
    description: 'Missing approvals, specs, or proof-of-loss paperwork can invalidate coverage — even if the work was completed.',
    icon: <FileX className="w-6 h-6" />,
    patternClass: 'pattern-lines'
  },
  {
    title: 'The Deductible Blind Spot',
    description: "Many homeowners don't realize they carry a 2–5% hurricane deductible. Combined with overpaying on a quote, they may never reach a payout threshold.",
    icon: <Calculator className="w-6 h-6" />,
    patternClass: 'pattern-steps'
  }];


  return (
    <section className="py-20 md:py-32 relative bg-gradient-to-b from-[hsl(34,34%,96.8%)] to-[hsl(210,26%,96.1%)] overflow-hidden isolate pattern-crosshatch">
      {/* Ambient mesh blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[radial-gradient(circle,hsl(var(--secondary)/0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Most Homeowners Don't Get Burned by Bad Decisions.
            <span className="block mt-2 text-[hsl(var(--secondary))]">They Get Burned by Technicalities.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            The window industry doesn't fail homeowners emotionally. It fails them <em>technically</em>.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto mb-12">
          <p className="text-lg text-muted-foreground leading-relaxed text-center">
            Most homeowners approach window upgrades responsibly. They compare quotes. They ask questions. They choose "impact-rated" products. They trust licensed contractors.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed text-center mt-4">
            And still — many lose coverage, fail inspections, or discover gaps only when it's too late.
          </p>
          <p className="text-xl text-foreground font-semibold text-center mt-6">
            That's because the system doesn't reward effort or intent. It rewards <span className="text-primary">precision</span>.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto mb-16">
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">The Four Failure Points</h3>
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {failurePoints.map((point, index) => {
              // Desktop 2x2 grid: alternating left/right reveals
              // Top row: index 0 (left), index 1 (right)
              // Bottom row: index 2 (left), index 3 (right)
              const direction = index % 2 === 0 ? 'left' : 'right';
              // Desktop: 100ms stagger, Mobile: 50ms stagger
              const staggerDelay = typeof window !== 'undefined' && window.innerWidth >= 768 ?
              index * 100 :
              index * 50;

              return (
                <AnimateOnScroll
                  key={index}
                  delay={staggerDelay}
                  threshold={0.3}
                  direction={direction}
                  desktopDirectionOnly={true}>

                  <FailurePoint
                    number={index + 1}
                    title={point.title}
                    description={point.description}
                    icon={point.icon}
                    isOpen={openIndex === index}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    patternClass={point.patternClass} />

                </AnimateOnScroll>);

            })}
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-[hsl(var(--secondary)/0.1)] via-transparent to-[hsl(var(--secondary)/0.1)] border border-[hsl(var(--secondary)/0.2)]">
            <p className="text-lg mb-4 text-gray-900">When something goes wrong, insurers don't ask whether you tried your best.</p>
            <p className="text-xl font-semibold text-secondary-foreground">They ask whether everything was done <em>exactly right</em>.</p>
            <p className="text-lg text-muted-foreground mt-4">And most window quotes don't give homeowners the information needed to know the difference.</p>
          </div>
        </div>
      </div>
    </section>);

}