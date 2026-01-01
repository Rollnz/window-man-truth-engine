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
import ClaimSurvival from "./pages/ClaimSurvival";
import KitchenTableGuide from "./pages/KitchenTableGuide";
import SalesTacticsGuide from "./pages/SalesTacticsGuide";
import SpecChecklistGuide from "./pages/SpecChecklistGuide";
import InsuranceSavingsGuide from "./pages/InsuranceSavingsGuide";
import QuoteScanner from "./pages/QuoteScanner";
import Vault from "./pages/Vault";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Disclaimer from "./pages/legal/Disclaimer";
import { AuthGuard } from "./components/auth/AuthGuard";

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
          <Route path="/claim-survival" element={<ClaimSurvival />} />
          <Route path="/kitchen-table-guide" element={<KitchenTableGuide />} />
          <Route path="/sales-tactics-guide" element={<SalesTacticsGuide />} />
          <Route path="/spec-checklist-guide" element={<SpecChecklistGuide />} />
          <Route path="/insurance-savings-guide" element={<InsuranceSavingsGuide />} />
          <Route path="/quote-scanner" element={<QuoteScanner />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/vault" element={<AuthGuard><Vault /></AuthGuard>} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/legal/disclaimer" element={<Disclaimer />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
