import { Phone, ShieldCheck } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';

interface TalkToExpertCTAProps {
  leadId?: string | null;
}

export function TalkToExpertCTA({ leadId }: TalkToExpertCTAProps) {
  const handleClick = () => {
    trackEvent('cta_click', {
      location: 'post_scan_primary',
      placement: 'authority_report',
      leadId: leadId || undefined,
    });
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Talk to a Window Expert</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Get a free, no-obligation review of your quote from a certified window professional.
      </p>

      <a
        href="tel:+15614685571"
        onClick={handleClick}
        className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
      >
        <Phone className="w-4 h-4" />
        (561) 468-5571
      </a>

      <div className="flex items-center gap-1.5 justify-center text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5" />
        Free consultation · No obligation
      </div>
    </div>
  );
}
