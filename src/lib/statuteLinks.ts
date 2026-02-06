// ═══════════════════════════════════════════════════════════════════════════
// FLORIDA STATUTE LINK UTILITIES
// Transforms statute citations into clickable verification links
// ═══════════════════════════════════════════════════════════════════════════

/** Map of common Florida Statutes to their official URLs */
const STATUTE_URL_MAP: Record<string, string> = {
  '489.119': 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0400-0499/0489/Sections/0489.119.html',
  '489.103': 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0400-0499/0489/Sections/0489.103.html',
  '489.126': 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0400-0499/0489/Sections/0489.126.html',
  '501.137': 'http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&Search_String=&URL=0500-0599/0501/Sections/0501.137.html',
};

/** Default fallback URL for Florida Statutes search */
const FLORIDA_STATUTES_BASE = 'http://www.leg.state.fl.us/statutes/';

/** Florida Building Code product approval search */
export const FLORIDA_BUILDING_URL = 'https://floridabuilding.org/pr/pr_search.aspx';

/** MyFloridaLicense contractor verification */
export const MY_FLORIDA_LICENSE_URL = 'https://www.myfloridalicense.com/wl11.asp';

/**
 * Extract statute number from citation text
 * @example "F.S. 489.119 - All contractors..." → "489.119"
 */
export function extractStatuteNumber(citation: string): string | null {
  // Match patterns like "F.S. 489.119", "FS 489.119", "F.S.489.119"
  const match = citation.match(/F\.?S\.?\s*(\d+\.\d+)/i);
  return match ? match[1] : null;
}

/**
 * Get the official Florida Legislature URL for a statute
 */
export function getStatuteUrl(statuteNumber: string): string {
  return STATUTE_URL_MAP[statuteNumber] || FLORIDA_STATUTES_BASE;
}

/**
 * Parse a citation and return linkable parts
 */
export interface ParsedCitation {
  /** The full original citation text */
  original: string;
  /** Just the statute reference (e.g., "F.S. 489.119") */
  statuteRef: string | null;
  /** The description after the statute */
  description: string;
  /** URL to link to */
  url: string | null;
}

export function parseCitation(citation: string): ParsedCitation {
  const match = citation.match(/^(F\.?S\.?\s*\d+\.\d+)\s*[-–—]?\s*(.*)$/i);
  
  if (match) {
    const statuteRef = match[1];
    const description = match[2] || '';
    const statuteNumber = extractStatuteNumber(statuteRef);
    const url = statuteNumber ? getStatuteUrl(statuteNumber) : null;
    
    return {
      original: citation,
      statuteRef,
      description,
      url,
    };
  }
  
  // Check for FL Building Code reference
  if (citation.toLowerCase().includes('building code')) {
    return {
      original: citation,
      statuteRef: null,
      description: citation,
      url: FLORIDA_BUILDING_URL,
    };
  }
  
  return {
    original: citation,
    statuteRef: null,
    description: citation,
    url: null,
  };
}

/**
 * Generate license verification URL with pre-filled search
 */
export function getLicenseVerificationUrl(licenseNumber: string): string {
  // MyFloridaLicense doesn't support direct linking with params well,
  // so we just link to the search page
  return MY_FLORIDA_LICENSE_URL;
}

/**
 * Generate NOA verification URL 
 */
export function getNoaVerificationUrl(noaNumber: string): string {
  // Florida Building product approval search
  return FLORIDA_BUILDING_URL;
}
