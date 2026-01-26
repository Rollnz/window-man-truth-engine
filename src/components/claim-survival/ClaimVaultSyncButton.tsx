import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData } from '@/hooks/useSessionData';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { trackEvent } from '@/lib/gtm';
import { AnalysisResult } from '@/hooks/useEvidenceAnalysis';
import { 
  Vault, 
  Mail, 
  CheckCircle, 
  Loader2, 
  Shield, 
  FileCheck,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

interface ClaimVaultSyncButtonProps {
  analysis: AnalysisResult;
  variant?: 'primary' | 'compact';
}

export function ClaimVaultSyncButton({
  analysis,
  variant = 'primary',
}: ClaimVaultSyncButtonProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const { signInWithMagicLink, user } = useAuth();
  const { sessionData, updateFields } = useSessionData();
  const { hasIdentity } = useLeadIdentity();

  // Pre-fill from session data
  const prefilledEmail = sessionData.email || '';
  const prefilledName = sessionData.firstName 
    ? `${sessionData.firstName} ${sessionData.lastName || ''}`.trim()
    : sessionData.name || '';

  // Check if user is already logged in
  const isAuthenticated = !!user;

  const handleSync = async () => {
    const emailToUse = email || prefilledEmail;
    const nameToUse = name || prefilledName;

    if (!emailToUse) {
      setError('Please enter your email address.');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Persist analysis results to session for vault sync
      updateFields({
        claimAnalysisResult: {
          ...analysis,
          analyzedAt: analysis.analyzedAt || new Date().toISOString(),
        },
        vaultSyncPending: true,
        vaultSyncEmail: emailToUse,
        vaultSyncSource: 'other',
        email: emailToUse,
        name: nameToUse,
        sourceTool: 'claim-survival-kit',
      });

      // 2. Track the click
      trackEvent('vault_sync_clicked', { 
        source_tool: 'claim-survival-kit',
        analysis_score: analysis.overallScore,
        analysis_status: analysis.status,
      });

      // 3. Send magic link for account creation/access
      const { error: authError } = await signInWithMagicLink(emailToUse);

      if (authError) {
        console.error('Magic link error:', authError);
        setError('Failed to send access link. Please try again.');
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
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Already authenticated - show simpler state
  if (isAuthenticated) {
    return (
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">Analysis Saved to Your Vault</p>
            <p className="text-xs text-muted-foreground truncate">
              Logged in as {user.email}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Success state - email sent
  if (showSuccess) {
    const displayEmail = email || prefilledEmail;
    return (
      <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              Check Your Inbox
            </h3>
            <p className="text-sm text-muted-foreground">
              We sent a secure access link to{' '}
              <span className="font-medium text-foreground">{displayEmail}</span>
            </p>
          </div>

          <div className="text-left space-y-2 bg-card/50 rounded-lg p-3">
            <p className="text-xs font-medium text-foreground mb-2">
              Click the link to:
            </p>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Save Your Analysis</p>
                <p className="text-xs text-muted-foreground">Keep your {analysis.overallScore}% readiness score safe</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Access Your Documents</p>
                <p className="text-xs text-muted-foreground">All your uploaded evidence in one place</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ClipboardList className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Track Your Progress</p>
                <p className="text-xs text-muted-foreground">Resume your checklist anytime</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            <p className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" />
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
        <Vault className="w-4 h-4 mr-2" />
        Save Analysis to My Vault
      </Button>
    );
  }

  // Form state - collect email
  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Vault className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Save Your Analysis
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create a free account to preserve your {analysis.overallScore}% readiness score and documents
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="vault-email" className="text-xs font-medium">
              Email Address
            </Label>
            <Input
              id="vault-email"
              type="email"
              placeholder="you@example.com"
              value={email || prefilledEmail}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-9"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="vault-name" className="text-xs font-medium">
              Name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="vault-name"
              type="text"
              placeholder="Your name"
              value={name || prefilledName}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className="h-9"
            />
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending Access Link...
            </>
          ) : (
            <>
              <Vault className="w-4 h-4 mr-2" />
              Save to My Vault
            </>
          )}
        </Button>
        
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        
        <p className="text-xs text-center text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" />
          Secure one-click access via email • No password required
        </p>
      </div>
    </Card>
  );
}
