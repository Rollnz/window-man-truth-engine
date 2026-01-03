import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { ToolGrid } from "@/components/home/ToolGrid";

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              All Tools
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make smarter window decisions — from cost calculators to expert guidance.
            </p>
          </div>
        </div>
        <ToolGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
