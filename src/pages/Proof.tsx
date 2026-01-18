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
import { trackEvent as trackGTMEvent } from '@/lib/gtm';

/**
 * Render the /proof page ("The Evidence Locker") and wire section-level analytics and navigation handlers.
 *
 * Renders the page layout and sections, tracks page and section views, and provides CTA handlers that emit GTM events and perform scrolling or route navigation.
 *
 * @returns The rendered Proof page React element.
 */
export default function Proof() {
  usePageTracking('proof');
  const navigate = useNavigate();
  const { sessionData, updateFields, markToolCompleted } = useSessionData();

  // Track section views for lead scoring
  const handleSectionView = useCallback((sectionId: string) => {
    const storageKey = `wm_proof_viewed_${sectionId}`;
    if (sessionStorage.getItem(storageKey)) return;
    
    sessionStorage.setItem(storageKey, '1');
    
    trackGTMEvent('wm_proof_section_view', {
      section_id: sectionId,
      page_path: '/proof',
    });
  }, []);

  // CTA handlers with tracking
  const handleWatchVoiceAgent = useCallback(() => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: 'watch_voice_agent',
      section_id: 'hero',
      target_path: '#voice-agent',
    });
    
    document.getElementById('voice-agent')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleViewCaseStudies = useCallback(() => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: 'view_case_studies',
      section_id: 'hero',
      target_path: '#case-vault',
    });
    
    document.getElementById('case-vault')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleAuditQuote = useCallback(() => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: 'audit_my_quote',
      section_id: 'truth-audit',
      target_path: '/ai-scanner',
    });
    trackGTMEvent('wm_tool_route', {
      from_page: '/proof',
      to_tool: 'quote_scanner',
      target_path: '/ai-scanner',
    });
    
    navigate('/ai-scanner');
  }, [navigate]);

  const handleListenToCall = useCallback(() => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: 'listen_real_call',
      section_id: 'voice-agent',
      target_path: 'call_player',
    });
    
    // TODO: Open call player modal
    // For now, navigate to expert page
    navigate('/expert');
  }, [navigate]);

  const handleTranscriptOpen = useCallback((transcriptId: string, topic: string) => {
    trackGTMEvent('wm_proof_transcript_open', {
      section_id: 'voice-agent',
      transcript_id: transcriptId,
      topic,
    });
  }, []);

  const handleTranscriptFilterChange = useCallback((topic: string) => {
    trackGTMEvent('wm_proof_transcript_filter', {
      section_id: 'voice-agent',
      filter_topic: topic,
    });
  }, []);

  const handleCalculateCostOfInaction = useCallback(() => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: 'calculate_cost_of_inaction',
      section_id: 'economic-proof',
      target_path: '/cost-calculator',
    });
    trackGTMEvent('wm_tool_route', {
      from_page: '/proof',
      to_tool: 'cost_of_inaction',
      target_path: '/cost-calculator',
    });
    
    navigate('/cost-calculator');
  }, [navigate]);

  const handleDossierOpen = useCallback((caseId: string, county: string, scenarioType: string) => {
    trackGTMEvent('wm_proof_dossier_open', {
      section_id: 'case-vault',
      case_id: caseId,
      county,
      scenario_type: scenarioType,
    });
  }, []);

  const handleDossierFilterChange = useCallback((filters: { county?: string; scenarioType?: string }) => {
    trackGTMEvent('wm_proof_dossier_filter', {
      section_id: 'case-vault',
      filters,
    });
  }, []);

  const handleSeeHowMyHomeCompares = useCallback(() => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: 'see_how_my_home_compares',
      section_id: 'case-vault',
      target_path: '/reality-check',
    });
    trackGTMEvent('wm_tool_route', {
      from_page: '/proof',
      to_tool: 'reality_check',
      target_path: '/reality-check',
    });
    
    navigate('/reality-check');
  }, [navigate]);

  const handleToolSelect = useCallback((tool: NextStepTool) => {
    trackGTMEvent('wm_proof_cta_click', {
      cta_id: tool.ctaId,
      section_id: 'golden-thread',
      target_path: tool.path,
    });
    trackGTMEvent('wm_tool_route', {
      from_page: '/proof',
      to_tool: tool.id.replace('-', '_'),
      target_path: tool.path,
    });
    
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
      numberOfItems: 5,
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