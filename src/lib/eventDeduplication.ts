/**
 * Event Deduplication Utility
 * 
 * Prevents double-firing of conversion events due to:
 * - React re-renders
 * - Double-clicks
 * - Route transitions
 * - Network retries
 * 
 * Uses sessionStorage with UUID-based event IDs to ensure
 * each conversion event fires exactly once per session.
 */

const DEDUPE_PREFIX = 'cv_dedupe_';
const MAX_STORED_EVENTS = 100; // Prevent storage bloat

/**
 * Generate a unique event ID for deduplication
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Check if an event has already been fired this session
 * If not, mark it as fired and return false (allowing the event)
 * If yes, return true (blocking the duplicate)
 * 
 * @param eventId - Unique identifier for this specific event
 * @returns true if this is a duplicate (should be blocked), false if new event
 */
export function isDuplicateEvent(eventId: string): boolean {
  const key = `${DEDUPE_PREFIX}${eventId}`;
  
  try {
    // Check if already fired
    if (sessionStorage.getItem(key)) {
      return true; // Duplicate - block this event
    }
    
    // Mark as fired
    sessionStorage.setItem(key, Date.now().toString());
    
    // Cleanup old entries to prevent storage bloat
    cleanupOldEvents();
    
    return false; // New event - allow
  } catch {
    // If sessionStorage fails, allow the event (fail-open for data capture)
    return false;
  }
}

/**
 * Create a composite event ID for tool-based deduplication
 * Ensures same tool completion doesn't fire twice per session
 * 
 * @param toolId - The tool identifier
 * @param action - The action type (e.g., 'completed', 'started')
 */
export function createToolEventId(toolId: string, action: string = 'completed'): string {
  return `${toolId}_${action}_${sessionStorage.getItem('wm_session_id') || 'anon'}`;
}

/**
 * Check if a tool event has already been tracked this session
 */
export function isToolEventTracked(toolId: string, action: string = 'completed'): boolean {
  const eventId = createToolEventId(toolId, action);
  const key = `${DEDUPE_PREFIX}${eventId}`;
  
  try {
    return !!sessionStorage.getItem(key);
  } catch {
    return false;
  }
}

/**
 * Mark a tool event as tracked
 */
export function markToolEventTracked(toolId: string, action: string = 'completed'): void {
  const eventId = createToolEventId(toolId, action);
  const key = `${DEDUPE_PREFIX}${eventId}`;
  
  try {
    sessionStorage.setItem(key, Date.now().toString());
  } catch {
    // Silently fail
  }
}

/**
 * Cleanup old dedupe entries to prevent storage bloat
 */
function cleanupOldEvents(): void {
  try {
    const keys: string[] = [];
    
    // Collect all dedupe keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(DEDUPE_PREFIX)) {
        keys.push(key);
      }
    }
    
    // If over limit, remove oldest entries
    if (keys.length > MAX_STORED_EVENTS) {
      const toRemove = keys.slice(0, keys.length - MAX_STORED_EVENTS);
      toRemove.forEach(key => sessionStorage.removeItem(key));
    }
  } catch {
    // Silently fail
  }
}
