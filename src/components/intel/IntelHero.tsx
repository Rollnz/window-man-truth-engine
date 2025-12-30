import { FileStack, Lock, Mail } from 'lucide-react';

export function IntelHero() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 gradient-radial opacity-30" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-6">
            <FileStack className="w-4 h-4" />
            <span>DECLASSIFIED INTELLIGENCE</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Declassified{' '}
            <span className="text-primary text-glow">Window Intelligence</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Access restricted guides, checklists, and tactics previously reserved for industry insiders. 
            Each document unlocks critical knowledge for your protection.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold">5</span>
              <span>Classified Documents</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold">Instant</span>
              <span>Email Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
