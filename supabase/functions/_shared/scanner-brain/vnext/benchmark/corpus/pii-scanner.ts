// Sprint 07B.3 — Deterministic, local-only PII scanner for corpus intake.
//
// PRIVACY LAW: this module never stores, logs, or serializes a raw matched
// value. Findings carry only the kind, severity, character span, and the
// deterministic redaction token that replaced the value.

export const PII_SCANNER_VERSION = "pii-scanner-v1.0.0";

export type PiiKind =
  | "EMAIL"
  | "PHONE"
  | "STREET_ADDRESS"
  | "ZIP4"
  | "SSN"
  | "CREDIT_CARD"
  | "DOB"
  | "ACCOUNT_ID"
  | "PERSON_NAME";

export type PiiSeverity = "critical" | "high" | "medium";

export interface PiiFinding {
  kind: PiiKind;
  severity: PiiSeverity;
  /** Character offsets into the scanned string. No raw value is retained. */
  match_span: { start: number; end: number };
  /** e.g. "[REDACTED_EMAIL_1]" */
  redaction_token: string;
}

export interface PiiScanResult {
  scanner_version: string;
  findings: PiiFinding[];
  /** redaction_token -> PiiKind. Never contains raw values. */
  substitutions: Record<string, string>;
  scrubbed_text: string;
}

export const PII_SEVERITY: Record<PiiKind, PiiSeverity> = {
  EMAIL: "critical",
  SSN: "critical",
  CREDIT_CARD: "critical",
  PERSON_NAME: "critical",
  PHONE: "high",
  STREET_ADDRESS: "high",
  ACCOUNT_ID: "high",
  DOB: "high",
  ZIP4: "medium",
};

/** Matches any redaction token emitted by this scanner. */
export const REDACTION_TOKEN_RE = /\[REDACTED_[A-Z0-9_]+_\d+\]/g;

interface Detector {
  kind: PiiKind;
  re: RegExp;
  /** 1-based capture group holding the sensitive substring (default: whole match). */
  group?: number;
  /** Extra predicate; return false to reject the candidate. */
  accept?: (value: string) => boolean;
}

function luhnValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// Ordered by precedence: earlier detectors win overlapping spans.
const DETECTORS: Detector[] = [
  { kind: "EMAIL", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { kind: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  {
    kind: "CREDIT_CARD",
    re: /\b(?:\d[ -]?){12,18}\d\b/g,
    accept: luhnValid,
  },
  {
    kind: "PERSON_NAME",
    re:
      /(?:Customer|Homeowner|Sold\s+To|Bill\s+To|Client|Prepared\s+For)\s*:?\s*([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){1,2})/g,
    group: 1,
  },
  {
    kind: "STREET_ADDRESS",
    re:
      /\b\d{1,6}\s+(?:[A-Za-z0-9.'’-]+\s+){0,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Terrace|Ter|Place|Pl|Circle|Cir|Highway|Hwy)\b\.?/gi,
  },
  {
    kind: "ACCOUNT_ID",
    re:
      /\b(?:acct|account|loan|license|lic|policy)\s*(?:no\.?|number|#)?\s*[:#]\s*[A-Za-z0-9][A-Za-z0-9-]{3,}/gi,
  },
  {
    kind: "DOB",
    re: /\b(?:DOB|Date\s+of\s+Birth)\s*:?\s*\d{1,2}\/\d{1,2}\/\d{2,4}/gi,
  },
  {
    kind: "PHONE",
    re: /(?:\+1[\s.-]?)?(?:\(\d{3}\)\s?|\b\d{3}[\s.-])\d{3}[\s.-]\d{4}\b/g,
  },
  { kind: "ZIP4", re: /\b\d{5}-\d{4}\b/g },
];

/**
 * Registry keeping substitution stable ACROSS every string of one document:
 * the same normalized value always maps to the same token.
 */
export interface SubstitutionRegistry {
  byValue: Map<string, string>;
  counters: Map<PiiKind, number>;
  tokens: Record<string, string>;
}

export function createSubstitutionRegistry(): SubstitutionRegistry {
  return { byValue: new Map(), counters: new Map(), tokens: {} };
}

function normalizeValue(kind: PiiKind, raw: string): string {
  return `${kind}:${raw.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

function tokenFor(
  registry: SubstitutionRegistry,
  kind: PiiKind,
  raw: string,
): string {
  const key = normalizeValue(kind, raw);
  const existing = registry.byValue.get(key);
  if (existing) return existing;
  const next = (registry.counters.get(kind) ?? 0) + 1;
  registry.counters.set(kind, next);
  const token = `[REDACTED_${kind}_${next}]`;
  registry.byValue.set(key, token);
  registry.tokens[token] = kind;
  return token;
}

interface RawMatch {
  kind: PiiKind;
  start: number;
  end: number;
  value: string;
  order: number;
}

function collectMatches(text: string): RawMatch[] {
  const out: RawMatch[] = [];
  DETECTORS.forEach((det, order) => {
    const re = new RegExp(det.re.source, det.re.flags.includes("g") ? det.re.flags : det.re.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      let value = m[0];
      let start = m.index;
      if (det.group) {
        const g = m[det.group];
        if (!g) continue;
        const rel = m[0].indexOf(g);
        if (rel < 0) continue;
        value = g;
        start = m.index + rel;
      }
      if (det.accept && !det.accept(value)) continue;
      out.push({ kind: det.kind, start, end: start + value.length, value, order });
    }
  });
  // Precedence: detector order, then earliest start, then longest span.
  out.sort((a, b) =>
    a.order - b.order || a.start - b.start || (b.end - b.start) - (a.end - a.start)
  );
  const kept: RawMatch[] = [];
  for (const cand of out) {
    const overlaps = kept.some((k) => cand.start < k.end && k.start < cand.end);
    if (!overlaps) kept.push(cand);
  }
  kept.sort((a, b) => a.start - b.start);
  return kept;
}

/** Scan one string, producing findings and the scrubbed replacement text. */
export function scanText(
  text: string,
  registry: SubstitutionRegistry = createSubstitutionRegistry(),
): PiiScanResult {
  const matches = collectMatches(text ?? "");
  const findings: PiiFinding[] = [];
  let scrubbed = "";
  let cursor = 0;
  for (const m of matches) {
    const token = tokenFor(registry, m.kind, m.value);
    findings.push({
      kind: m.kind,
      severity: PII_SEVERITY[m.kind],
      match_span: { start: m.start, end: m.end },
      redaction_token: token,
    });
    scrubbed += text.slice(cursor, m.start) + token;
    cursor = m.end;
  }
  scrubbed += text.slice(cursor);
  return {
    scanner_version: PII_SCANNER_VERSION,
    findings,
    substitutions: { ...registry.tokens },
    scrubbed_text: scrubbed,
  };
}

/** Convenience: findings only, no scrubbing side output retained. */
export function detectPii(text: string): PiiFinding[] {
  return scanText(text, createSubstitutionRegistry()).findings;
}

/** True when no finding remains. */
export function isClean(findings: PiiFinding[]): boolean {
  return findings.length === 0;
}

/** Numeric tokens outside redaction tokens — used for invariant checks. */
export function numericFingerprint(text: string): string[] {
  return (text.replace(REDACTION_TOKEN_RE, " ").match(/\d+(?:\.\d+)?/g) ?? []);
}
