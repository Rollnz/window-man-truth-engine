import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

interface SetPasswordFormProps {
  onSuccess: () => void;
}

export function SetPasswordForm({ onSuccess }: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setPassword: setUserPassword, user } = useAuth();
  const { toast } = useToast();

  // Password strength indicators
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error: authError } = await setUserPassword(password);
      
      if (authError) {
        setError(authError.message);
        toast({
          title: "Error",
          description: authError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password created!",
          description: "You can now sign in with your email and password.",
        });
        onSuccess();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CheckItem = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <CheckCircle className="w-4 h-4 text-primary" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground" />
      )}
      <span className={passed ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {user?.email && (
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Creating password for <strong>{user.email}</strong>
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="pl-10 pr-10"
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Password strength checklist */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <CheckItem passed={checks.length} label="At least 8 characters" />
        <CheckItem passed={checks.uppercase} label="One uppercase letter" />
        <CheckItem passed={checks.lowercase} label="One lowercase letter" />
        <CheckItem passed={checks.number} label="One number" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            className="pl-10 pr-10"
            required
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-sm text-destructive">Passwords don't match</p>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating password...
          </>
        ) : (
          'Create Password'
        )}
      </Button>
    </form>
  );
}
