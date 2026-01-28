/**
 * Southeastern US states for EMQ 9.5+ address data collection
 * Used by guide modals (KitchenTable, SalesTactics, SpecChecklist)
 */

export const SOUTHEAST_STATES = [
  { value: 'FL', label: 'Florida' },       // Default - Primary market
  { value: 'GA', label: 'Georgia' },
  { value: 'AL', label: 'Alabama' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'TX', label: 'Texas' },         // Major hurricane market
  { value: 'PR', label: 'Puerto Rico' },   // High hurricane demand
] as const;

export const DEFAULT_STATE = 'FL';

export type StateCode = typeof SOUTHEAST_STATES[number]['value'];
