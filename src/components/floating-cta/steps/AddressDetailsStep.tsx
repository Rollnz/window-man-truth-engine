import { useState } from 'react';
import { Send, MapPin, Building, Map, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EstimateFormData } from '../EstimateSlidePanel';

interface AddressDetailsStepProps {
  formData: EstimateFormData;
  updateFormData: (updates: Partial<EstimateFormData>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

// Florida-focused but allow other states
const STATES = [
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'AL', label: 'Alabama' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'TX', label: 'Texas' },
  { value: 'OTHER', label: 'Other State' },
];

// Simple ZIP code validation (5 digits)
const ZIP_REGEX = /^\d{5}$/;

export function AddressDetailsStep({ 
  formData, 
  updateFormData, 
  onSubmit, 
  isSubmitting,
  error 
}: AddressDetailsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.street.trim()) {
      newErrors.street = 'Please enter your street address';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Please enter your city';
    }
    
    if (!formData.state) {
      newErrors.state = 'Please select your state';
    }
    
    if (!formData.zip.trim()) {
      newErrors.zip = 'Please enter your ZIP code';
    } else if (!ZIP_REGEX.test(formData.zip)) {
      newErrors.zip = 'Please enter a valid 5-digit ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Fire structured GTM dataLayer event after validation succeeds
      // Note: This fires BEFORE onSubmit to ensure it fires even if submission has issues
      // The 'lead_form_completed' status indicates validation passed and submission initiated
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'lead_form_completed',
        form_name: 'floating_slide_over',
        step_name: 'address_info',
        step_index: 3,
        step_status: 'validated',
      });
      onSubmit();
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="street" className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Street Address
        </Label>
        <Input
          id="street"
          type="text"
          placeholder="123 Main Street"
          value={formData.street}
          onChange={(e) => updateFormData({ street: e.target.value })}
          className={errors.street ? 'border-destructive' : ''}
          autoComplete="street-address"
        />
        {errors.street && (
          <p className="text-sm text-destructive">{errors.street}</p>
        )}
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city" className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          City
        </Label>
        <Input
          id="city"
          type="text"
          placeholder="Miami"
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
          className={errors.city ? 'border-destructive' : ''}
          autoComplete="address-level2"
        />
        {errors.city && (
          <p className="text-sm text-destructive">{errors.city}</p>
        )}
      </div>

      {/* State and ZIP in a row */}
      <div className="grid grid-cols-2 gap-4">
        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state" className="flex items-center gap-2">
            <Map className="h-4 w-4 text-muted-foreground" />
            State
          </Label>
          <Select
            value={formData.state}
            onValueChange={(value) => updateFormData({ state: value })}
          >
            <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state}</p>
          )}
        </div>

        {/* ZIP */}
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            type="text"
            placeholder="33101"
            value={formData.zip}
            onChange={(e) => updateFormData({ zip: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            className={errors.zip ? 'border-destructive' : ''}
            autoComplete="postal-code"
            maxLength={5}
          />
          {errors.zip && (
            <p className="text-sm text-destructive">{errors.zip}</p>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit} 
        className="w-full bg-green-600 hover:bg-green-700" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Request
          </>
        )}
      </Button>

      {/* Privacy note */}
      <p className="text-xs text-center text-muted-foreground">
        By submitting, you agree to our privacy policy. We never share your information.
      </p>
    </div>
  );
}
