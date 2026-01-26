import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';
import { ROUTES } from '@/config/navigation';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 gradient-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] gradient-radial opacity-50" />
      
      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Trusted by 10,000+ Florida Homeowners</span>
          </div>

          {/* Main headline - No animation delay for faster LCP */}
          <h1 className="display-h1 text-lift text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-foreground">Cheap Windows Cost You More</span>
            <span className="block mt-2 text-primary text-glow">— Discover the Proof for Yourself</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Stop wasting money on bargain windows that leak energy and fail early. 
            See how investing in quality protects your home and wallet for decades.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button asChild size="lg" className="glow-sm hover:glow text-base px-8 py-6 group">
              <Link to={ROUTES.REALITY_CHECK}>
                Start Your Discovery
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="high-contrast" size="lg" className="text-base px-8 py-6">
              <Link to={ROUTES.COMPARISON}>
                Compare Windows Now
              </Link>
            </Button>
          </div>

          {/* Micro-copy */}
          <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            No signup required • Explore at your own pace • Your data stays private
          </p>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}