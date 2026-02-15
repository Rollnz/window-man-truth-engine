/**
 * Universal Thank You Page (/thank-you)
 * 
 * Call-first conversion UX with dynamic content based on ?source= param.
 * Fires ONE enriched page_view (NOT a conversion) — GTM uses conversion_complete:true
 * as the handshake trigger. The actual conversion fires on the origin page.
 * 
 * WIRING RULE: Origin forms must redirect here using navigate(url, { replace: true })
 * to prevent back-button re-submission.
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Phone, ArrowRight, Shield, Check, Upload, Clock, Sparkles } from 'lucide-react';

import { Navbar } from '@/components/home/Navbar';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/gtm';
import { useLeadIdentity } from '@/hooks/useLeadIdentity';
import { CONTACT } from '@/constants/contact';
import { AnimateOnScroll } from '@/components/ui/AnimateOnScroll';
import { TestimonialCards } from '@/components/TestimonialCards';
import { UrgencyTicker } from '@/components/social-proof';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { THANK_YOU_CONTENT, resolveThankYouSource } from '@/config/thankYouContent';

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const { setLeadId } = useLeadIdentity();

  // Read & normalize query params
  const source = searchParams.get('source');
  const leadId = searchParams.get('leadId') || searchParams.get('lead_id') || searchParams.get('lead') || undefined;
  const name = (searchParams.get('name') || '').trim();
  const eventId = searchParams.get('eventId') || searchParams.get('event_id') || undefined;
  const valueParam = searchParams.get('value') || undefined;

  const resolvedSource = resolveThankYouSource(source);
  const content = THANK_YOU_CONTENT[resolvedSource];

  // Fire-once guard (StrictMode safe)
  const firedRef = useRef(false);
  const [showSecondary, setShowSecondary] = useState(false);

  // 1.5s delay for secondary CTAs (psychological pacing)
  useEffect(() => {
    const t = setTimeout(() => setShowSecondary(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Fire exactly ONE enriched page_view on mount
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (leadId) setLeadId(leadId);

    const value = valueParam ? Number.parseFloat(valueParam) : undefined;

    trackEvent('page_view', {
      page_path: '/thank-you',
      source_tool: resolvedSource,
      lead_id: leadId,
      conversion_complete: true,
      ...(eventId ? { event_id: eventId } : {}),
      ...(Number.isFinite(value as number) ? { value } : {}),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCtaClick = (
    cta: 'call' | 'upload' | 'primary' | 'secondary',
    destination: string,
  ) => {
    trackEvent('thankyou_cta_click', {
      cta,
      source_tool: resolvedSource,
      lead_id: leadId,
      destination,
      ...(cta === 'call' ? { phone_number: CONTACT.PHONE_E164, link_type: 'tel' } : {}),
    });
  };

  const greeting = name.length >= 2 ? `${name}, you're all set.` : "You're all set.";

  return (
    <>
      <Helmet>
        <title>Thank You | Window Man Truth Engine</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="/thank-you" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* DEV Debug Widget */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 z-50 bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs font-mono max-w-[260px] shadow-xl">
            <p>source: {source || '(none)'}</p>
            <p>resolved: {resolvedSource}</p>
            <p>leadId: {leadId || '(none)'}</p>
            <p>eventId: {eventId || '(none)'}</p>
            <p>value: {valueParam || '(none)'}</p>
            <p>name: {name || '(none)'}</p>
            <p>fired: {String(firedRef.current)}</p>
            <p>primary: {content.primaryWebCta.href}</p>
          </div>
        )}

        <Navbar funnelMode={true} />

        {/* ═══ Section 1: Confirmation Hero ═══ */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Radial gradient orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[hsl(25,95%,55%)]/10 blur-[100px] pointer-events-none" aria-hidden="true" />

          <div className="container max-w-3xl mx-auto px-4 relative z-10">
            <AnimateOnScroll delay={0}>
              <div className="bg-card/80 backdrop-blur-lg border border-border/50 rounded-2xl p-6 md:p-10 shadow-2xl">
                {/* Pill badge */}
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Confirmed
                  </span>
                </div>

                {/* Greeting */}
                <AnimateOnScroll delay={100}>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground text-center mb-3">
                    {greeting}
                  </h1>
                </AnimateOnScroll>

                {/* Brand voice */}
                <AnimateOnScroll delay={200}>
                  <p className="text-muted-foreground text-center text-base md:text-lg mb-6 max-w-xl mx-auto">
                    Good move. Most homeowners don't see the traps until it's too late. Let's keep you out of that story.
                  </p>
                </AnimateOnScroll>

                {/* Dynamic headline + subhead */}
                <AnimateOnScroll delay={300}>
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-2">
                    {content.headline}
                  </h2>
                  <p className="text-muted-foreground text-center text-sm md:text-base mb-6 max-w-lg mx-auto">
                    {content.subhead}
                  </p>
                </AnimateOnScroll>

                {/* Trust chips */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {['No sales pitch', 'No obligation', 'Available 24/7'].map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground"
                    >
                      <Check className="w-3 h-3 text-primary" aria-hidden="true" />
                      {chip}
                    </span>
                  ))}
                </div>

                {/* Safety microcopy */}
                <p className="text-xs text-muted-foreground text-center">
                  We never sell your information. Ever.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══ Section 1.5: UrgencyTicker ═══ */}
        <div className="py-4">
          <UrgencyTicker variant="minimal" />
        </div>

        {/* ═══ Section 2: Primary Call CTA ═══ */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container max-w-3xl mx-auto px-4">
            <AnimateOnScroll>
              <div className="bg-card/80 backdrop-blur-lg border border-border/50 rounded-2xl p-6 md:p-10 shadow-xl">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  {/* Left: Copy */}
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                      Call now — get your next step in minutes.
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {content.callCtaSubtext}
                    </p>
                    <p className="text-sm font-medium text-foreground mb-2">On the call, Window Man will:</p>
                    <ul className="space-y-2 mb-4">
                      {content.callBullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: CTA Button */}
                  <div className="flex flex-col items-center md:items-end">
                    <Button
                      variant="cta"
                      size="lg"
                      className="w-full sm:w-auto min-h-[56px] text-base gap-2"
                      asChild
                      onClick={() => handleCtaClick('call', `tel:${CONTACT.PHONE_E164}`)}
                    >
                      <a href={`tel:${CONTACT.PHONE_E164}`} aria-label={CONTACT.PHONE_ARIA}>
                        <Phone className="w-5 h-5" aria-hidden="true" />
                        {content.callCtaLabel}
                        <span className="text-xs opacity-80">{CONTACT.PHONE_DISPLAY}</span>
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3 text-center md:text-right max-w-xs">
                      Window Man is our voice assistant — available 24/7 to get you answers fast.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══ Section 3: Upload + Guarantee Block ═══ */}
        <section className="py-12 md:py-20">
          <div className="container max-w-3xl mx-auto px-4">
            <AnimateOnScroll>
              <div className="bg-card/50 border border-border/50 backdrop-blur-sm rounded-2xl p-6 md:p-10">
                {/* Pill */}
                <div className="flex justify-center mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    Beat Your Quote Path
                  </span>
                </div>

                <p className="text-center text-lg md:text-xl font-semibold text-foreground mb-2">
                  If you want us to beat your quote,{' '}
                  <span className="text-primary">upload it now.</span>
                </p>

                <p className="text-center text-sm text-muted-foreground max-w-lg mx-auto mb-6">
                  We compare your quote against vetted contractors in our network.
                  If we can beat it on the same scope/specs,{' '}
                  <strong className="text-foreground">we show you the competing offer</strong>. If we can't legitimately beat it, we tell you — and we don't send you to anyone.
                </p>

                {/* Upload CTA */}
                <div className="flex justify-center mb-6">
                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full sm:w-auto min-h-[48px] gap-2"
                    asChild
                    onClick={() => handleCtaClick('upload', '/ai-scanner')}
                  >
                    <Link to="/ai-scanner">
                      <Upload className="w-5 h-5" aria-hidden="true" />
                      Upload My Quote
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                {/* Delayed secondary CTAs */}
                <div
                  className="transition-all duration-500 ease-out"
                  style={{
                    opacity: showSecondary ? 1 : 0,
                    transform: showSecondary ? 'translateY(0)' : 'translateY(8px)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      onClick={() => handleCtaClick('primary', content.primaryWebCta.href)}
                    >
                      <Link to={content.primaryWebCta.href}>
                        {content.primaryWebCta.label}
                        <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      onClick={() => handleCtaClick('secondary', content.secondaryWebCta.href)}
                    >
                      <Link to={content.secondaryWebCta.href}>
                        {content.secondaryWebCta.label}
                        <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Guarantee block */}
                <div className="border-t border-border/50 pt-6 mt-2">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{content.guaranteeHeadline}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{content.guaranteeBody}</p>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-6 italic">
                  Bottom line: most companies sell you their quote. Window Man is built to challenge it.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══ Section 4: What Happens Next Timeline ═══ */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container max-w-3xl mx-auto px-4">
            <AnimateOnScroll>
              <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-2">
                What happens next
              </h3>
              <p className="text-muted-foreground text-center text-sm mb-10">
                simple, fast, no guessing
              </p>
            </AnimateOnScroll>

            <div className="relative grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Desktop connector line */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" aria-hidden="true" />

              {content.timeline.map((step, index) => {
                const Icon = index === 0 ? Clock : index === 1 ? Shield : Check;
                return (
                  <AnimateOnScroll key={step.step} delay={index * 150}>
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {step.step}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{step.label}</p>
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ Section 5: TestimonialCards ═══ */}
        <TestimonialCards variant="dark" />

        {/* ═══ Section 6: Final Close / CTA Repeat ═══ */}
        <section className="py-12 md:py-20 bg-muted/30">
          <div className="container max-w-3xl mx-auto px-4">
            <AnimateOnScroll>
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  Ready to protect your deal?
                </h3>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-6">
                  Call now and Window Man will give you a clear next step. If you have a quote, upload it —
                  that's how we can attempt to beat it on the same scope/specs.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full sm:w-auto min-h-[48px] gap-2"
                    asChild
                    onClick={() => handleCtaClick('call', `tel:${CONTACT.PHONE_E164}`)}
                  >
                    <a href={`tel:${CONTACT.PHONE_E164}`} aria-label={CONTACT.PHONE_ARIA}>
                      <Phone className="w-5 h-5" aria-hidden="true" />
                      Call Window Man
                      <span className="text-xs opacity-80">{CONTACT.PHONE_DISPLAY}</span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto gap-2"
                    asChild
                    onClick={() => handleCtaClick('upload', '/ai-scanner')}
                  >
                    <Link to="/ai-scanner">
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      Upload Quote
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Window Man is our AI-powered voice assistant — available 24/7. We never sell your info.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ═══ Section 7: Micro-FAQ ═══ */}
        <section className="py-12 md:py-20">
          <div className="container max-w-2xl mx-auto px-4">
            <AnimateOnScroll>
              <h3 className="text-lg font-semibold text-foreground text-center mb-6">
                Common Questions
              </h3>

              <div className="bg-card/50 border border-border/50 backdrop-blur-sm rounded-2xl p-4 md:p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="sales-call" className="border-border/50">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                      Is this a sales call?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      No — it's a quick diagnostic. You'll leave with a clear next step, not a pitch.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="need-quote" className="border-border/50">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                      Do I need a quote to call?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      No. If you don't have one yet, we'll tell you exactly what to ask for and what to watch out for.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="real-person" className="border-border/50">
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                      Can I talk to a real person?
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      Yes. Window Man is our AI voice assistant, but it can connect you to a human specialist whenever you need one.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Window Man is our AI-powered voice assistant — available 24/7 to help you protect your investment.
              </p>
            </AnimateOnScroll>
          </div>
        </section>
      </div>
    </>
  );
}
