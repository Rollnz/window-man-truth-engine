import { ScanSearch } from 'lucide-react';
import { ShimmerBadge } from '@/components/ui/ShimmerBadge';

export function QuoteScannerHero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden min-h-[50vh] flex items-center">
      {/* Layer 1: Background Image with Parallax */}
      <div 
        className="absolute inset-0 z-0 scale-105 parallax-bg"
        style={{
          backgroundImage: `url('/images/quote-scanner/hero-bg.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)',
          transform: 'translateZ(0)',
        }}
        aria-hidden="true"
      />
      
      {/* Parallax for desktop only via media query */}
      <style>{`
        .parallax-bg {
          background-attachment: scroll;
        }
        @media (min-width: 768px) {
          .parallax-bg {
            background-attachment: fixed;
          }
        }
      `}</style>
      
      {/* Layer 2: Dark Overlay for Contrast */}
      <div 
        className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/50 to-background"
        aria-hidden="true"
      />
      
      {/* Layer 3: Content */}
      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <ShimmerBadge className="mb-6" />
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <ScanSearch className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Headline - Locked to white for image overlay */}
          <h1 className="display-h1 text-lift text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Is Your Window Quote Fair?{' '}
            <span className="text-primary">AI Analysis in 60 Seconds</span>
          </h1>
          
          {/* Subtext - Slightly muted white */}
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Stop guessing. Upload a photo of your contractor's quote and let our AI flag hidden risks, 
            missing scope, and overpricing — in seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
