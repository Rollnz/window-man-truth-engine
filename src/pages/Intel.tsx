import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionData } from '@/hooks/useSessionData';
import { useToast } from '@/hooks/use-toast';
import { IntelHero } from '@/components/intel/IntelHero';
import { ResourceGrid } from '@/components/intel/ResourceGrid';
import { UnlockSuccessOverlay } from '@/components/intel/UnlockSuccessOverlay';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { intelResources, IntelResource, getResourceById } from '@/data/intelData';

export default function Intel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionData, updateField, updateFields, markToolCompleted } = useSessionData();
  const { toast } = useToast();

  // Get unlocked resources from session
  const unlockedResources = sessionData.unlockedResources || [];

  // Modal states
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [selectedResource, setSelectedResource] = useState<IntelResource | null>(null);

  // Get highlighted resource from URL params
  const highlightedResourceId = searchParams.get('resource') || undefined;

  // Mark tool as viewed
  useEffect(() => {
    if (!sessionData.intelLibraryViewed) {
      updateField('intelLibraryViewed', true);
      markToolCompleted('intel-library');
    }
  }, []);

  // Handle deep link - auto-open modal for specific resource
  useEffect(() => {
    const resourceId = searchParams.get('resource');
    if (resourceId) {
      const resource = getResourceById(resourceId);
      if (resource && !unlockedResources.includes(resourceId)) {
        // Auto-open unlock modal for this resource
        setSelectedResource(resource);
        setShowLeadCapture(true);
      }
    }
  }, [searchParams, unlockedResources]);

  // Clean URL when modal closes (prevents refresh/share trap)
  const clearUrlParams = () => {
    if (searchParams.has('resource')) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleUnlock = (resource: IntelResource) => {
    // Check if already unlocked
    if (unlockedResources.includes(resource.id)) {
      handleDownload(resource);
      return;
    }
    setSelectedResource(resource);
    setShowLeadCapture(true);
  };

  const handleLeadSuccess = (leadId: string) => {
    if (!selectedResource) return;

    // Add to unlocked resources
    const newUnlocked = [...unlockedResources, selectedResource.id];
    updateFields({
      unlockedResources: newUnlocked,
      leadId,
    });

    // Close lead modal
    setShowLeadCapture(false);
    clearUrlParams();

    // Special handling for claim-survival: redirect to the tool
    if (selectedResource.id === 'claim-survival') {
      navigate('/claim-survival');
      return;
    }

    // All other resources: show success overlay with download
    setShowSuccessOverlay(true);
  };

  const handleLeadClose = () => {
    setShowLeadCapture(false);
    setSelectedResource(null);
    clearUrlParams();
  };

  const handleDownload = (resource: IntelResource) => {
    // Manual click triggers download - opens in new tab
    window.open(resource.pdfUrl, '_blank', 'noopener,noreferrer');
    toast({
      title: 'Download Started',
      description: `Opening ${resource.title} in a new tab.`,
    });
  };

  const handleSuccessDownload = () => {
    if (selectedResource) {
      handleDownload(selectedResource);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessOverlay(false);
    setSelectedResource(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tools
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowConsultation(true)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Book Consultation
          </Button>
        </div>
      </header>

      {/* Hero */}
      <IntelHero />

      {/* Resource Grid */}
      <ResourceGrid
        resources={intelResources}
        unlockedResources={unlockedResources}
        highlightedResourceId={highlightedResourceId}
        onUnlock={handleUnlock}
        onDownload={handleDownload}
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
            size="lg" 
            onClick={() => setShowConsultation(true)}
            className="glow"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Schedule Free Consultation
          </Button>
        </div>
      </section>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={handleLeadClose}
        onSuccess={handleLeadSuccess}
        sourceTool="intel-library"
        sessionData={sessionData}
      />

      {/* Success Overlay */}
      {showSuccessOverlay && selectedResource && (
        <UnlockSuccessOverlay
          resource={selectedResource}
          onDownload={handleSuccessDownload}
          onClose={handleSuccessClose}
        />
      )}

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
    </div>
  );
}
