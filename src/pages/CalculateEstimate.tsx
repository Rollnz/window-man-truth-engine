import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar, Phone, HelpCircle, Check, Shield, Info, ArrowRight,
  Loader2, X, ArrowDown, Sparkles, MessageSquare, Mail,
  Wand2, TrendingUp, ArrowLeft
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WhyAccurateEstimates } from "@/components/quote-builder/WhyAccurateEstimates";
import { HowItWorks } from "@/components/quote-builder/HowItWorks";
import { WhoIsThisFor } from "@/components/quote-builder/WhoIsThisFor";
import { RelatedToolsSection } from "@/components/quote-builder/RelatedToolsSection";
import { supabase } from "@/integrations/supabase/client";

// Rate limit error with upsell message
class RateLimitError extends Error {
  isAnonymous: boolean;
  constructor(message: string, isAnonymous: boolean) {
    super(message);
    this.name = 'RateLimitError';
    this.isAnonymous = isAnonymous;
  }
}

// Secure AI call via Edge Function
const callGemini = async (prompt: string): Promise<string> => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let i = 0; i < 3; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: { prompt }
      });

      // Check for rate limit error (429)
      if (error?.message?.includes('429') || data?.error?.includes('Rate limit')) {
        const isAnonymous = data?.isAnonymous ?? true;
        throw new RateLimitError(
          data?.error || 'Rate limit exceeded. Please try again later.',
          isAnonymous
        );
      }

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate response');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.text || "I couldn't generate a response at this time.";
    } catch (error) {
      // Don't retry rate limit errors
      if (error instanceof RateLimitError) {
        throw error;
      }
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === 2) throw error;
      await delay(1000 * Math.pow(2, i));
    }
  }
  return "Service unavailable.";
};

// --- HERO COMPONENT ---
const QuoteBuilderHero = () => {
  const scrollToCalculator = () => {
    const calculator = document.getElementById("quote-calculator");
    if (calculator) {
      calculator.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full min-h-[50vh] flex flex-col items-center justify-center bg-white overflow-hidden border-b border-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white" />
      
      <div className="relative z-10 container px-4 mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Stop Guessing. <br className="hidden md:block" />
            <span className="text-blue-600">Start Building.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create a 100% transparent impact window cost estimate in minutes.
            No sales calls, no hidden fees—just real Florida market data.
          </p>
        </div>

        <button
          onClick={scrollToCalculator}
          className="group relative inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-orange-200"
        >
          Start My Estimate
          <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-multiply" />
    </section>
  );
};

// --- HELPERS ---
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const getHeatmapColor = (price: number, min: number, max: number) => {
  if (min === max) return 'hsl(142, 70%, 90%)';
  const ratio = (price - min) / (max - min);
  const lightness = 95 - (ratio * 55);
  return `hsla(142, 70%, ${lightness}%, 1)`;
};

// --- CONSTANTS ---
const WALL_OPTIONS = [
  { value: 0, label: 'Concrete Block (CBS)' },
  { value: 50, label: 'Wood Frame (+$50/op)' },
];

const COLOR_OPTIONS = [
  { value: 1.0, label: 'White (Standard)' },
  { value: 1.15, label: 'Bronze (+15%)' },
  { value: 1.15, label: 'Black (+15%)' },
];

const GRID_OPTIONS = [
  { value: 1.0, label: 'No Grids' },
  { value: 1.08, label: 'Colonial (+8%)' },
  { value: 1.15, label: 'Brittany (+15%)' },
];

const FLOOR_OPTIONS = [
  { value: 0, label: '1st Floor' },
  { value: 75, label: '2nd Floor (+$75)' },
  { value: 150, label: '3rd Floor+ (+$150)' },
];

const CONFIG = {
  glassTypes: [
    { name: "Clear", desc: "Standard impact glass" },
    { name: "Gray", desc: "Tinted for sun protection" },
    { name: "Low-E", desc: "Energy efficient coating" }
  ],
  frameMaterials: ["Aluminum", "Vinyl"],
  prices: {
    window: [
      [800, 850, 950],
      [900, 950, 1050]
    ],
    slider: [[2500, 2600, 2800], [2800, 2900, 3100]],
    french: [[3000, 3100, 3300], [3300, 3400, 3600]]
  }
};

const PRODUCT_TYPE_CONFIG: Record<string, { label: string }> = {
  window: { label: "Impact Window" },
  slider: { label: "Sliding Glass Door" },
  french: { label: "French Door" }
};

const STYLE_OPTIONS = {
  window: [
    { key: 'sh', label: 'Single Hung', mult: 1.0 },
    { key: 'cas', label: 'Casement', mult: 1.25 },
    { key: 'hr', label: 'Horizontal Roller', mult: 1.15 },
    { key: 'pw', label: 'Picture Window', mult: 0.9 },
  ],
  door: [
    { key: 'std', label: 'Standard', mult: 1.0 }
  ]
};

const SIZE_OPTIONS = {
  window: [
    { val: 1.0, label: 'Standard (Up to 48"x60")' },
    { val: 1.3, label: 'Large (Up to 54"x76")' },
    { val: 1.8, label: 'Oversized (Custom)' },
  ],
  door: [
    { val: 1.0, label: 'Standard Height (80")' },
    { val: 1.2, label: 'Tall (96")' }
  ]
};

// --- COMPONENTS ---
const TheaterMode = ({ isActive, message, subtext }: { isActive: boolean, message: string, subtext: string }) => {
  if (!isActive) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="text-center p-8 relative">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6 relative z-10" />
        <div className="text-2xl font-bold text-slate-900 mb-2 relative z-10">{message}</div>
        <div className="text-slate-500 text-lg relative z-10">{subtext}</div>
      </div>
    </div>
  );
};

const LeadModal = ({ isOpen, onClose, onSubmit, isSubmitting }: any) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 shadow-2xl rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-slate-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <Check className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Your Estimate is Ready!</h3>
          <p className="text-slate-500 mt-2 text-sm">
            We've generated your project estimate. Where should we send the detailed PDF report?
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, phone }); }} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-3 bg-white rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-3 bg-white rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full px-4 py-3 bg-white rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unlocking...
              </>
            ) : (
              "Send My Quote & Report"
            )}
          </button>
        </form>
        
        <p className="text-xs text-slate-400 text-center mt-4">
          Window GUY respects your privacy. No spam, ever.
        </p>
      </div>
    </div>
  );
};

const AiResultModal = ({ isOpen, onClose, title, content, isLoading }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 shadow-2xl rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative animate-in fade-in zoom-in duration-200 border border-slate-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
          <X size={24} />
        </button>
        
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
            {isLoading ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-600" />}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{isLoading ? "Thinking..." : title}</h3>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-600">
               <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
          <p className="text-xs text-slate-500 text-center">
            AI-generated content may vary. Use this information as a guide for your negotiations.
          </p>
        </div>
      </div>
    </div>
  );
};

interface CartItem {
  id: number;
  productType: string;
  name: string;
  desc: string;
  details: string;
  qty: number;
  unit: number;
  total: number;
}

const QuoteBuilderV2 = () => {
  const [state, setState] = useState({
    productType: "window" as keyof typeof CONFIG.prices,
    zipCode: "",
    wallType: 0,
    basePrice: 0,
    baseName: "",
    selectedFrameIndex: -1,
    selectedGlassIndex: -1,
    isUnlocked: false,
    isLeadSubmitted: false
  });
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [permitPercent] = useState(2);
  
  // Form state
  const [styleValue, setStyleValue] = useState(1.0);
  const [sizeValue, setSizeValue] = useState(1.0);
  const [colorValue, setColorValue] = useState(1.0);
  const [gridValue, setGridValue] = useState(1.0);
  const [floorValue] = useState(0);
  const [finishUpgrade, setFinishUpgrade] = useState(false);
  const [contingencyFund, setContingencyFund] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Modal states
  const [showTheater, setShowTheater] = useState(false);
  const [theaterMessage, setTheaterMessage] = useState("");
  const [theaterSubtext, setTheaterSubtext] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [isAiBuilding, setIsAiBuilding] = useState(false);

  const currentPrices = CONFIG.prices[state.productType];
  const styleOptions = state.productType === "window" ? STYLE_OPTIONS.window : STYLE_OPTIONS.door;
  const sizeOptions = state.productType === "window" ? SIZE_OPTIONS.window : SIZE_OPTIONS.door;

  // Derived calculations
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const permitFee = subtotal * (permitPercent / 100);
  const grandTotal = subtotal + permitFee;

  // --- AI HANDLERS ---
  const handleQuickBuild = async () => {
    if (!aiInputText.trim()) return;
    setIsAiBuilding(true);
    
    const defaultWindowPrice = CONFIG.prices.window[0][0];
    const defaultSliderPrice = CONFIG.prices.slider[0][0];
    const defaultFrenchPrice = CONFIG.prices.french[0][0];

    const prompt = `You are a construction estimator. Parse the following user request into a JSON array of items for a window quote.
    User Request: "${aiInputText}"
    
    Available Product Types: 'window' (Standard Impact Window), 'slider' (Sliding Glass Door), 'french' (French Door).
    
    Rules:
    1. If the user mentions "doors" without specifying type, assume "slider".
    2. Extract quantity (default to 1 if not specified).
    3. Generate a short descriptive name (e.g. "Bedroom Window", "Patio Slider").
    4. Return ONLY a valid JSON array. No markdown, no comments.
    
    JSON Schema:
    [{ "productType": "window"|"slider"|"french", "qty": number, "name": string, "desc": string }]`;

    try {
        const result = await callGemini(prompt);
        const jsonString = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const items = JSON.parse(jsonString);
        
        if (Array.isArray(items)) {
            const newCartItems = items.map((item: any) => {
                let unitPrice = defaultWindowPrice;
                if (item.productType === 'slider') unitPrice = defaultSliderPrice;
                if (item.productType === 'french') unitPrice = defaultFrenchPrice;

                return {
                    id: Date.now() + Math.random(),
                    productType: item.productType,
                    name: item.name,
                    desc: item.desc,
                    details: "Standard • Impact Glass",
                    qty: item.qty || 1,
                    unit: unitPrice,
                    total: unitPrice * (item.qty || 1)
                };
            });
            
            setCart(prev => [...prev, ...newCartItems]);
            toast.success(`✨ AI added ${newCartItems.length} items to your quote!`);
            setAiInputText("");
        }
    } catch (e) {
        console.error(e);
        if (e instanceof RateLimitError) {
          if (e.isAnonymous) {
            toast.error("🔒 You've used all 3 free estimates. Sign up to get 20/hour!", {
              duration: 6000,
              action: {
                label: "Sign Up",
                onClick: () => window.location.href = "/auth"
              }
            });
          } else {
            toast.error("⏳ You've reached your hourly limit. Please try again later.");
          }
        } else {
          toast.error("AI couldn't understand that request. Try '5 windows and 1 door'.");
        }
    } finally {
        setIsAiBuilding(false);
    }
  };

  const handleAiAction = async (action: string) => {
    if (!state.isUnlocked) {
        toast.error("You must unlock your quote first!");
        return;
    }
    
    setAiModalOpen(true);
    setAiLoading(true);
    setAiContent("");

    let prompt = "";
    
    const cartSummary = cart.map(i => `${i.qty}x ${i.name} (${i.details}) @ ${formatCurrency(i.unit)}/ea`).join(", ");
    const wallContext = state.wallType === 50 ? "Wood Frame Construction" : "Concrete Block (CBS)";

    switch (action) {
        case "analyze":
            setAiTitle("Smart Quote Analysis");
            prompt = `Analyze this impact window quote: Total: ${formatCurrency(grandTotal)}. Items: ${cartSummary}. Zip: ${state.zipCode}. Wall: ${wallContext}. Provide Value Rating /10, Pros, Cons, and Fairness Summary.`;
            break;
        case "email":
            setAiTitle("Negotiation Email Generator");
            prompt = `Write a tough negotiation email for a window quote of ${formatCurrency(grandTotal)} for ${cart.length} items (${cartSummary}). Ask for volume discount.`;
            break;
        case "script":
            setAiTitle("Contractor Interrogation Script");
            prompt = `Generate 5 "Gotcha" questions for a window contractor. Context: ${wallContext}, Zip ${state.zipCode}, Items: ${cartSummary}. Focus on installation & hidden fees.`;
            break;
        case "hidden":
            setAiTitle("Hidden Cost Detector");
            prompt = `Analyze quote for hidden costs: ${cartSummary}. Wall: ${wallContext}. List 5 potential extra charges.`;
            break;
        case "roi":
            setAiTitle("💰 ROI & Insurance Savings Projector");
            prompt = `Calculate ROI for ${formatCurrency(grandTotal)} window project in Florida Zip ${state.zipCode}. Estimate Insurance Savings, Energy Savings, and Home Value Increase over 5 years.`;
            break;
    }

    try {
        const result = await callGemini(prompt);
        setAiContent(result);
    } catch (err) {
        setAiContent("Sorry, I couldn't reach the AI service at the moment. Please try again later.");
    } finally {
        setAiLoading(false);
    }
  };

  const handleSelectCell = (frameIdx: number, glassIdx: number, price: number, frameName: string, glassName: string) => {
    if (state.zipCode.length !== 5) {
      toast.error("Please enter a valid 5-digit zip code first");
      return;
    }
    setState(prev => ({
      ...prev,
      basePrice: price,
      baseName: `${frameName} / ${glassName}`,
      selectedFrameIndex: frameIdx,
      selectedGlassIndex: glassIdx
    }));
  };

  const addToCart = () => {
    if (state.basePrice === 0) return;
    
    const productConfig = PRODUCT_TYPE_CONFIG[state.productType];
    const unitTotal = state.basePrice * styleValue * sizeValue * colorValue * gridValue + floorValue + state.wallType + (finishUpgrade ? 450 : 0) + (contingencyFund ? 200 : 0);
    const lineTotal = unitTotal * quantity;
    
    const styleLabel = styleOptions.find(s => s.mult === styleValue)?.label || "";
    const sizeLabel = sizeOptions.find(s => s.val === sizeValue)?.label || "";

    const newItem: CartItem = {
      id: Date.now(),
      productType: state.productType,
      name: roomName || productConfig.label,
      desc: `${productConfig.label} - ${state.baseName}`,
      details: `${sizeLabel}, ${styleLabel}`,
      qty: quantity,
      unit: unitTotal,
      total: lineTotal
    };

    setCart(prev => [...prev, newItem]);
    setRoomName("");
    setQuantity(1);
    toast.success("Item added to estimate");
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const startGeneration = async () => {
    setShowTheater(true);
    setTheaterMessage("Analyzing Project Specs...");
    setTheaterSubtext("Checking wind load requirements...");
    setTimeout(() => {
        setShowTheater(false);
        setShowModal(true);
    }, 2000);
  };

  const handleLeadSubmit = async (data: { name: string; email: string; phone: string }) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            email: data.email.trim(),
            name: data.name.trim() || null,
            phone: data.phone.trim() || null,
            sourceTool: 'quote-builder',
            sessionData: {
              cartItems: cart.length,
              estimateTotal: grandTotal,
              zipCode: state.zipCode,
            },
            chatHistory: [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save lead');
      }

      const result = await response.json();

      if (result.success && result.leadId) {
        setShowModal(false);
        setState(prev => ({ ...prev, isUnlocked: true, isLeadSubmitted: true }));
        toast.success("Quote Unlocked! Check your email for a copy.");
      } else {
        throw new Error(result.error || 'Unexpected error');
      }
    } catch (error) {
      console.error('Lead submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldLabel = ({ label, tooltip }: { label: string, tooltip: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-help transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-white border border-slate-200 text-slate-600 text-xs p-3 shadow-xl">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-white font-sans text-slate-900 pb-24">
        <TheaterMode isActive={showTheater} message={theaterMessage} subtext={theaterSubtext} />
        <LeadModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleLeadSubmit} isSubmitting={isSubmitting} />
        <AiResultModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title={aiTitle} content={aiContent} isLoading={aiLoading} />

        <QuoteBuilderHero />

        {/* MAIN CALCULATOR SECTION */}
        <div id="quote-calculator" className="relative z-20 mt-8 max-w-7xl mx-auto px-4 md:px-6">
            
            {/* FLOATING HEADER BAR */}
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
                
                {/* LEFT COLUMN: SETTINGS & PRICING GRID (5 cols) */}
                <div className="lg:col-span-5 space-y-6">

                    {/* AI QUICK BUILD SECTION */}
                    <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 relative overflow-hidden group shadow-lg">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-16 h-16 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Wand2 className="w-5 h-5 text-blue-600" />
                                <h3 className="text-slate-900 font-bold">Quick Build with AI</h3>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">
                                Describe your project in plain English (e.g. "3 bedrooms with 2 windows each and a sliding door").
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Type your project list here..."
                                    value={aiInputText}
                                    onChange={(e) => setAiInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickBuild()}
                                />
                                <button
                                    onClick={handleQuickBuild}
                                    disabled={isAiBuilding || !aiInputText.trim()}
                                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-100 disabled:text-slate-400 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    {isAiBuilding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Build"}
                                </button>
                            </div>
                        </div>
                    </section>
                    
                    {/* Step 1: Project Basics */}
                    <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                            <h2 className="text-lg font-bold text-slate-900">Project Basics</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <FieldLabel label="Product Type" tooltip="Choose the type of opening you are pricing." />
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors outline-none"
                                    value={state.productType}
                                    onChange={e => {
                                        setState(prev => ({ ...prev, productType: e.target.value as any, basePrice: 0, baseName: "", selectedFrameIndex: -1, selectedGlassIndex: -1 }));
                                        setStyleValue(1.0);
                                    }}
                                >
                                    <option value="window">Impact Windows (Standard)</option>
                                    <option value="slider">Sliding Glass Doors</option>
                                    <option value="french">French / Swing Doors</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel label="Zip Code" tooltip="Required for wind-load calculation." />
                                    <input
                                        type="tel"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="e.g. 33101"
                                        maxLength={5}
                                        value={state.zipCode}
                                        onChange={e => setState(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                                    />
                                </div>
                                <div>
                                    <FieldLabel label="Wall Type" tooltip="Wood frame requires additional structural work." />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={state.wallType}
                                        onChange={e => setState(prev => ({ ...prev, wallType: Number(e.target.value) }))}
                                    >
                                        {WALL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Base Pricing Grid (HEATMAP) */}
                    <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
                                <h2 className="text-lg font-bold text-slate-900">Select Base Grade</h2>
                            </div>
                            {state.basePrice > 0 && (
                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                    Selected: {state.baseName}
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            {!state.zipCode && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg border border-dashed border-slate-300">
                                    <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                        <Info size={16} /> Enter Zip Code to unlock pricing
                                    </div>
                                </div>
                            )}
                            
                            <div className="overflow-x-auto pb-2">
                                <div className="min-w-[300px]">
                                    {/* Grid Header */}
                                    <div className="grid grid-cols-4 gap-2 mb-2 text-xs font-semibold text-slate-500 text-center uppercase tracking-wider">
                                        <div className="text-left pl-2">Material</div>
                                        {CONFIG.glassTypes.map((g, i) => <div key={i}>{g.name}</div>)}
                                    </div>
                                    
                                    {/* Grid Rows */}
                                    <div className="space-y-2">
                                        {CONFIG.frameMaterials.map((frame, frameIdx) => {
                                            const rowPrices = currentPrices[frameIdx];
                                            const minPrice = Math.min(...rowPrices);
                                            const maxPrice = Math.max(...rowPrices);

                                            return (
                                                <div key={frame} className="grid grid-cols-4 gap-2 items-stretch">
                                                    <div className="text-xs font-bold text-slate-700 flex items-center pl-2">{frame}</div>
                                                    {rowPrices.map((price, glassIdx) => {
                                                        const isSelected = state.selectedFrameIndex === frameIdx && state.selectedGlassIndex === glassIdx;
                                                        const heatColor = getHeatmapColor(price, minPrice, maxPrice);
                                                        
                                                        return (
                                                            <button
                                                                key={`${frameIdx}-${glassIdx}`}
                                                                onClick={() => handleSelectCell(frameIdx, glassIdx, price, frame, CONFIG.glassTypes[glassIdx].name)}
                                                                className={`
                                                                    relative py-3 px-1 rounded-lg text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border
                                                                    ${isSelected
                                                                        ? 'border-blue-600 shadow-md scale-[1.05] z-10'
                                                                        : 'border-transparent hover:border-slate-300 hover:scale-[1.02] z-0'
                                                                    }
                                                                `}
                                                                style={{
                                                                    backgroundColor: isSelected ? '#2563EB' : heatColor,
                                                                    color: isSelected ? 'white' : '#0f172a',
                                                                }}
                                                            >
                                                                <span className="font-bold">
                                                                    {state.isUnlocked ? formatCurrency(price) : '$' + Math.round(price/100) + '00'}
                                                                </span>
                                                                <span className="text-[10px] opacity-70">
                                                                    /unit
                                                                </span>
                                                                {isSelected && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* CENTER COLUMN: BUILDER CONFIG (4 cols) */}
                <div className="lg:col-span-4">
                        <section className={`bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-6 h-full shadow-lg transition-opacity duration-300 ${state.basePrice === 0 ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">3</div>
                            <h2 className="text-lg font-bold text-slate-900">Customize Item</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel label="Style" tooltip="Operation type affects price." />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        value={styleValue} onChange={e => setStyleValue(Number(e.target.value))}
                                    >
                                        {styleOptions.map(opt => <option key={opt.key} value={opt.mult}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <FieldLabel label="Size" tooltip="Larger openings cost more." />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        value={sizeValue} onChange={e => setSizeValue(Number(e.target.value))}
                                    >
                                        {sizeOptions.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <FieldLabel label="Frame Color" tooltip="Standard white is cheapest." />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        value={colorValue} onChange={e => setColorValue(Number(e.target.value))}
                                    >
                                        {COLOR_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <FieldLabel label="Grids" tooltip="Decorative bars between glass." />
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        value={gridValue} onChange={e => setGridValue(Number(e.target.value))}
                                    >
                                        {GRID_OPTIONS.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <label className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" checked={finishUpgrade} onChange={e => setFinishUpgrade(e.target.checked)} />
                                    <div className="text-sm">
                                        <span className="font-semibold text-slate-900 group-hover:text-blue-700 block">Premium Finish (+$450)</span>
                                        <span className="text-slate-500 text-xs">Stucco patch, paint & interior trim.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" checked={contingencyFund} onChange={e => setContingencyFund(e.target.checked)} />
                                    <div className="text-sm">
                                        <span className="font-semibold text-slate-900 group-hover:text-blue-700 block">Wood Rot Fund (+$200)</span>
                                        <span className="text-slate-500 text-xs">Refundable if no damage found.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <div className="col-span-2">
                                    <FieldLabel label="Room Label" tooltip="E.g. Master Bedroom" />
                                    <input
                                        type="text"
                                        placeholder="e.g. Living Room"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        value={roomName} onChange={e => setRoomName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <FieldLabel label="Qty" tooltip="Number of identical items" />
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={addToCart}
                                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span>Add to Estimate</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                        </section>
                </div>

                {/* RIGHT COLUMN: CART / TRUST REPORT (3 cols) */}
                <div className="lg:col-span-3">
                    <div className="sticky top-24 space-y-6">
                        <section className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl shadow-lg border border-slate-300 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
                                <h2 className="text-slate-700 font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                                    <Shield size={16} className="text-blue-600" />
                                    Trust Report
                                </h2>
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">{cart.length} Items</span>
                            </div>
                            
                            <div className="p-0">
                                {cart.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                                            <Info size={24} className="opacity-50" />
                                        </div>
                                        <p className="text-sm">Your estimate is empty.</p>
                                        <p className="text-xs mt-1">Configure items to see costs.</p>
                                    </div>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {cart.map((item) => (
                                            <div key={item.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group relative">
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-800 text-sm truncate pr-4">{item.name}</span>
                                                    <span className="font-mono text-sm text-blue-600 font-medium">
                                                        {state.isUnlocked ? formatCurrency(item.total) : '$-,--'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 mb-1">{item.desc}</div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider">
                                                    <span>Qty: {item.qty}</span>
                                                    <span>•</span>
                                                    <span>{item.details.split(',')[0]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-3">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Materials & Labor</span>
                                    <span>{state.isUnlocked ? formatCurrency(subtotal) : '$-,--'}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span className="flex items-center gap-1">Permits (~2%) <Info size={10} /></span>
                                    <span>{state.isUnlocked ? formatCurrency(permitFee) : '$-,--'}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-600">Total Estimate</span>
                                    <span className={`text-xl font-bold ${state.isUnlocked ? 'text-blue-600' : 'text-slate-400 blur-[4px]'}`}>
                                        {formatCurrency(grandTotal)}
                                    </span>
                                </div>
                                
                                {!state.isUnlocked ? (
                                    <button
                                        onClick={startGeneration}
                                        disabled={cart.length === 0}
                                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-lg shadow-md transition-all text-sm mt-2"
                                    >
                                        Unlock Price & Save
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <button className="flex items-center justify-center gap-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded text-xs shadow-sm transition-colors">
                                            <Phone size={12} /> Call Now
                                        </button>
                                        <button className="flex items-center justify-center gap-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs shadow-sm transition-colors">
                                            <Calendar size={12} /> Book Site Visit
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* AI Tools */}
                        <div className="bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50 rounded-xl border border-slate-300 p-4 shadow-lg">
                            <h3 className="text-slate-800 font-bold text-sm mb-3 flex items-center gap-2">
                                <span><Sparkles className="w-4 h-4 text-blue-600" /></span>
                                AI Assistant ✨
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleAiAction("analyze")}
                                    className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
                                >
                                    <Sparkles size={12} /> Analyze Quote {state.isUnlocked ? '' : '🔒'}
                                </button>
                                <button
                                    onClick={() => handleAiAction("email")}
                                    className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
                                >
                                    <Mail size={12} /> Draft Email {state.isUnlocked ? '' : '🔒'}
                                </button>
                                <button
                                    onClick={() => handleAiAction("script")}
                                    className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
                                >
                                    <MessageSquare size={12} /> Gotcha Script {state.isUnlocked ? '' : '🔒'}
                                </button>
                                <button
                                    onClick={() => handleAiAction("roi")}
                                    className={`px-3 py-2 rounded text-xs font-semibold text-center transition-all border flex items-center justify-center gap-1 ${state.isUnlocked ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
                                >
                                    <TrendingUp size={12} /> ROI Projector {state.isUnlocked ? '' : '🔒'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default function CalculateEstimate() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Back navigation */}
      <div className="container px-4 py-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Tools</span>
        </Link>
      </div>

      {/* Main Quote Builder */}
      <QuoteBuilderV2 />

      {/* CRO Supporting Sections */}
      <WhyAccurateEstimates />
      <HowItWorks />
      <WhoIsThisFor />
      <RelatedToolsSection />
    </div>
  );
}
