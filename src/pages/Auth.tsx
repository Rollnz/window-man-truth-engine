import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Vault, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

export default function Auth() {
  usePageTracking('auth');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithMagicLink, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/vault';
      navigate(redirectTo);
    }
  }, [isAuthenticated, loading, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error: authError } = await signInWithMagicLink(email);
      
      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        toast({
          title: "Error",
          description: authError.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Check your inbox",
          description: "We've sent you a magic link to access your Vault.",
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Vault className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              {emailSent ? 'Check Your Email' : 'Access Your Vault'}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? `We've sent a magic link to ${email}. Click it to access your Vault.`
                : 'Enter your email to receive a passwordless login link.'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {emailSent ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Didn't receive it? Check your spam folder or
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setEmailSent(false)}
                    className="p-0 h-auto"
                  >
                    try again with a different email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      className="pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you agree to our{' '}
                  <Link to="/legal/terms" className="underline hover:text-foreground">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/legal/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
