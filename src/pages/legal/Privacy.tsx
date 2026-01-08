import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ROUTES } from '@/config/navigation';

export default function Privacy() {
  usePageTracking('legal-privacy');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to={ROUTES.HOME}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: [Insert Date]</p>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Welcome to the Window Truth Engine (the "Site"). We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and share information when you use our tools, including the Window IQ Challenge, Risk Diagnostic, and Cost Calculator.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Identity Data:</strong> Name, email address, and phone number (when you create a Vault account or save results).</li>
              <li><strong className="text-foreground">Property Data:</strong> Information about your home, windows, and current contractor quotes submitted through our "Beat Your Quote" tool.</li>
              <li><strong className="text-foreground">Assessment Data:</strong> Scores and results from our diagnostic tools.</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We also automatically collect usage data via cookies and pixels, including your IP address, browser type, and interactions with our ads.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-3">We use your data to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Generate your custom "Window IQ" and "Risk Score" reports.</li>
              <li>Provide you with access to your secure "Vault" dashboard.</li>
              <li>Send you email updates, educational reports, and "Intel" summaries.</li>
              <li><strong className="text-foreground">Connect you with contractors:</strong> If you request a consultation or quote comparison, we use your data to match you with vetted contractors in our network.</li>
              <li><strong className="text-foreground">Marketing & Ads:</strong> We use tracking pixels (such as Meta Pixel and Google Ads) to serve relevant advertisements to you on other platforms based on your activity here.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Sharing Your Information</h2>
            <p className="text-muted-foreground mb-3">
              We are a referral service. By using our tools and submitting your information, you explicitly authorize us to share your details with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong className="text-foreground">Service Providers:</strong> Third-party contractors and window installation companies relevant to your project.</li>
              <li><strong className="text-foreground">Tech Partners:</strong> Platforms that assist us in operating the Site (e.g., email services, database hosting).</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We do not sell your personal data to unrelated third parties for spam purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Your Rights</h2>
            <p className="text-muted-foreground">
              You may access, update, or delete your "Vault" account at any time by contacting us at [Insert Support Email]. You may also opt-out of marketing emails via the "Unsubscribe" link.
            </p>
          </section>

          <section className="rounded-lg border border-border p-4 bg-card/40 space-y-3">
            <h3 className="text-lg font-semibold">Next step</h3>
            <p className="text-sm text-muted-foreground">
              Want us to review your project under these privacy commitments? Book an inspection or grab the Claim Kit to start your evidence trail.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to={ROUTES.FREE_ESTIMATE}>Book an Inspection</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={ROUTES.CLAIM_SURVIVAL}>Download the Claim Kit</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}