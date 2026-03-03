import { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Phone, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/gtm";
import { useSessionData } from "@/hooks/useSessionData";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/navigation";

const PHONE_NUMBER = "+15614685571";
const PHONE_DISPLAY = "(561) 468-5571";

interface SourceConfig {
  headline: string;
  subtitle: string;
  primaryLabel: string;
  primaryTo: string;
}

function getSourceConfig(source: string | null): SourceConfig {
  switch (source) {
    case "quote-scanner":
      return {
        headline: "Your Quote Analysis is Ready",
        subtitle: "Our AI has finished scanning your quote. View your results now.",
        primaryLabel: "View Your Results",
        primaryTo: ROUTES.QUOTE_SCANNER,
      };
    case "consultation":
      return {
        headline: "Consultation Request Received",
        subtitle: "A specialist will reach out within 24 hours.",
        primaryLabel: "Scan a Quote While You Wait",
        primaryTo: ROUTES.QUOTE_SCANNER,
      };
    case "estimate":
      return {
        headline: "Your Estimate Request is Submitted",
        subtitle: "We're preparing your personalized estimate. You'll hear from us shortly.",
        primaryLabel: "Scan Your Quote",
        primaryTo: ROUTES.QUOTE_SCANNER,
      };
    case "beat-your-quote":
      return {
        headline: "We're Finding You a Better Deal",
        subtitle: "Our team is reviewing your quote to find savings. We'll be in touch soon.",
        primaryLabel: "Track Your Results",
        primaryTo: ROUTES.VAULT,
      };
    default:
      return {
        headline: "Thank You!",
        subtitle: "Your submission has been received. We'll follow up shortly.",
        primaryLabel: "Explore Our Tools",
        primaryTo: ROUTES.TOOLS,
      };
  }
}

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source");
  const leadIdParam = searchParams.get("leadId");
  const { sessionData } = useSessionData();
  const { setLeadId } = useLeadIdentity();
  const trackedRef = useRef(false);

  // Sync leadId to Golden Thread
  useEffect(() => {
    if (leadIdParam) {
      setLeadId(leadIdParam);
    }
  }, [leadIdParam, setLeadId]);

  // Fire tracking event exactly once
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackEvent("thankyou_page_view", {
      source: source || "direct",
      lead_id: leadIdParam || undefined,
      conversion_complete: true,
    });
  }, [source, leadIdParam]);

  const config = getSourceConfig(source);
  const firstName = sessionData.firstName;

  return (
    <>
      <Helmet>
        <title>Thank You | Window Man Truth Engine</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            {/* Success icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {firstName ? `${config.headline}, ${firstName}!` : `${config.headline}!`}
              </h1>
              <p className="text-muted-foreground">{config.subtitle}</p>
            </div>

            {/* Primary CTA */}
            <Button asChild size="lg" className="w-full">
              <Link to={config.primaryTo}>
                {config.primaryLabel}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>

            {/* Secondary CTA */}
            {source !== "consultation" && (
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link to={ROUTES.CONSULTATION}>Book a Free Consultation</Link>
              </Button>
            )}

            {/* Tertiary: Phone */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Want answers now? Talk to our AI assistant:
              </p>
              <Button asChild variant="ghost" size="sm">
                <a href={`tel:${PHONE_NUMBER}`}>
                  <Phone className="mr-2 w-4 h-4" />
                  {PHONE_DISPLAY}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
