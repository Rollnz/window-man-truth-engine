// Sprint 07A — Conservative deterministic normalization for cross-system comparison.
// Prefer HUMAN_REVIEW_REQUIRED over false equivalence.

export type EquivalenceResult =
  | { kind: "equal" }
  | { kind: "not_equal" }
  | { kind: "human_review_required"; reason: string };

// ------- Money -------
export function normalizeMoney(v: unknown): { value: number; currency: string } | null {
  if (v == null) return null;
  if (typeof v === "number" && isFinite(v)) return { value: round2(v), currency: "USD" };
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    if (!isFinite(n)) return null;
    return { value: round2(n), currency: "USD" };
  }
  if (typeof v === "object" && v !== null && "value" in v) {
    const val = Number((v as { value: unknown }).value);
    const cur = String((v as { currency?: unknown }).currency ?? "USD").toUpperCase();
    if (!isFinite(val)) return null;
    return { value: round2(val), currency: cur };
  }
  return null;
}
export function moneyEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const ma = normalizeMoney(a);
  const mb = normalizeMoney(b);
  if (!ma || !mb) return { kind: "not_equal" };
  if (ma.currency !== mb.currency) return { kind: "not_equal" };
  return Math.abs(ma.value - mb.value) < 0.005
    ? { kind: "equal" }
    : { kind: "not_equal" };
}

// ------- Dates -------
export function normalizeDate(v: unknown): { iso: string } | { ambiguous: true } | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { iso: s };
  // MM/DD/YYYY or M/D/YYYY (US) — unambiguous only if day > 12
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [_, mm, dd, yyyy] = us;
    const m = Number(mm), d = Number(dd);
    if (d > 12 && m <= 12) {
      return { iso: `${yyyy}-${pad(m)}-${pad(d)}` };
    }
    if (m > 12 && d <= 12) {
      return { iso: `${yyyy}-${pad(d)}-${pad(m)}` };
    }
    return { ambiguous: true };
  }
  return null;
}
export function dateEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const na = normalizeDate(a);
  const nb = normalizeDate(b);
  if (!na || !nb) return { kind: "not_equal" };
  if ("ambiguous" in na || "ambiguous" in nb) {
    return { kind: "human_review_required", reason: "ambiguous date format" };
  }
  return na.iso === nb.iso ? { kind: "equal" } : { kind: "not_equal" };
}

// ------- Names -------
export function normalizeName(v: unknown): string | null {
  if (v == null) return null;
  return String(v).trim().replace(/\s+/g, " ").toLowerCase();
}
export function nameEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na == null || nb == null) return { kind: "not_equal" };
  if (na === nb) return { kind: "equal" };
  // Near-match: token overlap ≥ 0.8 but not equal → human review, never auto-equal.
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  if (jaccard >= 0.66) {
    return { kind: "human_review_required", reason: "name near-match" };
  }
  return { kind: "not_equal" };
}

// ------- Phones -------
export function normalizePhone(v: unknown): string | null {
  if (v == null) return null;
  const digits = String(v).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits || null;
}
export function phoneEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const pa = normalizePhone(a);
  const pb = normalizePhone(b);
  if (!pa || !pb) return { kind: "not_equal" };
  return pa === pb ? { kind: "equal" } : { kind: "not_equal" };
}

// ------- Emails -------
export function normalizeEmail(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  return s || null;
}
export function emailEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const ea = normalizeEmail(a);
  const eb = normalizeEmail(b);
  if (!ea || !eb) return { kind: "not_equal" };
  return ea === eb ? { kind: "equal" } : { kind: "not_equal" };
}

// ------- Addresses -------
export function addressEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return { kind: "not_equal" };
  if (na === nb) return { kind: "equal" };
  const zipA = (na.match(/\b\d{5}(-\d{4})?\b/) || [])[0];
  const zipB = (nb.match(/\b\d{5}(-\d{4})?\b/) || [])[0];
  if (zipA && zipB && zipA !== zipB) return { kind: "not_equal" };
  const ta = new Set(na.split(/[\s,]+/));
  const tb = new Set(nb.split(/[\s,]+/));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = union === 0 ? 0 : inter / union;
  if (jaccard >= 0.8 && zipA && zipA === zipB) return { kind: "equal" };
  if (jaccard >= 0.5) return { kind: "human_review_required", reason: "address near-match" };
  return { kind: "not_equal" };
}

// ------- Identifiers / NOAs -------
export function normalizeIdentifier(v: unknown): string | null {
  if (v == null) return null;
  return String(v).replace(/[-\s]/g, "").toUpperCase() || null;
}
export function identifierEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const ia = normalizeIdentifier(a);
  const ib = normalizeIdentifier(b);
  if (!ia || !ib) return { kind: "not_equal" };
  return ia === ib ? { kind: "equal" } : { kind: "not_equal" };
}

// ------- Dimensions (inches) -------
export function normalizeDimension(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim().toLowerCase();
  const m = s.match(/^(\d+(\.\d+)?)\s*(in|"|inches?)?$/);
  if (m) return Number(m[1]);
  const ft = s.match(/^(\d+(\.\d+)?)\s*(ft|')$/);
  if (ft) return Number(ft[1]) * 12;
  return null;
}
export function dimensionEquivalent(a: unknown, b: unknown, toleranceIn = 0.5): EquivalenceResult {
  const da = normalizeDimension(a);
  const db = normalizeDimension(b);
  if (da == null || db == null) return { kind: "not_equal" };
  return Math.abs(da - db) <= toleranceIn ? { kind: "equal" } : { kind: "not_equal" };
}

// ------- Manufacturer / Series -------
const BRAND_ALIASES: Record<string, string> = {
  "pgt": "pgt",
  "pgt industries": "pgt",
  "cws": "cws",
  "custom window systems": "cws",
  "eze-breeze": "ezebreeze",
  "eze breeze": "ezebreeze",
};
export function normalizeManufacturer(v: unknown): string | null {
  const s = normalizeName(v);
  if (!s) return null;
  return BRAND_ALIASES[s] ?? s;
}
export function manufacturerEquivalent(a: unknown, b: unknown): EquivalenceResult {
  const ma = normalizeManufacturer(a);
  const mb = normalizeManufacturer(b);
  if (!ma || !mb) return { kind: "not_equal" };
  return ma === mb ? { kind: "equal" } : { kind: "not_equal" };
}

// ------- Generic value equivalence dispatch -------
export function valueEquivalent(
  a: unknown,
  b: unknown,
  kind: "money" | "date" | "name" | "phone" | "email" | "address" | "identifier" | "dimension" | "manufacturer" | "raw" = "raw",
): EquivalenceResult {
  switch (kind) {
    case "money": return moneyEquivalent(a, b);
    case "date": return dateEquivalent(a, b);
    case "name": return nameEquivalent(a, b);
    case "phone": return phoneEquivalent(a, b);
    case "email": return emailEquivalent(a, b);
    case "address": return addressEquivalent(a, b);
    case "identifier": return identifierEquivalent(a, b);
    case "dimension": return dimensionEquivalent(a, b);
    case "manufacturer": return manufacturerEquivalent(a, b);
    default: {
      if (a === b) return { kind: "equal" };
      if (a == null || b == null) return { kind: "not_equal" };
      return String(a).trim() === String(b).trim() ? { kind: "equal" } : { kind: "not_equal" };
    }
  }
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
function pad(n: number): string { return String(n).padStart(2, "0"); }
