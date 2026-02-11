import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Component-local themeable tokens (art-direction names preserved) ─────────
const C = {
  // Surfaces
  bg: "hsl(var(--sp-bg) / 0.55)",
  bgCard: "hsl(var(--sp-card))",

  // Accent (was "cyan" in the original art direction)
  cyan: "hsl(var(--sp-accent))",
  cyanDim: "hsl(var(--sp-accent) / 0.12)",
  cyanMid: "hsl(var(--sp-accent) / 0.35)",
  cyanGlow: "hsl(var(--sp-accent) / 0.55)",
  cyanBright: "hsl(var(--sp-accent) / 0.85)",

  // Destructive (red flag)
  red: "hsl(var(--sp-danger))",
  redDim: "hsl(var(--sp-danger) / 0.15)",
  redMid: "hsl(var(--sp-danger) / 0.4)",

  // Status colors (data states, not theme accents)
  green: "#4ade80",
  greenDim: "rgba(74,222,128,0.2)",

  // Text
  white: "hsl(var(--sp-fg))",
  whiteDim: "hsl(var(--sp-muted))",
  whiteFaint: "hsl(var(--sp-border))",
};

// ─── Scoped Keyframes ─────────────────────────────────────────────────────────
const SCOPED_STYLES = `
/* Component-local CSS variables: Light defaults + Dark overrides */
.sp-pipeline-root {
  --sp-bg: var(--muted);
  --sp-card: var(--card);
  --sp-accent: var(--primary);
  --sp-danger: var(--destructive);
  --sp-fg: var(--foreground);
  --sp-muted: var(--muted-foreground);
  --sp-border: var(--border);
}
.dark .sp-pipeline-root {
  --sp-bg: var(--background);
  --sp-card: var(--card);
  --sp-accent: var(--primary);
  --sp-danger: var(--destructive);
  --sp-fg: var(--foreground);
  --sp-muted: var(--muted-foreground);
  --sp-border: var(--border);
}

@keyframes sp-streamRight { 0% { left: -6px; opacity: 0; } 5% { opacity: 1; } 90% { opacity: 1; } 100% { left: calc(100% + 6px); opacity: 0; } }
@keyframes sp-streamDown { 0% { top: -6px; opacity: 0; } 5% { opacity: 1; } 90% { opacity: 1; } 100% { top: calc(100% + 6px); opacity: 0; } }
@keyframes sp-sonarPing { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.8); opacity: 0; } }
@keyframes sp-breathe { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
@keyframes sp-coreGlow { 0%, 100% { box-shadow: 0 0 20px hsl(var(--sp-accent) / 0.20), 0 0 40px hsl(var(--sp-accent) / 0.10); } 50% { box-shadow: 0 0 30px hsl(var(--sp-accent) / 0.35), 0 0 60px hsl(var(--sp-accent) / 0.15); } }
@keyframes sp-rotate { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
@keyframes sp-rotateReverse { from { transform: translate(-50%,-50%) rotate(360deg); } to { transform: translate(-50%,-50%) rotate(0deg); } }
@keyframes sp-flagWave { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
@keyframes sp-scanLine { 0% { top: -2px; } 100% { top: calc(100% + 2px); } }
@keyframes sp-textFlicker { 0%, 95%, 100% { opacity: 1; } 96% { opacity: 0.3; } }
@keyframes sp-dataFlow { 0% { stroke-dashoffset: 20; } 100% { stroke-dashoffset: 0; } }
@keyframes sp-checkPop { 0% { transform: scale(0) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.2) rotate(3deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
@keyframes sp-dbPulse { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }
@keyframes sp-vpFadeOut { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-8px); } }
@keyframes sp-vpFadeIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }

@media (prefers-reduced-motion: reduce) {
  .sp-pipeline-root * {
    animation: none !important;
    transition: none !important;
  }
}
`;

// ─── Value Propositions (preserved) ───────────────────────────────────────────
const VALUE_PROPS = [
  "⚠️ {80%} of quotes contain hidden errors. Find yours before you sign.",
  "🔒 100% {Private} Analysis — Your contractor will never know.",
  "💪 Shift the power dynamic. Negotiate with {facts}, not feelings.",
  "🧐 See exactly what your contractor is hoping you won't notice.",
  "🧠 Translates 'Contractor Jargon' into plain English warnings.",
  "⏱️ Faster (and more accurate) than getting a {second opinion}.",
  "⚖️ The only {unbiased}, non-commissioned review in the industry.",
];

function renderHighlighted(text: string): ReactNode[] {
  return text.split(/\{(.*?)\}/g).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color: "hsl(var(--primary))", fontWeight: 600 }}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ─── Rotating Value Prop (preserved) ──────────────────────────────────────────
function RotatingValueProp({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);
  const [animClass, setAnimClass] = useState<"in" | "out" | "none">("in");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!active) return;
    timerRef.current = setInterval(() => {
      if (prefersReducedMotion) {
        setIndex((prev) => (prev + 1) % VALUE_PROPS.length);
        return;
      }
      setAnimClass("out");
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % VALUE_PROPS.length);
        setAnimClass("in");
      }, 300);
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, prefersReducedMotion]);

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: 16,
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s",
      }}
    >
      <p
        style={{
          fontSize: 14,
          color: "hsl(var(--muted-foreground))",
          margin: 0,
          lineHeight: 1.5,
          animation:
            prefersReducedMotion || animClass === "none"
              ? "none"
              : animClass === "out"
                ? "sp-vpFadeOut 0.3s ease forwards"
                : "sp-vpFadeIn 0.3s ease forwards",
        }}
      >
        {renderHighlighted(VALUE_PROPS[index])}
      </p>
    </div>
  );
}

// ─── Particle Beam ────────────────────────────────────────────────────────────
interface ParticleBeamProps {
  direction?: "right" | "down";
  width?: string | number;
  height?: number;
  count?: number;
  speed?: number;
  color?: string;
  style?: CSSProperties;
}

function ParticleBeam({
  direction = "right",
  width = "100%",
  height = 40,
  count = 7,
  speed = 1.6,
  color = C.cyan,
  style = {},
}: ParticleBeamProps) {
  const isH = direction === "right";
  const animName = isH ? "sp-streamRight" : "sp-streamDown";

  return (
    <div
      style={{
        position: "relative",
        width: isH ? width : 2,
        height: isH ? 2 : height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {/* Track line */}
      <div
        style={{
          position: "absolute",
          width: isH ? "100%" : 2,
          height: isH ? 2 : "100%",
          background: `linear-gradient(${isH ? "90deg" : "180deg"}, transparent, ${C.cyanDim}, transparent)`,
          borderRadius: 1,
        }}
      />
      {/* Particles */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}`,
            opacity: 0,
            animation: `${animName} ${speed}s linear ${(i * speed) / count}s infinite`,
            ...(isH ? { top: "50%", transform: "translateY(-50%)" } : { left: "50%", transform: "translateX(-50%)" }),
          }}
        />
      ))}
    </div>
  );
}

// ─── Circuit Traces (background SVG) ──────────────────────────────────────────
function CircuitTraces({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="10%"
        y1="20%"
        x2="40%"
        y2="20%"
        stroke={C.cyan}
        strokeWidth="0.5"
        strokeDasharray="4 4"
        style={{ animation: "sp-dataFlow 3s linear infinite" }}
      />
      <line
        x1="60%"
        y1="30%"
        x2="90%"
        y2="30%"
        stroke={C.cyan}
        strokeWidth="0.5"
        strokeDasharray="4 4"
        style={{ animation: "sp-dataFlow 3s linear 0.5s infinite" }}
      />
      <line
        x1="20%"
        y1="70%"
        x2="50%"
        y2="70%"
        stroke={C.cyan}
        strokeWidth="0.5"
        strokeDasharray="4 4"
        style={{ animation: "sp-dataFlow 3s linear 1s infinite" }}
      />
      <line
        x1="70%"
        y1="80%"
        x2="95%"
        y2="80%"
        stroke={C.cyan}
        strokeWidth="0.5"
        strokeDasharray="4 4"
        style={{ animation: "sp-dataFlow 3s linear 1.5s infinite" }}
      />
      <circle cx="10%" cy="20%" r="2" fill={C.cyan} opacity="0.4" />
      <circle cx="90%" cy="30%" r="2" fill={C.cyan} opacity="0.4" />
    </svg>
  );
}

// ─── Forensic Badge Banner ────────────────────────────────────────────────────
function ForensicBadge({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 8 : 16,
        marginBottom: isMobile ? 16 : 24,
        textAlign: "center",
      }}
    >
      {/* Hexagon icon */}
      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
        <svg viewBox="0 0 40 40" width="40" height="40">
          <polygon
            points="20,2 36,11 36,29 20,38 4,29 4,11"
            fill="none"
            stroke={C.cyan}
            strokeWidth="1.5"
            opacity="0.6"
          />
          <polygon
            points="20,8 30,14 30,26 20,32 10,26 10,14"
            fill={C.cyanDim}
            stroke={C.cyan}
            strokeWidth="0.5"
            opacity="0.8"
          />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <circle
                key={i}
                cx={20 + Math.cos(a) * 14}
                cy={20 + Math.sin(a) * 14}
                r="1.5"
                fill={C.cyan}
                opacity="0.5"
                style={{ animation: `sp-breathe 2s ease-in-out ${i * 0.25}s infinite` }}
              />
            );
          })}
          <text x="20" y="23" textAnchor="middle" fill={C.cyan} fontSize="10" fontWeight="700">
            AI
          </text>
        </svg>
      </div>
      {/* Text */}
      <div>
        <div
          style={{
            fontSize: isMobile ? 13 : 15,
            fontWeight: 700,
            color: C.cyan,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
          }}
        >
          FORENSIC ALLY
        </div>
        <div
          style={{
            fontSize: isMobile ? 9 : 10,
            color: C.whiteDim,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            marginTop: 2,
          }}
        >
          FOR IMPACT WINDOW DECISIONS
        </div>
      </div>
    </div>
  );
}

// ─── Scene 1: Extraction ──────────────────────────────────────────────────────
function ExtractionScene({ isMobile }: { isMobile: boolean }) {
  const docW = isMobile ? 56 : 66;
  const docH = isMobile ? 72 : 84;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isMobile ? "16px 8px" : "20px 12px",
        position: "relative",
      }}
    >
      {/* Document illustration */}
      <div style={{ position: "relative", width: docW + 24, height: docH + 10, marginBottom: 12 }}>
        {/* Shadow copies */}
        {[2, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: docW,
              height: docH,
              borderRadius: 4,
              background: C.bgCard,
              border: `1px solid ${C.cyanDim}`,
              top: i * 4,
              left: i * 4 + 8,
              opacity: 0.4,
            }}
          />
        ))}
        {/* Main document */}
        <div
          style={{
            position: "relative",
            width: docW,
            height: docH,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${C.bgCard}, hsl(var(--sp-bg)))`,
            border: `1px solid ${C.cyanMid}`,
            left: 8,
            overflow: "hidden",
          }}
        >
          {/* PDF label */}
          <div
            style={{
              fontSize: isMobile ? 7 : 8,
              fontWeight: 700,
              color: C.cyan,
              textAlign: "center",
              marginTop: 5,
              letterSpacing: "0.1em",
              fontFamily: "monospace",
            }}
          >
            PDF
          </div>
          {/* Text lines */}
          {[24, 34, 43, 52, 61, 70, 79].map((y, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "15%",
                top: `${y}%`,
                width: `${55 + (i % 3) * 10}%`,
                height: 2,
                background: C.whiteFaint,
                borderRadius: 1,
                animation: `sp-textFlicker 4s ease ${i * 0.3}s infinite`,
              }}
            />
          ))}
          {/* Scan line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: "100%",
              height: 2,
              background: `linear-gradient(90deg, transparent, ${C.cyanBright}, transparent)`,
              boxShadow: `0 0 8px ${C.cyan}`,
              animation: "sp-scanLine 2.5s ease-in-out infinite",
              top: 0,
            }}
          />
        </div>
      </div>

      {/* Extracted data fragments */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: isMobile ? 16 : 20,
              height: isMobile ? 8 : 10,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${C.cyanDim}, ${C.cyanMid})`,
              opacity: 0.6,
              animation: `sp-breathe 2s ease ${i * 0.2}s infinite`,
            }}
          >
            <div
              style={{
                width: "60%",
                height: 2,
                background: C.cyan,
                borderRadius: 1,
                margin: "3px auto 0",
                opacity: 0.5,
              }}
            />
          </div>
        ))}
      </div>

      {/* Labels */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: isMobile ? 22 : 13, fontWeight: 600, color: C.cyan, letterSpacing: "0.05em" }}>
          EXTRACTION
        </div>
        <div style={{ fontSize: isMobile ? 16 : 9, color: C.whiteDim, marginTop: 2, lineHeight: 1.3 }}>
          Raw PDF/text parsed
          <br />
          into structured JSON
        </div>
      </div>
    </div>
  );
}

// ─── Scene 2: AI Brain ────────────────────────────────────────────────────────
function AIBrainScene({ isMobile }: { isMobile: boolean }) {
  const nodes = 12;
  const outerR = isMobile ? 110 : 140;
  const innerR = isMobile ? 80 : 100;
  const chipSize = isMobile ? 50 : 60;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isMobile ? "16px 8px" : "20px 12px",
        position: "relative",
      }}
    >
      {/* Outer orbit ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: outerR,
          height: outerR,
          borderRadius: "50%",
          border: `1px solid ${C.cyanDim}`,
          animation: "sp-rotate 20s linear infinite",
          transform: "translate(-50%, -50%)",
        }}
      >
        {Array.from({ length: nodes }).map((_, i) => {
          const a = (i / nodes) * Math.PI * 2;
          const r = outerR / 2 - 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: C.cyan,
                opacity: 0.5,
                top: `calc(50% + ${Math.sin(a) * r}px - 2px)`,
                left: `calc(50% + ${Math.cos(a) * r}px - 2px)`,
                animation: `sp-breathe 2s ease ${i * 0.15}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Inner orbit ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: innerR,
          height: innerR,
          borderRadius: "50%",
          border: `1px dashed ${C.cyanDim}`,
          animation: "sp-rotateReverse 15s linear infinite",
          transform: "translate(-50%, -50%)",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r = innerR / 2 - 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: C.cyanGlow,
                top: `calc(50% + ${Math.sin(a) * r}px - 1.5px)`,
                left: `calc(50% + ${Math.cos(a) * r}px - 1.5px)`,
              }}
            />
          );
        })}
      </div>

      {/* Central chip */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: chipSize,
          height: chipSize,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${C.bgCard}, hsl(var(--sp-bg)))`,
          border: `1.5px solid ${C.cyanMid}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          animation: "sp-coreGlow 3s ease-in-out infinite",
        }}
      >
        <svg viewBox="0 0 20 20" width={isMobile ? 16 : 20} height={isMobile ? 16 : 20}>
          <rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke={C.cyan} strokeWidth="1" />
          <circle cx="10" cy="10" r="3" fill={C.cyanDim} stroke={C.cyan} strokeWidth="0.5" />
          <line x1="10" y1="3" x2="10" y2="7" stroke={C.cyan} strokeWidth="0.5" opacity="0.6" />
        </svg>
        <div
          style={{ fontSize: isMobile ? 7 : 8, fontWeight: 700, color: C.cyan, marginTop: 2, fontFamily: "monospace" }}
        >
          AI
        </div>
        {/* Sonar ping */}
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 14,
            border: `1px solid ${C.cyan}`,
            opacity: 0,
            animation: "sp-sonarPing 2.5s ease-out infinite",
          }}
        />
      </div>

      {/* Connection traces */}
      {[
        { x: -32, y: -16, w: 20, h: 1 },
        { x: -28, y: 4, w: 16, h: 1 },
        { x: -24, y: 16, w: 14, h: 1 },
        { x: 32, y: -16, w: 20, h: 1 },
        { x: 28, y: 4, w: 16, h: 1 },
        { x: 24, y: 16, w: 14, h: 1 },
        { x: -7, y: -32, w: 1, h: 14 },
        { x: 7, y: -32, w: 1, h: 14 },
        { x: -7, y: 32, w: 1, h: 14 },
        { x: 7, y: 32, w: 1, h: 14 },
      ].map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: `calc(50% + ${t.y}px)`,
            left: `calc(50% + ${t.x}px)`,
            width: t.w,
            height: t.h,
            background: C.cyanDim,
            borderRadius: 1,
          }}
        />
      ))}

      {/* Labels */}
      <div
        style={{ position: "absolute", bottom: isMobile ? 12 : 16, left: 0, right: 0, textAlign: "center", zIndex: 3 }}
      >
        <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 600, color: C.cyan, letterSpacing: "0.05em" }}>
          CONTEXT INJECTION
        </div>
        <div style={{ fontSize: isMobile ? 7 : 8, color: C.whiteDim, marginTop: 2, lineHeight: 1.3 }}>
          AI cross-references against
          <br />
          Ground Truth database
        </div>
      </div>

      {/* Secondary label */}
      <div style={{ position: "absolute", top: isMobile ? 12 : 16, left: 0, right: 0, textAlign: "center", zIndex: 3 }}>
        <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, color: C.red, letterSpacing: "0.05em" }}>
          ANOMALY DETECTION
        </div>
        <div style={{ fontSize: isMobile ? 14 : 8, color: C.whiteDim, marginTop: 1, lineHeight: 1.3 }}>
          Flags &quot;Red Flags&quot; like
          <br />
          bundled labor costs
        </div>
      </div>
    </div>
  );
}

// ─── Scene 3: Database ────────────────────────────────────────────────────────
function DatabaseScene({ isMobile }: { isMobile: boolean }) {
  const dbW = isMobile ? 60 : 72;
  const dbH = isMobile ? 78 : 92;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isMobile ? "16px 8px" : "20px 12px",
        position: "relative",
      }}
    >
      {/* Database cylinder */}
      <div
        style={{
          position: "relative",
          width: dbW,
          height: dbH,
          margin: "0 auto 12px",
          animation: "sp-dbPulse 3s ease-in-out infinite",
        }}
      >
        {/* Top ellipse */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: dbW,
            height: dbW * 0.35,
            borderRadius: "50%",
            background: `linear-gradient(180deg, ${C.cyanMid}, ${C.cyanDim})`,
            border: `1px solid ${C.cyanMid}`,
            zIndex: 2,
          }}
        />
        {/* Body */}
        <div
          style={{
            position: "absolute",
            top: dbW * 0.175,
            left: 0,
            width: dbW,
            height: dbH - dbW * 0.35,
            background: `linear-gradient(180deg, ${C.bgCard}, hsl(var(--sp-bg)))`,
            borderLeft: `1px solid ${C.cyanDim}`,
            borderRight: `1px solid ${C.cyanDim}`,
          }}
        >
          {/* Data rows */}
          {[16, 30, 44].map((y, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "12%",
                top: `${y}%`,
                width: "76%",
                height: 3,
                background: `linear-gradient(90deg, ${C.cyanDim}, ${C.cyanMid}, ${C.cyanDim})`,
                borderRadius: 1,
                animation: `sp-breathe 2s ease ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>
        {/* Bottom ellipse */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: dbW,
            height: dbW * 0.35,
            borderRadius: "50%",
            background: `linear-gradient(180deg, ${C.cyanDim}, hsl(var(--sp-bg)))`,
            border: `1px solid ${C.cyanDim}`,
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.cyanDim} 0%, transparent 70%)`,
            animation: "sp-breathe 3s ease infinite",
          }}
        />
      </div>

      {/* Data fragments */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 8 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              width: isMobile ? 12 : 16,
              height: isMobile ? 6 : 8,
              borderRadius: 2,
              background: C.cyanDim,
              animation: `sp-breathe 2s ease ${i * 0.15}s infinite`,
            }}
          >
            <div
              style={{
                width: "50%",
                height: 1.5,
                background: C.cyan,
                borderRadius: 1,
                margin: "2px auto 0",
                opacity: 0.4,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scene 4: Red Flag Report ─────────────────────────────────────────────────
function RedFlagScene({ isMobile }: { isMobile: boolean }) {
  const w = isMobile ? 160 : 140;
  const h = isMobile ? 175 : 170;
  const items = [
    { type: "flag", label: "Bundled labor", y: 34 },
    { type: "check", label: "Impact rating", y: 56 },
    { type: "flag", label: "Hidden markup", y: 78 },
    { type: "check", label: "Permit fees", y: 100 },
    { type: "warn", label: "Missing NOA", y: 122 },
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isMobile ? "16px 8px" : "20px 12px",
        position: "relative",
      }}
    >
      <div style={{ position: "relative", width: w, height: h }}>
        {/* Report card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: `linear-gradient(180deg, ${C.bgCard}, hsl(var(--sp-bg)))`,
            border: `1px solid ${C.redDim}`,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 10px",
              borderBottom: `1px solid ${C.redDim}`,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              style={{ animation: "sp-flagWave 2s ease-in-out infinite", transformOrigin: "bottom left" }}
            >
              <rect x="1" y="0" width="1.5" height="12" fill={C.red} />
              <path d="M2.5,0 L11,0 L9,3 L11,6 L2.5,6 Z" fill={C.red} opacity="0.8" />
            </svg>
            <span
              style={{
                fontSize: isMobile ? 7 : 8,
                fontWeight: 700,
                color: C.red,
                letterSpacing: "0.08em",
                fontFamily: "monospace",
              }}
            >
              RED FLAG REPORT
            </span>
          </div>

          {/* Items */}
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 10,
                top: item.y,
                display: "flex",
                alignItems: "center",
                gap: 6,
                animation: `sp-checkPop 0.4s ease ${0.5 + i * 0.15}s both`,
              }}
            >
              {item.type === "flag" ? (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: C.redDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="6" height="6" viewBox="0 0 6 6">
                    <path
                      d="M0.5,0 L0.5,6 M0.5,0 L5,0 L4,1.5 L5,3 L0.5,3"
                      stroke={C.red}
                      strokeWidth="0.8"
                      fill="none"
                    />
                  </svg>
                </div>
              ) : item.type === "check" ? (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: C.greenDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="6" height="6" viewBox="0 0 6 6">
                    <path d="M1,3 L2.5,4.5 L5,1.5" stroke={C.green} strokeWidth="1" fill="none" />
                  </svg>
                </div>
              ) : (
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "rgba(251,191,36,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="6" height="6" viewBox="0 0 6 6">
                    <path d="M3,0.5 L5.5,5 L0.5,5 Z" stroke="#fbbf24" strokeWidth="0.8" fill="none" />
                    <line x1="3" y1="2.5" x2="3" y2="3.5" stroke="#fbbf24" strokeWidth="0.8" />
                  </svg>
                </div>
              )}
              <span style={{ fontSize: isMobile ? 8 : 9, color: C.whiteDim, fontFamily: "monospace" }}>
                {item.label}
              </span>
            </div>
          ))}

          {/* Corner decorations */}
          {[-1, 1].map((side) => (
            <div
              key={side}
              style={{
                position: "absolute",
                bottom: 8,
                [side === -1 ? "left" : "right"]: 8,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d={side === -1 ? "M0,12 L0,4 L4,0" : "M12,12 L12,4 L8,0"}
                  stroke={C.red}
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.3"
                />
                <circle cx={side === -1 ? 0 : 12} cy="12" r="1.5" fill={C.red} opacity="0.3" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Vertical Beam (mobile connector) ─────────────────────────────────────────
function VerticalBeam({ color = C.cyan, visible }: { color?: string; visible: boolean }) {
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        justifyContent: "center",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <ParticleBeam direction="down" height={44} count={5} speed={1.2} color={color} />
    </div>
  );
}

// ━━━ MAIN EXPORT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function ScanPipelineStrip() {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // IntersectionObserver scroll-trigger
  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [prefersReducedMotion]);

  const cell = (delay: number, borderOverride?: string): CSSProperties => ({
    position: "relative",
    background: C.bgCard,
    borderRadius: 16,
    border: `1px solid ${borderOverride || C.cyanDim}`,
    overflow: "hidden",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 0.6s ${delay}s ease, transform 0.6s ${delay}s ease`,
  });

  return (
    <div ref={containerRef} className="sp-pipeline-root">
      <style>{SCOPED_STYLES}</style>

      <div
        className="bg-muted/50 dark:bg-background/40 rounded-[20px] relative overflow-hidden max-w-[960px] mx-auto"
        style={{ padding: isMobile ? "24px 12px" : "32px 28px" }}
      >
        <CircuitTraces />

        {/* Banner */}
        <ForensicBadge isMobile={isMobile} />

        {isMobile ? (
          /* ━━━ MOBILE: VERTICAL STACK ━━━ */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ ...cell(0.1), height: 220 }}>
              <CircuitTraces opacity={0.05} />
              <ExtractionScene isMobile={isMobile} />
            </div>

            <VerticalBeam visible={visible} />

            <div style={{ ...cell(0.3), height: 240 }}>
              <CircuitTraces opacity={0.05} />
              <AIBrainScene isMobile={isMobile} />
            </div>

            <VerticalBeam visible={visible} />

            <div style={{ ...cell(0.5), height: 180 }}>
              <CircuitTraces opacity={0.05} />
              <DatabaseScene isMobile={isMobile} />
            </div>

            <VerticalBeam color={C.red} visible={visible} />

            <div style={{ ...cell(0.7, C.redDim), height: 210 }}>
              <RedFlagScene isMobile={isMobile} />
            </div>
          </div>
        ) : (
          /* ━━━ DESKTOP: HORIZONTAL GRID ━━━ */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1.3fr auto 0.8fr auto 1fr",
              alignItems: "center",
              gap: 0,
            }}
          >
            <div style={{ ...cell(0.1), height: 240 }}>
              <CircuitTraces opacity={0.05} />
              <ExtractionScene isMobile={false} />
            </div>

            <div style={{ padding: "0 4px", display: "flex", alignItems: "center", width: 60 }}>
              <ParticleBeam direction="right" count={5} speed={1.8} />
            </div>

            <div style={{ ...cell(0.3), height: 240 }}>
              <CircuitTraces opacity={0.05} />
              <AIBrainScene isMobile={false} />
            </div>

            <div style={{ padding: "0 4px", display: "flex", alignItems: "center", width: 60 }}>
              <ParticleBeam direction="right" count={5} speed={1.8} />
            </div>

            <div style={{ ...cell(0.5), height: 240 }}>
              <CircuitTraces opacity={0.05} />
              <DatabaseScene isMobile={false} />
            </div>

            <div style={{ padding: "0 4px", display: "flex", alignItems: "center", width: 60 }}>
              <ParticleBeam direction="right" count={5} speed={1.8} color={C.red} />
            </div>

            <div style={{ ...cell(0.7, C.redDim), height: 240 }}>
              <RedFlagScene isMobile={false} />
            </div>
          </div>
        )}

        <RotatingValueProp active={visible} />
      </div>
    </div>
  );
}
