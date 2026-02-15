import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Zap, Download, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackLeadCapture, trackLeadSubmissionSuccess } from "@/lib/gtm";
import { getOrCreateClientId } from "@/lib/tracking";
import { getAttributionData } from "@/lib/attribution";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/navigation";

interface PreQuoteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
  ctaSource?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Phone formatting helper
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

// Validation helpers
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}

export function PreQuoteLeadModal({ isOpen, onClose, onSuccess, ctaSource = "unknown" }: PreQuoteLeadModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const firstNameRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [submittedLeadId, setSubmittedLeadId] = useState("");

  // Focus first field when modal opens
  useEffect(() => {
    if (isOpen && !isSuccess) {
      setTimeout(() => firstNameRef.current?.focus(), 100);
    }
  }, [isOpen, isSuccess]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData({ firstName: "", lastName: "", email: "", phone: "" });
        setErrors({});
        setIsSuccess(false);
        setSubmittedName("");
      }, 300);
    }
  }, [isOpen]);

  const handleChange = (field: keyof FormData, value: string) => {
    let processedValue = value;

    if (field === "phone") {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = "Please enter your first name";
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = "Please enter your last name";
    }
    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone || !validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke("save-lead", {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone.replace(/\D/g, ""),
          sourceTool: "sample-report",
          leadType: "pre_quote",
          sessionData: {
            clientId: getOrCreateClientId(),
            ctaSource,
          },
          attribution: getAttributionData(),
        },
      });

      if (error) throw error;

      if (result?.leadId) {
        // Track both lead_captured AND lead_submission_success for full EMQ
        Promise.allSettled([
          trackLeadCapture(
            {
              leadId: result.leadId,
              sourceTool: "sample_report",
              conversionAction: "pre_quote_signup",
            },
            formData.email,
            formData.phone,
            { hasName: true, hasPhone: true },
          ),
          trackLeadSubmissionSuccess({
            leadId: result.leadId,
            email: formData.email,
            phone: formData.phone.replace(/\D/g, ""),
            firstName: formData.firstName,
            lastName: formData.lastName,
            sourceTool: "sample-report",
            eventId: `pre_quote_lead:${result.leadId}`,
            value: 75, // Higher value than quote uploads ($50) - main page goal
          }),
        ]).catch((err) => console.warn("[PreQuoteLeadModal] Non-fatal tracking error:", err));

        setSubmittedName(formData.firstName);
        setSubmittedLeadId(result.leadId);
        setIsSuccess(true);
        onSuccess?.(result.leadId);
      }
    } catch (err) {
      console.error("[PreQuoteLeadModal] Submit error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContinueLabel = () => {
    switch (ctaSource) {
      case "scanner_download_sample":
        return "View Sample Report";
      case "option_b_request":
      default:
        return "Go to Quote Scanner";
    }
  };

  const handleContinue = () => {
    onClose();

    switch (ctaSource) {
      case "scanner_download_sample": {
        navigate(ROUTES.SAMPLE_REPORT, {
          state: {
            firstName: formData.firstName || submittedName || "",
            leadId: submittedLeadId || "",
            ctaSource,
          },
        });
        return;
      }

      case "option_b_request":
      default: {
        if (submittedLeadId) {
          navigate(`${ROUTES.QUOTE_SCANNER}?lead=${submittedLeadId}#upload`);
        } else {
          navigate(ROUTES.QUOTE_SCANNER);
        }
        return;
      }
    }
  };

  const isFormValid =
    formData.firstName.length >= 2 &&
    formData.lastName.length >= 2 &&
    validateEmail(formData.email) &&
    validatePhone(formData.phone);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        {!isSuccess ? (
          /* Form State */
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">The Info to Outsmart the Sales Pitch</h2>
            </div>

            <p className="text-muted-foreground mb-4">
              When a contractor hands you a quote, you'll have seconds to decide if you trust it.
            </p>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-foreground">Set up now so you can:</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Upload quotes instantly from your phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Get real-time analysis while the contractor waits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Know exactly what questions to ask on the spot</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prequote-firstName">First Name</Label>
                  <Input
                    ref={firstNameRef}
                    id="prequote-firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="First name"
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-xs text-destructive">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prequote-lastName">Last Name</Label>
                  <Input
                    id="prequote-lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Last name"
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="text-xs text-destructive">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prequote-email">Email</Label>
                <Input
                  id="prequote-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="you@example.com"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prequote-phone">Phone</Label>
                <Input
                  id="prequote-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(555) 555-5555"
                  aria-describedby={errors.phone ? "phone-error" : "phone-help"}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone ? (
                  <p id="phone-error" className="text-xs text-destructive">
                    {errors.phone}
                  </p>
                ) : (
                  <p id="phone-help" className="text-xs text-muted-foreground">
                    📱 We'll text you a direct link to upload from your phone
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create My Free Account"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                🔒 No spam. No obligations. Unsubscribe anytime.
              </p>
            </form>
          </div>
        ) : (
          /* Success State */
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">You're All Set, {submittedName}!</h2>

            <p className="text-muted-foreground mb-6">
              We just sent a link to your phone. Bookmark it so you're ready when the first quote lands in your hands.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-foreground mb-2">💡 Pro Tip</p>
              <p className="text-sm text-muted-foreground">
                Upload your quote while the contractor is still in your living room. Nothing keeps them honest like
                watching you fact-check their numbers in real time.
              </p>
            </div>

            <div className="border border-border rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-foreground mb-1">
                📥 Bonus: Download our "7 Red Flags" cheat sheet
              </p>
              <p className="text-xs text-muted-foreground">Keep it on your phone during contractor visits.</p>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open("/downloads/7-red-flags-cheatsheet.pdf", "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Cheat Sheet (PDF)
              </Button>

              <Button className="w-full" onClick={handleContinue}>
                {getContinueLabel()}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
