import { Scale, TrendingUp, ShieldAlert } from 'lucide-react';
const badges = [{
  icon: Scale,
  label: 'Florida Code Compliant'
}, {
  icon: TrendingUp,
  label: 'Real-Time Pricing'
}, {
  icon: ShieldAlert,
  label: 'Contractor Scam Database'
}];
export function TrustSection() {
  return <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-4 sm:text-4xl">
          What Powers This <span className="text-primary">Engine?</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          This isn't a basic support bot. Our Expert System is trained on Florida Building Codes, 
          real-time market pricing data, and thousands of actual contractor contracts to give you 
          answers that matter.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {badges.map(badge => <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <badge.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{badge.label}</span>
            </div>)}
        </div>
      </div>
    </section>;
}