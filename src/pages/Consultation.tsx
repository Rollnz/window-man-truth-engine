import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Navbar } from '@/components/home/Navbar';
import { ConsultationForm } from '@/components/consultation/ConsultationForm';
import { SubmissionConfirmation } from '@/components/consultation/SubmissionConfirmation';
import { ConsultationFormData, ConsultationSubmission } from '@/types/consultation';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  UserCheck,
  BadgeDollarSign } from
'lucide-react';
import { ConsultationSchema } from '@/components/consultation/ConsultationSchema';
import { supabase } from '@/integrations/supabase/client';
import { trackLeadSubmissionSuccess, trackEvent } from '@/lib/gtm';
import { useCanonicalScore, getOrCreateAnonId } from '@/hooks/useCanonicalScore';
import { toast } from 'sonner';

export default function Consultation() {
  const navigate = useNavigate();
  usePageTracking('consultation');
  const { awardScore } = useCanonicalScore();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedFirstName, setSubmittedFirstName] = useState('');

  // Handle form start tracking
  const handleFormStart = useCallback(() => {
    trackEvent('form_start', {
      source: 'consultation'
    });
  }, []);

  // Handle form submission - integrated with Supabase
  const handleSubmit = async (data: ConsultationFormData) => {
    const clientId = getOrCreateAnonId();

    const submission: ConsultationSubmission = {
      ...data,
      source: 'consultation',
      timestamp: new Date().toISOString()
    };

    try {
      // Call save-lead edge function
      const { data: leadData, error: leadError } = await supabase.functions.invoke('save-lead', {
        body: {
          email: data.email,
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          sourceTool: 'consultation',
          sessionData: {
            clientId,
            propertyType: data.propertyType,
            windowCount: data.windowCount,
            cityZip: data.cityZip,
            impactRequired: data.impactRequired,
            hasQuote: data.hasQuote,
            quoteCount: data.quoteCount,
            windowTypes: data.windowTypes,
            concern: data.concern,
            quoteDetails: data.quoteDetails
          }
        }
      });

      if (leadError) {
        console.error('[Consultation] save-lead error:', leadError);
        throw new Error(leadError.message || 'Failed to save lead');
      }

      const leadId = leadData?.leadId || leadData?.lead_id;

      if (!leadId) {
        console.error('[Consultation] No leadId returned from save-lead');
        throw new Error('Failed to create lead');
      }

      // Best-effort telemetry: fire scoring and tracking in parallel, don't block success
      await Promise.allSettled([
      awardScore({
        eventType: 'LEAD_CAPTURED',
        sourceEntityType: 'lead',
        sourceEntityId: leadId
      }),
      trackLeadSubmissionSuccess({
        leadId,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        city: data.cityZip,
        sourceTool: 'consultation',
        eventId: leadId,
        value: 100
      })]
      );

      // Track consultation booked event (non-blocking)
      trackEvent('consultation_booked', {
        source: 'consultation',
        propertyType: data.propertyType,
        windowCount: data.windowCount,
        hasQuote: data.hasQuote,
        lead_id: leadId
      });

      setSubmittedFirstName(data.firstName);
      setIsSubmitted(true);

      // Scroll to top to show confirmation
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('[Consultation] Submission error:', error);

      trackEvent('form_submit_error', {
        source: 'consultation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast.error('Unable to submit. Please try again.');
      throw error;
    }
  };

  // Handle continue browsing from confirmation
  const handleContinueBrowsing = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // If submitted, show confirmation
  if (isSubmitted) {
    return (
      <>
        <ConsultationSchema />
        <Navbar />
        <div className="pt-16">
          <SubmissionConfirmation
            firstName={submittedFirstName}
            source="consultation"
            nextStep="text"
            expectedTime="5 minutes"
            onContinueBrowsing={handleContinueBrowsing} />

        </div>
      </>);

  }

  return (
    <>
      <ConsultationSchema />
      <Navbar />
      
      <div className="min-h-screen bg-background pt-16">
        
        {/* ============================================
              SECTION 1: HERO - PRE-FRAME DISRUPTOR
              ============================================ */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
            <Badge
              variant="outline"
              className="mb-6 border-amber-500/50 bg-amber-500/10 text-amber-300 px-4 py-1.5">

              <ShieldAlert className="w-4 h-4 mr-2" />
              Before You Sign Anything
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Do Not Let Another Salesperson 
              <span className="block text-amber-300 mt-2">
                In Your House Until You Read This.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              The "Free Estimate" is a trap designed to hold you hostage for 2 hours. 
              We offer a <strong className="text-primary-foreground">15-minute Strategy Session</strong>. 
              No commission. No pressure. No agents in your living room.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                15 minutes, remote
              </span>
              <span className="flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
                No commission breath
              </span>
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Data, not pressure
              </span>
            </div>
          </div>
        </section>


        {/* ============================================
              SECTION 2: THE BOOKING FORM
              ============================================ */}
        <section id="book" className="py-12 sm:py-16 bg-background">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Get The Truth From Window Man     
              </h2>
              
              <p className="max-w-xl mx-auto text-primary-foreground">
                The more accurate your details, the more useful your call will be.
              
              </p>
            </div>

            <ConsultationForm
              onSubmit={handleSubmit}
              onFormStart={handleFormStart} />

          </div>
        </section>


        {/* ============================================
              SECTION 3: REASSURANCE BLOCK
              ============================================ */}
        <section className="py-12 bg-muted border-t border-border">
          <div className="max-w-3xl mx-auto px-4">
            <h3 className="text-center text-sm font-semibold text-foreground mb-6">
              What to Expect
            </h3>
            
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                15-minute call
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No sales pressure
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                No obligation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                You don't need to choose us
              </span>
            </div>
            
            <p className="text-center text-muted-foreground text-sm mt-6 italic">
              Sometimes the outcome is confirmation—not a change.
            </p>
          </div>
        </section>

      </div>
    </>);

}