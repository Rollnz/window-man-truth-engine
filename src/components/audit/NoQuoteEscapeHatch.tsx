import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Calculator, 
  FileQuestion,
  ArrowRight,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { AUDIT_CONFIG } from '@/config/auditConfig';

interface NoQuoteEscapeHatchProps {
  onViewSampleClick?: () => void;
}

const ALTERNATIVES = [
  {
    icon: FileText,
    title: AUDIT_CONFIG.noQuote.sampleCardTitle,
    description: AUDIT_CONFIG.noQuote.sampleCardDescription,
    cta: AUDIT_CONFIG.noQuote.sampleCardCta,
    action: 'modal' as const,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-400',
  },
  {
    icon: Calculator,
    title: 'Get an Instant Estimate',
    description: 'No contractor needed. Our AI calculates what you should pay based on your home specs.',
    cta: 'Calculate My Price',
    href: '/cost-calculator',
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-400',
  },
  {
    icon: MessageSquare,
    title: 'Talk to Our AI Expert',
    description: 'Have questions before getting quotes? Our AI window expert knows everything.',
    cta: 'Start Chat',
    href: '/expert',
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-400',
  },
  {
    icon: Phone,
    title: 'Request a Real Quote',
    description: 'Skip the sketchy contractors. Get a transparent quote from our verified network.',
    cta: 'Get a Quote',
    href: '/consultation',
    color: 'amber',
    gradient: 'from-amber-500 to-amber-400',
  },
];

export function NoQuoteEscapeHatch({ onViewSampleClick }: NoQuoteEscapeHatchProps) {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-slate-950 to-slate-900 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container relative px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge 
            variant="outline" 
            className="mb-6 px-4 py-2 bg-slate-800/50 border-slate-700 text-slate-300"
          >
            <FileQuestion className="w-4 h-4 mr-2" />
            Don't Have a Quote Yet?
          </Badge>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            No Quote?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              No Problem.
            </span>
          </h2>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            You're smart to do research first. Here's how to arm yourself 
            <em className="text-slate-300"> before </em> 
            the contractors show up.
          </p>
        </div>

        {/* Alternative Paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {ALTERNATIVES.map((alt, index) => (
            <Card 
              key={alt.title}
              className={cn(
                "relative bg-slate-900/80 border-slate-800 p-6 backdrop-blur-sm transition-all duration-300",
                "hover:border-slate-700 hover:shadow-lg group overflow-hidden"
              )}
            >
              {/* Hover glow effect */}
              <div 
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  `bg-gradient-to-br ${alt.gradient}/5`
                )}
              />

              <div className="relative">
                {/* Icon */}
                <div 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110",
                    `bg-gradient-to-br ${alt.gradient}`
                  )}
                >
                  <alt.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {alt.title}
                </h3>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {alt.description}
                </p>

                {/* CTA */}
                {'action' in alt && alt.action === 'modal' && onViewSampleClick ? (
                  <Button
                    variant="outline"
                    onClick={onViewSampleClick}
                    className={cn(
                      "w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all",
                      "group-hover:border-slate-600"
                    )}
                  >
                    {alt.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : 'href' in alt ? (
                  <Link to={alt.href}>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all",
                        "group-hover:border-slate-600"
                      )}
                    >
                      {alt.cta}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : null}
              </div>

              {/* Step indicator */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <span className="text-slate-500 text-sm font-bold">{index + 1}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom reassurance */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-slate-500">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>
              Come back anytime with your quote—we'll be here to scan it.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
