import { useState } from 'react';
import { ArrowRight, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EstimateFormData } from '../EstimateSlidePanel';

interface ContactDetailsStepProps {
  formData: EstimateFormData;
  updateFormData: (updates: Partial<EstimateFormData>) => void;
  onNext: () => void;
}

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone formatting helper
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

/**
 * Render the contact details step of the estimate form.
 *
 * @param formData - Current estimate form values (name, email, phone).
 * @param updateFormData - Callback to apply partial updates to the form data.
 * @param onNext - Callback invoked when the user proceeds to the next step after validation.
 * @returns The contact details step UI as a React element.
 */
export function ContactDetailsStep({ formData, updateFormData, onNext }: ContactDetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Please enter your phone number';
    } else {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 10) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    updateFormData({ phone: formatted });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="John Smith"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className={errors.name ? 'border-destructive' : ''}
          autoComplete="name"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@example.com"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className={errors.email ? 'border-destructive' : ''}
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
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
          type="tel"
          placeholder="(555) 123-4567"
          value={formData.phone}
          onChange={handlePhoneChange}
          className={errors.phone ? 'border-destructive' : ''}
          autoComplete="tel"
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
        <p className="text-xs text-muted-foreground">
          We'll only call if you request it. No spam, ever.
        </p>
      </div>

      {/* Next Button */}
      <Button onClick={handleNext} className="w-full" size="lg">
        Last Step
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}