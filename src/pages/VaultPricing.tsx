import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Shield, Lock, FileText, Bell, Star, Clock, Users } from 'lucide-react';

export default function VaultPricing() {
  usePageTracking('vault-pricing');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Basic Vault',
      price: { monthly: 9, annual: 99 },
      savings: 9,
      description: 'Essential document protection',
      features: [
        '5GB secure storage',
        'Quote comparison tools',
        'Annual hurricane reminders',
        'Email support',
        'Browser access',
        'Document categories',
      ],
      icon: FileText,
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Protection Vault',
      price: { monthly: 15, annual: 149 },
      savings: 31,
      description: 'Complete home protection suite',
      features: [
        '25GB secure storage',
        'SMS hurricane alerts',
        'Annual photo reminders',
        'Insurance policy analysis',
        'Contractor verification',
        'Priority email support',
        'Expert quote review',
        'Share with contractors',
      ],
      icon: Shield,
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Ultimate Vault',
      price: { monthly: 39, annual: 399 },
      savings: 69,
      description: 'White-glove protection service',
      features: [
        'Unlimited storage',
        'Priority expert review (24hr)',
        'Quarterly check-ins',
        'Claim assistance',
        'Concierge contractor matching',
        'Phone support',
        'Dedicated account manager',
        'Advanced analytics',
      ],
      icon: Star,
      popular: false,
      cta: 'Start Free Trial',
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return billingPeriod === 'monthly' ? plan.price.monthly : plan.price.annual;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-6">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Secure Document Protection</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Horizons <span className="text-primary">Vault</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Protect your home investment with secure document storage, expert quote analysis,
            and hurricane preparedness tools.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'annual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">
                Save up to $69
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const price = getPrice(plan);

            return (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PlanIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <p className="text-sm text-green-500 mt-1">
                        Save ${plan.savings} per year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    <Link
                      to={`/vault/signup?plan=${plan.name.toLowerCase().replace(' ', '-')}&billing=${billingPeriod}`}
                    >
                      {plan.cta}
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Trial Info */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            <Clock className="inline w-4 h-4 mr-1" />
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-card/30 border-y border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Trusted by Florida Homeowners
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "Saved me $6,200 on my impact window quote! Found 3 red flags I totally missed."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Sarah M.</p>
                  <p className="text-xs text-muted-foreground">Boca Raton</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "When Hurricane Ian hit, I had everything organized for my insurance claim. Lifesaver!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Mike T.</p>
                  <p className="text-xs text-muted-foreground">Fort Myers</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-sm mb-4">
                "The SMS alerts gave me time to prepare before the storm. Worth every penny."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Linda K.</p>
                  <p className="text-xs text-muted-foreground">West Palm Beach</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">When will I be charged?</h3>
            <p className="text-sm text-muted-foreground">
              Your 14-day free trial starts immediately with no credit card required.
              You'll only be charged after day 15 if you choose to continue. We'll send
              a reminder on day 12.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes! One-click cancellation anytime. No contracts, no commitments. Your
              documents will remain accessible for 30 days after cancellation.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">How secure are my documents?</h3>
            <p className="text-sm text-muted-foreground">
              Bank-level encryption (AES-256) for all stored documents. Your files are
              encrypted both in transit and at rest. Only you (and contractors you
              explicitly approve) can access your vault.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">What's included in the expert review?</h3>
            <p className="text-sm text-muted-foreground">
              Upload your contractor quotes and we'll analyze them line-by-line for red
              flags, inflated pricing, and permit issues. You'll receive a detailed PDF
              report within 24 hours (Protection & Ultimate tiers).
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-sm text-muted-foreground">
              Absolutely! Upgrade anytime to access more features. Downgrade at your next
              billing cycle. Any unused time on your current plan will be prorated.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              100% money-back guarantee within your first 30 days. If you're not
              completely satisfied, we'll refund every penny. No questions asked.
            </p>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-primary/10 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Protect Your Home Investment?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join 2,847+ Florida homeowners who sleep better knowing their impact window
            quotes, insurance policies, and hurricane documentation are safe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link to="/vault/signup?plan=protection-vault&billing=annual">
                Start 14-Day Free Trial
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link to="/tools">
                Explore Free Tools First
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      <MinimalFooter />
    </div>
  );
}
