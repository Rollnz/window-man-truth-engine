import { AlertTriangle, Percent, FileWarning, HardHat, LucideIcon } from 'lucide-react';

interface AgitationPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PROBLEM_CONTENT = {
  headline: 'Your Quote is a Minefield of Hidden Costs.',
  subheadline: "Contractors rely on your confusion to inflate their margins. Don't let them.",
  imageAlt: 'Frustrated homeowner reviewing a confusing window replacement quote with hidden fees',
};

const AGITATION_POINTS: AgitationPoint[] = [
  {
    icon: AlertTriangle,
    title: 'The "Padding" Trap',
    description: "Are you paying for 'miscellaneous' materials that don't exist?",
  },
  {
    icon: Percent,
    title: 'The Discount Illusion',
    description: "That 'Limited Time Offer' is usually the standard price—inflated 20% first.",
  },
  {
    icon: FileWarning,
    title: 'Hidden Disposal Fees',
    description: "Many quotes hide $500+ in cleanup costs in the fine print.",
  },
  {
    icon: HardHat,
    title: 'Low-Ball Labor',
    description: "Unusually low labor costs often mean uninsured sub-contractors on your property.",
  },
];

export function ProblemAgitationSection() {
  return (
    <section 
      aria-labelledby="problem-agitation-heading"
      className="relative py-16 md:py-24 bg-slate-950 overflow-hidden"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900/50 pointer-events-none" />
      
      <div className="container relative px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image Column - First on mobile */}
          <div className="order-1 lg:order-none">
            <div className="relative group">
              {/* Outer glow ring */}
              <div 
                className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 via-primary/20 to-orange-500/30 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 transform-gpu" 
                aria-hidden="true"
              />
              
              {/* Inner border with scan effect */}
              <div className="relative border-2 border-orange-500/40 rounded-2xl overflow-hidden">
                <img
                  src="/lovable-uploads/window_quote_confusion.webp"
                  alt={PROBLEM_CONTENT.imageAlt}
                  loading="lazy"
                  className="w-full h-auto rounded-xl"
                />
                
                {/* Scan line overlay */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                  <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-[scan-down_3s_ease-in-out_infinite] motion-reduce:hidden" />
                </div>
              </div>
            </div>
          </div>

          {/* Text Column */}
          <div className="order-2 lg:order-none space-y-6">
            {/* Headline */}
            <h2 
              id="problem-agitation-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight"
            >
              Your Quote is a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Minefield
              </span>{' '}
              of Hidden Costs.
            </h2>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#efefef] leading-relaxed">
              {PROBLEM_CONTENT.subheadline.split("Don't let them.")[0]}
              <span className="text-orange-400 font-medium">Don't let them.</span>
            </p>

            {/* Agitation Bullet Points */}
            <ul className="space-y-4 pt-2">
              {AGITATION_POINTS.map((point) => (
                <li key={point.title} className="flex gap-4 items-start group">
                  {/* Icon container with glow */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <point.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  
                  <div>
                    <span className="text-white font-semibold block">
                      {point.title}
                    </span>
                    <span className="text-[#efefef] text-sm">
                      {point.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
