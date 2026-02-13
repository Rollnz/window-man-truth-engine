import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Zap, Loader2 } from 'lucide-react';
import type { ContactData, ContactFormErrors } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// Validation helpers (same as V1 for consistency)
// ═══════════════════════════════════════════════════════════════════════════

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface LeadStep1CaptureProps {
  onSubmit: (data: ContactData) => Promise<void>;
  isSubmitting: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function LeadStep1Capture({ onSubmit, isSubmitting }: LeadStep1CaptureProps) {
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ContactData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});

  useEffect(() => {
    setTimeout(() => firstNameRef.current?.focus(), 100);
  }, []);

  const handleChange = (field: keyof ContactData, value: string) => {
    let processedValue = value;
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    }
    setFormData((prev) => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: ContactFormErrors = {};
    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'Please enter your first name';
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = 'Please enter your last name';
    }
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const isFormValid =
    formData.firstName.length >= 2 &&
    formData.lastName.length >= 2 &&
    validateEmail(formData.email) &&
    validatePhone(formData.phone);

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground" id="v2-modal-title">
          Get Ready to Outsmart the Sales Pitch
        </h2>
      </div>

      <p className="text-muted-foreground mb-4">
        When a contractor hands you a quote, you'll have seconds to decide if you trust it.
      </p>

      <div className="space-y-2 mb-6">
        <p className="text-sm text-foreground">Set up now so you can:</p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Upload quotes instantly from your phone</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Get real-time analysis while the contractor waits</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Know exactly what questions to ask on the spot</span>
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="v2-firstName">First Name</Label>
            <Input
              ref={firstNameRef}
              id="v2-firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="First name"
              aria-describedby={errors.firstName ? 'v2-firstName-error' : undefined}
              className={errors.firstName ? 'border-destructive' : ''}
            />
            {errors.firstName && (
              <p id="v2-firstName-error" className="text-xs text-destructive">
                {errors.firstName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="v2-lastName">Last Name</Label>
            <Input
              id="v2-lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Last name"
              aria-describedby={errors.lastName ? 'v2-lastName-error' : undefined}
              className={errors.lastName ? 'border-destructive' : ''}
            />
            {errors.lastName && (
              <p id="v2-lastName-error" className="text-xs text-destructive">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="v2-email">Email</Label>
          <Input
            id="v2-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@example.com"
            aria-describedby={errors.email ? 'v2-email-error' : undefined}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p id="v2-email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="v2-phone">Phone</Label>
          <Input
            id="v2-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(555) 555-5555"
            aria-describedby={errors.phone ? 'v2-phone-error' : 'v2-phone-help'}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone ? (
            <p id="v2-phone-error" className="text-xs text-destructive">
              {errors.phone}
            </p>
          ) : (
            <p id="v2-phone-help" className="text-xs text-muted-foreground">
              We'll text you a secure upload link.
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create My Free Account'
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          No spam. No obligations. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
