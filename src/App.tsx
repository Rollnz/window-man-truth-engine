import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTE_REDIRECTS } from "@/config/navigation";
import { ScoreProvider } from "@/contexts/ScoreContext";
import ScrollToTop from "./components/ScrollToTop";
import { usePageTimer } from "@/hooks/usePageTimer";
import { useSessionSync } from "@/hooks/useSessionSync";
import { WelcomeToast } from "@/components/onboarding/WelcomeToast";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { GTMDebugPanel } from "@/components/debug/GTMDebugPanel";
import { EMQValidatorOverlay } from "@/components/debug/EMQValidatorOverlay";

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
const AttributionDashboard = lazy(() => import("./pages/admin/AttributionDashboard"));
const AttributionHealthDashboard = lazy(() => import("./pages/admin/AttributionHealthDashboard"));
const LeadSourceROI = lazy(() => import("./pages/admin/LeadSourceROI"));
const CRMDashboard = lazy(() => import("./pages/admin/CRMDashboard"));
const QuotesDashboard = lazy(() => import("./pages/admin/QuotesDashboard"));
const LeadDetail = lazy(() => import("./pages/admin/LeadDetail"));
const SearchResults = lazy(() => import("./pages/admin/SearchResults"));
const Revenue = lazy(() => import("./pages/admin/Revenue"));
const ExecutiveProfit = lazy(() => import("./pages/admin/ExecutiveProfit"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const CallAgentsConfig = lazy(() => import("./pages/admin/CallAgentsConfig"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Defense = lazy(() => import("./pages/Defense"));
const Roleplay = lazy(() => import("./pages/Roleplay"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const BeatYourQuote = lazy(() => import("./pages/BeatYourQuote"));
const FairPriceQuiz = lazy(() => import("./pages/FairPriceQuiz"));
const ButtonAudit = lazy(() => import("./pages/ButtonAudit"));
const Proof = lazy(() => import("./pages/Proof"));
const Consultation = lazy(() => import("./pages/Consultation"));
const Audit = lazy(() => import("./pages/Audit"));
const SampleReport = lazy(() => import("./pages/SampleReport"));

// Semantic Pillar Pages
const WindowCostTruth = lazy(() => import("./pages/WindowCostTruth"));
const WindowRiskAndCode = lazy(() => import("./pages/WindowRiskAndCode"));
const WindowSalesTruth = lazy(() => import("./pages/WindowSalesTruth"));
const WindowVerificationSystem = lazy(() => import("./pages/WindowVerificationSystem"));

// Lazy load AuthGuard
const AuthGuard = lazy(() => import("./components/auth/AuthGuard").then(m => ({ default: m.AuthGuard })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

// Inner component to use hooks inside providers
function AppContent() {
  // Awards 10 points after 2 minutes on site (once per session)
  usePageTimer();
  
  // Syncs localStorage session data to database on auth (fire-and-forget)
  useSessionSync();
  
  return (
    <main id="main-content" tabIndex={-1} className="outline-none">
      <WelcomeToast />
      <Routes>
        {/* ============================================
            PUBLIC ROUTES (with UnifiedFooter system)
            All marketing pages wrapped in PublicLayout
        ============================================ */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/reality-check" element={<RealityCheck />} />
          <Route path="/cost-calculator" element={<CostCalculator />} />
          <Route path="/expert" element={<Expert />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/risk-diagnostic" element={<RiskDiagnostic />} />
          <Route path="/fast-win" element={<FastWin />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/proof" element={<Proof />} />
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/defense" element={<Defense />} />
          <Route path="/roleplay" element={<Roleplay />} />
          <Route path="/beat-your-quote" element={<BeatYourQuote />} />
          <Route path="/fair-price-quiz" element={<FairPriceQuiz />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/sample-report" element={<SampleReport />} />
          {/* Semantic Pillar Pages */}
          <Route path="/window-cost-truth" element={<WindowCostTruth />} />
          <Route path="/window-risk-and-code" element={<WindowRiskAndCode />} />
          <Route path="/window-sales-truth" element={<WindowSalesTruth />} />
          <Route path="/window-verification-system" element={<WindowVerificationSystem />} />
          {/* Legacy redirects - programmatically generated */}
          {Object.entries(ROUTE_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          {/* 404 catch-all for public routes */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ============================================
            PRIVATE ROUTES (without footer system)
            Auth, Vault, Admin - no marketing footer
        ============================================ */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/vault" element={<Suspense fallback={<PageLoader />}><AuthGuard><Vault /></AuthGuard></Suspense>} />
        <Route path="/audit" element={<Audit />} />
        
        {/* Admin Routes - wrapped with AdminLayout for global search */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/leads" element={<Navigate to="/admin/crm" replace />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/attribution" element={<AttributionDashboard />} />
          <Route path="/admin/attribution-health" element={<AttributionHealthDashboard />} />
          <Route path="/admin/roi" element={<LeadSourceROI />} />
          <Route path="/admin/crm" element={<CRMDashboard />} />
          <Route path="/admin/quotes" element={<QuotesDashboard />} />
          <Route path="/admin/search" element={<SearchResults />} />
          <Route path="/admin/leads/:id" element={<LeadDetail />} />
          <Route path="/admin/revenue" element={<Revenue />} />
          <Route path="/admin/executive" element={<ExecutiveProfit />} />
          <Route path="/admin/call-agents" element={<CallAgentsConfig />} />
        </Route>
        
        {/* Internal dev tools (no footer) */}
        <Route path="/button-audit" element={<ButtonAudit />} />
      </Routes>
      
      {/* Debug Panels - only render in development mode */}
      <GTMDebugPanel />
      <EMQValidatorOverlay />
    </main>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ScoreProvider>
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <AppContent />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ScoreProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
