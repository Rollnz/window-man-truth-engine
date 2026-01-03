import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, Target } from "lucide-react";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { ConversionBar } from "@/components/conversion/ConversionBar";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-20">
        <section className="container px-4 py-12 space-y-6">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-semibold text-primary">About Its Window Man</p>
            <h1 className="text-3xl sm:text-4xl font-bold">
              Built to protect Florida homeowners from storm risk and contractor games.
            </h1>
            <p className="text-muted-foreground">
              We combine AI tools, vetted estimators, and a homeowner-first playbook so you can make window decisions with confidence. Every tool routes back to a human who can confirm pricing and book an inspection if you want it.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border p-4 space-y-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Safety First</h2>
              <p className="text-sm text-muted-foreground">Hurricane-grade recommendations plus insurance-ready documentation.</p>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">AI + Human Review</h2>
              <p className="text-sm text-muted-foreground">Scanners surface red flags, then our specialists verify before you decide.</p>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Lead With Value</h2>
              <p className="text-sm text-muted-foreground">We give away the playbooks first. If you like them, book an inspection.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/free-estimate">Book an Inspection</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/claim-survival">Download the Claim Kit</Link>
            </Button>
          </div>
        </section>

        <section className="container px-4 pb-16">
          <ConversionBar
            headline="Need a human sanity check?"
            subheadline="Tap through to your free estimate and we’ll pair you with a vetted impact window specialist."
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
