import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingDown, Clock, DollarSign } from 'lucide-react';

interface AnimatedStatProps {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

function AnimatedStat({ value, suffix, label, icon, delay = 0 }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isVisible, value, delay]);

  return (
    <div 
      ref={ref}
      className="flex flex-col items-center p-6 rounded-lg bg-card/50 border border-border card-hover"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="stat-value text-4xl md:text-5xl mb-2">
        {displayValue}{suffix}
      </div>
      <p className="text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export function UncomfortableTruth() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="container px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            The <span className="text-primary">Uncomfortable Truth</span> About Cheap Windows
          </h2>
          <p className="text-lg text-muted-foreground">
            The "affordable window" myth pushed by price-first contractors hides the long-term 
            expenses of energy bills, repairs, and premature replacements.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <AnimatedStat
            value={30}
            suffix="%"
            label="Energy loss from cheap windows"
            icon={<TrendingDown className="w-6 h-6 text-primary" />}
            delay={0}
          />
          <AnimatedStat
            value={5}
            suffix="-10 yrs"
            label="Typical lifespan before failure"
            icon={<Clock className="w-6 h-6 text-primary" />}
            delay={200}
          />
          <AnimatedStat
            value={2500}
            suffix="+"
            label="Average hidden costs per year"
            icon={<DollarSign className="w-6 h-6 text-primary" />}
            delay={400}
          />
        </div>

        {/* CTA link */}
        <div className="text-center">
          <Link 
            to="/reality-check" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors group"
          >
            <span className="border-b border-primary/50 group-hover:border-primary">
              See the Reality Check Tool
            </span>
            <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}