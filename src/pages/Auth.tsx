import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Vault, Loader2, LogIn, UserPlus, KeyRound, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SEO } from '@/components/SEO';
import { ROUTES } from '@/config/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

const STORAGE_KEY = 'impact-windows-session';

type AuthMode = 'login' | 'signup' | 'set-password' | 'forgot-password' | 'reset-password';

export default function Auth() {
  usePageTracking('auth');
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Determine initial mode from URL
  const getModeFromParams = (): AuthMode => {
    const mode = searchParams.get('mode');
    if (mode === 'signup' || mode === 'set-password' || mode === 'forgot-password' || mode === 'reset-password') {
      return mode;
    }
    return 'login';
  };
  
  const [mode, setMode] = useState<AuthMode>(getModeFromParams);
  
  const { isAuthenticated, loading, hasPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Update mode when URL changes (e.g., from magic link redirect)
  useEffect(() => {
    const urlMode = getModeFromParams();
    setMode(urlMode);
  }, [searchParams]);

  // Handle authenticated user routing
  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Check if user needs to set password
      if (hasPassword === false && mode !== 'set-password') {
        setMode('set-password');
        return;
      }
      
      // If user has password and isn't in password setup, redirect
      if (hasPassword === true && mode !== 'set-password' && mode !== 'reset-password') {
        // Check for pending Vault sync from Fair Price Quiz
        try {
          const storedData = localStorage.getItem(STORAGE_KEY);
          if (storedData) {
            const sessionData = JSON.parse(storedData);
            if (sessionData.vaultSyncPending) {
              toast({
                title: "Welcome back!",
                description: "Your Fair Price Analysis is ready in your Vault.",
              });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
        
        const redirectTo = searchParams.get('redirect') || ROUTES.VAULT;
        navigate(redirectTo);
      }
    }
  }, [isAuthenticated, loading, hasPassword, mode, navigate, searchParams, toast]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    const newParams = new URLSearchParams(searchParams);
    if (newMode === 'login') {
      newParams.delete('mode');
    } else {
      newParams.set('mode', newMode);
    }
    setSearchParams(newParams);
  };

  const handleSuccess = () => {
    const redirectTo = searchParams.get('redirect') || ROUTES.VAULT;
    navigate(redirectTo);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get title, description, and icon based on mode
  const getModeConfig = () => {
    switch (mode) {
      case 'signup':
        return {
          title: 'Create Your Account',
          description: 'Enter your email to get started. We\'ll send you a verification link.',
          icon: UserPlus,
        };
      case 'set-password':
        return {
          title: 'Create Your Password',
          description: 'Set a secure password to complete your account setup.',
          icon: KeyRound,
        };
      case 'forgot-password':
        return {
          title: 'Reset Your Password',
          description: 'Enter your email and we\'ll send you a reset link.',
          icon: Mail,
        };
      case 'reset-password':
        return {
          title: 'Set New Password',
          description: 'Enter a new password for your account.',
          icon: KeyRound,
        };
      default:
        return {
          title: 'Welcome Back',
          description: 'Sign in to access your Vault and saved results.',
          icon: LogIn,
        };
    }
  };

  const { title, description, icon: Icon } = getModeConfig();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={title}
        description="Sign in to your Window Man Vault to access your saved results, checklists, and personalized window recommendations."
        canonicalUrl="https://itswindowman.com/auth"
      />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.HOME}>
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
              {mode === 'set-password' || mode === 'reset-password' ? (
                <Icon className="w-6 h-6 text-primary" />
              ) : (
                <Vault className="w-6 h-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            {mode === 'login' && (
              <LoginForm
                onForgotPassword={() => handleModeChange('forgot-password')}
                onSignup={() => handleModeChange('signup')}
                onSuccess={handleSuccess}
              />
            )}
            
            {mode === 'signup' && (
              <SignupForm
                onLogin={() => handleModeChange('login')}
              />
            )}
            
            {mode === 'set-password' && (
              <SetPasswordForm
                onSuccess={handleSuccess}
              />
            )}
            
            {mode === 'forgot-password' && (
              <ForgotPasswordForm
                onBack={() => handleModeChange('login')}
              />
            )}
            
            {mode === 'reset-password' && (
              <ResetPasswordForm
                onSuccess={handleSuccess}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
