import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RealityCheck from "./pages/RealityCheck";
import CostCalculator from "./pages/CostCalculator";
import Expert from "./pages/Expert";
import Comparison from "./pages/Comparison";
import RiskDiagnostic from "./pages/RiskDiagnostic";
import FastWin from "./pages/FastWin";
import Evidence from "./pages/Evidence";
import VulnerabilityTest from "./pages/VulnerabilityTest";
import Intel from "./pages/Intel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reality-check" element={<RealityCheck />} />
          <Route path="/cost-calculator" element={<CostCalculator />} />
          <Route path="/expert" element={<Expert />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/risk-diagnostic" element={<RiskDiagnostic />} />
          <Route path="/fast-win" element={<FastWin />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/vulnerability-test" element={<VulnerabilityTest />} />
          <Route path="/intel" element={<Intel />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
