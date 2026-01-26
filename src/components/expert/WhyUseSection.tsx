import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Zap, UserX } from 'lucide-react';

const features = [{
  icon: ShieldCheck,
  title: 'Unbiased Truth',
  description: "We don't sell windows, so we don't hide costs.",
  animation: 'translate-x-[-100px] opacity-0' // slide from left
}, {
  icon: Zap,
  title: 'Instant Validation',
  description: 'Check if a quote is fair in seconds, not days.',
  animation: 'translate-y-[50px] opacity-0' // slide from bottom
}, {
  icon: UserX,
  title: 'Sales Rep Kryptonite',
  description: 'Ask the hard questions that make shady contractors nervous.',
  animation: 'translate-x-[100px] opacity-0' // slide from right
}];

export function WhyUseSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
          Don't Walk Into a Negotiation <span className="text-primary bg-[#e7f3fe]">Unarmed</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          This Expert System gives you the leverage you need before, during, and after the sales pitch.
        </p>

        <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className={`bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg hover:shadow-black/20 transition-all duration-500 ease-out ${
                isVisible 
                  ? 'translate-x-0 translate-y-0 opacity-100' 
                  : feature.animation
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-black">{feature.title}</h3>
              <p className="text-sm text-black">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
