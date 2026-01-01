import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { SessionData } from '@/hooks/useSessionData';
import { IntelResource } from '@/data/intelData';
import { Mail, Check, Loader2, Unlock } from 'lucide-react';

interface IntelLeadModalProps {
  isOpen: boolean;
  resource: IntelResource | null;
  onClose: () => void; // Called on X click - treated as skip
  onSuccess: (leadId: string) => void;
  sessionData: SessionData;
}

export function IntelLeadModal({
  isOpen,
  resource,
  onClose,
  onSuccess,
  sessionData,
}: IntelLeadModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { values, hasError, getError, getFieldProps, validateAll } = useFormValidation({
    initialValues: { email: sessionData.email || '' },
    schemas: { email: commonSchemas.email },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: 'Invalid Email',
        description: getError('email') || 'Please check your email',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email: values.email.trim(),
            name: sessionData.name || null,
            phone: sessionData.phone || null,
            sourceTool: 'intel-library',
            sessionData,
            chatHistory: [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await response.json();

      if (data.success && data.leadId) {
        setIsSuccess(true);
        toast({
          title: 'Document Unlocked!',
          description: 'Access granted. Redirecting...',
        });
        
        setTimeout(() => {
          onSuccess(data.leadId);
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Lead capture error:', error);
      toast({
        title: 'Unable to save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Soft gate: close button triggers skip behavior
  const handleClose = () => {
    if (!isLoading) {
      setIsSuccess(false);
      onClose(); // Parent handles skip logic (redirect if landing page exists)
    }
  };

  const emailProps = getFieldProps('email');
  const emailHasError = hasError('email');
  const emailError = getError('email');

  if (!resource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">Document Unlocked!</DialogTitle>
            <DialogDescription>
              Access granted. Redirecting you now...
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              {/* Dynamic book cover display */}
              {resource.bookImageUrl && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={resource.bookImageUrl} 
                    alt={resource.title}
                    className="h-32 w-auto object-contain drop-shadow-lg"
                  />
                </div>
              )}
              {!resource.bookImageUrl && (
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Unlock className="w-6 h-6 text-primary" />
                  </div>
                </div>
              )}
              <DialogTitle className="text-center">
                Unlock: {resource.title}
              </DialogTitle>
              <DialogDescription className="text-center">
                Enter your email to access this resource and save it to your vault.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="intel-email" className={emailHasError ? 'text-destructive' : ''}>
                  Email Address
                </Label>
                <Input
                  id="intel-email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailProps}
                  disabled={isLoading}
                  autoFocus
                  className={emailHasError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={emailHasError}
                  aria-describedby={emailHasError ? 'intel-email-error' : undefined}
                />
                {emailHasError && (
                  <p id="intel-email-error" className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !values.email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Unlock & Access
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                No spam. Just your document + helpful resources.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
