// ============================================
// Quote Builder - Constants & Static Data
// ============================================

import type {
  QuoteBuilderConfig,
  WallOption,
  ColorOption,
  GridOption,
  FloorOption,
  StyleOption,
  SizeOption,
  ProductTypeConfig,
} from '@/types/quote-builder';

// --- WALL OPTIONS ---
export const WALL_OPTIONS: WallOption[] = [
  { value: 0, label: 'Concrete Block (CBS)' },
  { value: 50, label: 'Wood Frame (+$50/op)' },
];

// --- COLOR OPTIONS ---
export const COLOR_OPTIONS: ColorOption[] = [
  { value: 1.0, label: 'White (Standard)' },
  { value: 1.15, label: 'Bronze (+15%)' },
  { value: 1.15, label: 'Black (+15%)' },
];

// --- GRID OPTIONS ---
export const GRID_OPTIONS: GridOption[] = [
  { value: 1.0, label: 'No Grids' },
  { value: 1.08, label: 'Colonial (+8%)' },
  { value: 1.15, label: 'Brittany (+15%)' },
];

// --- FLOOR OPTIONS ---
export const FLOOR_OPTIONS: FloorOption[] = [
  { value: 0, label: '1st Floor' },
  { value: 75, label: '2nd Floor (+$75)' },
  { value: 150, label: '3rd Floor+ (+$150)' },
];

// --- MAIN CONFIG ---
export const CONFIG: QuoteBuilderConfig = {
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

// --- PRODUCT TYPE CONFIG ---
export const PRODUCT_TYPE_CONFIG: Record<string, ProductTypeConfig> = {
  window: { label: "Impact Window" },
  slider: { label: "Sliding Glass Door" },
  french: { label: "French Door" }
};

// --- STYLE OPTIONS ---
export const STYLE_OPTIONS: { window: StyleOption[]; door: StyleOption[] } = {
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

// --- SIZE OPTIONS ---
export const SIZE_OPTIONS: { window: SizeOption[]; door: SizeOption[] } = {
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

/**
 * Formats a number as a USD currency string with no decimal places.
 */
export const formatCurrency = (val: number): string =>
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(val);

/**
 * Returns an HSL background color on a green heatmap scale for a given price.
 * Lower prices are lighter, higher prices are darker.
 */
export const getHeatmapColor = (price: number, min: number, max: number): string => {
  if (min === max) return 'hsl(142, 70%, 90%)';
  const ratio = (price - min) / (max - min);
  const lightness = 95 - (ratio * 55);
  return `hsla(142, 70%, ${lightness}%, 1)`;
};

// --- DEFAULT PRICES (for AI Quick Build) ---
export const DEFAULT_PRICES = {
  window: CONFIG.prices.window[0][0],
  slider: CONFIG.prices.slider[0][0],
  french: CONFIG.prices.french[0][0],
};
