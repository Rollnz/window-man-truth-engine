import { useState } from 'react';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SessionData } from '@/hooks/useSessionData';
import { Calendar, Check, Loader2 } from 'lucide-react';

interface ConsultationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId?: string;
  sessionData: SessionData;
}

const consultationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number').max(20, 'Phone number is too long'),
  preferredTime: z.string().min(1, 'Please select a preferred time'),
});

const timeOptions = [
  { value: 'morning', label: 'Morning (9am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 8pm)' },
  { value: 'asap', label: 'ASAP - Call me now!' },
];

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  preferredTime?: string;
};

export function ConsultationBookingModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  sessionData,
}: ConsultationBookingModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: sessionData.name || '',
    email: sessionData.email || '',
    phone: sessionData.phone || '',
    preferredTime: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    const fieldSchemas = {
      name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
      email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
      phone: z.string().min(10, 'Please enter a valid phone number').max(20, 'Phone number is too long'),
      preferredTime: z.string().min(1, 'Please select a preferred time'),
    };
    
    const result = fieldSchemas[field].safeParse(value);
    return result.success ? undefined : result.error.errors[0].message;
  };

  const handleBlur = (field: keyof FieldErrors) => {
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FieldErrors = {};
    (Object.keys(formData) as Array<keyof typeof formData>).forEach(field => {
      if (field !== 'notes') {
        const error = validateField(field as keyof FieldErrors, formData[field]);
        if (error) newErrors[field as keyof FieldErrors] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Please fix the errors',
        description: 'Some fields need your attention.',
        variant: 'destructive',
      });
      return;
    }

    setErrors({});

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
            email: formData.email.trim(),
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            sourceTool: 'expert-system',
            sessionData,
            consultation: {
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              preferredTime: formData.preferredTime,
              notes: formData.notes.trim() || undefined,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to schedule');
      }

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        toast({
          title: 'Consultation Requested!',
          description: "We'll contact you within 24 hours.",
        });
        
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to schedule');
      }
    } catch (error) {
      console.error('Consultation booking error:', error);
      toast({
        title: 'Unable to schedule',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsSuccess(false);
      setFormData({
        name: sessionData.name || '',
        email: sessionData.email || '',
        phone: sessionData.phone || '',
        preferredTime: '',
        notes: '',
      });
      onClose();
    }
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const updateField = (field: string, value: string) => {
    // Apply phone formatting if it's the phone field
    const processedValue = field === 'phone' ? formatPhoneNumber(value) : value;
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    // Clear error when user starts typing
    if (errors[field as keyof FieldErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">Consultation Requested!</DialogTitle>
            <DialogDescription>
              Thanks! A window expert will contact you within 24 hours.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center">Schedule a Free Consultation</DialogTitle>
              <DialogDescription className="text-center">
                Get personalized advice from a local window expert at no cost.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={errors.name ? 'text-destructive' : ''}>
                  Your Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  disabled={isLoading}
                  className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="consult-email" className={errors.email ? 'text-destructive' : ''}>
                  Email Address
                </Label>
                <Input
                  id="consult-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isLoading}
                  className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={errors.phone ? 'text-destructive' : ''}>
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  disabled={isLoading}
                  className={errors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-time" className={errors.preferredTime ? 'text-destructive' : ''}>
                  Best Time to Call
                </Label>
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => {
                    updateField('preferredTime', value);
                    if (errors.preferredTime) setErrors(prev => ({ ...prev, preferredTime: undefined }));
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger 
                    id="preferred-time"
                    className={errors.preferredTime ? 'border-destructive focus:ring-destructive' : ''}
                    aria-invalid={!!errors.preferredTime}
                    aria-describedby={errors.preferredTime ? 'time-error' : undefined}
                  >
                    <SelectValue placeholder="Select a time..." />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredTime && (
                  <p id="time-error" className="text-sm text-destructive">{errors.preferredTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific questions or concerns?"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.name || !formData.email || !formData.phone || !formData.preferredTime}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Request Consultation
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
