import { useState, useEffect } from 'react';
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
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { SessionData } from '@/hooks/useSessionData';
import { Calendar, Check, Loader2 } from 'lucide-react';
import { logEvent } from '@/lib/windowTruthClient';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';

interface ConsultationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId?: string;
  sessionData: SessionData;
}

const timeOptions = [
  { value: 'morning', label: 'Morning (9am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 5pm)' },
  { value: 'evening', label: 'Evening (5pm - 8pm)' },
  { value: 'asap', label: 'ASAP - Call me now!' },
];

export function ConsultationBookingModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  sessionData,
}: ConsultationBookingModalProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  const { values, errors, setValue, setValues, hasError, getError, getFieldProps, validateAll, clearErrors } = useFormValidation({
    initialValues: {
      name: sessionData.name || '',
      email: sessionData.email || '',
      phone: sessionData.phone || '',
      preferredTime: '',
    },
    schemas: {
      name: commonSchemas.name,
      email: commonSchemas.email,
      phone: commonSchemas.phone,
      preferredTime: commonSchemas.required('Please select a preferred time'),
    },
    formatters: {
      phone: formatPhoneNumber,
    },
  });

  // Track modal open - fires ONLY when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = Date.now();
      setModalOpenTime(now);

      logEvent({
        event_name: 'modal_open',
        tool_name: 'expert-system',
        params: {
          modal_type: 'consultation_booking',
        },
      });
    }
  }, [isOpen]); // Only isOpen dependency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: 'Please fix the errors',
        description: 'Some fields need your attention.',
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
            name: values.name.trim(),
            phone: values.phone.trim(),
            sourceTool: 'expert-system',
            sessionData,
            consultation: {
              name: values.name.trim(),
              email: values.email.trim(),
              phone: values.phone.trim(),
              preferredTime: values.preferredTime,
              notes: notes.trim() || undefined,
            },
            attribution: getAttributionData(),
            aiContext: buildAIContextFromSession(sessionData),
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

        // Track successful consultation booking
        logEvent({
          event_name: 'consultation_booked',
          tool_name: 'expert-system',
          params: {
            preferred_time: values.preferredTime,
            lead_id: data.leadId,
          },
        });

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
      // Track modal abandonment if not successful
      if (!isSuccess && modalOpenTime > 0) {
        const timeSpent = Math.round((Date.now() - modalOpenTime) / 1000); // seconds
        logEvent({
          event_name: 'modal_abandon',
          tool_name: 'expert-system',
          params: {
            modal_type: 'consultation_booking',
            time_spent_seconds: timeSpent,
          },
        });
      }

      setIsSuccess(false);
      setValues({
        name: sessionData.name || '',
        email: sessionData.email || '',
        phone: sessionData.phone || '',
        preferredTime: '',
      });
      setNotes('');
      clearErrors();
      onClose();
    }
  };

  const nameProps = getFieldProps('name');
  const emailProps = getFieldProps('email');
  const phoneProps = getFieldProps('phone');

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
                <Label htmlFor="name" className={hasError('name') ? 'text-destructive' : ''}>
                  Your Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  {...nameProps}
                  disabled={isLoading}
                  className={hasError('name') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={hasError('name')}
                  aria-describedby={hasError('name') ? 'name-error' : undefined}
                />
                {hasError('name') && (
                  <p id="name-error" className="text-sm text-destructive">{getError('name')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="consult-email" className={hasError('email') ? 'text-destructive' : ''}>
                  Email Address
                </Label>
                <Input
                  id="consult-email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailProps}
                  disabled={isLoading}
                  className={hasError('email') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={hasError('email')}
                  aria-describedby={hasError('email') ? 'email-error' : undefined}
                />
                {hasError('email') && (
                  <p id="email-error" className="text-sm text-destructive">{getError('email')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className={hasError('phone') ? 'text-destructive' : ''}>
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...phoneProps}
                  disabled={isLoading}
                  className={hasError('phone') ? 'border-destructive focus-visible:ring-destructive' : ''}
                  aria-invalid={hasError('phone')}
                  aria-describedby={hasError('phone') ? 'phone-error' : undefined}
                />
                {hasError('phone') && (
                  <p id="phone-error" className="text-sm text-destructive">{getError('phone')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-time" className={hasError('preferredTime') ? 'text-destructive' : ''}>
                  Best Time to Call
                </Label>
                <Select
                  value={values.preferredTime}
                  onValueChange={(value) => setValue('preferredTime', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger 
                    id="preferred-time"
                    className={hasError('preferredTime') ? 'border-destructive focus:ring-destructive' : ''}
                    aria-invalid={hasError('preferredTime')}
                    aria-describedby={hasError('preferredTime') ? 'time-error' : undefined}
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
                {hasError('preferredTime') && (
                  <p id="time-error" className="text-sm text-destructive">{getError('preferredTime')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific questions or concerns?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !values.name || !values.email || !values.phone || !values.preferredTime}
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
