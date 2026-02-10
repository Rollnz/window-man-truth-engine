/**
 * EMQ (Event Match Quality) Validator
 * Validates conversion events against Meta EMQ 9.5+ and Google Enhanced Conversions standards
 */

export interface EMQCheckResult {
  passed: boolean;
  value?: string;
  reason?: string;
}

export interface EMQValidationResult {
  eventId: EMQCheckResult;
  emailHash: EMQCheckResult;
  phoneHash: EMQCheckResult;
  externalId: EMQCheckResult & { matchesLeadId: boolean };
  valueAndCurrency: EMQCheckResult & { expectedValue: number; actualValue?: number; currency?: string };
  overallScore: 'HIGH' | 'MEDIUM' | 'LOW';
  passedCount: number;
  totalChecks: number;
}

// Expected conversion values by event type
export const EXPECTED_VALUES: Record<string, number> = {
  lead_submission_success: 100,  // Full contact lead (name + email + phone)
  lead_captured: 15,             // Email-only leads
  phone_lead: 25,
  consultation_booked: 75,       // High-intent consultation
  booking_confirmed: 75,
};

// Conversion events we track
export const CONVERSION_EVENTS = [
  'lead_submission_success',
  'lead_captured',
  'phone_lead',
  'consultation_booked',
  'booking_confirmed',
];

// Validate event_id format: plain UUID v4 is the primary/recommended format.
// The "event_type:uuid" deterministic pattern is accepted as a legacy fallback but is no longer preferred,
// because Meta deduplication requires browser event_id to exactly match the server event_id (raw UUID).
const isValidEventId = (id: string | undefined | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  // Primary format: plain UUID v4 (matches server-side event_id for Meta deduplication)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Legacy fallback: event_type:uuid (e.g., "lead_captured:uuid") — accepted but no longer recommended
  const deterministicPattern = /^[a-z_]+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id) || deterministicPattern.test(id);
};

// Validate SHA-256 hash (64 hex chars)
const isValidSHA256 = (hash: string | undefined | null): boolean => {
  if (!hash || typeof hash !== 'string') return false;
  return /^[a-f0-9]{64}$/.test(hash.toLowerCase());
};

// Extract user_data from event payload
const getUserData = (event: Record<string, unknown>): Record<string, unknown> | null => {
  if (event.user_data && typeof event.user_data === 'object') {
    return event.user_data as Record<string, unknown>;
  }
  return null;
};

/**
 * Validate a dataLayer event against EMQ 9.5+ requirements
 */
export function validateEMQEvent(event: Record<string, unknown>): EMQValidationResult {
  const eventName = event.event as string;
  const userData = getUserData(event);
  
  // 1. Event ID validation (accepts UUID or deterministic format like "event_type:uuid")
  const eventId = event.event_id as string | undefined;
  const eventIdCheck: EMQCheckResult = {
    passed: isValidEventId(eventId),
    value: eventId ? `${eventId.substring(0, 8)}...` : undefined,
    reason: !eventId ? 'Missing event_id' : !isValidEventId(eventId) ? 'Invalid event_id format' : undefined,
  };

  // 2. Email Hash validation
  const emailHash = userData?.em as string | undefined;
  const sha256Email = userData?.sha256_email_address as string | undefined;
  const effectiveEmailHash = emailHash || sha256Email;
  const emailHashCheck: EMQCheckResult = {
    passed: isValidSHA256(effectiveEmailHash),
    value: effectiveEmailHash ? `${effectiveEmailHash.substring(0, 8)}...${effectiveEmailHash.substring(56)}` : undefined,
    reason: !effectiveEmailHash ? 'Missing email hash (em/sha256_email_address)' : 
            !isValidSHA256(effectiveEmailHash) ? 'Invalid SHA-256 format' : undefined,
  };

  // 3. Phone Hash validation (optional for some events)
  const phoneHash = userData?.ph as string | undefined;
  const sha256Phone = userData?.sha256_phone_number as string | undefined;
  const effectivePhoneHash = phoneHash || sha256Phone;
  const isPhoneRequired = eventName === 'phone_lead';
  const phoneHashCheck: EMQCheckResult = {
    passed: isPhoneRequired ? isValidSHA256(effectivePhoneHash) : (effectivePhoneHash ? isValidSHA256(effectivePhoneHash) : true),
    value: effectivePhoneHash ? `${effectivePhoneHash.substring(0, 8)}...${effectivePhoneHash.substring(56)}` : undefined,
    reason: isPhoneRequired && !effectivePhoneHash ? 'Missing phone hash (required for phone_lead)' :
            effectivePhoneHash && !isValidSHA256(effectivePhoneHash) ? 'Invalid SHA-256 format' : 
            !effectivePhoneHash ? 'No phone provided (optional)' : undefined,
  };

  // 4. External ID validation
  const externalId = userData?.external_id as string | undefined;
  const leadId = event.lead_id as string | undefined;
  const matchesLeadId = !!(externalId && leadId && externalId === leadId);
  const externalIdCheck: EMQCheckResult & { matchesLeadId: boolean } = {
    passed: !!externalId && (leadId ? matchesLeadId : true),
    value: externalId ? `${externalId.substring(0, 8)}...` : undefined,
    matchesLeadId,
    reason: !externalId ? 'Missing external_id' : 
            leadId && !matchesLeadId ? 'external_id does not match lead_id' : undefined,
  };

  // 5. Value and Currency validation
  const expectedValue = EXPECTED_VALUES[eventName] || 0;
  const actualValue = event.value as number | undefined;
  const currency = event.currency as string | undefined;
  const valueMatches = actualValue === expectedValue;
  const currencyValid = currency === 'USD';
  const valueAndCurrencyCheck: EMQCheckResult & { expectedValue: number; actualValue?: number; currency?: string } = {
    passed: valueMatches && currencyValid,
    expectedValue,
    actualValue,
    currency,
    reason: !valueMatches ? `Expected $${expectedValue}, got $${actualValue ?? 'undefined'}` :
            !currencyValid ? `Expected USD, got ${currency ?? 'undefined'}` : undefined,
  };

  // Calculate overall score
  const checks = [
    eventIdCheck.passed,
    emailHashCheck.passed,
    phoneHashCheck.passed,
    externalIdCheck.passed,
    valueAndCurrencyCheck.passed,
  ];
  const passedCount = checks.filter(Boolean).length;
  const totalChecks = 5;

  let overallScore: 'HIGH' | 'MEDIUM' | 'LOW';
  if (passedCount >= 4) {
    overallScore = 'HIGH';
  } else if (passedCount >= 3) {
    overallScore = 'MEDIUM';
  } else {
    overallScore = 'LOW';
  }

  return {
    eventId: eventIdCheck,
    emailHash: emailHashCheck,
    phoneHash: phoneHashCheck,
    externalId: externalIdCheck,
    valueAndCurrency: valueAndCurrencyCheck,
    overallScore,
    passedCount,
    totalChecks,
  };
}

/**
 * Check if event is a conversion event we should validate
 */
export function isConversionEvent(eventName: string | undefined): boolean {
  return !!eventName && CONVERSION_EVENTS.includes(eventName);
}
