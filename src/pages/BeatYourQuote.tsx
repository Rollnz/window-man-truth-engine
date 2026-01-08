import { useState } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useSessionData } from '@/hooks/useSessionData';
import { Navbar } from '@/components/home/Navbar';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { DossierHero } from '@/components/beat-your-quote/DossierHero';
import { ConceptSection } from '@/components/beat-your-quote/ConceptSection';
import { ManipulationTactics } from '@/components/beat-your-quote/ManipulationTactics';
import { AnatomySection } from '@/components/beat-your-quote/AnatomySection';
import { ToolsSection } from '@/components/beat-your-quote/ToolsSection';
import { MissionOutcomes } from '@/components/beat-your-quote/MissionOutcomes';
import { InterrogationFAQ } from '@/components/beat-your-quote/InterrogationFAQ';


export default function BeatYourQuote() {
  usePageTracking('beat-your-quote');
  useSessionData();

  // State to trigger modal from hero buttons
  const [modalTriggerCount, setModalTriggerCount] = useState(0);
  const handleOpenModal = () => setModalTriggerCount(prev => prev + 1);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen dossier-bg">
      <Navbar />
      <main>
        <DossierHero onOpenModal={handleOpenModal} />
        <ConceptSection />
        <ManipulationTactics />
        <AnatomySection modalTriggerCount={modalTriggerCount} />
        {/* Mission Outcomes - Testimonials */}
        <MissionOutcomes />
        {/* Interrogation FAQ */}
        <InterrogationFAQ />
        {/* Your Arsenal */}
        <ToolsSection />
      </main>
      <MinimalFooter onGetQuoteClick={scrollToTop} />
    </div>
  );
}
