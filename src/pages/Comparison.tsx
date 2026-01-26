import { useState, useEffect, useMemo } from "react";
import { useSessionData } from "@/hooks/useSessionData";
import { SEO } from "@/components/SEO";
import { getToolPageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
import { usePageTracking } from "@/hooks/usePageTracking";
import { windowTiers } from "@/data/windowData";
import { calculateTierTrueCost, TrueCostBreakdown } from "@/lib/comparisonCalculations";
import { Navbar } from "@/components/home/Navbar";
import { ComparisonHero } from "@/components/comparison/ComparisonHero";
import { ViewModeToggle, ViewMode } from "@/components/comparison/ViewModeToggle";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { ComparisonCards } from "@/components/comparison/ComparisonCards";
import { SavingsBanner } from "@/components/comparison/SavingsBanner";
import { ConsultationCTA } from "@/components/comparison/ConsultationCTA";
import { GenerateComparisonReportButton } from "@/components/comparison/GenerateComparisonReportButton";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { getSmartRelatedTools, getFrameControl } from "@/config/toolRegistry";
import { RelatedToolsGrid } from "@/components/ui/RelatedToolsGrid";
import { ToolFAQSection } from "@/components/seo";
import { PillarBreadcrumb } from "@/components/seo/PillarBreadcrumb";
import { getToolFAQs } from "@/data/toolFAQs";

export default function Comparison() {
  usePageTracking("comparison-tool");
  const { sessionData, markToolCompleted, updateField } = useSessionData();
  const [viewMode, setViewMode] = useState<ViewMode>("longterm");
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  // Track tool visit
  useEffect(() => {
    markToolCompleted("comparison");
    updateField("comparisonViewed", true);
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
      <SEO
        title="Window Tier Comparison Tool"
        description="Compare budget, mid-range, and premium window options side-by-side. See 10-year true costs including energy savings, maintenance, and replacement."
        canonicalUrl="https://itswindowman.com/comparison"
        jsonLd={[...getToolPageSchemas('comparison'), getBreadcrumbSchema('comparison')]}
      />
      <Navbar />

      {/* PillarBreadcrumb - links UP to parent pillar */}
      <div className="container px-4 pt-16 pb-2">
        <PillarBreadcrumb toolPath="/comparison" variant="badge" />
      </div>

      {/* Hero Section */}
      <div className="pt-2">
        <ComparisonHero sessionData={sessionData} />
      </div>

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
          {viewMode === "longterm" && trueCosts.tier1 && trueCosts.tier3 && (
            <SavingsBanner tier1Cost={trueCosts.tier1} tier3Cost={trueCosts.tier3} />
          )}

          {/* Desktop: Table View */}
          <ComparisonTable viewMode={viewMode} windowCount={windowCount} trueCosts={trueCosts} />

          {/* Mobile: Stacked Cards View */}
          <ComparisonCards viewMode={viewMode} windowCount={windowCount} trueCosts={trueCosts} />
        </div>
      </section>

      {/* Bottom CTA Section */}
      <ConsultationCTA onBookConsultation={() => setShowConsultationModal(true)} />

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        onSuccess={() => setShowConsultationModal(false)}
        sessionData={sessionData}
        sourceTool="comparison-tool"
      />

      {/* FAQ Section */}
      <ToolFAQSection
        toolPath="/comparison"
        faqs={getToolFAQs('comparison')}
        title="Window Comparison FAQs"
        description="Understanding tier pricing and true cost calculations"
      />

      {/* Related Tools */}
      <RelatedToolsGrid
        title={getFrameControl("comparison").title}
        description={getFrameControl("comparison").description}
        tools={getSmartRelatedTools("comparison", sessionData.toolsCompleted)}
      />
    </div>
  );
}
