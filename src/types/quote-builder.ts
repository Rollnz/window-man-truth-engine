// ============================================
// Quote Builder - Centralized Type Definitions
// ============================================

export interface CartItem {
  id: number;
  productType: "window" | "slider" | "french";
  name: string;
  desc: string;
  details: string;
  qty: number;
  unit: number;
  total: number;
}

export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
}

export interface QuoteBuilderState {
  productType: "window" | "slider" | "french";
  zipCode: string;
  wallType: number;
  basePrice: number;
  baseName: string;
  selectedFrameIndex: number;
  selectedGlassIndex: number;
  isUnlocked: boolean;
  isLeadSubmitted: boolean;
}

export interface GlassType {
  name: string;
  desc: string;
}

export interface ConfigPrices {
  window: number[][];
  slider: number[][];
  french: number[][];
}

export interface QuoteBuilderConfig {
  glassTypes: GlassType[];
  frameMaterials: string[];
  prices: ConfigPrices;
}

export interface WallOption {
  value: number;
  label: string;
}

export interface ColorOption {
  value: number;
  label: string;
}

export interface GridOption {
  value: number;
  label: string;
}

export interface FloorOption {
  value: number;
  label: string;
}

export interface StyleOption {
  key: string;
  label: string;
  mult: number;
}

export interface SizeOption {
  val: number;
  label: string;
}

export interface ProductTypeConfig {
  label: string;
}

export type ProductType = "window" | "slider" | "french";

export interface QuickBuildItem {
  productType: ProductType;
  qty?: number;
  name: string;
  desc: string;
}

export interface TheaterModeProps {
  isActive: boolean;
  message: string;
  subtext: string;
}

export interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => void;
  isSubmitting: boolean;
}

export interface AiResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
}

export interface FieldLabelProps {
  label: string;
  tooltip: string;
}

// Hook return types
export interface UseQuoteBuilderReturn {
  // State
  state: QuoteBuilderState;
  cart: CartItem[];
  permitPercent: number;

  // Form values
  styleValue: number;
  sizeValue: number;
  colorValue: number;
  gridValue: number;
  floorValue: number;
  finishUpgrade: boolean;
  contingencyFund: boolean;
  roomName: string;
  quantity: number;

  // Modal states
  showTheater: boolean;
  theaterMessage: string;
  theaterSubtext: string;
  showModal: boolean;
  isSubmitting: boolean;

  // AI state
  aiModalOpen: boolean;
  aiTitle: string;
  aiContent: string;
  aiLoading: boolean;
  aiInputText: string;
  isAiBuilding: boolean;

  // Derived values
  currentPrices: number[][];
  styleOptions: StyleOption[];
  sizeOptions: SizeOption[];
  subtotal: number;
  permitFee: number;
  grandTotal: number;

  // Form setters
  setStyleValue: (v: number) => void;
  setSizeValue: (v: number) => void;
  setColorValue: (v: number) => void;
  setGridValue: (v: number) => void;
  setFinishUpgrade: (v: boolean) => void;
  setContingencyFund: (v: boolean) => void;
  setRoomName: (v: string) => void;
  setQuantity: (v: number) => void;
  setAiInputText: (v: string) => void;

  // State setters
  setState: React.Dispatch<React.SetStateAction<QuoteBuilderState>>;
  setShowModal: (v: boolean) => void;
  setAiModalOpen: (v: boolean) => void;

  // Actions
  handleQuickBuild: () => Promise<void>;
  handleAiAction: (action: string) => Promise<void>;
  handleSelectCell: (frameIdx: number, glassIdx: number, price: number, frameName: string, glassName: string) => void;
  addToCart: () => void;
  removeFromCart: (id: number) => void;
  startGeneration: () => Promise<void>;
  handleLeadSubmit: (data: LeadFormData) => Promise<void>;
}
