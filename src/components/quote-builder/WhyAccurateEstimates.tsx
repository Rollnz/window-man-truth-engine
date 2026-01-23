import { Shield, CheckCircle, TrendingUp } from "lucide-react";

export const WhyAccurateEstimates = () => {
  return (
    <section className="py-16 bg-muted transition-colors duration-300">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Why Accurate Estimates Matter</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't let contractors overcharge you. Our data-driven approach gives you the leverage you need.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border transition-colors duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Protect Your Budget</h3>
            <p className="text-muted-foreground text-sm">
              Know the real market prices before getting quotes. Avoid paying 20-40% more than necessary.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border transition-colors duration-300">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Compare Apples to Apples</h3>
            <p className="text-muted-foreground text-sm">
              Break down your project into standardized line items to fairly compare contractor bids.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border transition-colors duration-300">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Negotiate with Confidence</h3>
            <p className="text-muted-foreground text-sm">
              Walk into negotiations armed with data. Contractors respect informed homeowners.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};