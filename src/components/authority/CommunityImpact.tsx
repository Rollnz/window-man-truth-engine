import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, DollarSign, Home, FileSearch, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface ImpactStatProps {
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

function ImpactStat({ value, prefix = '', suffix, label, icon, delay = 0 }: ImpactStatProps) {
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
      const duration = 1200;
      const steps = 50;
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
    <div ref={ref} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {prefix}{displayValue.toLocaleString()}{suffix}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface CommunityImpactProps {
  className?: string;
  /** Compact version for embedding in other sections */
  variant?: 'full' | 'compact';
}

/**
 * CommunityImpact Component
 * 
 * Shows aggregate data from the Window Truth Engine's impact on the Florida community.
 * Used on Home and Evidence pages for social proof.
 */
export function CommunityImpact({ className, variant = 'full' }: CommunityImpactProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("grid grid-cols-2 gap-4", className)}>
        <ImpactStat
          prefix="$"
          value={250}
          suffix="K+"
          label="Overpricing identified"
          icon={<DollarSign className="w-6 h-6 text-primary" />}
          delay={0}
        />
        <ImpactStat
          value={450}
          suffix="+"
          label="Florida homes scanned"
          icon={<Home className="w-6 h-6 text-primary" />}
          delay={150}
        />
      </div>
    );
  }

  return (
    <section className={cn("py-12 md:py-16 section-surface", className)}>
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Community Impact
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Protecting Florida Homeowners Together
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Real results from the Window Truth Engine—tracking transparency and savings across the state.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <ImpactStat
              prefix="$"
              value={250}
              suffix="K+"
              label="Overpricing identified"
              icon={<DollarSign className="w-6 h-6 text-primary" />}
              delay={0}
            />
            <ImpactStat
              value={450}
              suffix="+"
              label="Florida homes scanned"
              icon={<Home className="w-6 h-6 text-primary" />}
              delay={100}
            />
            <ImpactStat
              value={47}
              suffix=""
              label="Verified case studies"
              icon={<FileSearch className="w-6 h-6 text-primary" />}
              delay={200}
            />
            <ImpactStat
              value={18}
              suffix="%"
              label="Avg. insurance savings"
              icon={<Shield className="w-6 h-6 text-primary" />}
              delay={300}
            />
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link 
              to={ROUTES.PROOF}
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium group"
            >
              <span>Explore verified case studies</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CommunityImpact;
