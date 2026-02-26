import { useState, useCallback } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormSurfaceProvider } from '@/components/forms/FormSurfaceProvider';
import { InlineFieldStatus } from '@/components/forms/InlineFieldStatus';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { useAuth } from '@/hooks/useAuth';
import { useFormLock } from '@/hooks/forms';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import { cn } from '@/lib/utils';
import {
  Lock,
  Zap,
  FileText,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
export type VaultThemeVariant = 'vault' | 'engine' | 'report';

export interface VaultSignupModalProps {
  themeVariant: VaultThemeVariant;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
  mode: 'with-quote' | 'no-quote';
}

type ModalPhase = 'form' | 'submitting' | 'success';

// ─── Zod schema ─────────────────────────────────────────
const vaultFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().length(10, 'Enter a valid 10-digit phone number')),
});

type VaultFormValues = z.input<typeof vaultFormSchema>;

// ─── Theme configs ──────────────────────────────────────
interface ThemeConfig {
  icon: React.ReactNode;
  headline: string;
  subtitle: string;
  dialogClass: string;
  headerClass: string;
  headlineClass: string;
  subtitleClass: string;
  labelClass: string;
  buttonClass: string;
  buttonText: string;
  loadingText: string;
  surface: 'default' | 'trust';
  successIconClass: string;
  successTextClass: string;
}

const themeConfigs: Record<VaultThemeVariant, ThemeConfig> = {
  vault: {
    icon: <Lock className="w-6 h-6 text-amber-500" />,
    headline: 'Unlock Your Private Vault',
    subtitle: 'Your window data, protected and organized.',
    dialogClass:
      'bg-[#1a1a1a] border-amber-500/30 text-amber-50 sm:max-w-md',
    headerClass: 'border-b border-amber-500/20 pb-4',
    headlineClass: 'text-amber-100 text-xl font-bold',
    subtitleClass: 'text-amber-200/70 text-sm',
    labelClass: 'text-amber-200/80',
    buttonClass:
      'w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[#1a1a1a] font-semibold hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20',
    buttonText: 'Create Free Vault & Get Link',
    loadingText: 'Securing Vault…',
    surface: 'default',
    successIconClass: 'text-amber-400',
    successTextClass: 'text-amber-100',
  },
  engine: {
    icon: <Zap className="w-6 h-6 text-[#0F766E]" />,
    headline: 'Create Your Free Truth Engine Account',
    subtitle: 'AI-powered window quote intelligence.',
    dialogClass:
      'bg-black/80 backdrop-blur-xl border-[#0F766E]/30 text-white sm:max-w-md',
    headerClass: 'border-b border-[#0F766E]/20 pb-4',
    headlineClass: 'text-white text-xl font-bold',
    subtitleClass: 'text-white/60 text-sm',
    labelClass: 'text-white/70',
    buttonClass:
      'w-full bg-[#0F766E] text-white font-semibold hover:bg-[#0d6b63] shadow-lg shadow-[#0F766E]/30',
    buttonText: 'Create Free Vault & Get Link',
    loadingText: 'Securing Vault…',
    surface: 'default',
    successIconClass: 'text-[#0F766E]',
    successTextClass: 'text-white',
  },
  report: {
    icon: <FileText className="w-6 h-6 text-primary" />,
    headline: 'Secure Your Analysis',
    subtitle: 'Professional-grade window assessment results.',
    dialogClass:
      'bg-background border-border text-foreground sm:max-w-md',
    headerClass: 'border-b border-border pb-4',
    headlineClass: 'text-foreground text-xl font-bold',
    subtitleClass: 'text-muted-foreground text-sm',
    labelClass: 'text-foreground',
    buttonClass: 'w-full',
    buttonText: 'Create Free Vault & Get Link',
    loadingText: 'Securing Vault…',
    surface: 'trust',
    successIconClass: 'text-primary',
    successTextClass: 'text-foreground',
  },
};

// ─── Component ──────────────────────────────────────────
export function VaultSignupModal({
  themeVariant,
  isOpen,
  onClose,
  onSuccess,
  mode: _mode,
}: VaultSignupModalProps) {
  const theme = themeConfigs[themeVariant];

  // ── form state ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phase, setPhase] = useState<ModalPhase>('form');
  const [attempted, setAttempted] = useState(false);
  const [magicLinkWarning, setMagicLinkWarning] = useState<string | null>(null);

  // ── hooks ──
  const leadForm = useLeadFormSubmit({
    sourceTool: 'vault',
    successTitle: '',
    successDescription: '',
  });
  const { signInWithMagicLink } = useAuth();
  const { isLocked, lockAndExecute } = useFormLock();

  // ── validation ──
  const fieldErrors = (() => {
    if (!attempted) return {} as Record<string, string | undefined>;
    const result = vaultFormSchema.safeParse({
      firstName,
      lastName,
      email,
      phone: phoneDigits,
    });
    if (result.success) return {} as Record<string, string | undefined>;
    const flat: Record<string, string | undefined> = {};
    result.error.issues.forEach((i) => {
      const key = String(i.path[0]);
      if (!flat[key]) flat[key] = i.message;
    });
    return flat;
  })();

  const allFilled =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    phoneDigits.length === 10;

  // ── phone masking ──
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
      setPhoneDigits(raw);
      setPhoneDisplay(raw.length === 10 ? formatPhoneDisplay(raw) : raw);
    },
    [],
  );

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    const parsed = vaultFormSchema.safeParse({
      firstName,
      lastName,
      email,
      phone: phoneDigits,
    });
    if (!parsed.success) return;

    setPhase('submitting');

    await lockAndExecute(async () => {
      const [leadResult, magicResult] = await Promise.allSettled([
        leadForm.submit({
          email: parsed.data.email,
          name: `${parsed.data.firstName} ${parsed.data.lastName}`,
          firstName: parsed.data.firstName,
          phone: parsed.data.phone,
        }),
        signInWithMagicLink(parsed.data.email),
      ]);

      // Check lead result
      if (
        leadResult.status === 'rejected' ||
        (leadResult.status === 'fulfilled' && leadResult.value === false)
      ) {
        // Lead save failed → stay on form
        setPhase('form');
        return;
      }

      // Lead succeeded → go to success
      const leadId =
        leadResult.status === 'fulfilled' && typeof leadResult.value === 'string'
          ? leadResult.value
          : '';

      // Check magic link
      if (
        magicResult.status === 'rejected' ||
        (magicResult.status === 'fulfilled' && magicResult.value?.error)
      ) {
        setMagicLinkWarning(
          'Your info is saved, but the email didn\'t send. Try again in a few minutes.',
        );
      }

      setPhase('success');
      onSuccess?.(leadId);
    });
  };

  // ── reset on close ──
  const handleClose = () => {
    if (phase !== 'submitting') {
      setPhase('form');
      setAttempted(false);
      setMagicLinkWarning(null);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneDisplay('');
      setPhoneDigits('');
      onClose();
    }
  };

  // ── input styling for dark variants ──
  const darkInputClass =
    themeVariant === 'vault'
      ? 'bg-amber-950/30 border-amber-500/30 text-amber-50 placeholder:text-amber-300/30 focus-visible:ring-amber-500/50'
      : themeVariant === 'engine'
        ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-[#0F766E]/50'
        : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn(theme.dialogClass, 'gap-0')}>
        <FormSurfaceProvider surface={theme.surface}>
          {/* ── HEADER ── */}
          <DialogHeader className={theme.headerClass}>
            <div className="flex items-center gap-3">
              {theme.icon}
              <div>
                <DialogTitle className={theme.headlineClass}>
                  {theme.headline}
                </DialogTitle>
                <DialogDescription className={theme.subtitleClass}>
                  {theme.subtitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* ── FORM ── */}
          {phase !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              {/* Row: First + Last */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={theme.labelClass}>First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className={darkInputClass}
                    disabled={phase === 'submitting'}
                  />
                  <InlineFieldStatus
                    isValid={!fieldErrors.firstName}
                    error={fieldErrors.firstName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={theme.labelClass}>Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className={darkInputClass}
                    disabled={phase === 'submitting'}
                  />
                  <InlineFieldStatus
                    isValid={!fieldErrors.lastName}
                    error={fieldErrors.lastName}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className={theme.labelClass}>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className={darkInputClass}
                  disabled={phase === 'submitting'}
                />
                <InlineFieldStatus
                  isValid={!fieldErrors.email}
                  error={fieldErrors.email}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className={theme.labelClass}>Phone</Label>
                <Input
                  type="tel"
                  value={phoneDisplay}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className={darkInputClass}
                  disabled={phase === 'submitting'}
                />
                <InlineFieldStatus
                  isValid={!fieldErrors.phone}
                  error={fieldErrors.phone}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className={theme.buttonClass}
                disabled={!allFilled || isLocked || phase === 'submitting'}
              >
                {phase === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {theme.loadingText}
                  </>
                ) : (
                  theme.buttonText
                )}
              </Button>

              <p className="text-xs text-center opacity-50">
                Free forever. No spam, ever. We never sell your data.
              </p>
            </form>
          )}

          {/* ── SUCCESS ── */}
          {phase === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              {magicLinkWarning ? (
                <>
                  <AlertTriangle className={cn('w-12 h-12', 'text-amber-500')} />
                  <h3 className={cn('text-lg font-semibold', theme.successTextClass)}>
                    Almost There!
                  </h3>
                  <p className={cn('text-sm max-w-xs', theme.subtitleClass)}>
                    {magicLinkWarning}
                  </p>
                </>
              ) : (
                <>
                  <div className="relative">
                    <CheckCircle2
                      className={cn('w-12 h-12', theme.successIconClass)}
                    />
                    <Mail
                      className={cn(
                        'w-5 h-5 absolute -bottom-1 -right-1',
                        theme.successIconClass,
                      )}
                    />
                  </div>
                  <h3 className={cn('text-lg font-semibold', theme.successTextClass)}>
                    Vault Created!
                  </h3>
                  <p className={cn('text-sm max-w-xs', theme.subtitleClass)}>
                    Check your email for your secure Magic Link to enter.
                  </p>
                </>
              )}

              <Button
                variant="ghost"
                onClick={handleClose}
                className={cn('mt-2', theme.labelClass)}
              >
                Close
              </Button>
            </div>
          )}
        </FormSurfaceProvider>
      </DialogContent>
    </Dialog>
  );
}
