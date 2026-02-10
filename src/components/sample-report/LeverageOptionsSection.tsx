import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Zap, Check, ArrowRight, Shield } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { useSectionTracking } from '@/hooks/useSectionTracking';
interface LeverageOptionsSectionProps {
  onOpenLeadModal?: (ctaSource: string, preCheckConsent?: boolean) => void;
  onOpenPreQuoteModal?: (ctaSource: string) => void;
}
export function LeverageOptionsSection({
  onOpenLeadModal,
  onOpenPreQuoteModal
}: LeverageOptionsSectionProps) {
  const sectionRef = useSectionTracking('leverage_options');
  const [partnerConsent, setPartnerConsent] = useState(false);
  const handleOptionAClick = () => {
    trackEvent('sample_report_upload_click', {
      location: 'leverage_options',
      option: 'negotiate'
    });
    onOpenPreQuoteModal?.('option_a_audit');
  };
  const handleInactiveButtonClick = () => {
    setPartnerConsent(true);
    trackEvent('sample_report_auto_consent', {
      location: 'leverage_options',
      trigger: 'button_click'
    });
  };
  const handleOptionBClick = () => {
    trackEvent('sample_report_upload_click', {
      location: 'leverage_options',
      option: 'improve_deal'
    });
    onOpenPreQuoteModal?.('option_b_request');
  };
  const handleNoQuoteClick = () => {
    trackEvent('sample_report_no_quote_click', {
      location: 'leverage_options'
    });
    onOpenPreQuoteModal?.('option_a_setup');
  };
  return <section ref={sectionRef} className="py-16 md:py-24 bg-[hsl(var(--surface-1))]">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-12"><h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">How Do You Want to Use Your Free Report?</h2><p className="text-lg text-muted-foreground">Two paths. Same goal: protecting your investment. You choose.</p></div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-primary" /></div><span className="text-sm font-medium text-muted-foreground">Option A</span></div>
              <h3 className="text-xl font-bold text-foreground mb-2">Use It to Negotiate</h3>
              <p className="text-muted-foreground mb-6 flex-1">Bring the findings back to your contractor and fix missing protections before you sign.</p>
              <div className="space-y-3 mb-6">{['Keep your current contractor', 'Fix gaps before signing', 'No third parties involved'].map(item => <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-primary shrink-0" />{item}</div>)}</div>
              <Button variant="cta" size="lg" className="w-full group" onClick={handleOptionAClick}>
                Get My Free Audit
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                <span className="text-xs text-muted-foreground">— or —</span>
                <button onClick={handleNoQuoteClick} className="text-sm text-primary hover:underline">
                  No quote yet? Get set up now →
                </button>
              </div>
            </div>

            <div className="relative bg-card border-2 border-primary/30 rounded-2xl p-6 md:p-8 flex flex-col">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-[hsl(var(--secondary))] text-white text-xs font-semibold rounded-full">Pro-Consumer Choice</div>
              <div className="flex items-center gap-2 mb-4 mt-2"><div className="w-8 h-8 rounded-full bg-[hsl(var(--secondary)/0.1)] flex items-center justify-center"><Zap className="w-4 h-4 text-[hsl(var(--secondary))]" /></div><span className="text-sm font-medium text-muted-foreground">Option B</span></div>
              <h3 className="text-xl font-bold text-foreground mb-2">Let Window Man Improve the Deal</h3><p className="text-sm text-[hsl(var(--secondary))] font-medium mb-4">(Optional)</p>
              <p className="text-muted-foreground mb-6 flex-1">With your permission, we'll share your project specs (not personal info) with vetted partners to compete on price, scope, or warranty.</p>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 mb-6">
                <label className="flex items-start gap-3 cursor-pointer"><Checkbox checked={partnerConsent} onCheckedChange={checked => setPartnerConsent(checked === true)} className="mt-1" /><div><span className="text-sm font-medium text-foreground">Yes — share my project specs with vetted partners</span><p className="text-xs text-muted-foreground mt-1">We never sell your contact info. If a partner needs to reach you, we'll ask first.</p></div></label>
              </div>
              {partnerConsent ? <Button variant="cta" size="lg" className="w-full group" onClick={handleOptionBClick}>
                  Request Better Quote Options
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button> : <Button variant="outline" size="lg" className="w-full bg-muted text-muted-foreground border-2 border-[#D97706] dark:border-[#D97706]" onClick={handleInactiveButtonClick}>
                  Request Better Quote Options
                </Button>}
            </div>
          </div>
          <div className="max-w-2xl mx-auto mt-8 font-semibold text-center"><div className="flex items-center justify-center gap-2 text-sm text-muted-foreground"><Shield className="w-4 h-4 text-primary" /><span>Either way, the audit is free whether you use your contractor or ours.</span></div></div>
        </div>
    </section>;
}