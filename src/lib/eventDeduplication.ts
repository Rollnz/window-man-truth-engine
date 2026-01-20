/**
 * Event Deduplication Utility - Phase 2: Semantic Session Dedupe
 * 
 * SCOPE: Session-scope dedupe for tool cv events ONLY
 * cv_qualified_lead is deduped server-side (Phase 1A) - NOT here
 * 
 * Uses SEMANTIC keys instead of random UUIDs:
 * Key format: ${event}:${lead_id}:${tool_id}:${step_id}:${tab_session_id}
 * 
 * This prevents double-firing due to:
 * - React re-renders
 * - Double-clicks
 * - Tab refreshes within the same session
 * 
 * NOTE: This does NOT prevent cross-device or cross-browser duplicates
 * for qualified_lead - that's handled server-side.
 */

const DEDUPE_PREFIX = 'cv_dedupe_';
const MAX_STORED_EVENTS = 200; // Cap to prevent storage bloat
const TTL_MS = 120 * 60 * 1000; // 120 minutes

// Generate a stable tab session ID that persists for this tab's lifetime
let _tabSessionId: string | null = null;

function getTabSessionId(): string {
  if (_tabSessionId) return _tabSessionId;
  
  try {
    // Check if we already have one for this tab
    const existing = sessionStorage.getItem('wte_tab_session_id');
    if (existing) {
      _tabSessionId = existing;
      return existing;
    }
    
    // Generate new tab session ID
    const newId = crypto.randomUUID().slice(0, 8);
    sessionStorage.setItem('wte_tab_session_id', newId);
    _tabSessionId = newId;
    return newId;
  } catch {
    // Fallback if sessionStorage fails
    _tabSessionId = Math.random().toString(36).slice(2, 10);
    return _tabSessionId;
  }
}

/**
 * Events that should NEVER be deduped client-side
 * These are either server-gated or need special handling
 */
const SERVER_DEDUPED_EVENTS = new Set([
  'cv_qualified_lead',
  'qualified_lead',
  'cv_lead_captured', // Can fire from multiple forms
]);

/**
 * Create a semantic dedupe key for tool events
 * 
 * @param eventName - The event name (e.g., 'cv_tool_completed_quote_scanner')
 * @param options - Additional context for semantic key
 */
export function createSemanticDedupeKey(
  eventName: string,
  options: {
    leadId?: string;
    toolId?: string;
    stepId?: string;
  } = {}
): string {
  const tabSessionId = getTabSessionId();
  const leadId = options.leadId || 'anon';
  const toolId = options.toolId || 'default';
  const stepId = options.stepId || 'complete';
  
  return `${eventName}:${leadId}:${toolId}:${stepId}:${tabSessionId}`;
}

/**
 * Check if an event should be blocked (duplicate) or allowed
 * Uses semantic keys for meaningful deduplication
 * 
 * @param eventName - The event name to check
 * @param options - Context for semantic key generation
 * @returns true if duplicate (should block), false if new event (allow)
 */
export function isSemanticDuplicate(
  eventName: string,
  options: {
    leadId?: string;
    toolId?: string;
    stepId?: string;
  } = {}
): boolean {
  // Never dedupe server-gated events client-side
  if (SERVER_DEDUPED_EVENTS.has(eventName)) {
    return false; // Always allow - server handles dedupe
  }
  
  const semanticKey = createSemanticDedupeKey(eventName, options);
  const storageKey = `${DEDUPE_PREFIX}${semanticKey}`;
  
  try {
    const existing = sessionStorage.getItem(storageKey);
    
    if (existing) {
      // Check TTL
      const timestamp = parseInt(existing, 10);
      if (Date.now() - timestamp < TTL_MS) {
        return true; // Duplicate - still within TTL
      }
      // TTL expired - allow and update
    }
    
    // Mark as seen
    sessionStorage.setItem(storageKey, Date.now().toString());
    
    // Cleanup old entries
    cleanupOldEntries();
    
    return false; // New event - allow
  } catch {
    // If sessionStorage fails, allow the event (fail-open for data capture)
    return false;
  }
}

/**
 * Legacy function - generates random UUID
 * @deprecated Use createSemanticDedupeKey for semantic keys
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Legacy function - checks UUID-based dedupe
 * @deprecated Use isSemanticDuplicate for semantic dedupe
 */
export function isDuplicateEvent(eventId: string): boolean {
  const key = `${DEDUPE_PREFIX}${eventId}`;
  
  try {
    if (sessionStorage.getItem(key)) {
      return true;
    }
    
    sessionStorage.setItem(key, Date.now().toString());
    cleanupOldEntries();
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if a tool event has already been tracked this session
 * Uses semantic keys for meaningful deduplication
 */
export function isToolEventTracked(toolId: string, action: string = 'completed'): boolean {
  return isSemanticDuplicate(`cv_tool_${action}`, { toolId });
}

/**
 * Mark a tool event as tracked
 */
export function markToolEventTracked(toolId: string, action: string = 'completed'): void {
  const semanticKey = createSemanticDedupeKey(`cv_tool_${action}`, { toolId });
  const storageKey = `${DEDUPE_PREFIX}${semanticKey}`;
  
  try {
    sessionStorage.setItem(storageKey, Date.now().toString());
  } catch {
    // Silently fail
  }
}

/**
 * Create a composite event ID for tool-based deduplication
 * @deprecated Use createSemanticDedupeKey instead
 */
export function createToolEventId(toolId: string, action: string = 'completed'): string {
  return createSemanticDedupeKey(`tool_${action}`, { toolId });
}

/**
 * Cleanup old dedupe entries to prevent storage bloat
 * Removes entries over TTL or if count exceeds MAX
 */
function cleanupOldEntries(): void {
  try {
    const entries: { key: string; timestamp: number }[] = [];
    const now = Date.now();
    
    // Collect all dedupe keys with timestamps
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(DEDUPE_PREFIX)) {
        const value = sessionStorage.getItem(key);
        const timestamp = value ? parseInt(value, 10) : 0;
        
        // Remove expired entries immediately
        if (now - timestamp > TTL_MS) {
          sessionStorage.removeItem(key);
        } else {
          entries.push({ key, timestamp });
        }
      }
    }
    
    // If still over limit, remove oldest entries
    if (entries.length > MAX_STORED_EVENTS) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_STORED_EVENTS);
      toRemove.forEach(({ key }) => sessionStorage.removeItem(key));
    }
  } catch {
    // Silently fail
  }
}
