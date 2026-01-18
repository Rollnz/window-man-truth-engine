import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionData } from '@/hooks/useSessionData';
import { usePageTracking } from '@/hooks/usePageTracking';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/home/Navbar';
import { 
  ProofPageShell,
  ProofHero,
  TruthAuditSection,
  VoiceOfReasonSection,
  EconomicProofSection,
  CaseStudyVaultSection,
  GoldenThreadNextSteps,
  type NextStepTool,
} from '@/components/proof';
import { 
  track, 
  trackSectionView, 
  trackCTAClick, 
  trackToolRoute 
} from '@/lib/tracking';

/**
 * /proof - The Evidence Locker
 * Consumer Advocate Superhero Conviction Engine
 * 
 * Emotional arc: Curious → Safe → Informed → Certain → Ready to Act
 * 
 * Theme: Light, trust-forward design. NOT dark intelligence-room.
 * Think: Consumer watchdog, investigative journalist, homeowner advocate.
 */
export default function Proof() {
  usePageTracking('proof');
  const navigate = useNavigate();
  const { sessionData, updateFields, markToolCompleted } = useSessionData();

  // Track section views for lead scoring (deduped in trackSectionView)
  const handleSectionView = useCallback((sectionId: string) => {
    trackSectionView(sectionId, '/proof');
  }, []);

  // CTA handlers with unified tracking
  const handleWatchVoiceAgent = useCallback(() => {
    trackCTAClick('watch_voice_agent', 'hero', '#voice-agent', '/proof');
    document.getElementById('voice-agent')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleViewCaseStudies = useCallback(() => {
    trackCTAClick('view_case_studies', 'hero', '#case-vault', '/proof');
    document.getElementById('case-vault')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleAuditQuote = useCallback(() => {
    trackCTAClick('audit_my_quote', 'truth-audit', '/ai-scanner', '/proof');
    trackToolRoute('/proof', 'quote_scanner', '/ai-scanner');
    navigate('/ai-scanner');
  }, [navigate]);

  const handleListenToCall = useCallback(() => {
    trackCTAClick('listen_real_call', 'voice-agent', 'call_player', '/proof');
    track('wm_proof_call_player_open', {
      section_id: 'voice-agent',
      page_path: '/proof',
    });
    // For now, navigate to expert page
    navigate('/expert');
  }, [navigate]);

  const handleTranscriptOpen = useCallback((transcriptId: string, topic: string) => {
    track('wm_proof_transcript_open', {
      section_id: 'voice-agent',
      transcript_id: transcriptId,
      topic,
      page_path: '/proof',
    });
  }, []);

  const handleTranscriptFilterChange = useCallback((topic: string) => {
    track('wm_proof_transcript_filter', {
      section_id: 'voice-agent',
      filter_topic: topic,
      page_path: '/proof',
    });
  }, []);

  const handleCalculateCostOfInaction = useCallback(() => {
    trackCTAClick('calculate_cost_of_inaction', 'economic-proof', '/cost-calculator', '/proof');
    trackToolRoute('/proof', 'cost_of_inaction', '/cost-calculator');
    navigate('/cost-calculator');
  }, [navigate]);

  const handleDossierOpen = useCallback((caseId: string, county: string, scenarioType: string) => {
    track('wm_proof_dossier_open', {
      section_id: 'case-vault',
      case_id: caseId,
      county,
      scenario_type: scenarioType,
      page_path: '/proof',
    });
  }, []);

  const handleDossierFilterChange = useCallback((filters: { county?: string; scenarioType?: string }) => {
    track('wm_proof_dossier_filter', {
      section_id: 'case-vault',
      page_path: '/proof',
    });
  }, []);

  const handleSeeHowMyHomeCompares = useCallback(() => {
    trackCTAClick('see_how_my_home_compares', 'case-vault', '/reality-check', '/proof');
    trackToolRoute('/proof', 'reality_check', '/reality-check');
    navigate('/reality-check');
  }, [navigate]);

  const handleToolSelect = useCallback((tool: NextStepTool) => {
    trackCTAClick(tool.ctaId, 'golden-thread', tool.path, '/proof');
    trackToolRoute('/proof', tool.id.replace('-', '_'), tool.path);
    navigate(tool.path);
  }, [navigate]);

  // SEO schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'The Evidence Locker - Verified Window Replacement Savings',
    description: 'Real-time data, verified savings, and documented outcomes from 450+ Florida homeowners who beat inflated window pricing.',
    url: 'https://itswindowman.com/proof',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Verified Case Studies',
      numberOfItems: 3,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Miami-Dade Case Study',
          description: 'Spec upgrade + price reduction. Net savings: $2,300',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Broward County Case Study',
          description: 'Quote renegotiated. Labor reduced. Savings: $1,650',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Palm Beach Case Study',
          description: '19% premium reduction—year after year.',
        },
      ],
    },
  };

  return (
    <ProofPageShell>
      <SEO 
        title="The Evidence Locker - Verified Window Replacement Savings | Window Man"
        description="Real-time data, verified savings, and documented outcomes from 450+ Florida homeowners who beat inflated window pricing, hidden specs, and insurance blind spots."
        canonicalUrl="https://itswindowman.com/proof"
        jsonLd={jsonLd}
      />
      
      <Navbar />

      {/* Hero - Consumer Advocate Positioning */}
      <ProofHero 
        onWatchVoiceAgent={handleWatchVoiceAgent}
        onViewCaseStudies={handleViewCaseStudies}
      />

      {/* Section I - The AI Truth Audit */}
      <TruthAuditSection 
        onAuditQuote={handleAuditQuote}
        onSectionView={handleSectionView}
      />

      {/* Section II - The Voice of Reason */}
      <VoiceOfReasonSection 
        onListenToCall={handleListenToCall}
        onSectionView={handleSectionView}
        onTranscriptOpen={handleTranscriptOpen}
        onFilterChange={handleTranscriptFilterChange}
      />

      {/* Section III - Economic Proof */}
      <EconomicProofSection 
        onCalculateCostOfInaction={handleCalculateCostOfInaction}
        onSectionView={handleSectionView}
      />

      {/* Section IV - The Case Study Vault */}
      <CaseStudyVaultSection 
        onSeeHowMyHomeCompares={handleSeeHowMyHomeCompares}
        onSectionView={handleSectionView}
        onDossierOpen={handleDossierOpen}
        onFilterChange={handleDossierFilterChange}
      />

      {/* Golden Thread - Next Steps */}
      <GoldenThreadNextSteps 
        onToolSelect={handleToolSelect}
        onSectionView={handleSectionView}
      />
    </ProofPageShell>
  );
}
