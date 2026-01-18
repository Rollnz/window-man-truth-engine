import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { toast } from '@/hooks/use-toast';
import { trustSignals } from '@/data/specChecklistData';

interface SecondaryCTASectionProps {
  id?: string;
  onSuccess?: () => void;
  hasConverted?: boolean;
}

const SecondaryCTASection: React.FC<SecondaryCTASectionProps> = ({ id, onSuccess, hasConverted }) => {
  const [consent, setConsent] = useState(false);

  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll,
  } = useFormValidation({
    initialValues: { firstName: '', email: '' },
    schemas: {
      firstName: commonSchemas.name,
      email: commonSchemas.email,
    },
  });

  const { submit, isSubmitting } = useLeadFormSubmit({
    sourceTool: 'spec-checklist-guide',
    formLocation: 'secondary_cta',
    leadScore: 50,
    successTitle: 'Checklist Unlocked!',
    successDescription: 'Check your email! Your Pre-Installation Audit Checklist is on its way.',
    onSuccess: () => onSuccess?.(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) return;
    
    if (!consent) {
      toast({
        title: "Consent Required",
        description: "Please agree to receive occasional emails to continue.",
        variant: "destructive",
      });
      return;
    }
    
    await submit({ 
      email: values.email, 
      firstName: values.firstName,
      consent,
    });
  };

  // Show success state if already converted
  if (hasConverted) {
    return (
      <section id={id} className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-card rounded-xl p-6 sm:p-8 shadow-lg border border-border">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Checklist Unlocked!</h2>
            <p className="text-muted-foreground">
              Check your email for your Pre-Installation Audit Checklist.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="py-16 sm:py-24 bg-muted/30">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Ready to Protect Your Investment?
          </h2>
          <p className="text-muted-foreground">
            Get your free 4-Packet Audit System now
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 sm:p-8 shadow-lg border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secondaryFirstName" className="text-slate-900 dark:text-foreground font-semibold">First Name</Label>
              <Input 
                id="secondaryFirstName"
                {...getFieldProps('firstName')}
                placeholder="Your first name"
                className={hasError('firstName') ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {hasError('firstName') && (
                <p className="text-xs text-destructive">{getError('firstName')}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondaryEmail" className="text-slate-900 dark:text-foreground font-semibold">Email Address</Label>
              <Input 
                id="secondaryEmail"
                type="email"
                {...getFieldProps('email')}
                placeholder="your@email.com"
                className={hasError('email') ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {hasError('email') && (
                <p className="text-xs text-destructive">{getError('email')}</p>
              )}
            </div>
            
            <div className="flex items-start gap-3 pt-2">
              <Checkbox 
                id="secondaryConsent" 
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                disabled={isSubmitting}
              />
              <Label 
                htmlFor="secondaryConsent" 
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to receive occasional emails with tips on protecting myself during window projects.
              </Label>
            </div>
            
            <Button 
              type="submit" 
              variant="cta"
              size="lg" 
              className="w-full gap-2 mt-4" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Download My Free Audit Checklist'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>

          <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
            {trustSignals.slice(0, 3).map((signal, i) => (
              <span key={i} className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {signal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecondaryCTASection;
