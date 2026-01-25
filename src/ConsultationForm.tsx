import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ConsultationFormData, 
  FormErrors, 
  PropertyType, 
  WindowType, 
  ImpactRequired, 
  QuoteStatus, 
  QuoteCount,
  ConcernType 
} from '@/types/consultation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsultationFormProps {
  onSubmit: (data: ConsultationFormData) => Promise<void>;
  onFormStart?: () => void;
  className?: string;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'single-family', label: 'Single-Family Home' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhome', label: 'Townhome' },
  { value: 'other', label: 'Other' },
];

const WINDOW_TYPES: { value: WindowType; label: string }[] = [
  { value: 'sliding', label: 'Sliding windows' },
  { value: 'single-hung', label: 'Single-hung' },
  { value: 'double-hung', label: 'Double-hung' },
  { value: 'picture', label: 'Picture windows' },
  { value: 'doors', label: 'Doors' },
  { value: 'not-sure', label: 'Not sure yet' },
];

const CONCERNS: { value: ConcernType; label: string }[] = [
  { value: 'price', label: 'Price' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'quality', label: 'Quality' },
  { value: 'trust', label: 'Trust' },
  { value: 'other', label: 'Other' },
];

export function ConsultationForm({ onSubmit, onFormStart, className }: ConsultationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<ConsultationFormData>>({
    windowTypes: [],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Track form start
  useEffect(() => {
    if (!hasStarted && Object.keys(touched).length > 0) {
      setHasStarted(true);
      onFormStart?.();
    }
  }, [touched, hasStarted, onFormStart]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return 'Phone number is required';
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) return 'Please enter a valid phone number';
    return undefined;
  };

  const validateField = useCallback((field: keyof ConsultationFormData, value: unknown): string | undefined => {
    switch (field) {
      case 'firstName':
        return !value ? 'First name is required' : undefined;
      case 'lastName':
        return !value ? 'Last name is required' : undefined;
      case 'email':
        return validateEmail(value as string);
      case 'phone':
        return validatePhone(value as string);
      case 'propertyType':
        return !value ? 'Please select a property type' : undefined;
      case 'cityZip':
        return !value ? 'City or ZIP code is required' : undefined;
      case 'windowCount':
        const count = value as number;
        if (!count || count < 1) return 'Please enter the number of windows';
        return undefined;
      case 'impactRequired':
        return !value ? 'Please select an option' : undefined;
      case 'hasQuote':
        return !value ? 'Please select an option' : undefined;
      default:
        return undefined;
    }
  }, []);

  // Handle field changes
  const handleChange = useCallback((field: keyof ConsultationFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
    
    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [touched, validateField]);

  // Handle field blur
  const handleBlur = useCallback((field: keyof ConsultationFormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [formData, validateField]);

  // Handle window type checkbox changes
  const handleWindowTypeChange = useCallback((type: WindowType, checked: boolean) => {
    setFormData(prev => {
      const current = prev.windowTypes || [];
      if (checked) {
        return { ...prev, windowTypes: [...current, type] };
      }
      return { ...prev, windowTypes: current.filter(t => t !== type) };
    });
  }, []);

  // Validate all fields
 // 1. UPDATE: Change return type to FormErrors and return the object directly
  const validateAll = useCallback((): FormErrors => {
    const requiredFields: (keyof ConsultationFormData)[] = [
      'firstName', 'lastName', 'email', 'phone',
      'propertyType', 'cityZip', 'windowCount',
      'impactRequired', 'hasQuote'
    ];

    const newErrors: FormErrors = {};

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    return newErrors; // Return the errors directly!
  }, [formData, validateField]);

  // 2. UPDATE: Use the returned errors immediately instead of waiting for state
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateAll(); // Capture the returned errors
    
    if (Object.keys(validationErrors).length > 0) {
      // Focus first error field using the local variable, not stale state
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField && formRef.current) {
        const element = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        (element as HTMLElement)?.focus();
      }
      return;
    }

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const isFormValid = !Object.values(errors).some(Boolean) && 
    formData.firstName && formData.lastName && 
    formData.email && formData.phone &&
    formData.propertyType && formData.cityZip &&
    formData.windowCount && formData.impactRequired &&
    formData.hasQuote;

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={cn('space-y-8', className)}
      noValidate
    >
      {/* Contact Information Section */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-700">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                className={cn(
                  'transition-colors',
                  errors.firstName && touched.firstName && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!(errors.firstName && touched.firstName)}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && touched.firstName && (
                <p id="firstName-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-700">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                className={cn(
                  'transition-colors',
                  errors.lastName && touched.lastName && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!(errors.lastName && touched.lastName)}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && touched.lastName && (
                <p id="lastName-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={cn(
                  'transition-colors',
                  errors.email && touched.email && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!(errors.email && touched.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && touched.email && (
                <p id="email-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', formatPhoneNumber(e.target.value))}
                onBlur={() => handleBlur('phone')}
                placeholder="(555) 123-4567"
                className={cn(
                  'transition-colors',
                  errors.phone && touched.phone && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!(errors.phone && touched.phone)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && touched.phone && (
                <p id="phone-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details Section */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Project Details</h3>
          
          <div className="space-y-6">
            {/* Property Type & Location */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="propertyType" className="text-slate-700">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleChange('propertyType', value as PropertyType)}
                >
                  <SelectTrigger 
                    id="propertyType"
                    className={cn(
                      'transition-colors',
                      errors.propertyType && touched.propertyType && 'border-red-500'
                    )}
                    aria-invalid={!!(errors.propertyType && touched.propertyType)}
                  >
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyType && touched.propertyType && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.propertyType}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityZip" className="text-slate-700">
                  City / ZIP Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cityZip"
                  name="cityZip"
                  type="text"
                  autoComplete="postal-code"
                  placeholder="e.g., Miami or 33101"
                  value={formData.cityZip || ''}
                  onChange={(e) => handleChange('cityZip', e.target.value)}
                  onBlur={() => handleBlur('cityZip')}
                  className={cn(
                    'transition-colors',
                    errors.cityZip && touched.cityZip && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  aria-invalid={!!(errors.cityZip && touched.cityZip)}
                  aria-describedby={errors.cityZip ? 'cityZip-error' : undefined}
                />
                {errors.cityZip && touched.cityZip && (
                  <p id="cityZip-error" className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cityZip}
                  </p>
                )}
              </div>
            </div>

            {/* Window Count */}
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="windowCount" className="text-slate-700">
                How many windows are you replacing? <span className="text-red-500">*</span>
              </Label>
              <Input
                id="windowCount"
                name="windowCount"
                type="number"
                min={1}
                max={100}
                value={formData.windowCount || ''}
                onChange={(e) => handleChange('windowCount', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('windowCount')}
                className={cn(
                  'transition-colors max-w-[120px]',
                  errors.windowCount && touched.windowCount && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!(errors.windowCount && touched.windowCount)}
                aria-describedby={errors.windowCount ? 'windowCount-error' : undefined}
              />
              {errors.windowCount && touched.windowCount && (
                <p id="windowCount-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.windowCount}
                </p>
              )}
            </div>

            {/* Window Types */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-700">
                What types of windows are included?
              </legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {WINDOW_TYPES.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`window-${type.value}`}
                      checked={formData.windowTypes?.includes(type.value)}
                      onCheckedChange={(checked) => handleWindowTypeChange(type.value, checked as boolean)}
                    />
                    <Label 
                      htmlFor={`window-${type.value}`}
                      className="text-sm text-slate-600 cursor-pointer"
                    >
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </fieldset>

            {/* Impact Required */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-700">
                Are impact-rated or hurricane-rated windows required? <span className="text-red-500">*</span>
              </legend>
              <RadioGroup
                value={formData.impactRequired}
                onValueChange={(value) => handleChange('impactRequired', value as ImpactRequired)}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'not-sure', label: 'Not sure' },
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`impact-${option.value}`}
                    />
                    <Label 
                      htmlFor={`impact-${option.value}`}
                      className="text-sm text-slate-600 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.impactRequired && touched.impactRequired && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.impactRequired}
                </p>
              )}
            </fieldset>
          </div>
        </CardContent>
      </Card>

      {/* Quote Status Section */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Current Quotes</h3>
          
          <div className="space-y-6">
            {/* Has Quote */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-700">
                Do you already have a quote? <span className="text-red-500">*</span>
              </legend>
              <RadioGroup
                value={formData.hasQuote}
                onValueChange={(value) => handleChange('hasQuote', value as QuoteStatus)}
                className="flex flex-wrap gap-4"
              >
                {[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'in-progress', label: 'In progress' },
                ].map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={`quote-${option.value}`}
                    />
                    <Label 
                      htmlFor={`quote-${option.value}`}
                      className="text-sm text-slate-600 cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {errors.hasQuote && touched.hasQuote && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.hasQuote}
                </p>
              )}
            </fieldset>

            {/* Quote Count - Conditional */}
            {formData.hasQuote === 'yes' && (
              <fieldset className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <legend className="text-sm font-medium text-slate-700">
                  How many quotes have you received?
                </legend>
                <RadioGroup
                  value={formData.quoteCount}
                  onValueChange={(value) => handleChange('quoteCount', value as QuoteCount)}
                  className="flex flex-wrap gap-4"
                >
                  {[
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3+', label: '3+' },
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option.value} 
                        id={`quoteCount-${option.value}`}
                      />
                      <Label 
                        htmlFor={`quoteCount-${option.value}`}
                        className="text-sm text-slate-600 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </fieldset>
            )}

            {/* Quote Details - Optional */}
            <div className="space-y-2">
              <Label htmlFor="quoteDetails" className="text-slate-700">
                Upload or paste quote details <span className="text-slate-400">(optional)</span>
              </Label>
              <Textarea
                id="quoteDetails"
                name="quoteDetails"
                rows={4}
                value={formData.quoteDetails || ''}
                onChange={(e) => handleChange('quoteDetails', e.target.value)}
                placeholder="Paste your quote details here, or describe what you've been quoted..."
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                The more details you share, the more thorough our review can be.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Concerns Section - Optional */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            What concerns you most?
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Optional, but helps us focus your call.
          </p>
          
          <RadioGroup
            value={formData.concern}
            onValueChange={(value) => handleChange('concern', value as ConcernType)}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {CONCERNS.map(concern => (
              <div key={concern.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={concern.value} 
                  id={`concern-${concern.value}`}
                />
                <Label 
                  htmlFor={`concern-${concern.value}`}
                  className="text-sm text-slate-600 cursor-pointer"
                >
                  {concern.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {formData.concern === 'other' && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
              <Label htmlFor="concernOther" className="text-slate-700 sr-only">
                Describe your concern
              </Label>
              <Textarea
                id="concernOther"
                name="concernOther"
                rows={2}
                value={formData.concernOther || ''}
                onChange={(e) => handleChange('concernOther', e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="resize-none"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Error */}
      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Unable to submit</p>
            <p className="text-sm text-red-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex flex-col items-center gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !isFormValid}
          className={cn(
            'w-full sm:w-auto px-12 py-6 text-lg font-semibold transition-all duration-200',
            'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Request My Strategy Call'
          )}
        </Button>
        
        <p className="text-sm text-slate-500 text-center max-w-md">
          No preparation needed. Bring your quotes if you have them. 
          If not, just bring your questions.
        </p>
      </div>
    </form>
  );
}
