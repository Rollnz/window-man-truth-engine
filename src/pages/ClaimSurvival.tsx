import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useToast } from '@/hooks/use-toast';
import { useEvidenceAnalysis } from '@/hooks/useEvidenceAnalysis';
import { ClaimHero } from '@/components/claim-survival/ClaimHero';
import { ReadinessScore } from '@/components/claim-survival/ReadinessScore';
import { StickyProgress } from '@/components/claim-survival/StickyProgress';
import { DocumentChecklist } from '@/components/claim-survival/DocumentChecklist';
import { PhotoWalkthrough } from '@/components/claim-survival/PhotoWalkthrough';
import { TimelinePlaybook } from '@/components/claim-survival/TimelinePlaybook';
import { ReceiptRescue } from '@/components/claim-survival/ReceiptRescue';
import { CommonMistakes } from '@/components/claim-survival/CommonMistakes';
import { ToolEcosystem } from '@/components/claim-survival/ToolEcosystem';
import { ClaimFinalCTA } from '@/components/claim-survival/ClaimFinalCTA';
import { DocumentUploadModal } from '@/components/claim-survival/DocumentUploadModal';
import { EvidenceTagFilter, EvidenceTag, getDefaultTagForDocument } from '@/components/claim-survival/EvidenceTagFilter';
import { EvidenceAnalysisModal } from '@/components/claim-survival/EvidenceAnalysisModal';
import { LeadCaptureModal } from '@/components/conversion/LeadCaptureModal';
import { ConsultationBookingModal } from '@/components/conversion/ConsultationBookingModal';
import { claimDocuments } from '@/data/claimSurvivalData';

export default function ClaimSurvival() {
  usePageTracking('claim-survival-kit');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sessionData, updateField, updateFields, markToolCompleted } = useSessionData();
  const { toast } = useToast();

  // Generate or retrieve session ID for anonymous uploads
  const [vaultSessionId] = useState(() => {
    if (sessionData.claimVaultSessionId) {
      return sessionData.claimVaultSessionId;
    }
    const newId = crypto.randomUUID();
    return newId;
  });

  // Save session ID if new
  useEffect(() => {
    if (!sessionData.claimVaultSessionId) {
      updateField('claimVaultSessionId', vaultSessionId);
    }
  }, [vaultSessionId, sessionData.claimVaultSessionId, updateField]);

  // Modal states
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [showConsultation, setShowConsultation] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [pendingUploadDocId, setPendingUploadDocId] = useState<string | null>(null);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState<string | null>(null);

  // Scroll tracking for sticky header
  const [showStickyProgress, setShowStickyProgress] = useState(false);

  // Tag filter state
  const [selectedTags, setSelectedTags] = useState<EvidenceTag[]>([]);

  // Emergency mode from URL
  const isEmergencyMode = searchParams.get('mode') === 'emergency';

  // Check if user is "unlocked" (gated vs ungated)
  const isUnlocked = 
    sessionData.unlockedResources?.includes('claim-survival') || 
    !!sessionData.email;

  // Progress tracking
  const vaultProgress = useMemo(() => sessionData.claimVaultProgress || {}, [sessionData.claimVaultProgress]);
  const vaultFiles = useMemo(() => sessionData.claimVaultFiles || {}, [sessionData.claimVaultFiles]);
  const completedCount = claimDocuments.filter(doc => 
    vaultProgress[doc.id] || vaultFiles[doc.id]
  ).length;

  // Document tags - assign based on document IDs
  const documentTags = useMemo(() => {
    const tags: Record<string, EvidenceTag[]> = {};
    claimDocuments.forEach(doc => {
      if (vaultProgress[doc.id] || vaultFiles[doc.id]) {
        tags[doc.id] = [getDefaultTagForDocument(doc.id)];
      }
    });
    return tags;
  }, [vaultProgress, vaultFiles]);

  // AI Analysis hook
  const { isAnalyzing, analysisResult, analyzeEvidence, resetAnalysis } = useEvidenceAnalysis({
    documents: claimDocuments,
    progress: vaultProgress,
    files: vaultFiles,
  });

  // Tag toggle handler
  const handleTagToggle = useCallback((tag: EvidenceTag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  }, []);

  // Filter documents by selected tags
  const filteredDocuments = useMemo(() => {
    if (selectedTags.length === 0) return claimDocuments;
    return claimDocuments.filter(doc => {
      const docTag = getDefaultTagForDocument(doc.id);
      return selectedTags.includes(docTag);
    });
  }, [selectedTags]);

  // Mark tool as viewed on mount
  useEffect(() => {
    if (!sessionData.claimVaultViewed) {
      updateField('claimVaultViewed', true);
      markToolCompleted('claim-survival');
    }
  }, [markToolCompleted, sessionData.claimVaultViewed, updateField]);

  // Handle emergency mode auto-scroll
  useEffect(() => {
    if (isEmergencyMode) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById('24-hour-playbook');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isEmergencyMode]);

  // Scroll listener for sticky progress
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyProgress(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle emergency mode
  const handleEmergencyToggle = () => {
    if (isEmergencyMode) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ mode: 'emergency' }, { replace: true });
      updateField('emergencyModeUsed', true);
      // Scroll after a brief delay
      setTimeout(() => {
        const element = document.getElementById('24-hour-playbook');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Handle checkbox toggle
  const handleCheckboxToggle = useCallback((docId: string, checked: boolean) => {
    const newProgress = { ...vaultProgress, [docId]: checked };
    updateField('claimVaultProgress', newProgress);
  }, [vaultProgress, updateField]);

  // Handle upload button click
  const handleUploadClick = useCallback((docId: string) => {
    if (!isUnlocked) {
      // Gate: save pending upload and show lead capture
      setPendingUploadDocId(docId);
      setShowLeadCapture(true);
    } else {
      // Unlocked: show upload modal directly
      setSelectedDocForUpload(docId);
      setShowUploadModal(true);
    }
  }, [isUnlocked]);

  // Handle successful lead capture
  const handleLeadSuccess = (leadId: string) => {
    // Add claim-survival to unlocked resources
    const newUnlocked = [...(sessionData.unlockedResources || []), 'claim-survival'];
    updateFields({
      unlockedResources: newUnlocked,
      leadId,
    });

    setShowLeadCapture(false);
    
    toast({
      title: 'Vault Created!',
      description: 'Your progress is now saved. Uploading your document...',
    });

    // Resume upload if there was a pending one
    if (pendingUploadDocId) {
      setSelectedDocForUpload(pendingUploadDocId);
      setPendingUploadDocId(null);
      setShowUploadModal(true);
    }
  };

  // Handle successful upload
  const handleUploadSuccess = (docId: string, fileUrl: string) => {
    // Save file URL
    const newFiles = { ...vaultFiles, [docId]: fileUrl };
    updateField('claimVaultFiles', newFiles);

    // Auto-check the checkbox
    const newProgress = { ...vaultProgress, [docId]: true };
    updateField('claimVaultProgress', newProgress);

    setShowUploadModal(false);
    setSelectedDocForUpload(null);

    toast({
      title: 'Document Saved!',
      description: 'Your file has been securely stored in your vault.',
    });
  };

  // Handle view document
  const handleViewDocument = (docId: string) => {
    const url = vaultFiles[docId];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle CTA click
  const handleCreateVaultClick = () => {
    if (!isUnlocked) {
      setShowLeadCapture(true);
    } else {
      // Scroll to checklist
      const element = document.getElementById('document-checklist');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

      {/* Sticky Progress Bar */}
      <StickyProgress 
        visible={showStickyProgress}
        completed={completedCount}
        total={claimDocuments.length}
        onCtaClick={handleCreateVaultClick}
        isUnlocked={isUnlocked}
      />

      {/* Hero */}
      <ClaimHero 
        onCreateVaultClick={handleCreateVaultClick}
        onEmergencyToggle={handleEmergencyToggle}
        isEmergencyMode={isEmergencyMode}
        isUnlocked={isUnlocked}
      />

      {/* Readiness Score */}
      <section className="py-8 border-b border-border">
        <div className="container px-4">
          <ReadinessScore 
            completed={completedCount} 
            total={claimDocuments.length} 
          />
        </div>
      </section>

      {/* Document Checklist */}
      <section id="document-checklist" className="py-12">
        <div className="container px-4">
          {/* Section Header with AI Analyze Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 font-mono uppercase tracking-wide">
                YOUR 7 CRITICAL DOCUMENTS
              </h2>
              <p className="text-muted-foreground">
                These are the documents insurance adjusters expect. Missing even one can delay or deny your claim.
              </p>
            </div>
            <Button 
              onClick={() => setShowAnalysisModal(true)}
              className="font-mono uppercase shrink-0"
              disabled={completedCount === 0}
            >
              <FileSearch className="mr-2 h-4 w-4" />
              Analyze Readiness
            </Button>
          </div>

          {/* Tag Filter */}
          <div className="mb-6">
            <EvidenceTagFilter
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              documentTags={documentTags}
            />
          </div>

          {/* Document List */}
          <DocumentChecklist 
            documents={filteredDocuments}
            progress={vaultProgress}
            files={vaultFiles}
            onCheckboxToggle={handleCheckboxToggle}
            onUploadClick={handleUploadClick}
            onViewDocument={handleViewDocument}
          />

          {/* Empty state for filtered results */}
          {filteredDocuments.length === 0 && selectedTags.length > 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground font-mono text-sm">
                No documents match the selected filters.
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedTags([])}
                className="mt-2 font-mono text-xs"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Photo Walkthrough */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4">
          <h2 className="text-2xl font-bold mb-2">Post-Storm Photo Protocol</h2>
          <p className="text-muted-foreground mb-8">
            Document damage correctly or risk having your claim denied. Follow this systematic approach.
          </p>
          <PhotoWalkthrough 
            onUploadClick={handleUploadClick}
            isUnlocked={isUnlocked}
          />
        </div>
      </section>

      {/* 24-Hour Playbook */}
      <section id="24-hour-playbook" className="py-12">
        <TimelinePlaybook />
      </section>

      {/* Receipt Rescue */}
      <section className="py-12 bg-muted/30">
        <ReceiptRescue />
      </section>

      {/* Common Mistakes */}
      <section className="py-12">
        <CommonMistakes onCtaClick={handleCreateVaultClick} />
      </section>

      {/* Tool Ecosystem */}
      <section className="py-12 bg-muted/30">
        <ToolEcosystem />
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <ClaimFinalCTA 
          onCreateVaultClick={handleCreateVaultClick}
          isUnlocked={isUnlocked}
        />
      </section>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadCapture}
        onClose={() => {
          setShowLeadCapture(false);
          setPendingUploadDocId(null);
        }}
        onSuccess={handleLeadSuccess}
        sourceTool="claim-survival-kit"
        sessionData={sessionData}
      />

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedDocForUpload(null);
        }}
        onSuccess={handleUploadSuccess}
        documentId={selectedDocForUpload}
        sessionId={vaultSessionId}
      />

      {/* Consultation Modal */}
      <ConsultationBookingModal
        isOpen={showConsultation}
        onClose={() => setShowConsultation(false)}
        onSuccess={() => {
          setShowConsultation(false);
          toast({
            title: 'Consultation Requested!',
            description: "We'll contact you shortly to confirm your appointment.",
          });
        }}
        sessionData={sessionData}
      />

      {/* Evidence Analysis Modal */}
      <EvidenceAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        documents={claimDocuments}
        progress={vaultProgress}
        files={vaultFiles}
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
        onAnalyze={analyzeEvidence}
      />
    </div>
  );
}
