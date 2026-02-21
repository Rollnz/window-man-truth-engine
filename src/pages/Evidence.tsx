import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { caseStudies, MissionType, getCaseStudyByEvidenceId } from "@/data/evidenceData";
import { useSessionData } from "@/hooks/useSessionData";
import { usePageTracking } from "@/hooks/usePageTracking";
import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { FilterBar } from "@/components/evidence/FilterBar";
import { CaseFileGrid } from "@/components/evidence/CaseFileGrid";
import { CaseDebriefModal } from "@/components/evidence/CaseDebriefModal";
import { RelatedIntelligence } from "@/components/evidence/RelatedIntelligence";
import { LeadCaptureModal } from "@/components/conversion/LeadCaptureModal";
import { ConsultationBookingModal } from "@/components/conversion/ConsultationBookingModal";
import { CommunityImpact } from "@/components/authority/CommunityImpact";
import { getToolPageSchemas, getBreadcrumbSchema, generateEvidenceLibrarySchemas } from "@/lib/seoSchemas";
import { PillarBreadcrumb } from "@/components/seo/PillarBreadcrumb";
import type { SourceTool } from "@/types/sourceTool";
import { ROUTES } from "@/config/navigation";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { ExitIntentModal } from "@/components/authority";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { Shield, FileSearch, Users } from "lucide-react";

export default function Evidence() {
  usePageTracking("evidence-locker");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionData, updateFields, markToolCompleted } = useSessionData();
  const { hasIdentity } = useLeadIdentity();
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
    params.delete("case");
    setSearchParams(params);
  };

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

      {/* Hero Section - Forensic Elevated */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        {/* Ambient depth gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Breadcrumb */}
            <AnimateOnScroll duration={300}>
              <PillarBreadcrumb toolPath="/evidence" variant="badge" />
            </AnimateOnScroll>

            {/* Eyebrow badge */}
            <AnimateOnScroll delay={100} duration={400}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mt-6 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Verified Case Files</span>
              </div>
            </AnimateOnScroll>

            {/* Headline */}
            <AnimateOnScroll delay={200} duration={500}>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight tracking-tight">
                Real Homeowner Wins.{' '}
                <span className="text-primary">Exposed & Documented.</span>
              </h1>
            </AnimateOnScroll>

            {/* Sub-headline */}
            <AnimateOnScroll delay={300} duration={500}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Browse verified case studies showing how Florida homeowners saved thousands 
                on window replacements—with the tools and strategies they used.
              </p>
            </AnimateOnScroll>

            {/* Hero stat badges */}
            <AnimateOnScroll delay={400} duration={500}>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg">
                  <FileSearch className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{caseStudies.length} Verified Cases</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border shadow-lg">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Real Homeowners</span>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Filter + Grid Section */}
      <section className="py-8 md:py-12 bg-[hsl(var(--surface-2,var(--background)))]" ref={gridRef}>
        <div className="container px-4 space-y-8">
          <AnimateOnScroll duration={400}>
            <FilterBar activeFilter={urlFilter} onFilterChange={handleFilterChange} />
          </AnimateOnScroll>

          <CaseFileGrid 
            caseStudies={caseStudies} 
            activeFilter={urlFilter} 
            onOpenCase={handleOpenCase}
            highlightedCaseId={highlightedCase?.id}
          />
        </div>
      </section>

      {/* Community Impact */}
      <section className="py-12 md:py-16">
        <div className="container px-4">
          <AnimateOnScroll duration={500}>
            <CommunityImpact variant="compact" />
          </AnimateOnScroll>
        </div>
      </section>

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

      <ExitIntentModal
        sourceTool="evidence-locker"
        hasConverted={hasIdentity}
        resultSummary="Evidence Locker Case Studies"
      />
    </div>
  );
}
