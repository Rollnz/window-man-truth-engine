import { Link } from "react-router-dom";
import { FileSearch, Shield, Calculator, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { ImpactWindowCard } from "@/components/ui/ImpactWindowCard";

export const RelatedToolsSection = () => {
  const tools = [
    {
      icon: FileSearch,
      title: "Quote Scanner",
      description: "Upload a contractor quote and let AI analyze it for red flags and hidden fees.",
      href: ROUTES.QUOTE_SCANNER,
      iconColor: "text-sky-400",
      bgColor: "bg-sky-500/20",
      borderColor: "border-sky-500/40"
    },
    {
      icon: Shield,
      title: "Risk Diagnostic",
      description: "Assess your home's vulnerability and discover protection gaps.",
      href: ROUTES.RISK_DIAGNOSTIC,
      iconColor: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/40"
    },
    {
      icon: Calculator,
      title: "Cost Calculator",
      description: "Calculate long-term costs and savings for hurricane protection.",
      href: ROUTES.COST_CALCULATOR,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
      borderColor: "border-emerald-500/40"
    }
  ];

  return (
    <section className="py-16 bg-muted/30 border-t border-border">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Related Tools</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore more resources to help you make informed decisions about your impact window project.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tools.map((tool, index) => (
            <ImpactWindowCard key={index}>
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center`}>
                    <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-white drop-shadow-md">{tool.title}</h3>
                </div>
                <p className="text-sm text-white/80 mb-4 flex-grow">{tool.description}</p>
                <Link to={tool.href}>
                  <Button variant="cta" size="sm" className="w-full gap-2">
                    Use Tool <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </ImpactWindowCard>
          ))}
        </div>
      </div>
    </section>
  );
};
