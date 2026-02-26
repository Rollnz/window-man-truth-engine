import { useState } from 'react';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NameInputPair, normalizeNameFields } from '@/components/ui/NameInputPair';
import { generateEventId } from '@/lib/gtm';
import { getOrCreateClientId, getOrCreateSessionId } from '@/lib/tracking';
import { getLeadAnchor } from '@/lib/leadAnchor';
import { emailInputProps, phoneInputProps } from '@/lib/formAccessibility';
import { formMicroCopy } from '@/components/forms/InlineFieldStatus';
import { formatPhoneNumber, validateEmail } from '@/hooks/useFormValidation';
import type { EstimateFormData } from '../EstimateSlidePanel';

interface ContactDetailsStepProps {
  formData: EstimateFormData;
  updateFormData: (updates: Partial<EstimateFormData>) => void;
  onNext: () => void;
}

export function ContactDetailsStep({ formData, updateFormData, onNext }: ContactDetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Normalize name before validation
    const { firstName, lastName } = normalizeNameFields(formData.firstName, formData.lastName);
    
    if (!firstName) {
      newErrors.firstName = 'Please enter your first name';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length !== 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      // Normalize before proceeding
      const { firstName, lastName } = normalizeNameFields(formData.firstName, formData.lastName);
      updateFormData({ firstName, lastName });
      
      const externalId = getLeadAnchor() || null;
      
      // Fire structured GTM dataLayer event with identity enrichment
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'lead_form_step_completed',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: 'floating_slide_over',
        source_system: 'web',
        form_name: 'floating_slide_over',
        step_name: 'contact_info',
        step_index: 2,
        step_status: 'validated',
      });
      onNext();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateFormData({ phone: formatted });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Name (First/Last) */}
      <NameInputPair
        firstName={formData.firstName}
        lastName={formData.lastName}
        onFirstNameChange={(value) => updateFormData({ firstName: value })}
        onLastNameChange={(value) => updateFormData({ lastName: value })}
        errors={{ firstName: errors.firstName, lastName: errors.lastName }}
        showIcon
        autoFocus
      />

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          {...emailInputProps}
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className={errors.email ? 'border-destructive' : ''}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
        />
        {errors.email ? (
          <p id="email-error" className="text-sm text-destructive" role="alert">{errors.email}</p>
        ) : (
          <p id="email-hint" className="text-xs text-muted-foreground">{formMicroCopy.email}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Phone Number
        </Label>
        <Input
          id="phone"
          name="phone"
          {...phoneInputProps}
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={handlePhoneChange}
          className={errors.phone ? 'border-destructive' : ''}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
        />
        {errors.phone ? (
          <p id="phone-error" className="text-sm text-destructive" role="alert">{errors.phone}</p>
        ) : (
          <p id="phone-hint" className="text-xs text-muted-foreground">{formMicroCopy.phone}</p>
        )}
      </div>

      {/* Next Button */}
      <Button onClick={handleNext} className="w-full" size="lg">
        Last Step
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
