import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Download, Clock, Smartphone, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { heroData } from '@/data/specChecklistData';
import { ROUTES } from '@/config/navigation';
import { EbookLeadModal, EBOOK_CONFIGS } from '@/components/conversion/EbookLeadModal';

interface SpecChecklistHeroProps {
  onCtaClick: () => void;
  onSuccess?: () => void;
  hasConverted?: boolean;
}

const SpecChecklistHero: React.FC<SpecChecklistHeroProps> = ({ onCtaClick, onSuccess, hasConverted }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCtaClick = () => {
    // If already converted, just scroll to the section
    if (hasConverted) {
      onCtaClick();
      return;
    }
    // Otherwise open the modal
    setIsModalOpen(true);
  };

  const handleModalSuccess = (leadId: string) => {
    setIsModalOpen(false);
    onSuccess?.();
  };

  return (
    <>
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Column */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground uppercase tracking-wider">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span>Pre-Installation Audit System</span>
              </div>

              <h1 className="display-h1 text-lift text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                {heroData.headline}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {heroData.subheadline}
              </p>

              <p className="text-base font-medium text-foreground">
                {heroData.supportingCopy}
              </p>

              <div className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto gap-2"
                  onClick={handleCtaClick}
                >
                  Download My Free Audit Checklist
                  <Download className="w-4 h-4" />
                </Button>
                
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 flex-shrink-0" /> 35-page guide
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 flex-shrink-0" /> Print or digital
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 flex-shrink-0" /> 4-Packet System
                </span>
              </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Already have a quote to analyze?</p>
                <Button 
                  variant="cta" 
                  className="gap-2"
                  onClick={() => navigate(ROUTES.QUOTE_SCANNER)}
                >
                  Use our Quote Scanner <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-75" />
              
              <div className="relative">
                <div className="relative bg-card rounded-xl shadow-2xl p-2 border border-border">
                  <img 
                    src="/images/spec-checklist-book.webp"
                    alt="Pre-Installation Audit Checklist - 4-Packet System"
                    className="w-64 sm:w-80 h-auto rounded-lg"
                  />
                  
                  <div className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                    <Shield className="w-3.5 h-3.5" />
                    4-Packet System
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-lg px-4 py-3 shadow-lg">
                  <p className="text-xs text-muted-foreground">Complete Protection</p>
                  <p className="text-sm font-semibold text-foreground">Contract to Final Payment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ebook Lead Modal */}
      <EbookLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        sourceTool="spec-checklist-guide"
        config={EBOOK_CONFIGS['spec-checklist-guide']}
      />
    </>
  );
};

export default SpecChecklistHero;
