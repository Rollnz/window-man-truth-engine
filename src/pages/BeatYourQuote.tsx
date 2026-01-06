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
import { OutcomeFolders } from '@/components/beat-your-quote/OutcomeFolders';

export default function BeatYourQuote() {
  usePageTracking('beat-your-quote');
  useSessionData();

  return (
    <div className="min-h-screen dossier-bg">
      <Navbar />
      <main>
        <DossierHero />
        <ConceptSection />
        <ManipulationTactics />
        <AnatomySection />
        {/* Two Possible Outcomes - between CTA and Testimonials */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <OutcomeFolders isVisible={true} />
          </div>
        </section>
        {/* Mission Outcomes - Testimonials */}
        <MissionOutcomes />
        {/* Interrogation FAQ */}
        <InterrogationFAQ />
        {/* Your Arsenal */}
        <ToolsSection />
      </main>
      <MinimalFooter />
    </div>
  );
}
