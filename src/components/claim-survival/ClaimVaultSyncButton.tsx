import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData } from '@/hooks/useSessionData';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { trackEvent } from '@/lib/gtm';
import { toast } from '@/hooks/use-toast';
import { AnalysisResult } from '@/hooks/useEvidenceAnalysis';
import { 
  Vault, 
  Mail, 
  CheckCircle, 
  Loader2, 
  Shield, 
  FileCheck,
  ClipboardList,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ClaimVaultSyncButtonProps {
  analysis: AnalysisResult;
  variant?: 'primary' | 'compact';
}

export function ClaimVaultSyncButton({
  analysis,
  variant = 'primary',
}: ClaimVaultSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  
  const { signInWithMagicLink, user } = useAuth();
  const { sessionData, updateFields } = useSessionData();

  // Phase 1: Use useFormValidation for proper controlled inputs
  const {
    values,
    setValues,
    getFieldProps,
    validateAll,
    hasError,
    getError,
  } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
    schemas: {
      firstName: commonSchemas.firstName,
      lastName: commonSchemas.lastName,
      email: commonSchemas.email,
    },
  });

  // Phase 1: Initialize from session data ONCE on mount (not in render)
  useEffect(() => {
    const newValues = { ...values };
    let hasChanges = false;

    if (sessionData.firstName && !values.firstName) {
      newValues.firstName = sessionData.firstName;
      hasChanges = true;
    }
    if (sessionData.lastName && !values.lastName) {
      newValues.lastName = sessionData.lastName;
      hasChanges = true;
    }
    if (sessionData.email && !values.email) {
      newValues.email = sessionData.email;
      hasChanges = true;
    }

    if (hasChanges) {
      setValues(newValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps = mount only

  // Check if user is already logged in
  const isAuthenticated = !!user;

  // Phase 4: Auto-sync for authenticated users
  useEffect(() => {
    if (isAuthenticated && !hasSynced && analysis && user?.email) {
      // Auto-save analysis to user's vault
      updateFields({
        claimAnalysisResult: {
          ...analysis,
          analyzedAt: analysis.analyzedAt || new Date().toISOString(),
        },
        vaultSyncPending: false,
        email: user.email,
        sourceTool: 'claim-survival-kit',
      });
      
      trackEvent('vault_auto_sync', {
        source_tool: 'claim-survival-kit',
        analysis_score: analysis.overallScore,
        user_authenticated: true,
      });
      
      setHasSynced(true);
    }
  }, [isAuthenticated, hasSynced, analysis, user, updateFields]);

  const handleSync = async () => {
    // Phase 1: Validate all fields before submission
    if (!validateAll()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. Persist analysis results to session for vault sync
      updateFields({
        claimAnalysisResult: {
          ...analysis,
          analyzedAt: analysis.analyzedAt || new Date().toISOString(),
        },
        vaultSyncPending: true,
        vaultSyncEmail: values.email,
        vaultSyncSource: 'other',
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        sourceTool: 'claim-survival-kit',
      });

      // 2. Track the click
      trackEvent('vault_sync_clicked', {
        source_tool: 'claim-survival-kit',
        analysis_score: analysis.overallScore,
        analysis_status: analysis.status,
      });

      // 3. Send magic link for account creation/access
      const { error: authError } = await signInWithMagicLink(values.email);

      if (authError) {
        console.error('Magic link error:', authError);
        toast({
          title: "Couldn't send access link",
          description: authError.message || "Please check your email address and try again.",
          variant: "destructive",
        });
        trackEvent('vault_sync_error', {
          source_tool: 'claim-survival-kit',
          error_type: 'magic_link_failed',
          error_message: authError.message,
        });
        setIsLoading(false);
        return;
      }

      // 4. Track successful activation
      trackEvent('vault_activation', {
        source_tool: 'claim-survival-kit',
        method: 'magic_link',
        analysis_score: analysis.overallScore,
      });

      // 5. Show success state
      setShowSuccess(true);
    } catch (err) {
      console.error('Vault sync error:', err);
      toast({
        title: "Something went wrong",
        description: "We couldn't save your analysis. Please try again.",
        variant: "destructive",
      });
      trackEvent('vault_sync_error', {
        source_tool: 'claim-survival-kit',
        error_type: 'sync_failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 4: Enhanced authenticated state with auto-sync and vault link
  if (isAuthenticated) {
    return (
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">
              {hasSynced ? 'Analysis Synced to Your Vault' : 'Syncing to Vault...'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Logged in as {user.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <a href="/vault" aria-label="Manage your evidence vault">
              <span className="hidden sm:inline">Manage Vault</span>
              <ExternalLink className="w-4 h-4 sm:ml-1" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </Card>
    );
  }

  // Success state - email sent
  if (showSuccess) {
    return (
      <Card 
        className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Check Your Inbox
            </h3>
            <p className="text-sm text-muted-foreground">
              We sent a secure access link to{' '}
              <span className="font-medium text-foreground">{values.email}</span>
            </p>
          </div>

          <div className="text-left space-y-2 bg-card/50 rounded-lg p-3" role="list" aria-label="Next steps after clicking the link">
            <p className="text-xs font-medium text-foreground mb-2">
              Click the link to:
            </p>
            <div className="flex items-start gap-2" role="listitem">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">Save Your Analysis</p>
                <p className="text-xs text-muted-foreground">Keep your {analysis.overallScore}% readiness score safe</p>
              </div>
            </div>
            <div className="flex items-start gap-2" role="listitem">
              <FileCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">Access Your Documents</p>
                <p className="text-xs text-muted-foreground">All your uploaded evidence in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-2" role="listitem">
              <ClipboardList className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">Track Your Progress</p>
                <p className="text-xs text-muted-foreground">Resume your checklist anytime</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            <p className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              <span>Check Spam/Promotions if you don't see it</span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Compact variant - just a button that expands
  if (variant === 'compact' && !showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        className="w-full border-primary/30 hover:bg-primary/5"
      >
        <Vault className="w-4 h-4 mr-2" aria-hidden="true" />
        Save Analysis to My Vault
      </Button>
    );
  }

  // Phase 1 & 3: Form state with proper controlled inputs, validation, and ARIA
  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Vault className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Save Your Analysis
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a free account to preserve your {analysis.overallScore}% readiness score and documents
          </p>
        </div>

        {/* Phase 1: 2x2 grid layout matching Kitchen Table pattern */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vault-firstName" className="text-xs font-medium">
                First Name
              </Label>
              <Input
                id="vault-firstName"
                type="text"
                placeholder="First name"
                {...getFieldProps('firstName')}
                disabled={isLoading}
                className={`h-9 bg-white border-slate-300 ${hasError('firstName') ? 'border-destructive' : ''}`}
                aria-required="true"
                aria-invalid={hasError('firstName')}
                aria-describedby={hasError('firstName') ? 'vault-firstName-error' : undefined}
              />
              {hasError('firstName') && (
                <p id="vault-firstName-error" className="text-xs text-destructive" role="alert">
                  {getError('firstName')}
                </p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="vault-lastName" className="text-xs font-medium">
                Last Name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="vault-lastName"
                type="text"
                placeholder="Last name"
                {...getFieldProps('lastName')}
                disabled={isLoading}
                className="h-9 bg-white border-slate-300"
                aria-describedby={hasError('lastName') ? 'vault-lastName-error' : undefined}
              />
              {hasError('lastName') && (
                <p id="vault-lastName-error" className="text-xs text-destructive" role="alert">
                  {getError('lastName')}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="vault-email" className="text-xs font-medium">
              Email Address
            </Label>
            <Input
              id="vault-email"
              type="email"
              placeholder="you@example.com"
              {...getFieldProps('email')}
              disabled={isLoading}
              className={`h-9 bg-white border-slate-300 ${hasError('email') ? 'border-destructive' : ''}`}
              aria-required="true"
              aria-invalid={hasError('email')}
              aria-describedby={hasError('email') ? 'vault-email-error' : undefined}
            />
            {hasError('email') && (
              <p id="vault-email-error" className="text-xs text-destructive" role="alert">
                {getError('email')}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={isLoading}
          className="w-full text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              Sending Access Link...
            </>
          ) : (
            <>
              <Vault className="w-4 h-4 mr-2" aria-hidden="true" />
              Save to My Vault
            </>
          )}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" aria-hidden="true" />
          Secure one-click access via email • No password required
        </p>
      </div>
    </Card>
  );
}
