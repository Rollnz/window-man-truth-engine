import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, ArrowRight, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function VaultSignup() {
  usePageTracking('vault-signup');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    smsOptIn: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<string>('');

  useEffect(() => {
    const plan = searchParams.get('plan') || 'protection-vault';
    const billing = searchParams.get('billing') || 'annual';
    setSelectedPlan(plan);
    setBillingPeriod(billing);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            sms_opt_in: formData.smsOptIn,
            selected_plan: selectedPlan,
            billing_period: billingPeriod,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: 'Account Created!',
          description: 'Your vault account has been created. Redirecting...',
        });

        // Redirect to welcome page
        setTimeout(() => {
          navigate(`/vault/welcome?plan=${selectedPlan}&billing=${billingPeriod}`);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanName = () => {
    return selectedPlan
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Secure Account Creation</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Protect Your Home. Protect Your Investment.
          </h1>
          <p className="text-muted-foreground">
            Start your free 14-day trial of Horizons Vault
          </p>
        </div>

        {/* Selected Plan Info */}
        {selectedPlan && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected Plan:</p>
                <p className="font-semibold">{getPlanName()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Billing:</p>
                <p className="font-semibold capitalize">{billingPeriod}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Signup Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="(561) 555-1234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll only text you for hurricanes & important alerts
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password <span className="text-destructive">*</span>
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            {/* SMS Opt-in */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="smsOptIn"
                checked={formData.smsOptIn}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, smsOptIn: checked as boolean })
                }
                disabled={isLoading}
              />
              <div className="flex-1">
                <label
                  htmlFor="smsOptIn"
                  className="text-sm font-medium cursor-pointer"
                >
                  I want SMS alerts during hurricane season (highly recommended!)
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Get critical alerts when storms approach your area. You can opt-out anytime.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                'Creating Your Vault...'
              ) : (
                <>
                  Create My Free Vault
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Bank-level encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>No credit card required</span>
              </div>
            </div>
          </form>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <a href="/auth" className="text-primary hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
