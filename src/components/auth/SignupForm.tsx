import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/navigation';

const emailSchema = z.string().email('Please enter a valid email address');

interface SignupFormProps {
  onLogin: () => void;
}

export function SignupForm({ onLogin }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error: authError } = await signUp(email);
      
      if (authError) {
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
          description: "We've sent you a verification link to create your account.",
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Check your email</h3>
          <p className="text-muted-foreground text-sm">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="text-muted-foreground text-sm">
            Click the link to verify your email and create your password.
          </p>
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
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
            autoComplete="email"
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
          'Continue with Email'
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        We'll send you a link to verify your email and create a password.
      </p>
      
      <div className="text-center">
        <span className="text-sm text-muted-foreground">Already have an account? </span>
        <Button 
          type="button"
          variant="link" 
          onClick={onLogin}
          className="p-0 h-auto text-sm"
        >
          Sign in
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link to={ROUTES.TERMS} className="underline hover:text-foreground">
          Terms
        </Link>{' '}
        and{' '}
        <Link to={ROUTES.PRIVACY} className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
