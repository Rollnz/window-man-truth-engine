import { useState, useCallback, useEffect, useRef } from 'react';
import { ConsultationFormData, FormErrors, PropertyType, WindowType, ImpactRequired, QuoteStatus, QuoteCount, ConcernType } from '@/types/consultation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CallWindowManButton } from './CallWindowManButton';
import { QuoteUploadDropzone } from '@/components/beat-your-quote/QuoteUploadDropzone';
import { toast } from 'sonner';

interface ConsultationFormProps {
  onSubmit: (data: ConsultationFormData) => Promise<void>;
  onFormStart?: () => void;
  className?: string;
}

const PROPERTY_TYPES: {
  value: PropertyType;
  label: string;
}[] = [{
  value: 'single-family',
  label: 'Single-Family Home'
}, {
  value: 'condo',
  label: 'Condo'
}, {
  value: 'townhome',
  label: 'Townhome'
}, {
  value: 'other',
  label: 'Other'
}];
const WINDOW_TYPES: {
  value: WindowType;
  label: string;
}[] = [{
  value: 'sliding',
  label: 'Sliding windows'
}, {
  value: 'single-hung',
  label: 'Single-hung'
}, {
  value: 'double-hung',
  label: 'Double-hung'
}, {
  value: 'picture',
  label: 'Picture windows'
}, {
  value: 'doors',
  label: 'Doors'
}, {
  value: 'not-sure',
  label: 'Not sure yet'
}];
const CONCERNS: {
  value: ConcernType;
  label: string;
}[] = [{
  value: 'price',
  label: 'Price'
}, {
  value: 'timeline',
  label: 'Timeline'
}, {
  value: 'quality',
  label: 'Quality'
}, {
  value: 'trust',
  label: 'Trust'
}, {
  value: 'other',
  label: 'Other'
}];

export function ConsultationForm({
  onSubmit,
  onFormStart,
  className
}: ConsultationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ConsultationFormData>>({
    windowTypes: []
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

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };
  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return 'Phone number is required';
    const digitsOnly = phone.replace(/\\D/g, '');
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

  const handleChange = useCallback((field: keyof ConsultationFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSubmitError(null);
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((field: keyof ConsultationFormData) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [formData, validateField]);

  const handleWindowTypeChange = useCallback((type: WindowType, checked: boolean) => {
    setFormData(prev => {
      const current = prev.windowTypes || [];
      if (checked) {
        return { ...prev, windowTypes: [...current, type] };
      }
      return { ...prev, windowTypes: current.filter(t => t !== type) };
    });
  }, []);

  const validateAll = useCallback((): FormErrors => {
    const requiredFields: (keyof ConsultationFormData)[] = ['firstName', 'lastName', 'email', 'phone', 'propertyType', 'cityZip', 'windowCount', 'impactRequired', 'hasQuote'];
    const newErrors: FormErrors = {};
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
      }
    });
    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {}));
    return newErrors;
  }, [formData, validateField]);

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const isFormValid = !Object.values(errors).some(Boolean) && formData.firstName && formData.lastName && formData.email && formData.phone && formData.propertyType && formData.cityZip && formData.windowCount && formData.impactRequired && formData.hasQuote;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField && formRef.current) {
        const element = formRef.current.querySelector(`#${firstErrorField}`) || formRef.current.querySelector(`[name="${firstErrorField}"]`);
        (element as HTMLElement)?.focus();
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        quoteFileId: uploadedFileId || undefined,
        quoteFileName: uploadedFileName || undefined,
      } as ConsultationFormData;
      await onSubmit(submissionData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      noValidate
      aria-label="Strategy session booking form"
    >
      {/* Contact Information Section */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <fieldset>
            <legend className="text-lg font-semibold mb-4 text-foreground">Contact Information</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground font-medium">
                  First Name <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName || ''}
                  onChange={e => handleChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  className={cn(
                    'transition-colors focus:ring-2 focus:ring-primary',
                    errors.firstName && touched.firstName && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-required="true"
                  aria-invalid={!!(errors.firstName && touched.firstName)}
                  aria-describedby={errors.firstName && touched.firstName ? 'firstName-error' : undefined}
                />
                {errors.firstName && touched.firstName && (
                  <p id="firstName-error" role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground font-medium">
                  Last Name <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName || ''}
                  onChange={e => handleChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  className={cn(
                    'transition-colors focus:ring-2 focus:ring-primary',
                    errors.lastName && touched.lastName && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-required="true"
                  aria-invalid={!!(errors.lastName && touched.lastName)}
                  aria-describedby={errors.lastName && touched.lastName ? 'lastName-error' : undefined}
                />
                {errors.lastName && touched.lastName && (
                  <p id="lastName-error" role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.lastName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={formData.email || ''}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={cn(
                    'transition-colors focus:ring-2 focus:ring-primary',
                    errors.email && touched.email && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-required="true"
                  aria-invalid={!!(errors.email && touched.email)}
                  aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                />
                {errors.email && touched.email && (
                  <p id="email-error" role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium">
                  Phone Number <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formData.phone || ''}
                  onChange={e => handleChange('phone', formatPhoneNumber(e.target.value))}
                  onBlur={() => handleBlur('phone')}
                  placeholder="(555) 123-4567"
                  className={cn(
                    'transition-colors focus:ring-2 focus:ring-primary',
                    errors.phone && touched.phone && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-required="true"
                  aria-invalid={!!(errors.phone && touched.phone)}
                  aria-describedby={errors.phone && touched.phone ? 'phone-error' : undefined}
                />
                {errors.phone && touched.phone && (
                  <p id="phone-error" role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* Project Details Section */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <fieldset>
            <legend className="text-lg font-semibold text-foreground mb-4">Project Details</legend>

            <div className="space-y-6">
              {/* Property Type & Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="propertyType" className="text-foreground font-medium">
                    Property Type <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Select value={formData.propertyType} onValueChange={value => handleChange('propertyType', value as PropertyType)}>
                    <SelectTrigger
                      id="propertyType"
                      className={cn(
                        'transition-colors focus:ring-2 focus:ring-primary',
                        errors.propertyType && touched.propertyType && 'border-destructive'
                      )}
                      aria-required="true"
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
                    <p role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {errors.propertyType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cityZip" className="text-foreground font-medium">
                    City / ZIP Code <span className="text-destructive" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="cityZip"
                    name="cityZip"
                    type="text"
                    autoComplete="postal-code"
                    placeholder="e.g., Miami or 33101"
                    value={formData.cityZip || ''}
                    onChange={e => handleChange('cityZip', e.target.value)}
                    onBlur={() => handleBlur('cityZip')}
                    className={cn(
                      'transition-colors focus:ring-2 focus:ring-primary',
                      errors.cityZip && touched.cityZip && 'border-destructive focus-visible:ring-destructive'
                    )}
                    aria-required="true"
                    aria-invalid={!!(errors.cityZip && touched.cityZip)}
                    aria-describedby={errors.cityZip && touched.cityZip ? 'cityZip-error' : undefined}
                  />
                  {errors.cityZip && touched.cityZip && (
                    <p id="cityZip-error" role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {errors.cityZip}
                    </p>
                  )}
                </div>
              </div>

              {/* Window Count */}
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="windowCount" className="text-foreground font-medium">
                  How many windows are you replacing? <span className="text-destructive" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="windowCount"
                  name="windowCount"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.windowCount || ''}
                  onChange={e => handleChange('windowCount', parseInt(e.target.value) || 0)}
                  onBlur={() => handleBlur('windowCount')}
                  className={cn(
                    'transition-colors max-w-[120px] focus:ring-2 focus:ring-primary',
                    errors.windowCount && touched.windowCount && 'border-destructive focus-visible:ring-destructive'
                  )}
                  aria-required="true"
                  aria-invalid={!!(errors.windowCount && touched.windowCount)}
                  aria-describedby={errors.windowCount && touched.windowCount ? 'windowCount-error' : undefined}
                />
                {errors.windowCount && touched.windowCount && (
                  <p id="windowCount-error" role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.windowCount}
                  </p>
                )}
              </div>

              {/* Window Types */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  What types of windows are included?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {WINDOW_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`window-${type.value}`}
                        checked={formData.windowTypes?.includes(type.value)}
                        onCheckedChange={checked => handleWindowTypeChange(type.value, checked as boolean)}
                      />
                      <Label htmlFor={`window-${type.value}`} className="text-sm text-foreground cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* Impact Required */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  Are impact-rated or hurricane-rated windows required? <span className="text-destructive" aria-hidden="true">*</span>
                </legend>
                <RadioGroup
                  value={formData.impactRequired}
                  onValueChange={value => handleChange('impactRequired', value as ImpactRequired)}
                  className="flex flex-wrap gap-4"
                  aria-required="true"
                >
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'not-sure', label: 'Not sure' },
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`impact-${option.value}`} />
                      <Label htmlFor={`impact-${option.value}`} className="text-sm text-foreground cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.impactRequired && touched.impactRequired && (
                  <p role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.impactRequired}
                  </p>
                )}
              </fieldset>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* Quote Status Section */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <fieldset>
            <legend className="text-lg font-semibold text-foreground mb-4">Your Current Quotes</legend>

            <div className="space-y-6">
              {/* Has Quote */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">
                  Do you already have a quote? <span className="text-destructive" aria-hidden="true">*</span>
                </legend>
                <RadioGroup
                  value={formData.hasQuote}
                  onValueChange={value => handleChange('hasQuote', value as QuoteStatus)}
                  className="flex flex-wrap gap-4"
                  aria-required="true"
                >
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'in-progress', label: 'In progress' },
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`quote-${option.value}`} />
                      <Label htmlFor={`quote-${option.value}`} className="text-sm text-foreground cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.hasQuote && touched.hasQuote && (
                  <p role="alert" aria-live="polite" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {errors.hasQuote}
                  </p>
                )}
              </fieldset>

              {/* Quote Count - Conditional */}
              {formData.hasQuote === 'yes' && (
                <fieldset className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <legend className="text-sm font-medium text-foreground">
                    How many quotes have you received?
                  </legend>
                  <RadioGroup
                    value={formData.quoteCount}
                    onValueChange={value => handleChange('quoteCount', value as QuoteCount)}
                    className="flex flex-wrap gap-4"
                  >
                    {[
                      { value: '1', label: '1' },
                      { value: '2', label: '2' },
                      { value: '3+', label: '3+' },
                    ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`quoteCount-${option.value}`} />
                        <Label htmlFor={`quoteCount-${option.value}`} className="text-sm text-foreground cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </fieldset>
              )}

              {/* Quote Details - Upload + Paste */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">
                  Share your quote <span className="text-muted-foreground">(optional)</span>
                </Label>

                {/* File upload or attached badge */}
                {uploadedFileId ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span className="text-sm text-foreground truncate flex-1">{uploadedFileName || 'Quote attached'}</span>
                    <button
                      type="button"
                      onClick={() => { setUploadedFileId(null); setUploadedFileName(null); }}
                      className="text-muted-foreground hover:text-foreground p-0.5 focus:ring-2 focus:ring-primary rounded"
                      aria-label="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <QuoteUploadDropzone
                    compact
                    sourcePage="consultation"
                    onSuccess={(fileId, filePath) => {
                      setUploadedFileId(fileId);
                      setUploadedFileName(filePath.split('/').pop() || 'quote-document');
                    }}
                    onError={(error) => toast.error(error)}
                  />
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
                  <div className="flex-1 h-px bg-border" />
                  <span>or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Paste textarea */}
                <Textarea
                  id="quoteDetails"
                  name="quoteDetails"
                  rows={3}
                  value={formData.quoteDetails || ''}
                  onChange={e => handleChange('quoteDetails', e.target.value)}
                  placeholder="Paste your quote details here, or describe what you've been quoted..."
                  className="resize-none focus:ring-2 focus:ring-primary"
                  aria-describedby="quoteDetails-hint"
                />
                <p id="quoteDetails-hint" className="text-xs text-muted-foreground">
                  The more details you share, the more thorough our review can be.
                </p>
              </div>
            </div>
          </fieldset>
        </CardContent>
      </Card>

      {/* Concerns Section - Optional */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <fieldset>
            <legend className="text-lg font-semibold text-foreground mb-2">
              What concerns you most?
            </legend>
            <p className="text-sm text-muted-foreground mb-4" id="concerns-hint">
              Optional, but helps us focus your call.
            </p>

            <RadioGroup
              value={formData.concern}
              onValueChange={value => handleChange('concern', value as ConcernType)}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
              aria-describedby="concerns-hint"
            >
              {CONCERNS.map(concern => (
                <div key={concern.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={concern.value} id={`concern-${concern.value}`} />
                  <Label htmlFor={`concern-${concern.value}`} className="text-sm text-foreground cursor-pointer">
                    {concern.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {formData.concern === 'other' && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                <Label htmlFor="concernOther" className="text-foreground sr-only">
                  Describe your concern
                </Label>
                <Textarea
                  id="concernOther"
                  name="concernOther"
                  rows={2}
                  value={formData.concernOther || ''}
                  onChange={e => handleChange('concernOther', e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="resize-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </fieldset>
        </CardContent>
      </Card>

      {/* Submission Error */}
      {submitError && (
        <div role="alert" aria-live="assertive" className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-destructive">Unable to submit</p>
            <p className="text-sm text-destructive/80 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !isFormValid}
            className={cn(
              'w-full sm:w-auto px-10 py-6 text-lg font-semibold transition-all duration-200',
              'bg-primary hover:bg-primary/90',
              'shadow-lg hover:shadow-xl hover:-translate-y-0.5',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            style={{
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Book Strategy Call'
            )}
          </Button>

          <span className="text-muted-foreground font-medium" aria-hidden="true">or</span>

          <CallWindowManButton size="lg" source="consultation_form" className="w-full sm:w-auto px-10 py-6 text-lg font-semibold" />
        </div>

        <p className="text-sm text-muted-foreground text-center max-w-md">
          No preparation needed. Bring your quotes if you have them.
          If not, just bring your questions.
        </p>
      </div>
    </form>
  );
}
