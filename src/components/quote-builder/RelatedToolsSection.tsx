import { Link } from "react-router-dom";
import { FileSearch, Shield, Calculator, ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/navigation";

export const RelatedToolsSection = () => {
  const tools = [
    {
      icon: FileSearch,
      title: "Quote Scanner",
      description: "Upload a contractor quote and let AI analyze it for red flags and hidden fees.",
      href: ROUTES.QUOTE_SCANNER,
      color: "blue"
    },
    {
      icon: Shield,
      title: "Risk Diagnostic",
      description: "Assess your home's vulnerability and discover protection gaps.",
      href: ROUTES.RISK_DIAGNOSTIC,
      color: "emerald"
    },
    {
      icon: Calculator,
      title: "Cost Calculator",
      description: "Calculate long-term costs and savings for hurricane protection.",
      href: ROUTES.COST_CALCULATOR,
      color: "orange"
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Related Tools</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore more resources to help you make informed decisions about your impact window project.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tools.map((tool, index) => (
            <Link 
              key={index}
              to={tool.href}
              className="group bg-slate-50 hover:bg-slate-100 rounded-xl p-6 transition-all border border-slate-200 hover:border-slate-300"
            >
              <div className={`w-12 h-12 bg-${tool.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                <tool.icon className={`w-6 h-6 text-${tool.color}-600`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                {tool.title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-muted-foreground text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
