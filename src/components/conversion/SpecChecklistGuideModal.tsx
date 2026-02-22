import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { useLeadFormSubmit } from '@/hooks/useLeadFormSubmit';
import { useSessionData } from '@/hooks/useSessionData';
import { ArrowRight, CheckCircle2, Calendar, Phone, Home, Building2, MapPin, Clock, ChevronLeft, X } from 'lucide-react';
import { trackModalOpen, trackEvent } from '@/lib/gtm';
import { wmLead } from '@/lib/wmTracking';
import { normalizeToE164 } from '@/lib/phoneFormat';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { getFullAttributionData } from '@/lib/attribution';
import { SOUTHEAST_STATES, DEFAULT_STATE } from '@/constants/states';

interface SpecChecklistGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStep = 'form' | 'success' | 'project' | 'location' | 'thankyou';

const PROPERTY_TYPES = [
  { value: 'house', label: 'House', icon: Home },
  { value: 'condo', label: 'Condo', icon: Building2 },
  { value: 'townhome', label: 'Townhome', icon: Building2 },
  { value: 'business', label: 'Business', icon: Building2 },
  { value: 'other', label: 'Other', icon: Building2 },
];

const WINDOW_REASONS = [
  'Hurricane/Storm Protection',
  'Energy Efficiency / Lower Bills',
  'Noise Reduction',
  'Home Security',
  'Increase Home Value',
];

const WINDOW_COUNTS = ['1-5', '5-10', '10-15', '15+'];

const TIMEFRAMES = [
  { value: 'hurry', label: 'In a hurry' },
  { value: '1-2', label: 'Within 1-2 months' },
  { value: '2-4', label: '2-4 months' },
  { value: 'this-year', label: 'Hopefully this year' },
  { value: 'researching', label: 'Just researching' },
];

export function SpecChecklistGuideModal({ isOpen, onClose, onSuccess }: SpecChecklistGuideModalProps) {
  const [step, setStep] = useState<ModalStep>('form');
  const [lastNameNudge, setLastNameNudge] = useState(false);
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null);
  const [upsellType, setUpsellType] = useState<'measurement' | 'callback' | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { sessionData, updateFields, sessionId } = useSessionData();

  // Project details state
  const [projectDetails, setProjectDetails] = useState({
    propertyType: '',
    propertyStatus: '',
    windowReasons: [] as string[],
    windowCount: '',
    timeframe: '',
  });

  // Location details state
  const [locationDetails, setLocationDetails] = useState({
    city: '',
    state: DEFAULT_STATE,
    zipCode: '',
    remark: '',
  });

  const {
    values,
    getFieldProps,
    hasError,
    getError,
    validateAll,
    setValue
  } = useFormValidation({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    schemas: {
      firstName: commonSchemas.firstName,
      email: commonSchemas.email
    },
    formatters: {
      phone: formatPhoneNumber
    }
  });

  const {
    submit,
    isSubmitting
  } = useLeadFormSubmit({
    sourceTool: 'spec-checklist-guide',
    formLocation: 'modal',
    leadScore: 40,
    successTitle: 'Spec Sheet Unlocked!',
    successDescription: 'Check your inbox - the spec sheet is on its way.',
    onSuccess: (leadId) => {
      setCapturedLeadId(leadId);
    },
  });

  // Track modal open
  useEffect(() => {
    if (isOpen) {
      trackModalOpen({ modalName: 'spec_checklist_guide', sourceTool: 'spec-checklist-guide' });
    }
  }, [isOpen]);

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setLastNameNudge(false);
      setCapturedLeadId(null);
      setUpsellType(null);
      setFormSubmitted(false);
      setProjectDetails({
        propertyType: '',
        propertyStatus: '',
        windowReasons: [],
        windowCount: '',
        timeframe: '',
      });
      setLocationDetails({
        city: '',
        state: DEFAULT_STATE,
        zipCode: '',
        remark: '',
      });
    }
  }, [isOpen]);

  // Track upsell shown
  useEffect(() => {
    if (step === 'success') {
      trackEvent('upsell_shown', { 
        sourceTool: 'spec-checklist-guide', 
        upsell_type: 'consultation' 
      });
    }
  }, [step]);

  // Clear last name nudge when user fills it
  useEffect(() => {
    if (values.lastName.trim()) {
      setLastNameNudge(false);
    }
  }, [values.lastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    
    // Format phone for storage (E.164)
    const phoneE164 = normalizeToE164(values.phone);
    
    const success = await submit({
      email: values.email,
      firstName: values.firstName,
      name: `${values.firstName}${values.lastName ? ' ' + values.lastName : ''}`,
      phone: phoneE164 || values.phone || undefined
    });

    if (success) {
      // Persist lead data to session for future forms
      updateFields({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
      });
      
      setFormSubmitted(true);
      setStep('success');
      // Don't call onSuccess yet - wait until user finishes or declines upsell
    }
  };

  const handleUpsellAccept = (type: 'measurement' | 'callback') => {
    trackEvent('upsell_accepted', { 
      sourceTool: 'spec-checklist-guide', 
      upsell_type: type 
    });
    setUpsellType(type);
    setStep('project');
  };

  const handleUpsellDecline = () => {
    trackEvent('upsell_declined', { 
      sourceTool: 'spec-checklist-guide', 
      upsell_type: 'consultation' 
    });
    onSuccess?.(); // Mark as converted before closing
    onClose();
  };

  // Handle modal close - only trigger onSuccess at explicit exit points
  const handleClose = () => {
    // If on form step, just close (no conversion happened)
    if (step === 'form') {
      onClose();
      return;
    }
    
    // If on success step (upsell shown) or thankyou, fire onSuccess
    if (step === 'success' || step === 'thankyou') {
      if (formSubmitted) onSuccess?.();
      onClose();
      return;
    }
    
    // If in middle of questionnaire (project/location), keep modal open (locked)
    // User must use the back button or complete the flow
  };

  // Explicit close with confirmation (for the X button after form submission)
  const handleExplicitClose = () => {
    if (formSubmitted) onSuccess?.();
    onClose();
  };

  const handleProjectNext = () => {
    // Persist project details to session
    updateFields({
      homeType: projectDetails.propertyType as 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'other',
      projectType: projectDetails.propertyStatus === 'new' ? 'new-construction' : 'replacement',
    });
    setStep('location');
  };

  const handleLocationSubmit = async () => {
    // Persist location to session
    updateFields({
      city: locationDetails.city,
      state: locationDetails.state,
      zipCode: locationDetails.zipCode,
      notes: locationDetails.remark,
    });

    // Submit consultation booking
    try {
      const phoneE164 = normalizeToE164(values.phone);
      
      await invokeEdgeFunction('save-lead', {
        body: {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: phoneE164 || values.phone,
          sourceTool: 'consultation',
          // Golden Thread fields for attribution tracking
          leadId: capturedLeadId,
          sessionId,
          sessionData: {
            clientId: getOrCreateAnonId(),
          },
          ...getFullAttributionData(),
          aiContext: {
            source_form: 'spec-checklist-guide-upsell',
            upsell_type: upsellType,
            property_type: projectDetails.propertyType,
            property_status: projectDetails.propertyStatus,
            window_reasons: projectDetails.windowReasons,
            window_count: projectDetails.windowCount,
            timeframe: projectDetails.timeframe,
            city: locationDetails.city,
            state: locationDetails.state,
            zip_code: locationDetails.zipCode,
            remark: locationDetails.remark,
          },
        }
      });

      // Track wmLead conversion event
      const effectiveLeadId = capturedLeadId || crypto.randomUUID();
      await wmLead(
        { leadId: effectiveLeadId, email: values.email, phone: values.phone || undefined, firstName: values.firstName, lastName: values.lastName },
        { source_tool: 'spec-checklist-guide' },
      );
    } catch (error) {
      console.error('Failed to save consultation:', error);
    }

    setStep('thankyou');
  };

  const toggleWindowReason = (reason: string) => {
    setProjectDetails(prev => ({
      ...prev,
      windowReasons: prev.windowReasons.includes(reason)
        ? prev.windowReasons.filter(r => r !== reason)
        : [...prev.windowReasons, reason]
    }));
  };

  // Fix: Use Tailwind focus classes instead of inline style manipulation to prevent tab flashing
  const inputBaseClass = "bg-white border focus:ring-2 focus:ring-primary/25 focus:ring-offset-0 focus:border-primary focus:outline-none transition-all duration-200";

  const renderFormStep = () => (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Homeowner's Spec Sheet</h2>
        <p className="text-sm text-slate-600 mt-1">Free PDF • Instant Access</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: First Name | Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="modal-firstName" className="text-sm font-medium text-slate-700 mb-1 block">First Name *</Label>
            <Input
              id="modal-firstName"
              {...getFieldProps('firstName')}
              placeholder="First name"
              className={`${inputBaseClass} border-black ${hasError('firstName') ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
              autoComplete="given-name"
              aria-required="true"
              aria-invalid={hasError('firstName')}
              aria-describedby={hasError('firstName') ? 'modal-firstName-error' : undefined}
            />
            {hasError('firstName') && <p id="modal-firstName-error" className="text-xs text-destructive mt-1">{getError('firstName')}</p>}
          </div>
          <div>
            <Label htmlFor="modal-lastName" className="text-sm font-medium text-slate-700 mb-1 block">Last Name</Label>
            <Input
              id="modal-lastName"
              {...getFieldProps('lastName')}
              placeholder="Last name"
              className={`${inputBaseClass} ${lastNameNudge ? 'border-red-500 border-2' : 'border-black'}`}
              disabled={isSubmitting}
              autoComplete="family-name"
            />
          </div>
        </div>

        {/* Row 2: Email | Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="modal-email" className="text-sm font-medium text-slate-700 mb-1 block">Email *</Label>
            <Input
              id="modal-email"
              type="email"
              inputMode="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              {...getFieldProps('email')}
              placeholder="Email address"
              className={`${inputBaseClass} border-black ${hasError('email') ? 'border-destructive' : ''}`}
              onFocus={() => {
                // Nudge last name if empty
                if (!values.lastName.trim()) {
                  setLastNameNudge(true);
                }
              }}
              disabled={isSubmitting}
              autoComplete="email"
              aria-required="true"
              aria-invalid={hasError('email')}
              aria-describedby={hasError('email') ? 'modal-email-error' : undefined}
            />
            {hasError('email') && <p id="modal-email-error" className="text-xs text-destructive mt-1">{getError('email')}</p>}
          </div>
          <div>
            <Label htmlFor="modal-phone" className="text-sm font-medium text-slate-700 mb-1 block">Phone</Label>
            <Input
              id="modal-phone"
              type="tel"
              inputMode="tel"
              {...getFieldProps('phone')}
              placeholder="Phone"
              className={`${inputBaseClass} border-black placeholder:text-slate-500`}
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
        </div>
        
        <Button type="submit" variant="cta" size="lg" className="w-full gap-2 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Me the Spec Sheet'}
          {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </Button>
        
        <p className="text-xs text-black text-center">
          We'll also save this to your private Windowman Vault.
        </p>
      </form>

      <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-black">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> No Spam
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> No Sales Calls
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> No Contractor Handoff
        </span>
      </div>
    </>
  );

  const renderSuccessStep = () => (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        Your Spec Sheet is on its way to your Vault!
      </h2>
      
      <p className="text-slate-600 mb-6">
        While you wait, would you like to skip the guesswork?
      </p>

      <div className="space-y-3">
        <Button 
          variant="cta" 
          size="lg" 
          className="w-full gap-2 text-white"
          onClick={() => handleUpsellAccept('measurement')}
        >
          <Calendar className="w-4 h-4" />
          Book a Free Measurement
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900"
          onClick={() => handleUpsellAccept('callback')}
        >
          <Phone className="w-4 h-4" />
          Request a 5-Minute Callback
        </Button>
      </div>

      <button
        onClick={handleUpsellDecline}
        className="mt-6 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
      >
        No thanks, I'll review the checklist first
      </button>
    </div>
  );

  const renderProjectStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => setStep('success')}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Great! Just a few quick questions...
        </h2>
      </div>

      {/* Property Type */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">What type of property?</Label>
        <div className="grid grid-cols-5 gap-2">
          {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setProjectDetails(prev => ({ ...prev, propertyType: value }))}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                projectDetails.propertyType === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Property Status */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">Is this property...</Label>
        <RadioGroup 
          value={projectDetails.propertyStatus}
          onValueChange={(value) => setProjectDetails(prev => ({ ...prev, propertyStatus: value }))}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="new" id="spec-new" />
            <Label htmlFor="spec-new" className="text-slate-700 cursor-pointer">New to me</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="updating" id="spec-updating" />
            <Label htmlFor="spec-updating" className="text-slate-700 cursor-pointer">One I'm updating</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Window Reasons */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">Why are you considering new windows? (Select all that apply)</Label>
        <div className="space-y-2">
          {WINDOW_REASONS.map((reason) => (
            <div key={reason} className="flex items-center space-x-2">
              <Checkbox 
                id={`spec-${reason}`}
                checked={projectDetails.windowReasons.includes(reason)}
                onCheckedChange={() => toggleWindowReason(reason)}
              />
              <Label htmlFor={`spec-${reason}`} className="text-sm text-slate-700 cursor-pointer">{reason}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Window Count */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">How many windows?</Label>
        <div className="flex gap-2">
          {WINDOW_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setProjectDetails(prev => ({ ...prev, windowCount: count }))}
              className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                projectDetails.windowCount === count
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
          <Clock className="w-4 h-4" /> What's your timeframe?
        </Label>
        <RadioGroup 
          value={projectDetails.timeframe}
          onValueChange={(value) => setProjectDetails(prev => ({ ...prev, timeframe: value }))}
          className="grid grid-cols-2 gap-2"
        >
          {TIMEFRAMES.map(({ value, label }) => (
            <div key={value} className="flex items-center space-x-2">
              <RadioGroupItem value={value} id={`spec-${value}`} />
              <Label htmlFor={`spec-${value}`} className="text-sm text-slate-700 cursor-pointer">{label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button 
        variant="cta" 
        size="lg" 
        className="w-full gap-2 text-white"
        onClick={handleProjectNext}
        disabled={!projectDetails.propertyType || !projectDetails.windowCount}
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => setStep('project')}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
          Almost done! Where's the project?
        </h2>
      </div>

      {/* City - Full Width */}
      <div>
        <Label htmlFor="spec-city" className="text-sm font-medium text-slate-700 mb-1 block flex items-center gap-1">
          <MapPin className="w-4 h-4" /> City
        </Label>
        <Input
          id="spec-city"
          value={locationDetails.city}
          onChange={(e) => setLocationDetails(prev => ({ ...prev, city: e.target.value }))}
          placeholder="Miami"
          className={`${inputBaseClass} border-black`}
          autoComplete="address-level2"
        />
      </div>

      {/* State + Zip Code - Split Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="spec-state" className="text-sm font-medium text-slate-700 mb-1 block">State</Label>
          <Select
            value={locationDetails.state}
            onValueChange={(value) => setLocationDetails(prev => ({ ...prev, state: value }))}
          >
            <SelectTrigger 
              id="spec-state"
              className="bg-white border border-black focus:ring-2 focus:ring-primary/25"
              aria-label="Select state"
            >
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
              {SOUTHEAST_STATES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="spec-zipCode" className="text-sm font-medium text-slate-700 mb-1 block">Zip Code</Label>
          <Input
            id="spec-zipCode"
            value={locationDetails.zipCode}
            onChange={(e) => setLocationDetails(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
            placeholder="33101"
            className={`${inputBaseClass} border-black`}
            autoComplete="postal-code"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="spec-remark" className="text-sm font-medium text-slate-700 mb-1 block">
          Anything else we should know? (Optional)
        </Label>
        <Input
          id="spec-remark"
          value={locationDetails.remark}
          onChange={(e) => setLocationDetails(prev => ({ ...prev, remark: e.target.value }))}
          placeholder="e.g., HOA restrictions, specific concerns..."
          className={`${inputBaseClass} border-black`}
        />
      </div>

      <Button 
        variant="cta" 
        size="lg" 
        className="w-full gap-2 text-white"
        onClick={handleLocationSubmit}
      >
        Complete Request
        <CheckCircle2 className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderThankYouStep = () => (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
        You're All Set!
      </h2>
      
      <p className="text-slate-600 mb-6">
        Here's what happens next:
      </p>

      <div className="text-left space-y-3 mb-6 bg-slate-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary">1</span>
          </div>
          <p className="text-sm text-slate-700">A window specialist will review your project details</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary">2</span>
          </div>
          <p className="text-sm text-slate-700">You'll receive a call within 24 hours at your preferred time</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-primary">3</span>
          </div>
          <p className="text-sm text-slate-700">We'll schedule your free, no-obligation measurement</p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-600 mb-2">Questions? Call us anytime:</p>
        <a 
          href="tel:+15614685571" 
          className="text-xl font-bold text-primary flex items-center justify-center gap-2 hover:underline"
        >
          <Phone className="w-5 h-5" />
          (561) 468-5571
        </a>
        <p className="text-xs text-slate-500 mt-1">We're local and ready to help.</p>
      </div>

      <Button 
        variant="secondary" 
        size="lg" 
        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900"
        onClick={() => {
          onSuccess?.();
          onClose();
        }}
      >
        Return to Checklist
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'form':
        return renderFormStep();
      case 'success':
        return renderSuccessStep();
      case 'project':
        return renderProjectStep();
      case 'location':
        return renderLocationStep();
      case 'thankyou':
        return renderThankYouStep();
      default:
        return renderFormStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-[500px] p-0 overflow-hidden border-0 max-h-[90vh] overflow-y-auto"
        style={{ 
          background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)'
        }}
        onInteractOutside={(e) => { if (step !== 'form') e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (step !== 'form') e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (step !== 'form') e.preventDefault(); }}
      >
        {/* Explicit X close button - only shows after form submission */}
        {step !== 'form' && (
          <button 
            onClick={handleExplicitClose}
            className="absolute top-4 right-4 z-50 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
        
        <div className="p-6">
          <div 
            className="rounded-xl p-6 sm:p-8 ring-1 ring-white/30"
            style={{ 
              background: 'radial-gradient(ellipse at center, #e2bbb7 0%, #f0d5d2 25%, #ffffff 60%, #ffffff 100%)',
              boxShadow: '0 35px 60px -15px rgba(0, 0, 0, 0.35), 0 20px 25px -10px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            {renderCurrentStep()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
