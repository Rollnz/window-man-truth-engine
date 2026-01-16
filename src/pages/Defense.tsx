import { CheckCircle2, ShieldAlert, Siren } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ConversionBar } from "@/components/conversion/ConversionBar";
import { ROUTES } from "@/config/navigation";
import { getToolPageSchemas } from "@/lib/seoSchemas";

const redFlags = [
  "Quotes without line-item pricing for glass, frames, and installation.",
  "Pressure tactics like 'today only' discounts or unverified rebates.",
  "Missing wind-load or Miami-Dade approvals for hurricane zones.",
];

const Defense = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Window Quote Defense Mode"
        description="Quick checklist of red flags to watch for before signing any window replacement contract. Protect your home and insurance claims."
        canonicalUrl="https://itswindowman.com/defense"
        jsonLd={getToolPageSchemas('defense')}
      />
      <Navbar />

      <main className="pt-20">
        <section className="container px-4 py-12 space-y-8">
          <div className="space-y-3 max-w-3xl">
            <p className="text-sm font-semibold text-primary">Defense Mode</p>
            <h1 className="text-3xl sm:text-4xl font-bold">Red flags to watch for before you sign.</h1>
            <p className="text-muted-foreground">
              Use these checks to protect your home and insurance claims. When you're ready, let us capture the details and schedule a vetted estimator.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {redFlags.map((flag) => (
              <div key={flag} className="rounded-xl border border-border p-4 space-y-3">
                <Siren className="h-5 w-5 text-destructive" />
                <p className="text-sm text-muted-foreground">{flag}</p>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Add this to your inspection checklist</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border p-4 flex flex-col gap-3 bg-card/40">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Next step: lock in your evidence trail</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Capture your project details so we can pair you with the right specialist and prep your spec checklist.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to={ROUTES.FREE_ESTIMATE}>Book an Inspection</Link>
              </Button>
              <Button asChild variant="secondary-action">
                <Link to={ROUTES.SPEC_CHECKLIST_GUIDE}>Download Spec Checklist</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container px-4 pb-16">
          <ConversionBar
            headline="Want a human to double-check these red flags?"
            subheadline="Jump into a free estimate and we'll verify specs, pricing, and insurance readiness for your home."
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Defense;