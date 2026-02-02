import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Phone, ArrowRight, Shield, Check } from 'lucide-react';
import { trackEvent } from '@/lib/gtm';
import { ROUTES } from '@/config/navigation';

export function CloserSection() {
  const handleUploadClick = () => { trackEvent('sample_report_upload_click', { location: 'closer_section' }); };
  const handleTalkClick = () => { trackEvent('sample_report_talk_click', { location: 'closer_section' }); };

  return (
    <section className="py-20 md:py-28 bg-[hsl(var(--surface-1))] relative overflow-hidden">
      <div className="absolute inset-0"><div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)]" /><div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,hsl(var(--secondary)/0.05)_0%,transparent_70%)]" /></div>
      <div className="container px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">Apply This Audit to Your Quote<span className="block text-primary">Before You Put Money Down</span></h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Most problems aren't visible until after the deposit. A free audit gives you leverage while you still have choices.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button asChild variant="cta" size="lg" className="group text-lg px-8 py-6 shadow-lg shadow-primary/20" onClick={handleUploadClick}><Link to={`${ROUTES.QUOTE_SCANNER}#upload`}><Upload className="w-5 h-5 mr-2" />Upload My Estimate (Free Audit)<ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" /></Link></Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2" onClick={handleTalkClick}><Link to={ROUTES.CONSULTATION}><Phone className="w-5 h-5 mr-2" />Talk to Window Man</Link></Button>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50"><Shield className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">The audit is free whether you use your contractor or ours.</span></div>
          <div className="flex flex-wrap gap-3 justify-center mt-8">{['100% Free', 'No obligation', 'You keep the report'].map((chip) => (<span key={chip} className="inline-flex items-center gap-1.5 px-3 py-1 text-sm text-muted-foreground"><Check className="w-3.5 h-3.5 text-primary" />{chip}</span>))}</div>
        </div>
      </div>
    </section>
  );
}
