import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trustSignals } from '@/data/specChecklistData';
import { SpecChecklistGuideModal } from '@/components/conversion/SpecChecklistGuideModal';

interface SecondaryCTASectionProps {
  id?: string;
  onSuccess?: () => void;
  hasConverted?: boolean;
}

const SecondaryCTASection: React.FC<SecondaryCTASectionProps> = ({ id, onSuccess, hasConverted }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Always allow opening the modal - user can book appointment even after converting
  const handleCtaClick = () => {
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    onSuccess?.();
  };

  // Show success state with upsell CTA if already converted
  if (hasConverted) {
    return (
      <>
        <section id={id} className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-card rounded-xl p-6 sm:p-8 shadow-lg border border-border">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Checklist Unlocked!</h2>
              <p className="text-muted-foreground mb-6">
                Check your email for your Pre-Installation Audit Checklist. Ready for a professional assessment?
              </p>
              
              {/* Upsell CTA - still functional after conversion */}
              <Button 
                variant="cta"
                size="lg" 
                className="w-full gap-2" 
                onClick={handleCtaClick}
              >
                <Calendar className="w-4 h-4" />
                Book Your Free Measurement
              </Button>
              
              <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
                {trustSignals.slice(0, 3).map((signal, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {signal}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Spec Checklist Guide Modal */}
        <SpecChecklistGuideModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </>
    );
  }

  return (
    <>
      <section id={id} className="py-16 sm:py-24 bg-muted/30">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Ready to Protect Your Investment?
            </h2>
            <p className="text-muted-foreground">
              Get your free 4-Packet Audit System now
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 sm:p-8 shadow-lg border border-border">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Download the complete Pre-Installation Audit Checklist and protect yourself from common contractor mistakes.
              </p>
              
              <Button 
                variant="cta"
                size="lg" 
                className="w-full gap-2" 
                onClick={handleCtaClick}
              >
                Download My Free Audit Checklist
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
              {trustSignals.slice(0, 3).map((signal, i) => (
                <span key={i} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {signal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Spec Checklist Guide Modal */}
      <SpecChecklistGuideModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default SecondaryCTASection;
