import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCheck } from 'lucide-react';
import { formatPhoneNumber, validateEmail, validatePhone } from '@/hooks/useFormValidation';
import type { ContactField } from '@/hooks/useLeadIdentity';

// ═══════════════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════════════

interface PartialLeadCaptureProps {
  missingFields: ContactField[];
  onSubmit: (data: Partial<Record<ContactField, string>>) => Promise<void>;
  isSubmitting: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Field labels and placeholders
// ═══════════════════════════════════════════════════════════════════════════

const FIELD_CONFIG: Record<ContactField, { label: string; placeholder: string; type: string }> = {
  firstName: { label: 'First Name', placeholder: 'First name', type: 'text' },
  email: { label: 'Email', placeholder: 'you@example.com', type: 'email' },
  phone: { label: 'Phone', placeholder: '(555) 555-5555', type: 'tel' },
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function PartialLeadCapture({ missingFields, onSubmit, isSubmitting }: PartialLeadCaptureProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(missingFields.map(f => [f, '']))
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: ContactField, value: string) => {
    let processed = value;
    if (field === 'phone') processed = formatPhoneNumber(value);
    setValues(prev => ({ ...prev, [field]: processed }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of missingFields) {
      const val = values[field]?.trim();
      if (!val) {
        newErrors[field] = `Please enter your ${FIELD_CONFIG[field].label.toLowerCase()}`;
        continue;
      }
      if (field === 'email' && !validateEmail(val)) {
        newErrors[field] = 'Please enter a valid email address';
      }
      if (field === 'phone' && !validatePhone(val)) {
        newErrors[field] = 'Please enter a valid 10-digit phone number';
      }
      if (field === 'firstName' && val.length < 2) {
        newErrors[field] = 'Please enter your first name';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = useMemo(() => {
    return missingFields.every(field => {
      const val = values[field]?.trim();
      if (!val) return false;
      if (field === 'email') return validateEmail(val);
      if (field === 'phone') return validatePhone(val);
      if (field === 'firstName') return val.length >= 2;
      return true;
    });
  }, [values, missingFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const trimmed: Partial<Record<ContactField, string>> = {};
    for (const field of missingFields) {
      trimmed[field] = values[field]?.trim();
    }
    await onSubmit(trimmed);
  };

  // Contextual nudge message based on what's missing
  const nudgeMessage = missingFields.length === 1 && missingFields[0] === 'phone'
    ? 'Add your phone to complete your account setup.'
    : 'Complete your profile to skip this step next time.';

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">
          Almost There
        </h2>
      </div>

      <p className="text-muted-foreground mb-6">
        {nudgeMessage}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {missingFields.map(field => {
          const config = FIELD_CONFIG[field];
          return (
            <div key={field} className="space-y-2">
              <Label htmlFor={`partial-${field}`}>{config.label}</Label>
              <Input
                id={`partial-${field}`}
                type={config.type}
                value={values[field] || ''}
                onChange={e => handleChange(field, e.target.value)}
                placeholder={config.placeholder}
                className={errors[field] ? 'border-destructive' : ''}
                aria-describedby={errors[field] ? `partial-${field}-error` : undefined}
              />
              {errors[field] && (
                <p id={`partial-${field}-error`} className="text-xs text-destructive">
                  {errors[field]}
                </p>
              )}
            </div>
          );
        })}

        <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Complete Profile'
          )}
        </Button>
      </form>
    </div>
  );
}
