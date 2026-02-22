import { useState } from 'react';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function getOAuthErrorMessage(error: unknown): { title: string; description: string } {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();

  if (msg.includes('redirect_uri_mismatch'))
    return { title: 'Configuration issue', description: "Google sign-in isn't available in this environment. Please try from the published app." };
  if (msg.includes('access_denied') || msg.includes('user_denied'))
    return { title: 'Sign-in cancelled', description: 'You cancelled the Google sign-in. You can try again anytime.' };
  if (msg.includes('popup_closed') || msg.includes('popup_blocked'))
    return { title: 'Pop-up blocked', description: 'Your browser blocked the sign-in window. Please allow pop-ups and try again.' };
  if (msg.includes('network') || msg.includes('fetch'))
    return { title: 'Connection problem', description: "Couldn't reach Google. Check your internet connection and try again." };
  if (msg.includes('temporarily_unavailable') || msg.includes('server_error'))
    return { title: 'Google is unavailable', description: 'Google sign-in is temporarily down. Please try again in a few minutes.' };

  return { title: 'Sign-in failed', description: 'Something went wrong with Google sign-in. Please try again or use email instead.' };
}

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
}

export function GoogleSignInButton({ mode = 'signin' }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      const error = result?.error ? (result.error instanceof Error ? result.error : new Error(String(result.error))) : null;
      
      if (error) {
        const { title, description } = getOAuthErrorMessage(error);
        toast({ title, description, variant: "destructive" });
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      const { title, description } = getOAuthErrorMessage(err);
      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
    </Button>
  );
}
