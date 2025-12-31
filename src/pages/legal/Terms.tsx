import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last Updated: [Insert Date]</p>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing the Window Truth Engine (the "Site"), you agree to be bound by these Terms. If you do not agree, please do not use our tools.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Nature of Service</h2>
            <p className="text-muted-foreground">
              The Site provides educational tools, cost calculators, and contractor referrals. We are not a licensed window contractor or installation company. We act as a bridge to connect homeowners with third-party professionals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. "The Vault" and User Accounts</h2>
            <p className="text-muted-foreground">
              You are responsible for maintaining the confidentiality of your login credentials (including Magic Links sent to your email). You agree to provide accurate, current, and complete information during the registration and quote upload process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content on this Site—including the "Window Man" persona, "Fear-Based Education" materials, "Window IQ" methodology, and "Defense Arsenal" tools—is the exclusive property of Window Truth Engine and is protected by copyright laws. You may not copy, reproduce, or distribute our content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Window Truth Engine shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site or any services provided by contractors you find through us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
