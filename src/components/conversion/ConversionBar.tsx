import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/navigation";

type ConversionBarProps = {
  headline?: string;
  subheadline?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  helperText?: string;
};

/**
 * ConversionBar is a lightweight call-to-action strip that can be reused across
 * multiple landing pages to keep visitors moving toward the free estimate flow.
 * It defaults to the "/free-estimate" path but can be customized per page.
 */
export const ConversionBar = ({
  headline = "Ready for a no-obligation impact window estimate?",
  subheadline = "Upload your quote or tell us about your home—we'll price-check it in minutes.",
  primaryCtaLabel = "Start your free estimate",
  primaryCtaHref = ROUTES.FREE_ESTIMATE,
  helperText = "No spam. We only use your info to prep your tailored inspection plan.",
}: ConversionBarProps) => {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{headline}</p>
          <p className="text-sm text-muted-foreground">{subheadline}</p>
          <p className="text-xs text-muted-foreground/80">{helperText}</p>
        </div>

        <Button asChild className="w-full md:w-auto gap-2">
          <Link to={primaryCtaHref}>
            {primaryCtaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
