import { ScanSearch, Sparkles } from 'lucide-react';

export function QuoteScannerHero() {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      <div className="container relative px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-medium border rounded-full bg-primary/10 border-primary/20 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by AI</span>
          </div>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ScanSearch className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Headline - 2025 SEO Optimized */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Is Your Window Quote Fair?{' '}
            <span className="text-primary">AI Analysis in 60 Seconds</span>
          </h1>
          
          {/* Subtext */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop guessing. Upload a photo of your contractor's quote and let our AI flag hidden risks, 
            missing scope, and overpricing — in seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
