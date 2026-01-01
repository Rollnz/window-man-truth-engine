import { useState, useEffect, useMemo } from 'react';
import { useSessionData } from '@/hooks/useSessionData';
import { windowTiers } from '@/data/windowData';
import { calculateTierTrueCost, TrueCostBreakdown } from '@/lib/comparisonCalculations';
import { ComparisonHero } from '@/components/comparison/ComparisonHero';
import { ViewModeToggle, ViewMode } from '@/components/comparison/ViewModeToggle';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { ComparisonCards } from '@/components/comparison/ComparisonCards';
import { SavingsBanner } from '@/components/comparison/SavingsBanner';
import { FloatingEmailButton } from '@/components/comparison/FloatingEmailButton';
import { ConsultationCTA } from '@/components/comparison/ConsultationCTA';
import { GenerateComparisonReportButton } from '@/components/comparison/GenerateComparisonReportButton';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';

export default function Comparison() {
  const { sessionData, markToolCompleted, updateField } = useSessionData();
  const [viewMode, setViewMode] = useState<ViewMode>('longterm');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  // Track tool visit
  useEffect(() => {
    markToolCompleted('comparison');
    updateField('comparisonViewed', true);
  }, [markToolCompleted, updateField]);

  // Calculate true costs for all tiers
  const trueCosts = useMemo(() => {
    const costs: Record<string, TrueCostBreakdown> = {};
    windowTiers.forEach((tier) => {
      costs[tier.id] = calculateTierTrueCost(tier, sessionData);
    });
    return costs;
  }, [sessionData]);

  const windowCount = sessionData.windowCount || 10;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <ComparisonHero sessionData={sessionData} />

      {/* Main Comparison Section */}
      <section className="py-12 md:py-16">
        <div className="container px-4">
          {/* View Mode Toggle + Report Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <GenerateComparisonReportButton 
              windowCount={windowCount}
              trueCosts={trueCosts}
              viewMode={viewMode}
              homeownerName={sessionData.name}
            />
          </div>

          {/* Savings Banner (only show in long-term view) */}
          {viewMode === 'longterm' && trueCosts.tier1 && trueCosts.tier3 && (
            <SavingsBanner tier1Cost={trueCosts.tier1} tier3Cost={trueCosts.tier3} />
          )}

          {/* Desktop: Table View */}
          <ComparisonTable 
            viewMode={viewMode} 
            windowCount={windowCount}
            trueCosts={trueCosts}
          />

          {/* Mobile: Stacked Cards View */}
          <ComparisonCards 
            viewMode={viewMode} 
            windowCount={windowCount}
            trueCosts={trueCosts}
          />
        </div>
      </section>

      {/* Bottom CTA Section */}
      <ConsultationCTA onBookConsultation={() => setShowConsultationModal(true)} />

      {/* Floating Email Button */}
      <FloatingEmailButton onClick={() => setShowLeadModal(true)} />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => setShowLeadModal(false)}
        sourceTool="comparison-tool"
        sessionData={sessionData}
      />

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSuccess={() => setShowConsultationModal(false)}
        sessionData={sessionData}
      />
    </div>
  );
}
