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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with zod
    const validation = consultationSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Missing Information',
        description: firstError.message,
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
            email: formData.email.trim(),
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            sourceTool: 'expert-system',
            sessionData,
            consultation: {
              name: formData.name.trim(),
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consult-email">Email Address</Label>
                <Input
                  id="consult-email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred-time">Best Time to Call</Label>
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => updateField('preferredTime', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="preferred-time">
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
