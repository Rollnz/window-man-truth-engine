import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ConsultationForm } from '@/components/consultation/ConsultationForm';
import { SubmissionConfirmation } from '@/components/consultation/SubmissionConfirmation';
import { ConsultationFormData, ConsultationSubmission } from '@/types/consultation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, 
  Target, 
  Scale, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSearch,
  UserCheck,
  BadgeDollarSign,
  Building2,
  Gavel
} from 'lucide-react';
import { ConsultationSchema } from '@/components/consultation/ConsultationSchema';

export default function Consultation() {
  const navigate = useNavigate();
  usePageTracking('consultation');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedFirstName, setSubmittedFirstName] = useState('');

  // Handle form start tracking
  const handleFormStart = useCallback(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'form_start',
        source: 'consultation',
      });
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (data: ConsultationFormData) => {
    const submission: ConsultationSubmission = {
      ...data,
      source: 'consultation',
      timestamp: new Date().toISOString(),
    };

    // TODO: Replace with your actual submission handler
    // This would call your Supabase function or API endpoint
    try {
      // Simulated API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Example: await supabase.from('consultation_submissions').insert(submission);
      
      console.log('Submission data:', submission);
      
      // Track success
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'form_submit_success',
          source: 'consultation',
          propertyType: data.propertyType,
          windowCount: data.windowCount,
          hasQuote: data.hasQuote,
        });
      }

      setSubmittedFirstName(data.firstName);
      setIsSubmitted(true);
      
      // Scroll to top to show confirmation
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
          event: 'form_submit_error',
          source: 'consultation',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
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
        <SubmissionConfirmation
          firstName={submittedFirstName}
          source="consultation"
          nextStep="text"
          expectedTime="5 minutes"
          onContinueBrowsing={handleContinueBrowsing}
        />
      </>
    );
  }

  return (
    <>
      <ConsultationSchema />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        
        {/* ============================================
            SECTION 1: PRE-FRAME DISRUPTOR (HERO)
            ============================================ */}
        <section className="relative overflow-hidden bg-slate-900 text-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
            <Badge 
              variant="outline" 
              className="mb-6 border-amber-500/50 bg-amber-500/10 text-amber-300 px-4 py-1.5"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Before You Sign Anything
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Do Not Let Another Salesperson 
              <span className="block text-amber-400 mt-2">
                In Your House Until You Read This.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              The "Free Estimate" is a trap designed to hold you hostage for 2 hours. 
              We offer a <strong className="text-white">15-minute Strategy Session</strong>. 
              No commission. No pressure. No agents in your living room.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400">
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
            SECTION 2: THE VILLAIN'S PLAYBOOK EXPOSED
            ============================================ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 bg-red-100 text-red-700 border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                Industry Playbook Exposed
              </Badge>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                The In-Home Sales Scam—And How It Works
              </h2>
              
              <p className="text-slate-600 max-w-2xl mx-auto">
                You've felt it. That sinking feeling when a "quick estimate" turns into 
                a 3-hour negotiation session in your own living room. Here's their playbook:
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Tactic 1 */}
              <Card className="border-red-100 bg-red-50/50">
                <CardContent className="p-5">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-xl">🎭</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">The "Drop Call"</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    They call their "manager" for a special discount—except there's no manager. 
                    It's theater designed to make you feel special while they pad the price.
                  </p>
                </CardContent>
              </Card>

              {/* Tactic 2 */}
              <Card className="border-red-100 bg-red-50/50">
                <CardContent className="p-5">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-xl">⏰</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">"Tonight Only" Pricing</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    If you don't sign tonight, the price goes up. This artificial urgency 
                    is illegal in some states—and always a red flag.
                  </p>
                </CardContent>
              </Card>

              {/* Tactic 3 */}
              <Card className="border-red-100 bg-red-50/50">
                <CardContent className="p-5">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-xl">🏠</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">The Home Invasion</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    They won't leave. Literally. They're trained to outlast you until 
                    you're exhausted enough to sign just to get them out.
                  </p>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-slate-500 mt-8 text-sm italic">
              If you've experienced any of this—you're not paranoid. You're paying attention.
            </p>
          </div>
        </section>


        {/* ============================================
            SECTION 3: THE CONFESSION PORTAL
            ============================================ */}
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Why We Do This Differently
            </h2>
            
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 sm:p-10 mb-8">
              <p className="text-lg sm:text-xl text-slate-700 leading-relaxed mb-6">
                We don't need to sell you windows to survive.
                <br />
                <strong className="text-slate-900">We exist to verify the truth.</strong>
              </p>
              
              <div className="w-16 h-px bg-emerald-500 mx-auto mb-6" />
              
              <p className="text-slate-600 leading-relaxed">
                Sometimes we review your quote and tell you it's fair. 
                Sometimes we save you $5,000. Either way, you leave with <em>certainty</em>—the 
                one thing high-pressure salespeople never want you to have.
              </p>
            </div>

            <p className="text-emerald-700 font-medium text-lg">
              "Sometimes the outcome is confirmation—not a change."
            </p>
          </div>
        </section>


        {/* ============================================
            SECTION 4: THE "ANTI-SALES" HERO
            ============================================ */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Who You'll Be Speaking With
              </h2>
              <p className="text-slate-600">
                You won't be routed to a commission-based salesperson.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              {/* The Bad Guy */}
              <Card className="border-red-200 bg-red-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Typical Sales Rep</h3>
                      <p className="text-sm text-red-700">What you're used to</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Commission-driven. Wants your signature tonight.
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Shows up at your house. Stays for hours.
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Uses fear tactics and fake discounts.
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      Paid more when you pay more.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* The Good Guy */}
              <Card className="border-emerald-200 bg-emerald-50/30 ring-2 ring-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900">Strategy Expert</h3>
                      <p className="text-sm text-emerald-700">Who you'll talk to</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 text-sm text-emerald-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      Salaried. No commission. No pressure.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      Remote call. 15 minutes. Respects your time.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      Uses Truth Engine data to audit your quotes.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      Paid to find the truth—not close you.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>


        {/* ============================================
            SECTION 5: THE EVIDENCE LOCKER (MECHANISM)
            ============================================ */}
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 bg-slate-200 text-slate-700">
                <FileSearch className="w-3.5 h-3.5 mr-1.5" />
                The Truth Engine
              </Badge>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                What Happens on Your Call
              </h2>
              
              <p className="text-slate-600 max-w-2xl mx-auto">
                This isn't guesswork. We pull data from the Evidence Locker—our database 
                of real permit costs, installation timelines, and local pricing.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Quote Reality Check</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We tell you if your quote is fair—or if something looks inflated or missing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Scope & Spec Review</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We verify window counts, types, impact ratings, and installation assumptions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Permit & Timeline Truth</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We explain how long permits and installs actually take in your city—not best-case promises.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Risk Reduction</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Catching mistakes before installation can save thousands and months of frustration.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-500 mt-10 text-sm">
              Think of us as a body cam for your project—auditing every line item 
              so you can move forward with confidence.
            </p>
          </div>
        </section>


        {/* ============================================
            SECTION 6: THE UNCOMFORTABLE TRUTH (QUALIFIER)
            ============================================ */}
        <section className="py-12 bg-amber-50 border-y border-amber-200">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">
              An Uncomfortable Truth
            </h3>
            
            <p className="text-amber-800 leading-relaxed">
              If you want the cheapest, unpermitted windows installed by a ghost contractor 
              who won't be around when it fails inspection—do not book this call. 
              <strong className="block mt-2 text-amber-900">
                We only work with homeowners who care about doing it right.
              </strong>
            </p>
          </div>
        </section>


        {/* ============================================
            SECTION 7: THE BOOKING FORM
            ============================================ */}
        <section id="book" className="py-16 sm:py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Request Your Truth Engine Strategy Call
              </h2>
              
              <p className="text-slate-600 max-w-xl mx-auto">
                This takes about 2 minutes. The more accurate your details, the more useful 
                your call will be.
              </p>
            </div>

            <ConsultationForm 
              onSubmit={handleSubmit}
              onFormStart={handleFormStart}
            />

            {/* Reassurance Block */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-center text-sm font-semibold text-slate-900 mb-4">
                What to Expect
              </h3>
              
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
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
              
              <p className="text-center text-slate-500 text-sm mt-4 italic">
                Sometimes the outcome is confirmation—not a change.
              </p>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
