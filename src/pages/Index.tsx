import { Navbar } from '@/components/home/Navbar';
import { Hero } from '@/components/home/Hero';
import { UncomfortableTruth } from '@/components/home/UncomfortableTruth';
import { ToolGrid } from '@/components/home/ToolGrid';
import { SocialProof } from '@/components/home/SocialProof';
import { Footer } from '@/components/home/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-14"> {/* Padding for fixed navbar */}
        <Hero />
        <UncomfortableTruth />
        <ToolGrid />
        <SocialProof />
        <Footer />
      </div>
    </div>
  );
};

export default Index;