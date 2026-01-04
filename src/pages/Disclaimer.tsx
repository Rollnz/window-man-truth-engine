import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTracking } from '@/hooks/usePageTracking';

export default function Disclaimer() {
  usePageTracking('legal-disclaimer');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Disclaimer</h1>
        <p className="text-muted-foreground mb-8">Last Updated: [Insert Date]</p>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Not a Contractor</h2>
            <p className="text-muted-foreground">
              Window Truth Engine is a media and referral company, not a licensed construction contractor. All information provided on this site, including "Risk Scores," "Fair Price" estimates, and "Window IQ" assessments, is for educational and informational purposes only. It does not constitute professional engineering, legal, or construction advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. No Guarantee of Savings</h2>
            <p className="text-muted-foreground">
              Our "Beat Your Quote" and "Cost Calculator" tools provide estimates based on market data and average pricing. Actual project costs vary based on materials, labor rates, and specific home conditions. We do not guarantee that we or our partners can beat every quote or that your specific project will match our estimated ranges.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Third-Party Contractors</h2>
            <p className="text-muted-foreground">
              We may refer you to third-party window contractors. We make reasonable efforts to vet our network, but we do not supervise, direct, or control these contractors. We are not responsible for their workmanship, pricing, delays, or any damages they may cause. Any contract you sign is strictly between you and the service provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Advertising Disclosure</h2>
            <p className="text-muted-foreground">
              This Site may contain paid advertising and affiliate links. We may receive a referral fee or commission when you submit your information or hire a contractor through our network. This funding allows us to provide our educational tools to you for free.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
