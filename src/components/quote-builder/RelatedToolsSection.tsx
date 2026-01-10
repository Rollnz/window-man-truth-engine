import { FileSearch, Shield, Calculator } from "lucide-react";
import { ROUTES } from "@/config/navigation";
import { RelatedToolsGrid, ToolConfig } from "@/components/ui/RelatedToolsGrid";

const tools: ToolConfig[] = [
  {
    id: 'quote-scanner',
    icon: FileSearch,
    title: "Quote Scanner",
    description: "Upload a contractor quote and let AI analyze it for red flags and hidden fees.",
    path: ROUTES.QUOTE_SCANNER,
    iconColor: "text-sky-400",
    bgColor: "bg-sky-500/20",
    borderColor: "border-sky-500/40",
    cta: "Use Tool",
  },
  {
    id: 'risk-diagnostic',
    icon: Shield,
    title: "Risk Diagnostic",
    description: "Assess your home's vulnerability and discover protection gaps.",
    path: ROUTES.RISK_DIAGNOSTIC,
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/40",
    cta: "Use Tool",
  },
  {
    id: 'cost-calculator',
    icon: Calculator,
    title: "Cost Calculator",
    description: "Calculate long-term costs and savings for hurricane protection.",
    path: ROUTES.COST_CALCULATOR,
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/40",
    cta: "Use Tool",
  }
];

export const RelatedToolsSection = () => {
  return (
    <RelatedToolsGrid
      title="Related Tools"
      description="Explore more resources to help you make informed decisions about your impact window project."
      tools={tools}
      columns={3}
      variant="muted"
      className="py-16"
    />
  );
};
