/**
 * Stage SLA Configuration
 * 
 * Defines time thresholds for lead velocity tracking.
 * Speed-to-lead is critical in home services - these thresholds
 * trigger visual alerts when leads are going stale.
 */

import type { LeadStatus } from '@/types/crm';

export interface StageSLAConfig {
  /** Minutes before lead is considered "warm" (yellow warning) */
  warningMinutes: number;
  /** Minutes before lead is considered "stale" (red alert) */
  staleMinutes: number;
  /** Display name for the stage */
  label: string;
}

/**
 * SLA thresholds per stage - tuned for window replacement industry
 * 
 * Philosophy:
 * - "New" leads should be touched within 30 min (industry research shows 5-10x conversion drop after 30 min)
 * - "Qualified" leads are ready for appointment - 4 hour max before they shop elsewhere
 * - Post-appointment stages have longer windows
 */
export const STAGE_SLA_CONFIG: Record<LeadStatus, StageSLAConfig> = {
  new: {
    warningMinutes: 15,
    staleMinutes: 30,
    label: 'New',
  },
  qualifying: {
    warningMinutes: 60,
    staleMinutes: 120, // 2 hours
    label: 'Qualifying',
  },
  mql: {
    warningMinutes: 120, // 2 hours
    staleMinutes: 240, // 4 hours
    label: 'MQL',
  },
  qualified: {
    warningMinutes: 120, // 2 hours
    staleMinutes: 240, // 4 hours - critical stage!
    label: 'Qualified',
  },
  appointment_set: {
    warningMinutes: 1440, // 24 hours
    staleMinutes: 2880, // 48 hours
    label: 'Appointment Set',
  },
  sat: {
    warningMinutes: 1440, // 24 hours
    staleMinutes: 4320, // 72 hours
    label: 'SAT',
  },
  closed_won: {
    warningMinutes: Infinity, // No SLA for closed stages
    staleMinutes: Infinity,
    label: 'Closed Won',
  },
  closed_lost: {
    warningMinutes: Infinity,
    staleMinutes: Infinity,
    label: 'Closed Lost',
  },
  dead: {
    warningMinutes: Infinity,
    staleMinutes: Infinity,
    label: 'Dead',
  },
};

/**
 * Velocity status based on time in stage
 */
export type VelocityStatus = 'hot' | 'warm' | 'stale' | 'cold';

/**
 * Calculate velocity status based on time in current stage
 * 
 * @param status - Current lead status
 * @param stageEnteredAt - When lead entered this stage (usually updated_at)
 * @returns Velocity status for display
 */
export function getVelocityStatus(
  status: LeadStatus,
  stageEnteredAt: Date | string
): VelocityStatus {
  const config = STAGE_SLA_CONFIG[status];
  
  // Terminal stages have no velocity
  if (config.staleMinutes === Infinity) {
    return 'cold';
  }
  
  const enteredTime = new Date(stageEnteredAt).getTime();
  const now = Date.now();
  const minutesInStage = (now - enteredTime) / (1000 * 60);
  
  if (minutesInStage < config.warningMinutes) {
    return 'hot'; // Fresh, no action needed
  } else if (minutesInStage < config.staleMinutes) {
    return 'warm'; // Warning - should act soon
  } else {
    return 'stale'; // Critical - needs immediate attention
  }
}

/**
 * Get human-readable time in stage
 */
export function getTimeInStage(stageEnteredAt: Date | string): string {
  const enteredTime = new Date(stageEnteredAt).getTime();
  const now = Date.now();
  const minutesInStage = Math.floor((now - enteredTime) / (1000 * 60));
  
  if (minutesInStage < 60) {
    return `${minutesInStage}m`;
  } else if (minutesInStage < 1440) {
    const hours = Math.floor(minutesInStage / 60);
    return `${hours}h`;
  } else {
    const days = Math.floor(minutesInStage / 1440);
    return `${days}d`;
  }
}
