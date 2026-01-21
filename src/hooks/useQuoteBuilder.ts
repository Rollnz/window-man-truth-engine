// ============================================
// Quote Builder - Custom Hook (State Management)
// ============================================

import { useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/config/navigation";
import { getAttributionData } from "@/lib/attribution";
import { trackLeadCapture, trackLeadSubmissionSuccess } from "@/lib/gtm";
import { getLeadQuality } from "@/lib/leadQuality";
import { RateLimitError } from "@/lib/errors";
import { callGemini } from "@/utils/geminiHelper";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { useSessionData } from "@/hooks/useSessionData";
import { useTrackToolCompletion } from "@/hooks/useTrackToolCompletion";
import { 
  CONFIG, STYLE_OPTIONS, SIZE_OPTIONS, PRODUCT_TYPE_CONFIG, 
  formatCurrency, DEFAULT_PRICES 
} from "@/utils/quoteCalculatorConstants";
import type { 
  CartItem, QuoteBuilderState, LeadFormData, QuickBuildItem,
  UseQuoteBuilderReturn 
} from "@/types/quote-builder";
import type { SourceTool } from "@/types/sourceTool";

export function useQuoteBuilder(): UseQuoteBuilderReturn {
  // Golden Thread: Get and persist leadId and sessionId
  const { leadId: hookLeadId, setLeadId } = useLeadIdentity();
  const { updateField, sessionId } = useSessionData();
  const { trackToolComplete } = useTrackToolCompletion();

  const [state, setState] = useState<QuoteBuilderState>({
    productType: "window",
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
  
  const [styleValue, setStyleValue] = useState(1.0);
  const [sizeValue, setSizeValue] = useState(1.0);
  const [colorValue, setColorValue] = useState(1.0);
  const [gridValue, setGridValue] = useState(1.0);
  const [floorValue] = useState(0);
  const [finishUpgrade, setFinishUpgrade] = useState(false);
  const [contingencyFund, setContingencyFund] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [showTheater, setShowTheater] = useState(false);
  const [theaterMessage, setTheaterMessage] = useState("");
  const [theaterSubtext, setTheaterSubtext] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [isAiBuilding, setIsAiBuilding] = useState(false);

  const currentPrices = CONFIG.prices[state.productType];
  const styleOptions = state.productType === "window" ? STYLE_OPTIONS.window : STYLE_OPTIONS.door;
  const sizeOptions = state.productType === "window" ? SIZE_OPTIONS.window : SIZE_OPTIONS.door;

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const permitFee = subtotal * (permitPercent / 100);
  const grandTotal = subtotal + permitFee;

  const handleQuickBuild = async () => {
    if (!aiInputText.trim()) return;
    setIsAiBuilding(true);
    
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
      const result = await callGemini(prompt, { sessionId, leadId: hookLeadId });
      const jsonString = result.replace(/```json/g, '').replace(/```/g, '').trim();
      const items = JSON.parse(jsonString) as unknown;
      
      if (Array.isArray(items)) {
        const newCartItems = items.map((item: QuickBuildItem) => {
          let unitPrice = DEFAULT_PRICES.window;
          if (item.productType === 'slider') unitPrice = DEFAULT_PRICES.slider;
          if (item.productType === 'french') unitPrice = DEFAULT_PRICES.french;
          const qty = item.qty ?? 1;
          return {
            id: Date.now() + Math.random(),
            productType: item.productType,
            name: item.name,
            desc: item.desc,
            details: "Standard • Impact Glass",
            qty,
            unit: unitPrice,
            total: unitPrice * qty
          };
        });
        setCart(prev => [...prev, ...newCartItems]);
        toast.success(`✨ AI added ${newCartItems.length} items to your quote!`);
        setAiInputText("");
      }
    } catch (e) {
      if (e instanceof RateLimitError) {
        if (e.isAnonymous) {
          toast.error("🔒 You've used all 3 free estimates. Sign up to get 20/hour!", {
            duration: 6000,
            action: { label: "Sign Up", onClick: () => window.location.href = ROUTES.AUTH }
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

    const cartSummary = cart.map(i => `${i.qty}x ${i.name} (${i.details}) @ ${formatCurrency(i.unit)}/ea`).join(", ");
    const wallContext = state.wallType === 50 ? "Wood Frame Construction" : "Concrete Block (CBS)";
    let prompt = "";

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
      case "roi":
        setAiTitle("💰 ROI & Insurance Savings Projector");
        prompt = `Calculate ROI for ${formatCurrency(grandTotal)} window project in Florida Zip ${state.zipCode}. Estimate Insurance Savings, Energy Savings, and Home Value Increase over 5 years.`;
        break;
    }

    try {
      const result = await callGemini(prompt, { sessionId, leadId: hookLeadId });
      setAiContent(result);
    } catch {
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

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));

  const startGeneration = async () => {
    setShowTheater(true);
    setTheaterMessage("Analyzing Project Specs...");
    setTheaterSubtext("Checking wind load requirements...");
    setTimeout(() => {
      setShowTheater(false);
      setShowModal(true);
    }, 2000);
  };

  const handleLeadSubmit = async (data: LeadFormData) => {
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
            sourceTool: 'quote-builder' satisfies SourceTool,
            sessionData: { cartItems: cart.length, estimateTotal: grandTotal, zipCode: state.zipCode },
            chatHistory: [],
            attribution: getAttributionData(),
            aiContext: { source_form: 'quote-builder', window_count: cart.length },
            // Golden Thread: Pass existing leadId for identity persistence
            leadId: hookLeadId || undefined,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save lead');
      }
      const result = await response.json();
      if (result.success && result.leadId) {
        // Golden Thread: Persist leadId for future interactions
        setLeadId(result.leadId);
        updateField('leadId', result.leadId);

        // Track successful lead capture with full metadata (Phase 4)
        await trackLeadCapture(
          {
            leadId: result.leadId,
            sourceTool: 'quote_builder',
            conversionAction: 'form_submit',
          },
          data.email.trim(),
          data.phone?.trim(),
          {
            hasName: !!data.name.trim(),
            hasPhone: !!data.phone?.trim(),
            hasProjectDetails: cart.length > 0,
          }
        );

        // Push Enhanced Conversion event to dataLayer for GTM (Phase 1)
        const leadQuality = getLeadQuality({ windowCount: cart.length });
        await trackLeadSubmissionSuccess({
          leadId: result.leadId,
          email: data.email.trim(),
          phone: data.phone?.trim(),
          sourceTool: 'quote-builder',
          leadQuality,
          metadata: {
            windowCount: cart.length,
            quoteAmount: grandTotal,
          },
        });

        setShowModal(false);
        setState(prev => ({ ...prev, isUnlocked: true, isLeadSubmitted: true }));
        
        // Track tool completion with delta value for value-based bidding
        trackToolComplete('quote-builder', {
          items_count: cart.length,
          estimate_total: grandTotal,
        });
        
        toast.success("Quote Unlocked! Check your email for a copy.");
      } else {
        throw new Error(result.error || 'Unexpected error');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    state, cart, permitPercent,
    styleValue, sizeValue, colorValue, gridValue, floorValue,
    finishUpgrade, contingencyFund, roomName, quantity,
    showTheater, theaterMessage, theaterSubtext, showModal, isSubmitting,
    aiModalOpen, aiTitle, aiContent, aiLoading, aiInputText, isAiBuilding,
    currentPrices, styleOptions, sizeOptions, subtotal, permitFee, grandTotal,
    setStyleValue, setSizeValue, setColorValue, setGridValue,
    setFinishUpgrade, setContingencyFund, setRoomName, setQuantity, setAiInputText,
    setState, setShowModal, setAiModalOpen,
    handleQuickBuild, handleAiAction, handleSelectCell, addToCart, removeFromCart, startGeneration, handleLeadSubmit
  };
}
