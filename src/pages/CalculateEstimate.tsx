// ============================================
// Quote Builder - Main Page (Controller)
// ============================================

import { Shield } from "lucide-react";
import { ROUTES } from "@/config/navigation";
import { SEO } from "@/components/SEO";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useQuoteBuilder } from "@/hooks/useQuoteBuilder";
import { ErrorBoundary } from "@/components/error";
import { Navbar } from "@/components/home/Navbar";
import { MinimalFooter } from "@/components/navigation/MinimalFooter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatCurrency } from "@/utils/quoteCalculatorConstants";

// Components
import { QuoteBuilderHero } from "@/components/quote-builder/QuoteBuilderHero";
import { TheaterMode } from "@/components/quote-builder/TheaterMode";
import { LeadModal } from "@/components/quote-builder/LeadModal";
import { AiResultModal } from "@/components/quote-builder/AiResultModal";
import { AiQuickBuildSection } from "@/components/quote-builder/AiQuickBuildSection";
import { ProjectBasicsForm } from "@/components/quote-builder/ProjectBasicsForm";
import { PricingHeatmap } from "@/components/quote-builder/PricingHeatmap";
import { ItemConfigurator } from "@/components/quote-builder/ItemConfigurator";
import { QuoteSummarySidebar } from "@/components/quote-builder/QuoteSummarySidebar";
import { WhyAccurateEstimates } from "@/components/quote-builder/WhyAccurateEstimates";
import { HowItWorks } from "@/components/quote-builder/HowItWorks";
import { WhoIsThisFor } from "@/components/quote-builder/WhoIsThisFor";
import { RelatedToolsSection } from "@/components/quote-builder/RelatedToolsSection";

const QuoteBuilderV2 = () => {
  const {
    state, cart,
    styleValue, sizeValue, colorValue, gridValue,
    finishUpgrade, contingencyFund, roomName, quantity,
    showTheater, theaterMessage, theaterSubtext, showModal, isSubmitting,
    aiModalOpen, aiTitle, aiContent, aiLoading, aiInputText, isAiBuilding,
    currentPrices, styleOptions, sizeOptions, subtotal, permitFee, grandTotal,
    setStyleValue, setSizeValue, setColorValue, setGridValue,
    setFinishUpgrade, setContingencyFund, setRoomName, setQuantity, setAiInputText,
    setState, setShowModal, setAiModalOpen,
    handleQuickBuild, handleAiAction, handleSelectCell, addToCart, removeFromCart, startGeneration, handleLeadSubmit
  } = useQuoteBuilder();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-white font-sans text-slate-900 pb-24">
        <TheaterMode isActive={showTheater} message={theaterMessage} subtext={theaterSubtext} />
        <LeadModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleLeadSubmit} isSubmitting={isSubmitting} />
        <AiResultModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title={aiTitle} content={aiContent} isLoading={aiLoading} />

        <QuoteBuilderHero />

        <div id="quote-calculator" className="relative z-20 mt-8 max-w-7xl mx-auto px-4 md:px-6">
          {/* Floating Header Bar */}
          <div className="bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20 text-white overflow-hidden mb-8 p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 text-white px-2 py-1 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1 border border-white/30">
                <Shield size={12} />
                Configurator
              </div>
              <span className="text-sm text-blue-50 hidden md:inline-block">Build your custom quote</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-blue-100 text-[10px] uppercase tracking-wider font-bold">Estimated Total</span>
                <span className={`font-bold text-2xl ${state.isUnlocked ? 'text-white' : 'text-white/50 blur-[6px] select-none hover:blur-[2px] transition-all cursor-not-allowed'}`}>
                  {state.isUnlocked ? formatCurrency(grandTotal) : '$14,XXX'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
              <AiQuickBuildSection 
                aiInputText={aiInputText} 
                setAiInputText={setAiInputText} 
                isAiBuilding={isAiBuilding} 
                handleQuickBuild={handleQuickBuild} 
              />
              <ProjectBasicsForm state={state} setState={setState} setStyleValue={setStyleValue} />
              <PricingHeatmap state={state} currentPrices={currentPrices} handleSelectCell={handleSelectCell} />
            </div>

            {/* CENTER COLUMN */}
            <div className="lg:col-span-4">
              <ItemConfigurator
                state={state}
                styleValue={styleValue} setStyleValue={setStyleValue}
                sizeValue={sizeValue} setSizeValue={setSizeValue}
                colorValue={colorValue} setColorValue={setColorValue}
                gridValue={gridValue} setGridValue={setGridValue}
                finishUpgrade={finishUpgrade} setFinishUpgrade={setFinishUpgrade}
                contingencyFund={contingencyFund} setContingencyFund={setContingencyFund}
                roomName={roomName} setRoomName={setRoomName}
                quantity={quantity} setQuantity={setQuantity}
                styleOptions={styleOptions} sizeOptions={sizeOptions}
                addToCart={addToCart}
              />
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-3">
              <QuoteSummarySidebar
                state={state} cart={cart}
                subtotal={subtotal} permitFee={permitFee} grandTotal={grandTotal}
                removeFromCart={removeFromCart} startGeneration={startGeneration} handleAiAction={handleAiAction}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

const freeEstimateSchema = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Free Window Replacement Cost Calculator",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Build a custom window replacement estimate with our free calculator. Configure window styles, sizes, and features to get accurate pricing instantly.",
    "url": "https://itswindowman.com/free-estimate"
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Estimate Window Replacement Costs",
    "description": "Step-by-step guide to calculating your window replacement costs using our free online tool.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Select Your Project Details",
        "text": "Choose your home type, project scope, and timeline to get started."
      },
      {
        "@type": "HowToStep",
        "name": "Configure Your Windows",
        "text": "Select window style, size, color, and grid pattern for each room."
      },
      {
        "@type": "HowToStep",
        "name": "Add Windows to Your Quote",
        "text": "Add configured windows to your cart to build your complete project estimate."
      },
      {
        "@type": "HowToStep",
        "name": "Get Your Estimate",
        "text": "Review your detailed quote breakdown with material and installation costs."
      }
    ]
  }
];

export default function CalculateEstimate() {
  usePageTracking('free-estimate');

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SEO 
        title="Free Window Replacement Cost Calculator"
        description="Build a custom window replacement estimate for free. Configure styles, sizes, and features to get accurate pricing for your project instantly."
        canonicalUrl="https://itswindowman.com/free-estimate"
        jsonLd={freeEstimateSchema}
      />
      <Navbar />

      <div className="pt-14">
        <ErrorBoundary title="Quote Builder Error" description="The quote builder encountered an issue. Your data is safe." onReset={() => window.location.reload()}>
          <QuoteBuilderV2 />
        </ErrorBoundary>
      </div>

      <WhyAccurateEstimates />
      <HowItWorks />
      <WhoIsThisFor />
      <RelatedToolsSection />
      <MinimalFooter />
    </div>
  );
}
