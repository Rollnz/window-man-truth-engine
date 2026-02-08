import { ScanSearch, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectedQuotes } from '@/hooks/useProjectedQuotes';

const testimonials = [
  {
    quote: "Found $3,200 in hidden fees I would have missed.",
    author: "Maria T., Tampa",
  },
  {
    quote: "The AI caught a missing hurricane code compliance clause.",
    author: "Robert K., Miami",
  },
];

export function ScannerSocialProof() {
  const { total } = useProjectedQuotes();

  const stats = [
    {
      icon: ScanSearch,
      value: total.toLocaleString(),
      label: 'Quotes Scanned',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
    {
      icon: DollarSign,
      value: '$4.2M+',
      label: 'Overcharges Detected',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: AlertTriangle,
      value: '94%',
      label: 'Found At Least One Red Flag',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
            >
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bgColor)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-lg bg-card/50 border border-border/30"
            >
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground italic">"{testimonial.quote}"</p>
                <p className="text-xs text-muted-foreground mt-1">— {testimonial.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
