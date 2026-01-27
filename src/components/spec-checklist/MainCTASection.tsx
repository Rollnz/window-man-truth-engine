import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trustSignals } from '@/data/specChecklistData';
import { SpecChecklistGuideModal } from '@/components/conversion/SpecChecklistGuideModal';

interface MainCTASectionProps {
  id?: string;
  onSuccess?: () => void;
  hasConverted?: boolean;
}

const MainCTASection: React.FC<MainCTASectionProps> = ({ id, onSuccess, hasConverted }) => {
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
        <section 
          id={id} 
          className="py-16 sm:py-24"
          style={{ 
            background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)'
          }}
        >
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Checklist Sent!</h2>
              <p className="text-slate-600 mb-6">
                Check your email for your Pre-Installation Audit Checklist. Ready to take the next step?
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
              
              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-slate-600">
                {trustSignals.map((signal, i) => (
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
      <section 
        id={id} 
        className="py-16 sm:py-24"
        style={{ 
          background: 'linear-gradient(135deg, #d0e4f7 0%, #73b1e7 16%, #0a77d5 34%, #539fe1 61%, #539fe1 61%, #87bcea 100%)'
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-white">
              Get Your Complete 4-Packet Audit System
            </h2>
            <p className="text-white/80">
              Instant download. Print and use today. Every checkpoint explained.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center space-y-4">
              <p className="text-slate-600">
                Get instant access to the complete Pre-Installation Audit Checklist with all 4 packets.
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

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-slate-600">
              {trustSignals.map((signal, i) => (
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

export default MainCTASection;
