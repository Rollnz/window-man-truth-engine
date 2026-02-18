/**
 * Lead Scoring Analytics Engine
 * 
 * Manages cumulative engagement scoring and fires threshold events
 * to ad platforms (Google/Meta) for value-based bidding optimization.
 */

import { wmInternal } from '@/lib/wmTracking';

const SCORE_STORAGE_KEY = 'wte-engagement-score';
const HIGH_INTENT_THRESHOLD = 100;
const QUALIFIED_THRESHOLD = 150;

interface EngagementState {
  totalScore: number;
  events: { action: string; points: number; timestamp: number }[];
  highIntentFired: boolean;
  qualifiedFired: boolean;
}

/**
 * Action score constants for consistency across the app
 */
export const ENGAGEMENT_SCORES = {
  // Passive signals
  TIME_ON_SITE_2MIN: 10,
  SCROLL_DEPTH_75: 5,
  
  // Tool interactions (base scores - tools have their own engagementScore)
  TOOL_CLICK: 15,
  TOOL_COMPLETED: 30,
  
  // High-value actions
  QUOTE_UPLOADED: 50,
  CONSULTATION_PAGE: 75,
  VAULT_PAGE: 100,
  LEAD_CAPTURED: 100,
} as const;

/**
 * Get current engagement state from sessionStorage
 */
function getState(): EngagementState {
  try {
    const stored = sessionStorage.getItem(SCORE_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return { totalScore: 0, events: [], highIntentFired: false, qualifiedFired: false };
}

/**
 * Save engagement state to sessionStorage
 */
function setState(state: EngagementState): void {
  try {
    sessionStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Track engagement event and update cumulative score
 * 
 * @param action - Description of the action (e.g., "tool_click", "scroll_75")
 * @param points - Points to award
 * @param toolId - Optional tool ID for context
 */
export function trackEngagement(
  action: string,
  points: number,
  toolId?: string
): void {
  const state = getState();
  const newScore = state.totalScore + points;
  
  // Update state
  state.totalScore = newScore;
  state.events.push({
    action,
    points,
    timestamp: Date.now(),
  });
  
  // 1️⃣ Push to GTM DataLayer (internal scoring only — not sent to ad platforms)
  wmInternal('engagement_score', {
    action,
    score_delta: points,
    total_score: newScore,
    tool_id: toolId,
  });
  
  // 2️⃣ Fire High-Intent threshold event (100+ points)
  if (newScore >= HIGH_INTENT_THRESHOLD && !state.highIntentFired) {
    state.highIntentFired = true;
    wmInternal('HighIntentUser', {
      total_score: newScore,
      events_count: state.events.length,
    });
    console.log('🎯 HIGH INTENT USER DETECTED:', newScore);
  }
  
  // 3️⃣ Fire Qualified threshold event (150+ points)
  if (newScore >= QUALIFIED_THRESHOLD && !state.qualifiedFired) {
    state.qualifiedFired = true;
    wmInternal('QualifiedProspect', {
      total_score: newScore,
      events_count: state.events.length,
    });
    console.log('🏆 QUALIFIED PROSPECT:', newScore);
  }
  
  setState(state);
}

/**
 * Get current engagement score
 */
export function getEngagementScore(): number {
  return getState().totalScore;
}

/**
 * Get full engagement state (for debugging/display)
 */
export function getEngagementState(): EngagementState {
  return getState();
}

/**
 * Reset engagement tracking (e.g., on session clear)
 */
export function resetEngagement(): void {
  try {
    sessionStorage.removeItem(SCORE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
