import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronLeft, ChevronRight, DollarSign, FileWarning, ShieldAlert, Clock, Scale } from 'lucide-react';
interface RedFlag {
  id: string;
  icon: React.ReactNode;
  category: string;
  title: string;
  excerpt: string;
  impact: string;
  color: string;
  bgColor: string;
}
const RED_FLAGS: RedFlag[] = [{
  id: '1',
  icon: <DollarSign className="w-5 h-5" />,
  category: 'Hidden Fee',
  title: 'The "Disposal Fee" That Doesn\'t Exist',
  excerpt: '"Disposal & Haul Away: $850" — This fee is typically included in labor. They\'re charging you twice.',
  impact: 'Avg. Overcharge: $500–$1,200',
  color: 'text-red-400',
  bgColor: 'bg-red-500/10'
}, {
  id: '2',
  icon: <FileWarning className="w-5 h-5" />,
  category: 'Missing Scope',
  title: 'No Permit Mentioned Anywhere',
  excerpt: 'Quote shows no permit line item. In Florida, window replacement requires permits. Who pays when the inspector shows up?',
  impact: 'Risk: $500–$2,000 + Delays',
  color: 'text-orange-400',
  bgColor: 'bg-orange-500/10'
}, {
  id: '3',
  icon: <ShieldAlert className="w-5 h-5" />,
  category: 'Warranty Trap',
  title: 'The "Lifetime" Warranty That Expires',
  excerpt: '"Lifetime Warranty Included" — Read the fine print. This one expires after 5 years and doesn\'t cover labor.',
  impact: 'Hidden Cost: $3,000+ if issues arise',
  color: 'text-amber-400',
  bgColor: 'bg-amber-500/10'
}, {
  id: '4',
  icon: <Scale className="w-5 h-5" />,
  category: 'Code Violation',
  title: 'Wrong Impact Rating for Zone',
  excerpt: 'Quote specifies "Large Missile" rating but property is in HVHZ. This won\'t pass inspection.',
  impact: 'Risk: Full reinstallation',
  color: 'text-red-400',
  bgColor: 'bg-red-500/10'
}, {
  id: '5',
  icon: <Clock className="w-5 h-5" />,
  category: 'Vague Terms',
  title: '"Installation" With No Details',
  excerpt: 'Labor: $4,200 — but what does that include? Interior trim? Exterior caulking? Stucco repair? They\'ll charge extra later.',
  impact: 'Change Order Risk: $1,500+',
  color: 'text-orange-400',
  bgColor: 'bg-orange-500/10'
}, {
  id: '6',
  icon: <DollarSign className="w-5 h-5" />,
  category: 'Price Inflation',
  title: '40% Above Market Rate',
  excerpt: 'Premium vinyl windows quoted at $1,800/unit. Local average for same spec: $1,100–$1,300.',
  impact: 'Overcharge: $500/window',
  color: 'text-red-400',
  bgColor: 'bg-red-500/10'
}];
export function RedFlagGallery() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCount = 3;
  const nextSlide = () => setCurrentIndex(prev => prev + 1 >= RED_FLAGS.length - visibleCount + 1 ? 0 : prev + 1);
  const prevSlide = () => setCurrentIndex(prev => prev - 1 < 0 ? RED_FLAGS.length - visibleCount : prev - 1);
  return <section className="relative py-20 md:py-28 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.5) 10px, rgba(239, 68, 68, 0.5) 20px)`
      }} />
      </div>

      <div className="container relative px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-6 px-4 py-2 bg-red-500/10 border-red-500/30 text-red-400">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Real Examples From Our Scanner
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            An Independent Standard Audit      <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">​</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Here's what our AI finds hiding in quotes every single day.
            <span className="text-red-400 font-medium block mt-2">Don't let this be you.</span>
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
            <Button variant="outline" size="icon" onClick={prevSlide} className="w-12 h-12 rounded-full bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden md:block">
            <Button variant="outline" size="icon" onClick={nextSlide} className="w-12 h-12 rounded-full bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 backdrop-blur-sm">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>

          <div className="overflow-hidden px-2">
            <div className="flex transition-transform duration-500 ease-out gap-6" style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`
          }}>
              {RED_FLAGS.map(flag => <Card key={flag.id} className={cn("flex-shrink-0 w-full md:w-[calc(33.333%-1rem)] bg-slate-900/80 border-slate-800 p-6 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300 group")}>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className={cn("px-3 py-1 border-0", flag.bgColor, flag.color)}>
                      {flag.icon}
                      <span className="ml-2">{flag.category}</span>
                    </Badge>
                    <AlertTriangle className={cn("w-5 h-5", flag.color)} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-red-400 transition-colors">{flag.title}</h3>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-4">
                    <p className="text-slate-400 text-sm italic leading-relaxed">"{flag.excerpt}"</p>
                  </div>
                  <div className={cn("flex items-center gap-2 text-sm font-medium", flag.color)}>
                    <DollarSign className="w-4 h-4" />
                    {flag.impact}
                  </div>
                </Card>)}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-500 text-lg">
            Your quote might look fine on the surface.
            <span className="text-white font-medium block mt-1">Our AI sees what you can't.</span>
          </p>
        </div>
      </div>
    </section>;
}