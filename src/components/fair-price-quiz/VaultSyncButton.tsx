import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSessionData } from '@/hooks/useSessionData';
import { trackEvent } from '@/lib/gtm';
import { PriceAnalysis } from '@/lib/fairPriceCalculations';
import { 
  Vault, 
  Mail, 
  CheckCircle, 
  Loader2, 
  Shield, 
  Target, 
  GitCompare,
  AlertCircle
} from 'lucide-react';

interface VaultSyncButtonProps {
  userEmail: string;
  userName: string;
  analysis: PriceAnalysis;
  variant: 'primary' | 'downsell';
}

export function VaultSyncButton({
  userEmail,
  userName,
  analysis,
  variant,
}: VaultSyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signInWithMagicLink } = useAuth();
  const { updateFields } = useSessionData();

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Persist quiz results to session
      updateFields({
        fairPriceQuizResults: {
          ...analysis,
          analyzedAt: new Date().toISOString(),
        },
        vaultSyncPending: true,
        vaultSyncEmail: userEmail,
        vaultSyncSource: 'fair-price-quiz',
        email: userEmail,
        name: userName,
      });

      // 2. Track the click
      trackEvent('vault_sync_clicked', { 
        source_tool: 'fair-price-quiz',
        analysis_grade: analysis.grade,
      });

      // 3. Send magic link
      const { error: authError } = await signInWithMagicLink(userEmail);

      if (authError) {
        console.error('Magic link error:', authError);
        setError('Failed to send access link. Please try again.');
        setIsLoading(false);
        return;
      }

      // 4. Track successful activation
      trackEvent('vault_activation', {
        source_tool: 'fair-price-quiz',
        method: 'magic_link',
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

  if (showSuccess) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Check Your Inbox to Secure Your Data
            </h3>
            <p className="text-muted-foreground mb-4">
              We just sent a Secure Access Link to <span className="font-medium text-foreground">{userEmail}</span>
            </p>
          </div>

          <div className="text-left space-y-3 bg-card/50 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              Click the link in that email to immediately:
            </p>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Finalize Your Vault Setup</p>
                <p className="text-sm text-muted-foreground">Securely anchor this Fair Price Analysis so you don't lose your progress.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Equip Your Consultant</p>
                <p className="text-sm text-muted-foreground">Allow our expert to review your specific numbers before your call.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GitCompare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Access Comparison Tools</p>
                <p className="text-sm text-muted-foreground">Unlock your dashboard to stack multiple quotes side-by-side.</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>
                <strong>Tip:</strong> If you don't see the email within 60 seconds, check your Promotions or Spam folder to ensure your negotiation ammunition didn't get diverted.
              </span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSync}
        disabled={isLoading}
        size="lg"
        className={`w-full ${variant === 'primary' ? 'glow' : ''}`}
        variant={variant === 'downsell' ? 'outline' : 'default'}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Securing Your Data...
          </>
        ) : (
          <>
            <Vault className="w-4 h-4 mr-2" />
            {variant === 'primary' 
              ? 'Sync My Analysis to My Vault' 
              : 'Save My Data Before it Expires'
            }
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      
      {variant === 'primary' && (
        <p className="text-xs text-center text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" />
          One-click access via secure email link • No password needed
        </p>
      )}
    </div>
  );
}
