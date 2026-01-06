import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, ArrowRight, ClipboardCheck, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trackEvent } from '@/lib/gtm';
import { useToast } from '@/hooks/use-toast';
import { useFormValidation, commonSchemas, formatPhoneNumber } from '@/hooks/useFormValidation';
import { getAttributionData, buildAIContextFromSession } from '@/lib/attribution';
import { useSessionData } from '@/hooks/useSessionData';

interface OutcomeFoldersProps {
  isVisible: boolean;
}

export function OutcomeFolders({ isVisible }: OutcomeFoldersProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionData, updateFields } = useSessionData();
  const [activeOutcome, setActiveOutcome] = useState<'alpha' | 'bravo' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [name, setName] = useState(sessionData.name || '');
  const [phone, setPhone] = useState(sessionData.phone || '');
  const [projectCost, setProjectCost] = useState('');
  const [windowCount, setWindowCount] = useState(sessionData.windowCount?.toString() || '');

  const { values, hasError, getError, getFieldProps, validateAll } = useFormValidation({
    initialValues: { email: sessionData.email || '' },
    schemas: { email: commonSchemas.email },
  });

  // Field validation states
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = values.email.trim() && !hasError('email') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
  const isPhoneValid = phone.replace(/\D/g, '').length === 10;

  const handleOutcomeClick = (outcome: 'alpha' | 'bravo') => {
    setActiveOutcome(activeOutcome === outcome ? null : outcome);
    trackEvent('outcome_folder_opened', { outcome });
  };

  const handleStartMission = () => {
    trackEvent('start_mission_clicked');
    setIsModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handleProjectCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format as currency
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      setProjectCost(`$${parseInt(value).toLocaleString()}`);
    } else {
      setProjectCost('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: 'Invalid Email',
        description: getError('email') || 'Please check your email',
        variant: 'destructive',
      });
      return;
    }

    if (!name.trim() || !phone.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and phone number.',
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
            name: name.trim(),
            phone: phone.trim(),
            sourceTool: 'beat-your-quote',
            sessionData: {
              ...sessionData,
              projectCost: projectCost.replace(/[^0-9]/g, ''),
              windowCount: windowCount ? parseInt(windowCount) : undefined,
            },
            attribution: getAttributionData(),
            aiContext: buildAIContextFromSession(sessionData, 'beat-your-quote'),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);

        // Update session data
        updateFields({
          email: values.email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          windowCount: windowCount ? parseInt(windowCount) : undefined,
        });

        trackEvent('lead_captured', {
          source_tool: 'beat-your-quote',
          lead_id: data.leadId,
          has_project_cost: !!projectCost,
          has_window_count: !!windowCount,
        });

        toast({
          title: 'Mission Started!',
          description: 'Redirecting to Quote Scanner...',
        });

        setTimeout(() => {
          navigate('/quote-scanner');
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Lead capture error:', error);
      toast({
        title: 'Unable to start mission',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!isLoading) {
      setIsModalOpen(false);
      setIsSuccess(false);
    }
  };

  const emailProps = getFieldProps('email');
  const emailHasError = hasError('email');
  const emailError = getError('email');
  const isFormValid = values.email.trim() && name.trim() && phone.trim();

  return (
    <div className={`
      space-y-8 transition-all duration-700
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
    `}>
      {/* Section Divider */}
      <div className="flex items-center justify-center gap-4 py-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#00D4FF]/30" />
        <Zap className="w-5 h-5 text-[#00D4FF]" />
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#00D4FF]/30" />
      </div>

      {/* Header Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10">
          <ClipboardCheck className="w-4 h-4 text-[#00D4FF]" />
          <span className="text-sm font-mono tracking-wider text-[#00D4FF]">
            MISSION OUTCOME BRIEFING
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-3xl md:text-4xl font-bold text-center font-mono">
        <span className="text-white">TWO POSSIBLE </span>
        <span className="text-[#00D4FF]">OUTCOMES</span>
      </h3>
      
      <p className="text-center text-muted-foreground">
        Tap each folder to reveal what happens next.
      </p>

      {/* Outcome Folders */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Outcome Alpha - We Beat It */}
        <div 
          className={`
            cursor-pointer rounded-lg border transition-all duration-300
            ${activeOutcome === 'alpha' 
              ? 'border-green-500/60 bg-green-950/20' 
              : 'border-border/40 bg-background/5 hover:border-green-500/40'
            }
          `}
          onClick={() => handleOutcomeClick('alpha')}
        >
          <div className="p-4 flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${activeOutcome === 'alpha' ? 'bg-green-500/20' : 'bg-green-500/10'}
            `}>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-green-400 uppercase tracking-wide font-mono">
                WE BEAT IT
              </h4>
              <p className="text-sm text-muted-foreground">We beat your quote</p>
            </div>
            {activeOutcome === 'alpha' && (
              <span className="text-xs font-mono text-green-400/60 tracking-wider">OUTCOME ALPHA</span>
            )}
          </div>
          
          {/* Expanded Content */}
          {activeOutcome === 'alpha' && (
            <div className="px-4 pb-6 animate-fade-in">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <ClipboardCheck className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide font-mono">Mission Successful</span>
              </div>
              
              <div className="p-4 rounded-lg bg-green-900/30 border border-green-500/20 mb-4">
                <div className="text-sm text-muted-foreground mb-1">Average Savings</div>
                <div className="text-3xl font-bold text-green-400 font-mono">$4,200</div>
              </div>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Receive a verified quote from our contractor network
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Same materials, same quality, less markup
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  Proceed to contract with confidence
                </li>
              </ul>
              
              <p className="text-center text-sm text-green-400/60 italic mt-4">
                "You just saved enough for a family vacation."
              </p>
            </div>
          )}
        </div>

        {/* Outcome Bravo - Quote Validated */}
        <div 
          className={`
            cursor-pointer rounded-lg border transition-all duration-300
            ${activeOutcome === 'bravo' 
              ? 'border-[#00D4FF]/60 bg-[#00D4FF]/5' 
              : 'border-border/40 bg-background/5 hover:border-[#00D4FF]/40'
            }
          `}
          onClick={() => handleOutcomeClick('bravo')}
        >
          <div className="p-4 flex items-center gap-4">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${activeOutcome === 'bravo' ? 'bg-[#00D4FF]/20' : 'bg-[#00D4FF]/10'}
            `}>
              <Shield className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#00D4FF] uppercase tracking-wide font-mono">
                QUOTE VALIDATED
              </h4>
              <p className="text-sm text-muted-foreground">We can't beat it</p>
            </div>
            {activeOutcome === 'bravo' && (
              <span className="text-xs font-mono text-[#00D4FF]/60 tracking-wider">OUTCOME BRAVO</span>
            )}
          </div>
          
          {/* Expanded Content */}
          {activeOutcome === 'bravo' && (
            <div className="px-4 pb-6 animate-fade-in">
              <div className="flex items-center gap-2 text-[#00D4FF] mb-4">
                <Shield className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide font-mono">Intel Confirmed</span>
              </div>
              
              <div className="p-4 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 mb-4">
                <div className="text-sm text-muted-foreground mb-1">Your Quote Status</div>
                <div className="text-2xl font-bold text-[#00D4FF] font-mono">COMPETITIVE</div>
              </div>
              
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span>
                  Your original quote is confirmed as fair market value
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span>
                  No hidden markups detected
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00D4FF]">✓</span>
                  Proceed with your contractor confidently
                </li>
              </ul>
              
              <p className="text-center text-sm text-[#00D4FF]/60 italic mt-4">
                "We'll even tell you to take it."
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Win-Win Message */}
      <div className="max-w-lg mx-auto p-6 rounded-lg border border-border/30 bg-background/5 text-center">
        <p className="text-lg">
          Either way, <span className="text-[#00D4FF] font-bold">you win.</span>
        </p>
        <p className="text-sm text-[#00D4FF]/60 italic mt-2">
          "The only failed mission is the one you never start."
        </p>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button 
          onClick={handleStartMission}
          className="bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold px-8 py-6 text-lg uppercase tracking-wider"
        >
          Start Your Mission
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          Upload your quote. Get results in 24 hours.
        </p>
      </div>

      {/* Lead Capture Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="sm:max-w-md">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#00D4FF]/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-[#00D4FF]" />
              </div>
              <DialogTitle className="text-xl mb-2">Mission Initiated!</DialogTitle>
              <DialogDescription>
                Redirecting you to the Quote Scanner...
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-[#00D4FF]/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#00D4FF]" />
                  </div>
                </div>
                <DialogTitle className="text-center">Start Your Mission</DialogTitle>
                <DialogDescription className="text-center">
                  Enter your details to upload your quote and receive your personalized analysis within 24 hours.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mission-name">Name</Label>
                    {isNameValid && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <Input
                    id="mission-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mission-email" className={emailHasError ? 'text-destructive' : ''}>
                      Email Address
                    </Label>
                    {isEmailValid && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <Input
                    id="mission-email"
                    type="email"
                    placeholder="you@example.com"
                    {...emailProps}
                    disabled={isLoading}
                    className={emailHasError ? 'border-destructive focus-visible:ring-destructive' : ''}
                    aria-invalid={emailHasError}
                    aria-describedby={emailHasError ? 'mission-email-error' : undefined}
                  />
                  {emailHasError && (
                    <p id="mission-email-error" className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mission-phone">Phone Number</Label>
                    {isPhoneValid && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                  <Input
                    id="mission-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mission-cost">Project Cost</Label>
                      {projectCost && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <Input
                      id="mission-cost"
                      type="text"
                      placeholder="$15,000"
                      value={projectCost}
                      onChange={handleProjectCostChange}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mission-windows">Window Count</Label>
                      {windowCount && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <Input
                      id="mission-windows"
                      type="number"
                      placeholder="10"
                      min="1"
                      max="100"
                      value={windowCount}
                      onChange={(e) => setWindowCount(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-bold"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initiating Mission...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Continue to Quote Scanner
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
