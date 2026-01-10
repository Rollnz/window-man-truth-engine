import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTE_REDIRECTS } from "@/config/navigation";
import ScrollToTop from "./components/ScrollToTop";

// Critical path - load immediately
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Route-based code splitting for major pages
const RealityCheck = lazy(() => import("./pages/RealityCheck"));
const CostCalculator = lazy(() => import("./pages/CostCalculator"));
const Expert = lazy(() => import("./pages/Expert"));
const Comparison = lazy(() => import("./pages/Comparison"));
const RiskDiagnostic = lazy(() => import("./pages/RiskDiagnostic"));
const FastWin = lazy(() => import("./pages/FastWin"));
const Evidence = lazy(() => import("./pages/Evidence"));
const VulnerabilityTest = lazy(() => import("./pages/VulnerabilityTest"));
const Intel = lazy(() => import("./pages/Intel"));
const ClaimSurvival = lazy(() => import("./pages/ClaimSurvival"));
const KitchenTableGuide = lazy(() => import("./pages/KitchenTableGuide"));
const SalesTacticsGuide = lazy(() => import("./pages/SalesTacticsGuide"));
const SpecChecklistGuide = lazy(() => import("./pages/SpecChecklistGuide"));
const InsuranceSavingsGuide = lazy(() => import("./pages/InsuranceSavingsGuide"));
const QuoteScanner = lazy(() => import("./pages/QuoteScanner"));
const CalculateEstimate = lazy(() => import("./pages/CalculateEstimate"));
const Tools = lazy(() => import("./pages/Tools"));
const Vault = lazy(() => import("./pages/Vault"));
const Auth = lazy(() => import("./pages/Auth"));
const Analytics = lazy(() => import("./pages/Analytics"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Defense = lazy(() => import("./pages/Defense"));
const Roleplay = lazy(() => import("./pages/Roleplay"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const BeatYourQuote = lazy(() => import("./pages/BeatYourQuote"));
const FairPriceQuiz = lazy(() => import("./pages/FairPriceQuiz"));
const ButtonAudit = lazy(() => import("./pages/ButtonAudit"));

// Lazy load AuthGuard
const AuthGuard = lazy(() => import("./components/auth/AuthGuard").then(m => ({ default: m.AuthGuard })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/ai-scanner" element={<QuoteScanner />} />
            <Route path="/free-estimate" element={<CalculateEstimate />} />
            <Route path="/impact-window-calculator" element={<CostCalculator />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/vault" element={<Suspense fallback={<PageLoader />}><AuthGuard><Vault /></AuthGuard></Suspense>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/defense" element={<Defense />} />
            <Route path="/roleplay" element={<Roleplay />} />
            <Route path="/beat-your-quote" element={<BeatYourQuote />} />
            <Route path="/fair-price-quiz" element={<FairPriceQuiz />} />
            <Route path="/button-audit" element={<ButtonAudit />} />
            {/* Legacy redirects - programmatically generated */}
            {Object.entries(ROUTE_REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
