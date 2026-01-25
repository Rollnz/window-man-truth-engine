/**
 * ScannerUpload - Canonical dataLayer event for AI Quote Scanner analysis start
 * 
 * This event fires ONCE per scan attempt when analysis begins (not on file select).
 * The event_id is generated browser-side for Meta CAPI deduplication via Stape/sGTM.
 */

// Anti-double-fire guard: track which scan attempts have fired
let lastFiredScanId: string | null = null;

export interface ScannerUploadParams {
  /** Unique ID for this scan attempt (prevents duplicate fires from re-renders) */
  scanAttemptId: string;
  /** Optional quote amount from the document (will be sanitized to numeric) */
  quoteAmount?: string | number;
  /** Source tool identifier, e.g. "quote-scanner" */
  sourceTool?: string;
  /** Optional file name */
  fileName?: string;
  /** Optional file size in bytes */
  fileSize?: number;
  /** Optional file type/MIME */
  fileType?: string;
  /** Optional lead ID if known */
  leadId?: string;
  /** Optional session ID */
  sessionId?: string;
}

/**
 * Sanitize quote amount to a numeric value
 * Strips $, commas, spaces, and other non-numeric characters except decimal point
 */
function sanitizeAmount(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  
  if (typeof value === 'number') {
    return isNaN(value) ? undefined : value;
  }
  
  // Strip $, commas, spaces, and keep only digits and decimal
  const cleaned = String(value).replace(/[$,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Push ScannerUpload event to dataLayer
 * 
 * DEDUPLICATION: Uses scanAttemptId to prevent duplicate fires from:
 * - React re-renders
 * - Multiple calls within same scan attempt
 * 
 * @returns The event_id used, or null if deduplicated (already fired)
 */
export function trackScannerUpload(params: ScannerUploadParams): string | null {
  const {
    scanAttemptId,
    quoteAmount,
    sourceTool = 'quote-scanner',
    fileName,
    fileSize,
    fileType,
    leadId,
    sessionId,
  } = params;

  // Anti-double-fire guard: only fire once per scan attempt
  if (lastFiredScanId === scanAttemptId) {
    console.debug('[ScannerUpload] Deduplicated - already fired for scanAttemptId:', scanAttemptId);
    return null;
  }

  // Generate browser-side event_id for Meta CAPI deduplication
  const eventId = crypto.randomUUID();
  
  // Sanitize amount to numeric
  const value = sanitizeAmount(quoteAmount);

  // Build dataLayer payload with EXACT required keys
  const payload = {
    event: 'ScannerUpload',
    event_id: eventId,
    value: value,
    currency: 'USD',
    source_tool: sourceTool,
    page_path: window.location.pathname,
    page_url: window.location.href,
    debug_id: eventId, // Same as event_id for traceability
    // Additional context (optional, for debugging/enrichment)
    file_name: fileName,
    file_size: fileSize,
    file_type: fileType,
    lead_id: leadId,
    session_id: sessionId,
  };

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  
  // Push to dataLayer
  window.dataLayer.push(payload);

  // Mark this scan attempt as fired
  lastFiredScanId = scanAttemptId;

  console.debug('[ScannerUpload] Fired:', {
    event_id: eventId,
    value,
    source_tool: sourceTool,
    scanAttemptId,
  });

  return eventId;
}

/**
 * Reset the dedupe guard (useful for testing or forcing a new scan)
 */
export function resetScannerUploadGuard(): void {
  lastFiredScanId = null;
}

// Augment Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
