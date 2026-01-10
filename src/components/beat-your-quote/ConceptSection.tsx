import { Shield, Target, Eye } from 'lucide-react';
export function ConceptSection() {
  return <section id="concept" className="relative py-20 md:py-32 dossier-bg">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image Side */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-lg overflow-hidden border-2 border-primary/30 shadow-2xl">
              <img src="/images/beat-your-quote/windowmaninwindow.webp" alt="The Window Man - Sam Glass" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border-l-2 border-t-2 border-primary/50" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r-2 border-b-2 border-primary/50" />
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-mono uppercase tracking-wider rounded mb-4">
                Mission Briefing
              </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-primary-foreground">Exposing the </span>
              <span className="text-primary">Manipulation Machine</span>
            </h2>
              <p className="text-lg leading-relaxed text-primary-foreground">
                For years, high-pressure window salesmen have used psychological tactics to pressure 
                Florida homeowners into signing overpriced contracts. Sam Glass has made it his mission 
                to expose their playbook—and arm you with the tools to fight back.
              </p>
            </div>

            {/* Tactical Points */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-background border border-border rounded-lg">
                <div className="p-2 bg-primary/20 rounded">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">See Through Their Tactics</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn the 11 manipulation techniques contractors use to pressure you into signing today.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-background border border-border rounded-lg">
                <div className="p-2 bg-primary/20 rounded">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Get the Real Numbers</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload any quote and get an instant forensic analysis revealing hidden markups.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-background border border-border rounded-lg">
                <div className="p-2 bg-primary/20 rounded">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Negotiate from Strength</h3>
                  <p className="text-sm text-muted-foreground">
                    Armed with real market data, you'll have the leverage to get a fair deal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}