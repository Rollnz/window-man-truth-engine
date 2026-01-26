import { SEO } from "@/components/SEO";
import { Navbar } from "@/components/home/Navbar";
import { ToolGrid } from "@/components/home/ToolGrid";
import { usePageTracking } from "@/hooks/usePageTracking";
import { getToolPageSchemas, getBreadcrumbSchema } from "@/lib/seoSchemas/index";
const Tools = () => {
  usePageTracking('tools-page');
  return <div className="min-h-screen bg-background">
      <SEO title="All Free Window Tools" description="Complete collection of free window replacement tools: calculators, quote analyzers, quizzes, and expert guidance. Make smarter window decisions." canonicalUrl="https://itswindowman.com/tools" jsonLd={[...getToolPageSchemas('tools-index'), getBreadcrumbSchema('tools-index')]} />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              All Tools
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-primary-foreground">
              Everything you need to make smarter window decisions — from cost calculators to expert guidance.
            </p>
          </div>
        </div>
        <ToolGrid />
      </main>
    </div>;
};
export default Tools;