import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/home/Navbar';
import { IntelHero } from '@/components/intel/IntelHero';
import { ResourceGrid } from '@/components/intel/ResourceGrid';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { intelResources, IntelResource } from '@/data/intelData';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { ROUTES } from '@/config/navigation';

export default function Intel() {
  usePageTracking('intel-library');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionData, updateField, markToolCompleted } = useSessionData();
  const { toast } = useToast();

  // Modal state (consultation only)
  const [showConsultation, setShowConsultation] = useState(false);

  // Get highlighted resource from URL params
  const highlightedResourceId = searchParams.get('resource') || undefined;

  // Mark tool as viewed
  useEffect(() => {
    if (!sessionData.intelLibraryViewed) {
      updateField('intelLibraryViewed', true);
      markToolCompleted('intel-library');
    }
  }, [markToolCompleted, sessionData.intelLibraryViewed, updateField]);

  // Direct navigation - no modals
  const handleAccess = (resource: IntelResource) => {
    // Analytics: Track resource click
    console.log('[Analytics] intel_resource_clicked', {
      resourceId: resource.id,
      resourceTitle: resource.title,
      category: resource.category,
      destination: resource.landingPageUrl,
      timestamp: new Date().toISOString(),
    });

    // Navigate directly to landing page
    if (resource.landingPageUrl) {
      navigate(resource.landingPageUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="pt-14">
        <IntelHero />
      </div>

      {/* Resource Grid */}
      <ResourceGrid
        resources={intelResources}
        highlightedResourceId={highlightedResourceId}
        onAccess={handleAccess}
      />

      {/* Bottom CTA */}
      <section className="py-16 border-t border-border">
        <div className="container px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready for <span className="text-primary">Personalized Intel</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            These guides are just the beginning. Get a custom analysis of your specific situation 
            with a free consultation.
          </p>
          <Button 
            variant="cta"
            size="lg" 
            onClick={() => setShowConsultation(true)}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Free Consultation
          </Button>
        </div>
      </section>

      {/* Consultation Modal */}
      <ConsultationBookingModal
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
        onSuccess={() => {
          setShowConsultation(false);
          toast({
            title: 'Consultation Requested!',
            description: 'We\'ll contact you shortly to confirm your appointment.',
          });
        }}
        sessionData={sessionData}
      />

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}