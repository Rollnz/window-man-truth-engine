import { usePageTracking } from '@/hooks/usePageTracking';
import { useSessionData } from '@/hooks/useSessionData';
import { Navbar } from '@/components/home/Navbar';
import { MinimalFooter } from '@/components/navigation/MinimalFooter';
import { DossierHero } from '@/components/beat-your-quote/DossierHero';

export default function BeatYourQuote() {
  usePageTracking('beat-your-quote');
  useSessionData();

  return (
    <div className="min-h-screen dossier-bg">
      <Navbar />
      <main>
        <DossierHero />
        {/* Future sections: ConceptSection, ManipulationTactics, ToolsSection, etc. */}
      </main>
      <MinimalFooter />
    </div>
  );
}
