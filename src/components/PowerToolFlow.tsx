// @ts-nocheck
// Force rebuild — cleared stale cache reference
/**
 * PowerToolFlow.jsx
 * Window Man — Full Lead Capture + Demo Report Flow
 *
 * ARCHITECTURE:
 *   [Homepage Button] → [2-Step Lead Modal] → [Animated Scan Terminal] → [Demo Truth Report]
 *
 * PIXEL HOOKS: Search "🔥 PIXEL" for all Meta/Google event fire points.
 *
 * ADD TO <head>:
 *   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
 *
 * DROP ON HOMEPAGE:
 *   import PowerToolFlow from "./PowerToolFlow";
 *   <PowerToolFlow />
 *
 * ─── EXTERNAL WIRING: Live Scan Counter ───────────────────────────────────
 * To replace the static SCAN_COUNT with a live countdown from UrgencyChecker:
 *
 *   1. Import UrgencyChecker:
 *      import { useLiveCount } from "@/hooks/useUrgencyChecker";
 *
 *   2. Replace the SCAN_COUNT constant below with a hook call inside
 *      LeadModal (or lift it to PowerToolFlow and pass as a prop):
 *        const scanCount = useLiveCount("quote_scans") ?? SCAN_COUNT;
 *
 *   3. The useLiveCount hook should poll or subscribe to your API/websocket
 *      endpoint and return the current count, falling back to SCAN_COUNT
 *      if offline or loading.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from "react";
import { DS, DS_PAGE_STYLES } from "@/styles/design-system";
import TrustFooter from "@/components/ds/TrustFooter";
import UrgencyBadge from "@/components/ds/UrgencyBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Social proof counter — see header comment for live wiring instructions
// ─────────────────────────────────────────────────────────────────────────────
const SCAN_COUNT = 2432;

// ─────────────────────────────────────────────────────────────────────────────
// Demo Data — Real signals from a real Pompano Beach contractor quote
// This is deliberately scary — it IS the product's "holy sh*t" moment
// ─────────────────────────────────────────────────────────────────────────────
const DEMO = {
  contractor: "Sunshine Premium Windows LLC",
  date: "2026-02-28",
  city: "Pompano Beach",
  zip: "33060",
  openings: 12,
  totalPrice: 26500,
  pricePerOpening: 2208,
  score: 55,
  grade: "D+",
  hardCap: { statute: "FL §489.126", ceiling: 45 },
  pillars: [
    { label: "Safety", score: 42, status: "flag" },
    { label: "Scope", score: 60, status: "warn" },
    { label: "Price", score: 45, status: "flag" },
    { label: "Fine Print", score: 38, status: "flag" },
    { label: "Warranty", score: 58, status: "warn" },
  ],
};

// Terminal lines — timing is deliberate: slow enough to read, fast enough to feel live
const SCAN_LINES = [
  { text: "Initializing Window Man AI scanner...", ms: 0, type: "info" },
  { text: "Parsing document structure — 14 pages detected...", ms: 500, type: "info" },
  { text: "Extracting contractor identity fields...", ms: 1050, type: "info" },
  { text: "  → Contractor : Sunshine Premium Windows LLC", ms: 1350, type: "data" },
  { text: "  → License #  : NOT FOUND ON CONTRACT ⚠", ms: 1600, type: "warn" },
  { text: "Parsing payment + deposit terms...", ms: 2050, type: "info" },
  { text: "  → Deposit clause    : EXCEEDS FL STATUTORY LIMIT", ms: 2350, type: "danger" },
  { text: "  → Payment milestones: NOT DEFINED", ms: 2600, type: "warn" },
  { text: "  → Tax inclusion     : AMBIGUOUS", ms: 2820, type: "warn" },
  { text: "Checking Florida hurricane compliance database...", ms: 3200, type: "info" },
  { text: "  → NOA numbers       : MISSING", ms: 3500, type: "danger" },
  { text: "  → Design pressure   : NOT LISTED", ms: 3750, type: "danger" },
  { text: "  → FL Product Approval: Partial (FL12345 only)", ms: 4000, type: "warn" },
  { text: "  → Installation method: NOT SPECIFIED", ms: 4200, type: "warn" },
  { text: "Scanning contract fine print...", ms: 4600, type: "info" },
  { text: "  → Arbitration clause    : FOUND — limits your rights", ms: 4900, type: "warn" },
  { text: "  → Price escalation clause: FOUND — price can increase", ms: 5150, type: "danger" },
  { text: "  → Lien waiver           : MISSING — lien risk on home", ms: 5400, type: "danger" },
  { text: "  → Cancellation clause   : MISSING", ms: 5620, type: "danger" },
  { text: "  → Completion timeline   : NOT STATED", ms: 5820, type: "warn" },
  { text: "Detecting sales pressure tactics...", ms: 6200, type: "info" },
  { text: "  → 'Today only' pricing  : DETECTED", ms: 6500, type: "danger" },
  { text: "  → High-pressure language: DETECTED", ms: 6720, type: "danger" },
  { text: "Evaluating warranty terms...", ms: 7100, type: "info" },
  { text: "  → Labor warranty  : 1 YEAR — dangerously low", ms: 7380, type: "danger" },
  { text: "  → Transferability : NOT TRANSFERABLE", ms: 7600, type: "warn" },
  { text: "  → 'Lifetime' claim: CONTRADICTED by 10-year terms", ms: 7820, type: "warn" },
  { text: "Computing final risk score...", ms: 8200, type: "info" },
  { text: "  → Applying FL §489.126 deposit hard cap...", ms: 8600, type: "warn" },
  { text: "  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%", ms: 9000, type: "info" },
  { text: "ANALYSIS COMPLETE — 10 CRITICAL ISSUES DETECTED", ms: 9500, type: "complete" },
];

const FINDINGS = [
  {
    severity: "flag",
    pillar: "PRICE",
    title: "Deposit Risk: Upfront payment terms are unsafe",
    why: "Large deposits eliminate your leverage. If timelines slip or the contractor disappears, your money goes with them. FL §489.126 limits this — theirs doesn't comply.",
    what: "Rewrite into milestones: small deposit → permit issued → product delivery → install complete → inspection pass. Final payment only after official sign-off.",
  },
  {
    severity: "flag",
    pillar: "SAFETY",
    title: "HVHZ Risk: Product approvals not documented",
    why: "In hurricane zones, NOA numbers and Design Pressure ratings are inspection-critical. Missing approvals = potential failed inspection, delays, and out-of-pocket re-inspection costs.",
    what: "Require exact NOA numbers for every product series. Attach approval sheets as contract exhibits. Verify DP matches your exposure category.",
  },
  {
    severity: "flag",
    pillar: "SAFETY",
    title: "Design Pressure Not Listed",
    why: "DP determines if the window configuration is structurally appropriate for your home. Without it, compliance is unverifiable and inspection risk is high.",
    what: "Require DP ratings per product type, at minimum. Confirm they match your county's wind-load map for your address.",
  },
  {
    severity: "flag",
    pillar: "FINE PRINT",
    title: "Contract Trap: Cancellation rights not stated",
    why: "Florida consumers typically have a 3-day right to cancel certain home solicitation transactions. Missing language turns a simple change-of-mind into a legal fight.",
    what: "Require: written cancellation window (3 business days minimum), delivery method (email + certified mail), and written confirmation of receipt.",
  },
  {
    severity: "flag",
    pillar: "FINE PRINT",
    title: "Price Escalation Clause Detected",
    why: "This clause lets the contractor raise the price after you've signed, usually justified by vague 'materials cost' language. Total can drift with no cap.",
    what: "Demand a maximum escalation cap (e.g. 5%), require documented invoices to trigger any increase, and secure a right to cancel if increases exceed the threshold.",
  },
];

const COMPLIANCE = [
  { label: "Missile Impact Rating", status: "warn", detail: "Not clearly stated — request NOA/approval sheet proof" },
  { label: "Design Pressure", status: "fail", detail: "DP not listed — compliance cannot be verified" },
  { label: "Miami-Dade NOA", status: "warn", detail: "No NOA numbers found — request product-specific approvals" },
  {
    label: "FL Product Approval",
    status: "warn",
    detail: "Partial — FL12345 referenced, needs per-model verification",
  },
];

const NEXT_STEPS = [
  "Lock permits + inspections into scope — contractor pulls, pays, and schedules all re-inspections.",
  "Attach NOA/FL approval sheets as exhibits before signing — no approval, no signature.",
  "Rewrite payment into 5 milestones. Final balance only after official inspection pass.",
  "Add a written change-order clause: written approval required, price and schedule impact stated first.",
  "Request warranty PDF — confirm 5-year labor coverage for water intrusion and operational defects.",
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────
const fmt$ = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg: "#070b12",
  surface: "#0e1420",
  card: "rgba(255,255,255,0.033)",
  border: "rgba(255,255,255,0.08)",
  cyan: "#06b6d4",
  cyanDim: "rgba(6,182,212,0.15)",
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#10b981",
  text: "#f1f5f9",
  muted: "rgba(241,245,249,0.55)",
  faint: "rgba(241,245,249,0.32)",
  fontSans: "'Inter', system-ui, sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI Primitives
// ─────────────────────────────────────────────────────────────────────────────
function Pill({ children, tone = "neutral", sm = false }) {
  const map = {
    danger: { bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.28)", color: "#ef4444" },
    warn: { bg: "rgba(245,158,11,0.13)", border: "rgba(245,158,11,0.28)", color: "#f59e0b" },
    success: { bg: "rgba(16,185,129,0.13)", border: "rgba(16,185,129,0.25)", color: "#10b981" },
    cyan: { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.28)", color: "#06b6d4" },
    neutral: { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.10)", color: T.muted },
  };
  const s = map[tone] || map.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        borderRadius: "99px",
        padding: sm ? "2px 8px" : "4px 11px",
        fontSize: sm ? "10px" : "11px",
        fontWeight: 700,
        letterSpacing: "0.4px",
        fontFamily: T.fontSans,
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style = {}, highlight = false }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${highlight ? "rgba(6,182,212,0.22)" : T.border}`,
        borderRadius: "16px",
        padding: "20px",
        ...(highlight ? { boxShadow: "0 0 40px rgba(6,182,212,0.06)" } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ children }) {
  return (
    <div
      style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "2.5px",
        color: "rgba(6,182,212,0.8)",
        fontFamily: T.fontMono,
        marginBottom: "6px",
      }}
    >
      {children}
    </div>
  );
}

function SectionHead({ kicker, title }) {
  return (
    <div style={{ margin: "36px 0 14px" }}>
      <Kicker>{kicker}</Kicker>
      <div style={{ fontSize: "20px", fontWeight: 700, color: T.text, fontFamily: T.fontSans }}>{title}</div>
    </div>
  );
}

function FadeIn({ children, delay = 0 }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(18px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 1 — Homepage Button
// Drop anywhere on your homepage layout, no props required.
// ─────────────────────────────────────────────────────────────────────────────
function PowerToolButton({ onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        width: "100%",
        maxWidth: "440px",
        background: hover ? "linear-gradient(135deg, #0f1f35, #1a2d45)" : "linear-gradient(135deg, #0b1525, #0f1f35)",
        border: `1px solid ${hover ? "rgba(6,182,212,0.6)" : "rgba(6,182,212,0.28)"}`,
        borderRadius: "18px",
        padding: "22px 24px",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        overflow: "hidden",
        boxShadow: hover
          ? "0 0 60px rgba(6,182,212,0.16), inset 0 1px 0 rgba(255,255,255,0.07)"
          : "0 0 30px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
        transition: "all 0.22s ease",
        transform: hover ? "translateY(-2px)" : "none",
        fontFamily: T.fontSans,
      }}
    >
      {/* CRT scanline texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(6,182,212,0.012) 3px, rgba(6,182,212,0.012) 4px)",
        }}
      />

      {/* Top glow stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "30%",
          right: "30%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.7), transparent)",
          opacity: hover ? 1 : 0.5,
          transition: "opacity 0.2s",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", position: "relative" }}>
        {/* Icon block */}
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "11px",
            flexShrink: 0,
            background: "rgba(6,182,212,0.1)",
            border: "1px solid rgba(6,182,212,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            boxShadow: hover ? "0 0 20px rgba(6,182,212,0.2)" : "none",
            transition: "box-shadow 0.2s",
          }}
        >
          🛡️
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "2.5px",
              color: "rgba(6,182,212,0.88)",
              marginBottom: "5px",
              fontFamily: T.fontMono,
            }}
          >
            FREE POWER TOOL
          </div>
          <div style={{ fontSize: "17px", fontWeight: 800, color: T.text, lineHeight: 1.25, marginBottom: "7px" }}>
            Prepare Before Your First Quote
          </div>
          <div style={{ fontSize: "13px", color: "#e2f3ff", lineHeight: 1.55 }}>
            See what contractors hope you never find out — before you sit down with a single one of them.
          </div>
        </div>

        <div
          style={{
            color: "rgba(6,182,212,0.75)",
            fontSize: "22px",
            alignSelf: "center",
            flexShrink: 0,
            transform: hover ? "translateX(3px)" : "none",
            transition: "transform 0.2s",
          }}
        >
          →
        </div>
      </div>

      {/* Trust strip */}
      <div
        style={{
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255,255,255,0.055)",
          display: "flex",
          gap: "18px",
          position: "relative",
        }}
      >
        {["4,200+ Scans & Counting", "Free Forensic Analysis", "Less Than 60 Seconds"].map((tag) => (
          <div
            key={tag}
            style={{
              fontSize: "11px",
              color: "#e2f3ff",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={{ color: "rgb(229, 239, 252)", fontWeight: 700 }}>✓</span> {tag}
          </div>
        ))}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 2 — Lead Capture Modal (2 steps)
//
// PSYCHOLOGY:
//   Step 1: Name + Email — low friction, Zeigarnik loop opens
//   Step 2: Contact method toggle (Text vs Email) — phone feels like THEIR choice
//           Framing: "Contractor Alert" utility, not sales call
// ─────────────────────────────────────────────────────────────────────────────
function LeadModal({ onComplete, onClose }: { onComplete: (form: any) => void; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", method: "text" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Auto-focus phone field on step 2 (fallback for browsers ignoring autoFocus on dynamic renders)
  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => phoneRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [step]);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Phone formatter: (XXX) XXX-XXXX
  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (val: string) => {
    setForm((f) => ({ ...f, phone: formatPhone(val) }));
    if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "First name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    return e;
  };

  const handleStep1 = () => {
    const e = validateStep1();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});

    // 🔥 PIXEL: Lead event (name + email captured — step 1 complete)
    // window.fbq?.("track", "Lead", { content_name: "PowerTool_EmailCapture" });
    // window.gtag?.("event", "generate_lead", { event_category: "PowerTool", value: 1 });
    //
    // 🔥 META CAPI (server-side): Send SHA-256(email) + SHA-256(name) immediately for
    //    cleaner signal matching. Don't wait for phone.
    // await serverCAPI({ event: "Lead", email: form.email, name: form.name });

    setStep(2);
  };

  const handleStep2 = async () => {
    // Always require 10 digits regardless of method
    const clean = form.phone.replace(/\D/g, "");
    if (clean.length < 10) {
      setErrors({ phone: "Please enter a valid 10-digit mobile number" });
      return;
    }
    setErrors({});
    setSubmitting(true);

    // 🔥 PIXEL: CompleteRegistration (full lead with phone)
    // window.fbq?.("track",       "CompleteRegistration", { content_name: "PowerTool_Complete", status: "with_phone" });
    // window.fbq?.("trackCustom", "PowerToolActivated",   { has_phone: true, zip: "inferred_from_ip" });
    // window.gtag?.("event", "sign_up", { method: "PowerTool", has_phone: true });
    //
    // 🔥 META CAPI (server-side): Re-send now with phone appended. Two server events is
    //    fine — Meta deduplicates on event_id. Phone hash adds significant match quality.
    // await serverCAPI({ event: "CompleteRegistration", email: form.email, phone: form.phone, name: form.name });

    await new Promise((r) => setTimeout(r, 750)); // replace with real POST to your CRM/Zapier
    setSubmitting(false);
    onComplete(form);
  };

  const STEPS = {
    1: {
      eyebrow: "WINDOW MAN POWER TOOL",
      headline: "Unlock the Truth Report",
      sub: "Get the same AI scanner contractors don't want you to have. Every clause, every compliance gap, every price red flag — exposed before you sign anything.",
      cta: "Get Instant Access →",
    },
    2: {
      eyebrow: "ONE MORE THING",
      headline: `One more thing, ${form.name.split(" ")[0] || "friend"}`,
      sub: "",
      cta: "Show Me a Sample Truth Report →",
    },
  };

  const cfg = STEPS[step];

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "468px",
          background: "#0d1117",
          border: "1px solid rgba(6,182,212,0.18)",
          borderRadius: "22px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 90px rgba(0,0,0,0.65), 0 0 80px rgba(6,182,212,0.07)",
        }}
      >
        {/* Top glow line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.9), transparent)",
          }}
        />

        {/* Progress + close */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "18px 22px 0" }}>
          {[1, 2].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: "3px",
                borderRadius: "99px",
                background: n <= step ? T.cyan : "rgba(255,255,255,0.09)",
                transition: "background 0.4s ease",
              }}
            />
          ))}
          <button
            onClick={onClose}
            style={{
              marginLeft: "6px",
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              padding: "0 2px",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "22px 28px 30px" }}>
          <Kicker>{cfg.eyebrow}</Kicker>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: T.text, margin: "0 0 10px", lineHeight: 1.2 }}>
            {cfg.headline}
          </h2>

          {/* Social proof — step 2 only */}
          {step === 2 && (
            <div style={{ fontSize: "12px", color: T.cyan, marginBottom: "16px", fontWeight: 600 }}>
              Join {SCAN_COUNT.toLocaleString()}+ homeowners who've scanned their quotes
            </div>
          )}

          {cfg.sub && (
            <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 24px", lineHeight: 1.6 }}>{cfg.sub}</p>
          )}

          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <ModalField
                label="Your First Name"
                placeholder="e.g. Sarah"
                value={form.name}
                onChange={set("name")}
                error={errors.name}
                autoFocus
              />
              <ModalField
                label="Email Address"
                placeholder="sarah@email.com"
                type="email"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
              />
              <ModalBtn onClick={handleStep1}>{cfg.cta}</ModalBtn>
              <div style={{ fontSize: "11px", color: "#FFFFFF", textAlign: "center" }}>
                No spam, no sales pitches. Just the truth about your quote.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <ModalField
                label="Mobile Number"
                placeholder="(561) 867-5309"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={form.phone}
                onChange={handlePhoneChange}
                error={errors.phone}
                autoFocus
                inputRef={phoneRef}
              />

              {/* Trust bar */}
              <div style={{ fontSize: "11px", color: T.muted, textAlign: "center", letterSpacing: "0.3px" }}>
                🔒 256-bit encrypted · No credit card required
              </div>

              <ModalBtn onClick={handleStep2} loading={submitting}>
                {submitting ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "ptf-spin 0.6s linear infinite",
                      }}
                    />
                    Preparing your report...
                  </span>
                ) : (
                  cfg.cta
                )}
              </ModalBtn>

              <div style={{ fontSize: "11px", color: "#FFFFFF", textAlign: "center", lineHeight: 1.7 }}>
                This is the same quality analysis you'll get when you analyze your quote.
                <br />
                🔒 No spam, ever. ·{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#FFFFFF", textDecoration: "underline", textUnderlineOffset: "2px" }}
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes ptf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ModalField({
  label,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
  autoFocus = false,
  inputMode,
  autoComplete,
  inputRef,
}) {
  const [focused, setFocused] = useState(false);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || fallbackRef;

  // Auto-focus fallback
  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => ref.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <div>
      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: T.muted, marginBottom: "6px" }}>
        {label}
      </label>
      <input
        ref={ref}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.05)",
          color: T.text,
          border: `1.5px solid ${error ? "rgba(239,68,68,0.65)" : focused ? "rgba(6,182,212,0.55)" : "rgba(255,255,255,0.1)"}`,
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
          fontFamily: "'Inter', system-ui, sans-serif",
          transition: "border-color 0.15s",
        }}
      />
      {error && <div style={{ fontSize: "11px", color: T.red, marginTop: "5px" }}>{error}</div>}
    </div>
  );
}

function ModalBtn({ children, onClick, loading = false }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        padding: "14px",
        background: loading ? "rgba(6,182,212,0.38)" : "linear-gradient(135deg, #0ea5e9, #06b6d4)",
        color: loading ? "rgba(255,255,255,0.7)" : "#050e18",
        fontWeight: 800,
        fontSize: "15px",
        letterSpacing: "0.03em",
        border: "none",
        borderRadius: "12px",
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: hover && !loading ? "0 12px 40px rgba(6,182,212,0.38)" : "0 6px 24px rgba(6,182,212,0.22)",
        transition: "all 0.2s",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 3 — Animated Scan Terminal
// ─────────────────────────────────────────────────────────────────────────────
function ScanTerminal({ lines, progress, terminalRef, firstName }) {
  const isComplete = progress === 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: T.fontMono,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `
          linear-gradient(rgba(6,182,212,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.025) 1px, transparent 1px)
        `,
          backgroundSize: "44px 44px",
        }}
      />

      <div style={{ width: "100%", maxWidth: "700px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              background: "rgba(6,182,212,0.08)",
              border: "1px solid rgba(6,182,212,0.24)",
              borderRadius: "99px",
              padding: "7px 18px",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: T.cyan,
                display: "inline-block",
                animation: isComplete ? "none" : "blink 1s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: "11px", color: T.cyan, letterSpacing: "2px", fontWeight: 600 }}>
              {isComplete ? "SCAN COMPLETE" : "SCANNING IN PROGRESS"}
            </span>
          </div>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: T.text,
              margin: "0 0 10px",
              fontFamily: T.fontSans,
              lineHeight: 1.2,
            }}
          >
            {firstName ? `${firstName}, your` : "Your"} <span style={{ color: T.cyan }}>Truth Report</span> is being
            built
          </h1>
          <p style={{ color: T.muted, fontSize: "14px", margin: 0, fontFamily: T.fontSans }}>
            Analyzing a real contractor quote from Pompano Beach — this is exactly what you'll get with yours
          </p>
        </div>

        {/* Terminal window */}
        <div
          style={{
            background: "#080d14",
            border: "1px solid rgba(6,182,212,0.14)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 0 80px rgba(6,182,212,0.05)",
          }}
        >
          {/* Terminal chrome */}
          <div
            style={{
              background: "rgba(6,182,212,0.055)",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(6,182,212,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            {["#ef4444", "#f59e0b", "#10b981"].map((c) => (
              <div
                key={c}
                style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, opacity: 0.75 }}
              />
            ))}
            <span
              style={{ fontSize: "11px", color: "rgba(6,182,212,0.55)", marginLeft: "8px", letterSpacing: "0.5px" }}
            >
              windowman-ai-scanner — v2.4.1
            </span>
          </div>

          {/* Log output */}
          <div
            ref={terminalRef}
            style={{
              padding: "16px 20px",
              height: "300px",
              overflowY: "auto",
              scrollBehavior: "smooth",
            }}
          >
            {lines.map((line, i) => {
              const color =
                line.type === "danger"
                  ? T.red
                  : line.type === "warn"
                    ? T.amber
                    : line.type === "complete"
                      ? T.cyan
                      : line.type === "data"
                        ? T.green
                        : "rgba(241,245,249,0.55)";
              const isDataLine = line.type === "data" || line.type === "complete";
              return (
                <div
                  key={i}
                  style={{
                    fontSize: "13px",
                    color,
                    lineHeight: "1.95",
                    fontWeight: line.type === "complete" ? 700 : 400,
                    animation: "fadeUp 0.18s ease",
                  }}
                >
                  {!isDataLine && (
                    <span style={{ color: "rgba(6,182,212,0.35)", marginRight: "9px", userSelect: "none" }}>$</span>
                  )}
                  {line.text}
                </div>
              );
            })}
            {lines.length > 0 && !isComplete && (
              <div style={{ fontSize: "13px", color: T.muted, lineHeight: "1.95" }}>
                <span style={{ color: "rgba(6,182,212,0.35)", marginRight: "9px" }}>$</span>
                <span style={{ animation: "blink 0.9s step-end infinite" }}>▋</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
              <span style={{ fontSize: "11px", color: T.faint, letterSpacing: "1px" }}>ANALYSIS PROGRESS</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: isComplete ? T.red : T.cyan }}>{progress}%</span>
            </div>
            <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "99px" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: "99px",
                  background: isComplete
                    ? `linear-gradient(90deg, ${T.red}, #f97316)`
                    : `linear-gradient(90deg, ${T.cyan}, #38bdf8)`,
                  width: `${progress}%`,
                  transition: "width 0.3s ease, background 0.4s ease",
                  boxShadow: `0 0 12px ${isComplete ? "rgba(239,68,68,0.5)" : "rgba(6,182,212,0.45)"}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 4 — Score Reveal Interstitial
// ─────────────────────────────────────────────────────────────────────────────
function ScoreReveal({ score }) {
  const color = score < 60 ? T.red : score < 80 ? T.amber : T.green;
  const shadow = score < 60 ? "rgba(239,68,68,0.35)" : "rgba(6,182,212,0.25)";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: T.fontSans,
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "3px",
          color: "rgba(239,68,68,0.8)",
          fontFamily: T.fontMono,
          marginBottom: "8px",
        }}
      >
        RISK SCORE
      </div>
      <div
        style={{
          fontSize: "128px",
          fontWeight: 800,
          lineHeight: 1,
          color,
          textShadow: `0 0 100px ${shadow}`,
          transition: "color 0.3s",
          letterSpacing: "-4px",
        }}
      >
        {score}
      </div>
      <div style={{ fontSize: "18px", color: T.muted, marginTop: "4px" }}>
        out of 100 — Grade: <span style={{ color: T.red, fontWeight: 800 }}>{DEMO.grade}</span>
      </div>
      <div
        style={{
          marginTop: "20px",
          fontSize: "17px",
          fontWeight: 700,
          color: T.red,
          animation: "pulse 1.1s ease-in-out infinite",
        }}
      >
        10 Critical Issues Detected
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT 5 — Demo Truth Report
// ─────────────────────────────────────────────────────────────────────────────
function DemoReport({ lead }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const firstName = lead?.name?.split(" ")[0] || "there";

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        color: T.text,
        fontFamily: T.fontSans,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.7s ease",
      }}
    >
      {/* DEMO BANNER — persistent reminder + primary upsell */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.14), rgba(245,158,11,0.07), rgba(245,158,11,0.14))",
          borderBottom: "1px solid rgba(245,158,11,0.28)",
          padding: "11px 20px",
          textAlign: "center",
          position: "sticky",
          top: 0,
          zIndex: 200,
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontSize: "13px", color: "#fbbf24", fontWeight: 600 }}>
          ⚡ DEMO — Real Pompano Beach quote data.{" "}
          <a
            href="/ai-scanner"
            onClick={() => {
              // 🔥 PIXEL: UploadQuoteIntent from demo banner
              // window.fbq?.("trackCustom", "UploadQuoteIntent", { source: "demo_banner" });
            }}
            style={{ color: T.cyan, textDecoration: "underline", fontWeight: 700 }}
          >
            Upload YOUR quote to get your real Truth Report →
          </a>
        </span>
      </div>

      <div style={{ maxWidth: "940px", margin: "0 auto", padding: "44px 20px 140px" }}>
        {/* ── Report Header ── */}
        <FadeIn delay={0}>
          <div style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "13px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.cyan }} />
              <Kicker>WINDOW MAN TRUTH REPORT</Kicker>
            </div>
            <h1 style={{ fontSize: "38px", fontWeight: 800, lineHeight: 1.1, margin: "0 0 10px" }}>
              {firstName.charAt(0).toUpperCase() + firstName.slice(1)}'s Quote Safety Audit
            </h1>
            <p style={{ color: T.muted, fontSize: "15px", margin: 0 }}>
              Forensic consumer protection analysis — {DEMO.city}, FL {DEMO.zip}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
              <Pill>Contractor: {DEMO.contractor}</Pill>
              <Pill>Doc Date: {DEMO.date}</Pill>
              <Pill>
                Area: {DEMO.city}, {DEMO.zip}
              </Pill>
              <Pill tone="danger">
                Hard Cap: {DEMO.hardCap.statute} · Ceiling {DEMO.hardCap.ceiling}
              </Pill>
            </div>
          </div>
        </FadeIn>

        {/* ── Overall Score ── */}
        <FadeIn delay={120}>
          <Card highlight>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: T.muted, marginBottom: "6px" }}>Overall Risk Score</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <div style={{ fontSize: "68px", fontWeight: 800, color: T.red, lineHeight: 1 }}>{DEMO.score}</div>
                  <div style={{ color: T.faint, fontSize: "17px" }}>/ 100</div>
                  <Pill tone="danger">CRITICAL</Pill>
                </div>
                <div style={{ fontSize: "14px", color: T.muted, marginTop: "8px" }}>
                  Grade: <span style={{ fontWeight: 800, color: T.red }}>{DEMO.grade}</span>
                  <span style={{ color: T.faint, margin: "0 10px" }}>·</span>
                  <span style={{ color: T.amber, fontWeight: 600 }}>10 issues found</span>
                  <span style={{ color: T.faint, margin: "0 10px" }}>·</span>
                  <span style={{ color: T.faint, fontSize: "13px" }}>FL §489.126 hard cap applied</span>
                </div>
              </div>

              {/* Pillar mini-bars */}
              <div style={{ minWidth: "260px" }}>
                {DEMO.pillars.map((p) => {
                  const barColor = p.status === "flag" ? T.red : T.amber;
                  return (
                    <div
                      key={p.label}
                      style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "9px" }}
                    >
                      <div
                        style={{ width: "72px", fontSize: "12px", color: T.muted, textAlign: "right", flexShrink: 0 }}
                      >
                        {p.label}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: "7px",
                          background: "rgba(255,255,255,0.07)",
                          borderRadius: "99px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "99px",
                            background: barColor,
                            width: `${p.score}%`,
                            animation: "grow 1.2s ease both",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: "28px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: barColor,
                          textAlign: "right",
                        }}
                      >
                        {p.score}
                      </div>
                      <Pill tone={p.status === "flag" ? "danger" : "warn"} sm>
                        {p.status.toUpperCase()}
                      </Pill>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* ── Money Shot Findings ── */}
        <FadeIn delay={220}>
          <SectionHead kicker="MONEY SHOT" title="Critical risks detected — do not sign until these are fixed" />
          <div style={{ display: "grid", gap: "12px" }}>
            {FINDINGS.map((f, i) => (
              <div
                key={i}
                style={{
                  background: f.severity === "flag" ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)",
                  border: `1px solid ${f.severity === "flag" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.18)"}`,
                  borderRadius: "15px",
                  padding: "18px",
                }}
              >
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "11px", flexWrap: "wrap" }}
                >
                  <Pill tone={f.severity === "flag" ? "danger" : "warn"} sm>
                    {f.severity === "flag" ? "FLAG" : "WARNING"}
                  </Pill>
                  <span style={{ fontSize: "11px", color: T.faint, letterSpacing: "1px", fontFamily: T.fontMono }}>
                    {f.pillar}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "13px" }}>{f.title}</div>
                <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr 1fr" }}>
                  {[
                    ["WHY IT MATTERS", f.why],
                    ["WHAT TO DO", f.what],
                  ].map(([head, body]) => (
                    <div
                      key={head}
                      style={{
                        padding: "13px",
                        borderRadius: "10px",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(255,255,255,0.055)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: T.faint,
                          letterSpacing: "1.5px",
                          marginBottom: "7px",
                          fontFamily: T.fontMono,
                        }}
                      >
                        {head}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(241,245,249,0.77)", lineHeight: 1.65 }}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ── Pricing ── */}
        <FadeIn delay={300}>
          <SectionHead kicker="PRICING" title="Price Intelligence" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "12px" }}>
            {[
              {
                label: "Total Project Price",
                value: fmt$(DEMO.totalPrice),
                note: "Total stated in document",
                tone: "warn",
              },
              {
                label: "Openings (count)",
                value: `${DEMO.openings} openings`,
                note: "Used for comparison",
                tone: "neutral",
              },
              {
                label: "Price Per Opening",
                value: fmt$(DEMO.pricePerOpening),
                note: "Best single comparison metric",
                tone: "warn",
              },
              { label: "Market Check", value: "HIGH", note: "Elevated — request itemized lines", tone: "danger" },
            ].map((p) => (
              <Card key={p.label} style={{ padding: "16px 18px" }}>
                <div style={{ fontSize: "12px", color: T.faint, marginBottom: "4px" }}>{p.label}</div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: p.tone === "danger" ? T.red : p.tone === "warn" ? T.amber : T.green,
                  }}
                >
                  {p.value}
                </div>
                <div style={{ fontSize: "12px", color: T.faint, marginTop: "7px", lineHeight: 1.5 }}>{p.note}</div>
              </Card>
            ))}
          </div>
        </FadeIn>

        {/* ── Compliance ── */}
        <FadeIn delay={360}>
          <SectionHead kicker="COMPLIANCE" title="Hurricane + Inspection Readiness" />
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px" }}>
              {COMPLIANCE.map((c) => (
                <div
                  key={c.label}
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{c.label}</div>
                    <Pill tone={c.status === "fail" ? "danger" : c.status === "warn" ? "warn" : "success"} sm>
                      {c.status.toUpperCase()}
                    </Pill>
                  </div>
                  <div style={{ fontSize: "12px", color: T.muted, lineHeight: 1.55 }}>{c.detail}</div>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>

        {/* ── Recommendations + CTA ── */}
        <FadeIn delay={420}>
          <SectionHead kicker="WINDOW MAN RECOMMENDS" title="Protect yourself before you sign" />
          <Card>
            <div
              style={{
                display: "grid",
                gap: "10px",
                gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))",
                marginBottom: "28px",
              }}
            >
              {NEXT_STEPS.map((b, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: "rgba(6,182,212,0.04)",
                    border: "1px solid rgba(6,182,212,0.11)",
                    display: "flex",
                    gap: "11px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: T.cyan,
                      flexShrink: 0,
                      marginTop: "6px",
                    }}
                  />
                  <div style={{ fontSize: "13px", color: "rgba(241,245,249,0.82)", lineHeight: 1.65 }}>{b}</div>
                </div>
              ))}
            </div>

            {/* Primary CTA block */}
            <div
              style={{
                padding: "24px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(6,182,212,0.09), rgba(6,182,212,0.04))",
                border: "1px solid rgba(6,182,212,0.2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  letterSpacing: "2.5px",
                  color: "rgba(6,182,212,0.7)",
                  marginBottom: "10px",
                  fontFamily: T.fontMono,
                }}
              >
                THIS WAS A DEMO
              </div>
              <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
                Ready to scan YOUR actual quote?
              </div>
              <div style={{ fontSize: "14px", color: T.muted, marginBottom: "22px", lineHeight: 1.6 }}>
                Upload it in 60 seconds. Get your real Truth Report — free. Every clause, every red flag, every risk
                score.
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href="/ai-scanner"
                  onClick={() => {
                    // 🔥 PIXEL: Primary conversion event — UploadQuoteIntent (bottom CTA)
                    // window.fbq?.("trackCustom", "UploadQuoteIntent", { source: "demo_report_cta" });
                    // window.gtag?.("event", "upload_quote_cta_click", { location: "demo_report" });
                  }}
                  style={{
                    padding: "14px 28px",
                    borderRadius: "11px",
                    background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                    color: "#05101a",
                    fontWeight: 800,
                    fontSize: "15px",
                    textDecoration: "none",
                    display: "inline-block",
                    boxShadow: "0 8px 32px rgba(6,182,212,0.32)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Upload My Quote — Free →
                </a>
                <a
                  href="/consultation"
                  onClick={() => {
                    // 🔥 PIXEL: Consultation intent
                    // window.fbq?.("trackCustom", "ConsultationIntent", { source: "demo_report" });
                  }}
                  style={{
                    padding: "14px 22px",
                    borderRadius: "11px",
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${T.border}`,
                    color: T.muted,
                    fontWeight: 600,
                    fontSize: "14px",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Talk to a Window Expert
                </a>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: T.faint, marginTop: "18px", textAlign: "center", lineHeight: 1.6 }}>
              Informational only — based on extracted document signals. Not legal advice. Consult a licensed Florida
              attorney for legal interpretation.
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* ── Sticky Bottom Bar ── persistent CTA as they scroll the report */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 150,
          background: "rgba(7,11,18,0.93)",
          backdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(6,182,212,0.14)",
          padding: "13px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "940px",
            margin: "0 auto",
            display: "flex",
            gap: "14px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "14px" }}>
            <span style={{ fontWeight: 700, color: T.text }}>
              {firstName.charAt(0).toUpperCase() + firstName.slice(1)}, this is what you'll see with your real quote.
            </span>{" "}
            <span style={{ color: T.muted }}>Upload it free in 60 seconds.</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <a
              href="/ai-scanner"
              onClick={() => {
                // 🔥 PIXEL: sticky bar click — high-intent signal
                // window.fbq?.("trackCustom", "UploadQuoteIntent", { source: "demo_sticky_bar" });
              }}
              style={{
                padding: "10px 20px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                color: "#05101a",
                fontWeight: 800,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Upload My Real Quote →
            </a>
            <a
              href="/consultation"
              style={{
                padding: "10px 16px",
                borderRadius: "9px",
                border: `1px solid ${T.border}`,
                color: T.muted,
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Ask a Question
            </a>
          </div>
        </div>
      </div>

      <style>{`@keyframes grow{from{width:0}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR — DemoScanPage
// Manages the 3-phase animation sequence: terminal → reveal → report
// ─────────────────────────────────────────────────────────────────────────────
function DemoScanPage({ lead }) {
  const [phase, setPhase] = useState("scanning"); // "scanning" | "revealing" | "report"
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState(0);
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const terminalRef = useRef(null);

  const firstName = lead?.name?.split(" ")[0] || "";

  // Phase 1: stream terminal lines
  useEffect(() => {
    if (phase !== "scanning") return;
    const timers = SCAN_LINES.map((line, i) =>
      setTimeout(() => {
        setLines((prev) => [...prev, line]);
        setProgress(Math.round(((i + 1) / SCAN_LINES.length) * 100));
        requestAnimationFrame(() => {
          if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        });
      }, line.ms),
    );
    const transitionTimer = setTimeout(() => setPhase("revealing"), SCAN_LINES[SCAN_LINES.length - 1].ms + 1400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(transitionTimer);
    };
  }, [phase]);

  // Phase 2: count-up score, then transition to report
  useEffect(() => {
    if (phase !== "revealing") return;
    const target = DEMO.score;
    const duration = 1300;
    const tickMs = 16;
    const increment = target / (duration / tickMs);
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + increment, target);
      setScoreDisplay(Math.round(current));
      if (current >= target) {
        clearInterval(interval);
        setTimeout(() => setPhase("report"), 900);
      }
    }, tickMs);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === "scanning") {
    return <ScanTerminal lines={lines} progress={progress} terminalRef={terminalRef} firstName={firstName} />;
  }
  if (phase === "revealing") {
    return <ScoreReveal score={scoreDisplay} />;
  }
  return <DemoReport lead={lead} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — Drop <PowerToolFlow /> on your homepage
// ─────────────────────────────────────────────────────────────────────────────
export default function PowerToolFlow() {
  const [state, setState] = useState("idle"); // "idle" | "modal" | "demo"
  const [lead, setLead] = useState(null);

  const openModal = () => {
    // 🔥 PIXEL: ViewContent — user clicked the Power Tool button
    // window.fbq?.("track", "ViewContent", { content_name: "PowerToolModal_Open" });
    // window.gtag?.("event", "power_tool_button_click");
    setState("modal");
  };

  const handleLeadComplete = (formData) => {
    setLead(formData);
    setState("demo");
    // Pixel events fire inside LeadModal before calling this
  };

  // When in demo mode, take over the full page
  if (state === "demo") {
    return <DemoScanPage lead={lead} />;
  }

  return (
    <div className="ds-wrapper" style={{ fontFamily: DS.fontUI }}>
      <style>{DS_PAGE_STYLES}</style>
      <PowerToolButton onClick={openModal} />
      <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
        <UrgencyBadge />
      </div>
      {state === "modal" && <LeadModal onComplete={handleLeadComplete} onClose={() => setState("idle")} />}
      <TrustFooter />
    </div>
  );
}

export { LeadModal, DemoScanPage };
