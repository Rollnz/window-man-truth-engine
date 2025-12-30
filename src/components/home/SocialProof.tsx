import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Wrench, Calendar } from 'lucide-react';

interface ProofStatProps {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

function ProofStat({ value, prefix = '', suffix, label, icon, delay = 0 }: ProofStatProps) {
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
    <div ref={ref} className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-primary text-glow mb-2">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </div>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="container px-4">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Real Results from <span className="text-primary">Real Homeowners</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't take our word for it — explore the aggregated data from thousands of 
            homeowners who made the switch to quality windows.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mb-12">
          <ProofStat
            prefix="$"
            value={1847}
            suffix="/yr"
            label="Average energy savings"
            icon={<TrendingUp className="w-8 h-8 text-primary" />}
            delay={0}
          />
          <ProofStat
            value={92}
            suffix="%"
            label="Reduction in repair calls"
            icon={<Wrench className="w-8 h-8 text-primary" />}
            delay={200}
          />
          <ProofStat
            value={25}
            suffix="+ yrs"
            label="Average window lifespan"
            icon={<Calendar className="w-8 h-8 text-primary" />}
            delay={400}
          />
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link 
            to="/proof" 
            className="inline-flex items-center px-6 py-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors group"
          >
            <span className="text-foreground group-hover:text-primary transition-colors">
              Explore the Full Proof Dashboard
            </span>
            <span className="ml-2 text-primary transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}