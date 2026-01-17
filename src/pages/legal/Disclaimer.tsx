import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { getBreadcrumbSchema } from '@/lib/seoSchemas';
import { ROUTES } from '@/config/navigation';

export default function Disclaimer() {
  usePageTracking('legal-disclaimer');

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Disclaimer | WindowMan Truth Engine"
        description="Important disclaimer about WindowMan Truth Engine services. Our Cost Calculator and AI Scanner provide educational estimates only. Verify all quotes with licensed professionals."
        canonicalUrl="https://itswindowman.com/disclaimer"
        jsonLd={[getBreadcrumbSchema('disclaimer')]}
      />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to={ROUTES.HOME}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Disclaimer for WindowMan Truth Engine</h1>
        <p className="text-muted-foreground mb-8">Last Updated: January 17, 2025</p>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Educational Purpose Only</h2>
            <p className="text-muted-foreground">
              All information provided by the WindowMan Truth Engine, including data from our Cost Calculator and AI Scanner, is for educational and informational purposes only. It is not intended to be professional contracting, engineering, or financial advice. The tools and resources on this site are designed to help you make more informed decisions, but should not replace consultation with licensed professionals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Accuracy of Data</h2>
            <p className="text-muted-foreground">
              While we strive for absolute accuracy, window pricing and energy savings are subject to market fluctuations, regional labor costs, and specific home conditions. Our estimates are based on aggregated market data from the South Florida region, but your actual project results may vary significantly from the estimates provided on this site. We update our pricing data regularly, but cannot guarantee real-time accuracy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. No Guarantee of Results</h2>
            <p className="text-muted-foreground">
              WindowMan does not guarantee specific savings, insurance discounts, or project outcomes. Our "Beat Your Quote" and "Fair Price Quiz" tools provide comparative estimates based on available data, but we cannot guarantee that your specific project will match our estimated ranges. Users are strongly encouraged to verify all quotes and contract details with a licensed professional before making any purchase decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Contractors</h2>
            <p className="text-muted-foreground">
              We may refer you to third-party window contractors through our network. While we make reasonable efforts to vet our partners, we do not supervise, direct, or control these contractors. We are not responsible for their workmanship, pricing, project timelines, or any damages they may cause. Any contract you sign is strictly between you and the service provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Third-Party Links</h2>
            <p className="text-muted-foreground">
              This site may link to external sources, evidence studies, manufacturer specifications, and Florida building code references. We are not responsible for the content, accuracy, or privacy practices of these third-party websites. External links are provided for reference and educational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Advertising Disclosure</h2>
            <p className="text-muted-foreground">
              This site may contain paid advertising and affiliate relationships. We may receive a referral fee or commission when you submit your information or hire a contractor through our network. This funding model allows us to provide our educational tools, calculators, and guides to you at no cost.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Florida-Specific Information</h2>
            <p className="text-muted-foreground">
              Many of our tools and resources are specifically tailored for Florida homeowners, particularly those in the High-Velocity Hurricane Zone (HVHZ) including Miami-Dade and Broward counties. Information regarding building codes, insurance discounts, and product certifications (such as NOA requirements) may not apply to homes outside of Florida or in different wind zones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, WindowMan Truth Engine and its affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this site or reliance on any information provided herein. Your use of this site is at your own risk.
            </p>
          </section>

          <div className="mt-12 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              If you have questions about this disclaimer, please contact us through our website or visit our{' '}
              <Link to={ROUTES.FAQ} className="text-primary hover:underline">FAQ page</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}