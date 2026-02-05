import { Button } from '@/components/ui/button';
import { Upload, Phone, ArrowRight, Shield, Check, Users } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { useSectionTracking } from '@/hooks/useSectionTracking';

interface CloserSectionProps {
  onOpenLeadModal?: (ctaSource: string) => void;
  onOpenPreQuoteModal?: (ctaSource: string) => void;
}

export function CloserSection({ onOpenLeadModal, onOpenPreQuoteModal }: CloserSectionProps) {
  const sectionRef = useSectionTracking('closer');
  
  const handleUploadClick = () => {
    trackEvent('sample_report_upload_click', { location: 'closer_section' });
    onOpenLeadModal?.('closer_upload');
  };
  
  const handleNoQuoteClick = () => {
    trackEvent('sample_report_no_quote_click', { location: 'closer_section' });
    onOpenPreQuoteModal?.('closer_no_quote');
  };
  
  const handleTalkClick = () => {
    trackEvent('sample_report_talk_click', { location: 'closer_section', action: 'phone_call' });
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-[hsl(var(--surface-1))] relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)]" /><div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,hsl(var(--secondary)/0.05)_0%,transparent_70%)]" /></div>
      <div className="container px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">Apply This Audit to Your Quote<span className="block text-primary">Before You Put Money Down</span></h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Most problems aren't visible until after the deposit. A free audit gives you leverage while you still have choices.</p>
          
          <div className="flex flex-col gap-3 sm:gap-4 justify-center mb-6 max-w-xl mx-auto">
            <Button variant="cta" size="lg" className="group text-lg px-8 py-6 shadow-lg shadow-primary/20" onClick={handleUploadClick}>
              <Upload className="w-5 h-5 mr-2" />
              Upload My Quote for Free Audit
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-6 py-5 border-2" onClick={handleNoQuoteClick}>
              Getting Quotes Soon? Get Ready
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-lg" onClick={handleTalkClick}>
              <a href="tel:+15614685571">
                <Phone className="w-5 h-5 mr-2" />
                Talk to Window Man
              </a>
            </Button>
          </div>
          
          {/* Community Value Messaging */}
          <div className="max-w-lg mx-auto mb-8 p-4 rounded-lg border border-border/30 bg-card/50">
            <div className="flex items-start gap-3 text-left">
              <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Why share your quote?</p>
                <p className="text-xs text-muted-foreground">
                  Every quote uploaded helps us refine our analysis and build the most accurate pricing database in Florida. You get instant feedback—and you help the next homeowner avoid getting ripped off by the same contractor.
                </p>
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50"><Shield className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">The audit is free whether you use your contractor or ours.</span></div>
          <div className="flex flex-wrap gap-3 justify-center mt-8">{['100% Free', 'No obligation', 'You keep the report'].map((chip) => (<span key={chip} className="inline-flex items-center gap-1.5 px-3 py-1 text-sm text-muted-foreground"><Check className="w-3.5 h-3.5 text-primary" />{chip}</span>))}</div>
        </div>
      </div>
    </section>
  );
}
