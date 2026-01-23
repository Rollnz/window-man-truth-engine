import { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useFormValidation, commonSchemas, formatPhoneNumber } from "@/hooks/useFormValidation";
import { SessionData, useSessionData } from "@/hooks/useSessionData";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { useFormAbandonment } from "@/hooks/useFormAbandonment";
import { Calendar, Check, Loader2 } from "lucide-react";
import { trackEvent, trackModalOpen, trackBookingConfirmed, trackFormStart, trackLeadSubmissionSuccess, generateEventId } from "@/lib/gtm";
import { getOrCreateClientId, getOrCreateSessionId } from "@/lib/tracking";
import { getLeadAnchor } from "@/lib/leadAnchor";
import { getAttributionData, buildAIContextFromSession } from "@/lib/attribution";
import { setLeadAnchor } from "@/lib/leadAnchor";
import { logBookingConfirmed } from "@/lib/highValueSignals";
import type { SourceTool } from "@/types/sourceTool";
import { TrustModal } from "@/components/forms/TrustModal";

interface ConsultationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId?: string;
  sessionData: SessionData;
  sourceTool: SourceTool;
}

const timeOptions = [
  { value: "morning", label: "Morning (9am - 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm - 5pm)" },
  { value: "evening", label: "Evening (5pm - 8pm)" },
  { value: "asap", label: "ASAP - Call me now!" },
];

export function ConsultationBookingModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  sessionData,
  sourceTool,
}: ConsultationBookingModalProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [modalOpenTime, setModalOpenTime] = useState<number>(0);

  // Golden Thread: Use hook as fallback if leadId prop not provided
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { updateFields } = useSessionData();
  const effectiveLeadId = leadId || hookLeadId;

  // Form abandonment tracking (Phase 7)
  const { trackFieldEntry, resetTracking } = useFormAbandonment({
    formId: 'consultation_booking',
    sourceTool,
    isSubmitted: isSuccess,
  });

  const { values, errors, setValue, setValues, hasError, getError, getFieldProps, validateAll, clearErrors } =
    useFormValidation({
      initialValues: {
        name: sessionData.name || "",
        email: sessionData.email || "",
        phone: sessionData.phone || "",
        preferredTime: "",
      },
      schemas: {
        name: commonSchemas.name,
        email: commonSchemas.email,
        phone: commonSchemas.phone,
        preferredTime: commonSchemas.required("Please select a preferred time"),
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

      trackModalOpen({ modalName: "consultation_booking", sourceTool });
      
      // Enriched dataLayer push for funnel reconstruction
      const externalId = effectiveLeadId || getLeadAnchor() || null;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'consultation_modal_opened',
        event_id: generateEventId(),
        client_id: getOrCreateClientId(),
        session_id: getOrCreateSessionId(),
        external_id: externalId,
        source_tool: sourceTool,
        source_system: 'web',
        modal_name: 'consultation_booking',
      });
    }
  }, [isOpen, sourceTool, effectiveLeadId]); // Added effectiveLeadId for external_id resolution

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) {
      toast({
        title: "Please fix the errors",
        description: "Some fields need your attention.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          email: values.email.trim(),
          name: values.name.trim(),
          phone: values.phone.trim(),
          sourceTool,
          sessionData,
          consultation: {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            preferredTime: values.preferredTime,
            notes: notes.trim() || undefined,
          },
          attribution: getAttributionData(),
          aiContext: buildAIContextFromSession(sessionData, sourceTool),
          // Golden Thread: Pass existing leadId for identity persistence
          leadId: effectiveLeadId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to schedule");
      }

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);

        // Golden Thread: Persist leadId for future interactions
        if (data.leadId) {
          setLeadId(data.leadId);
          updateFields({ 
            leadId: data.leadId,
            consultationRequested: true 
          });
          
          // PHASE 3: Set lead anchor for 400-day persistence
          setLeadAnchor(data.leadId);
        }
        
        // Enriched dataLayer push for consultation completion
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'consultation_form_completed',
          event_id: generateEventId(),
          client_id: getOrCreateClientId(),
          session_id: getOrCreateSessionId(),
          external_id: data.leadId || effectiveLeadId || null,
          source_tool: sourceTool,
          source_system: 'web',
          form_name: 'consultation_booking',
          preferred_time: values.preferredTime,
        });

        // Track primary lead capture with Enhanced Conversions (value: 15 USD)
        // Option A: Full payload parity with lead_captured - includes all EMQ parameters
        const nameParts = (values.name || '').split(' ');
        const firstName = nameParts[0] || undefined;
        const lastName = nameParts.slice(1).join(' ') || undefined;
        
        await trackLeadSubmissionSuccess({
          leadId: data.leadId,
          email: values.email,
          phone: values.phone,
          firstName,
          lastName,
          // Location data from sessionData if available
          city: sessionData.city || undefined,
          state: sessionData.state || undefined,
          zipCode: sessionData.zipCode || undefined,
          sourceTool,
        });

        // Track Enhanced Consultation Booking with async PII hashing (value: 75 USD)
        await trackBookingConfirmed({
          leadId: data.leadId,
          email: values.email,
          phone: values.phone,
          firstName,
          lastName,
          preferredTime: values.preferredTime,
          sourceTool,
          windowCount: sessionData.windowCount,
          estimatedProjectValue: sessionData.fairPriceQuizResults?.quoteAmount,
          urgencyLevel: sessionData.urgencyLevel,
        });
        
        // PHASE 4: Log high-value booking_confirmed signal to wm_event_log
        await logBookingConfirmed({
          preferredTime: values.preferredTime,
          bookingType: 'consultation',
          windowCount: sessionData.windowCount,
          projectValue: sessionData.fairPriceQuizResults?.quoteAmount,
          urgencyLevel: sessionData.urgencyLevel,
          leadId: data.leadId,
        });

        toast({
          title: "Consultation Requested!",
          description: "We'll contact you within 24 hours.",
        });

        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to schedule");
      }
    } catch (error) {
      console.error("Consultation booking error:", error);
      toast({
        title: "Unable to schedule",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
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
        trackEvent("modal_abandon", {
          modal_type: "consultation_booking",
          time_spent_seconds: timeSpent,
        });
      }

      setIsSuccess(false);
      resetTracking(); // Reset abandonment tracking
      setValues({
        name: sessionData.name || "",
        email: sessionData.email || "",
        phone: sessionData.phone || "",
        preferredTime: "",
      });
      setNotes("");
      clearErrors();
      onClose();
    }
  };

  // Track form start on first field focus
  const handleFirstFieldFocus = () => {
    trackFormStart({ formName: 'consultation_booking', sourceTool });
  };

  const nameProps = getFieldProps("name");
  const emailProps = getFieldProps("email");
  const phoneProps = getFieldProps("phone");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <TrustModal 
        className="sm:max-w-md p-5"
        modalTitle={isSuccess ? undefined : "Schedule a Free Consultation"}
        modalDescription={isSuccess ? undefined : "Get personalized advice from a local window expert at no cost."}
        headerAlign="center"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <Check className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-900">Consultation Requested!</h2>
            <p className="text-slate-600">Thanks! A window expert will contact you within 24 hours.</p>
          </div>
        ) : (
          <>

            {/* TrustModal auto-wraps children with FormSurfaceProvider surface="trust" */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name" className={`text-sm font-semibold text-slate-900 ${hasError("name") ? "text-destructive" : ""}`}>
                  Your Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  {...nameProps}
                  disabled={isLoading}
                  className={`h-9 ${hasError("name") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-invalid={hasError("name")}
                  aria-describedby={hasError("name") ? "name-error" : undefined}
                />
                {hasError("name") && (
                  <p id="name-error" className="text-xs text-destructive">
                    {getError("name")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="consult-email" className={`text-sm font-semibold text-slate-900 ${hasError("email") ? "text-destructive" : ""}`}>
                  Email Address
                </Label>
                <Input
                  id="consult-email"
                  type="email"
                  placeholder="you@example.com"
                  {...emailProps}
                  disabled={isLoading}
                  className={`h-9 ${hasError("email") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-invalid={hasError("email")}
                  aria-describedby={hasError("email") ? "email-error" : undefined}
                />
                {hasError("email") && (
                  <p id="email-error" className="text-xs text-destructive">
                    {getError("email")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className={`text-sm font-semibold text-slate-900 ${hasError("phone") ? "text-destructive" : ""}`}>
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...phoneProps}
                  disabled={isLoading}
                  className={`h-9 ${hasError("phone") ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  aria-invalid={hasError("phone")}
                  aria-describedby={hasError("phone") ? "phone-error" : undefined}
                />
                {hasError("phone") && (
                  <p id="phone-error" className="text-xs text-destructive">
                    {getError("phone")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="preferred-time"
                  className={`text-sm font-semibold text-slate-900 ${hasError("preferredTime") ? "text-destructive" : ""}`}
                >
                  Best Time to Call
                </Label>
                <Select
                  value={values.preferredTime}
                  onValueChange={(value) => setValue("preferredTime", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="preferred-time"
                    className={`h-9 ${hasError("preferredTime") ? "border-destructive focus:ring-destructive" : ""}`}
                    aria-invalid={hasError("preferredTime")}
                    aria-describedby={hasError("preferredTime") ? "time-error" : undefined}
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
                {hasError("preferredTime") && (
                  <p id="time-error" className="text-xs text-destructive">
                    {getError("preferredTime")}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes" className="text-sm font-semibold text-slate-900">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific questions or concerns?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="cta"
                className="w-full h-10 mt-2"
                disabled={isLoading}
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
      </TrustModal>
    </Dialog>
  );
}
