import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { caseStudies, MissionType, getCaseStudyByEvidenceId } from "@/data/evidenceData";
import { useSessionData } from "@/hooks/useSessionData";
import { usePageTracking } from "@/hooks/usePageTracking";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { MinimalFooter } from "@/components/navigation/MinimalFooter";
import { EvidenceHero } from "@/components/evidence/EvidenceHero";
import { FilterBar } from "@/components/evidence/FilterBar";
import { CaseFileGrid } from "@/components/evidence/CaseFileGrid";
import { CaseDebriefModal } from "@/components/evidence/CaseDebriefModal";
import { RelatedIntelligence } from "@/components/evidence/RelatedIntelligence";
import { StickyCTA } from "@/components/evidence/StickyCTA";
import { LeadCaptureModal } from "@/components/conversion/LeadCaptureModal";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { CommunityImpact } from "@/components/authority/CommunityImpact";
import { getToolPageSchemas, getBreadcrumbSchema, generateEvidenceLibrarySchemas } from "@/lib/seoSchemas";
import { PillarBreadcrumb } from "@/components/seo/PillarBreadcrumb";
import type { SourceTool } from "@/types/sourceTool";
import { ROUTES } from "@/config/navigation";

export default function Evidence() {
  usePageTracking("evidence-locker");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionData, updateFields, markToolCompleted } = useSessionData();
  const gridRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);

  // URL-synced case selection
  const activeCaseId = searchParams.get("case");
  const activeCase = useMemo(
    () => (activeCaseId ? caseStudies.find((c) => c.id === activeCaseId) : null),
    [activeCaseId],
  );

  // URL-synced highlight (from EvidenceCitation deep links)
  const highlightId = searchParams.get("highlight");
  const highlightedCase = useMemo(
    () => (highlightId ? getCaseStudyByEvidenceId(highlightId) : null),
    [highlightId],
  );

  // URL-synced filter
  const urlFilter = (searchParams.get("filter") as MissionType | "all") || "all";

  // Track page view
  useEffect(() => {
    if (!sessionData.evidenceLockerViewed) {
      updateFields({ evidenceLockerViewed: true });
      markToolCompleted("evidence-locker");
    }
  }, []);

  const handleOpenCase = (caseId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("case", caseId);
    setSearchParams(params);

    // Track case view
    const viewedCases = sessionData.caseStudiesViewed || [];
    if (!viewedCases.includes(caseId)) {
      updateFields({
        caseStudiesViewed: [...viewedCases, caseId],
        lastCaseViewed: caseId,
      });
    }
  };

  const handleCloseCase = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("case");
    setSearchParams(params);
  };

  const handleFilterChange = (filter: MissionType | "all") => {
    const params = new URLSearchParams(searchParams);
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    params.delete("case"); // Close modal when filtering
    setSearchParams(params);
  };

  // Navigate directly to preserve modal state in history
  const handleToolNavigation = (toolPath: string) => {
    navigate(toolPath);
  };

  const handleDownload = () => {
    setShowLeadCapture(true);
  };

  const handleConsultation = () => {
    setShowConsultation(true);
  };

  const handleLeadSuccess = (leadId: string) => {
    updateFields({ leadId });
    setShowLeadCapture(false);
  };

  const handleConsultationSuccess = () => {
    updateFields({ consultationRequested: true });
    setShowConsultation(false);
  };

  // Combined schemas including CreativeWork for evidence library
  const combinedSchemas = useMemo(() => [
    ...getToolPageSchemas('evidence-locker'),
    getBreadcrumbSchema('evidence-locker'),
    ...generateEvidenceLibrarySchemas(caseStudies),
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Evidence Locker - Real Homeowner Case Studies"
        description="Browse real case studies showing how homeowners saved thousands on window replacements. See actual savings, strategies used, and tools that worked."
        canonicalUrl="https://itswindowman.com/evidence"
        jsonLd={combinedSchemas}
      />
      <Navbar />

      {/* PillarBreadcrumb - links UP to parent pillar */}
      <div className="container px-4 pt-16 pb-2">
        <PillarBreadcrumb toolPath="/evidence" variant="badge" />
      </div>

      {/* Hero */}
      <div className="pt-2">
        <EvidenceHero />
      </div>

      {/* Main Content */}
      <section className="py-8" ref={gridRef}>
        <div className="container px-4 space-y-8">
          {/* Filter Bar */}
          <FilterBar activeFilter={urlFilter} onFilterChange={handleFilterChange} />

          {/* Case Grid with highlighting support */}
          <CaseFileGrid 
            caseStudies={caseStudies} 
            activeFilter={urlFilter} 
            onOpenCase={handleOpenCase}
            highlightedCaseId={highlightedCase?.id}
          />
        </div>
      </section>

      {/* Community Impact */}
      <CommunityImpact variant="compact" className="container px-4 py-8" />

      {/* Related Intelligence */}
      <RelatedIntelligence />

      {/* Case Debrief Modal */}
      <CaseDebriefModal
        isOpen={!!activeCase}
        caseStudy={activeCase}
        onClose={handleCloseCase}
        onToolNavigate={handleToolNavigation}
        onDownload={handleDownload}
        onConsultation={handleConsultation}
      />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => setShowLeadCapture(false)}
        onSuccess={handleLeadSuccess}
        sourceTool={"evidence-locker" satisfies SourceTool}
        sessionData={{
          ...sessionData,
          lastCaseViewed: activeCase?.id,
        }}
        leadId={sessionData.leadId}
      />

      {/* Consultation Modal */}
      <ConsultationBookingModal
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
        onSuccess={handleConsultationSuccess}
        sessionData={sessionData}
        leadId={sessionData.leadId}
        sourceTool="evidence-locker"
      />

      {/* Sticky CTA (Mobile) */}
      <StickyCTA
        onConsultation={handleConsultation}
        isModalOpen={!!activeCase || showLeadCapture || showConsultation}
      />

      {/* Minimal Footer */}
      <MinimalFooter />
    </div>
  );
}
