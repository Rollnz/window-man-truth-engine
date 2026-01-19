/**
 * Type definitions for the unified tracking system.
 * 
 * Provides standardized interfaces for tool success callbacks
 * and completion metadata to ensure consistency across all tools.
 */

import type { SourceTool } from './sourceTool';

/**
 * Metadata that can be attached to any tool completion event.
 * All fields are optional - include what's relevant for the tool.
 */
export interface ToolCompletionMetadata {
  // Score/rating fields
  score?: number;
  grade?: string;
  
  // Quote/financial fields
  quote_amount?: number;
  estimate_total?: number;
  potential_savings?: number;
  
  // Resource fields (for downloads/unlocks)
  resource_id?: string;
  resource_type?: string;
  resource_title?: string;
  
  // Interaction fields
  turns?: number;
  duration_seconds?: number;
  items_count?: number;
  
  // Result fields
  won?: boolean;
  vulnerability_level?: string;
  urgency?: string;
  
  // Allow additional custom fields
  [key: string]: unknown;
}

/**
 * Standard callback interface for tool success events.
 */
export interface ToolSuccessCallback {
  toolId: SourceTool;
  onSuccess: (metadata?: ToolCompletionMetadata) => void;
}

/**
 * Configuration for a trackable tool event.
 */
export interface TrackableToolEvent {
  toolId: SourceTool;
  eventName: string;
  deltaValue: number;
  metadata?: ToolCompletionMetadata;
  email?: string;
  phone?: string;
}
