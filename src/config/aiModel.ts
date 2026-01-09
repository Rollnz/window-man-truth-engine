/**
 * AI Model Configuration
 * 
 * Single source of truth for AI model settings across the frontend.
 * Backend edge functions use Deno.env.get('AI_MODEL_VERSION') with this as fallback.
 * 
 * To change the AI model:
 * 1. Update this file for frontend display
 * 2. Update the AI_MODEL_VERSION secret in Supabase for backend
 */

export const AI_MODEL_CONFIG = {
  /** Full model identifier used in API calls */
  modelId: 'google/gemini-3-flash-preview',
  
  /** Short display name for UI (e.g., footers, badges) */
  displayName: 'GEMINI-3-FLASH',
  
  /** Human-readable description */
  description: 'Google Gemini 3 Flash Preview',
  
  /** Last updated date */
  lastUpdated: '2025-01-09',
} as const;

/** Default fallback model ID (used in edge functions if secret is missing) */
export const DEFAULT_MODEL_ID = AI_MODEL_CONFIG.modelId;

/** Type for the config object */
export type AIModelConfig = typeof AI_MODEL_CONFIG;
