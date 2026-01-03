import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Upload, FileText, Shield, Bell, ArrowRight, Sparkles } from 'lucide-react';

export default function VaultWelcome() {
  usePageTracking('vault-welcome');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const sourceTool = searchParams.get('source') || 'your assessment';

  return (
    <div className="min-h-screen bg-background">
      {/* Celebration Hero */}
      <div className="bg-gradient-to-b from-primary/20 to-background py-16 px-4 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="absolute top-10 left-1/4 w-8 h-8 text-primary animate-pulse" />
            <Sparkles className="absolute top-20 right-1/3 w-6 h-6 text-primary animate-pulse delay-100" />
            <Sparkles className="absolute top-32 left-1/2 w-10 h-10 text-primary animate-pulse delay-200" />
          </div>
        )}

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎉 You're Protected!
          </h1>

          <p className="text-xl text-muted-foreground mb-6">
            Your Horizons Vault is ready and your {sourceTool} results are safely stored.
          </p>

          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-500 px-6 py-3 rounded-full font-semibold">
            <Shield className="w-5 h-5" />
            <span>Premium Access Unlocked - FREE Forever</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Protection Status</h2>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Complete Your Vault</span>
              <span className="text-sm text-muted-foreground">2 of 5 steps</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '40%' }} />
            </div>
          </div>

          {/* Completed Steps */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">✓ Vault Created</h3>
                <p className="text-sm text-muted-foreground">
                  Your secure account is active and ready
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">✓ Results Saved</h3>
                <p className="text-sm text-muted-foreground">
                  Your {sourceTool} analysis is stored and accessible anytime
                </p>
              </div>
            </div>

            {/* Pending Steps */}
            <div className="flex items-start gap-4 opacity-50">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Upload Your Quotes</h3>
                <p className="text-sm text-muted-foreground">
                  Add contractor quotes for expert analysis (recommended)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-50">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Add Important Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Insurance policy, property photos, warranties
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-50">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Enable Hurricane Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Get SMS warnings when storms approach (optional)
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* What's Included */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            What You Get With Your FREE Vault
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure Storage</h3>
              <p className="text-sm text-muted-foreground">
                Bank-level encryption for all your important home protection documents
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Expert Quote Review</h3>
              <p className="text-sm text-muted-foreground">
                Upload contractor quotes and get detailed analysis within 24 hours
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Hurricane Alerts</h3>
              <p className="text-sm text-muted-foreground">
                SMS and email notifications during hurricane season (opt-in)
              </p>
            </Card>
          </div>
        </div>

        {/* Next Steps CTAs */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold mb-6">Ready for the Next Step?</h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/vault/upload')} className="text-lg">
              <Upload className="w-5 h-5 mr-2" />
              Upload Your Quotes
            </Button>

            <Button size="lg" variant="outline" onClick={() => navigate('/vault')} className="text-lg">
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            You can access your vault anytime at{' '}
            <a href="/vault" className="text-primary hover:underline">
              windowtruthengine.com/vault
            </a>
          </p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-muted/30 border-t border-border py-8 px-4 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-semibold mb-2">Need Help Getting Started?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our team is here to help you get the most out of your vault and protect your home investment.
          </p>
          <Button variant="outline" onClick={() => navigate('/expert')}>
            Contact an Expert
          </Button>
        </div>
      </div>
    </div>
  );
}
