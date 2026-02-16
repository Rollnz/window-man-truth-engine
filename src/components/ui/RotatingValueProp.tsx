import { useState, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

// ─── Audit-Optimized Value Propositions (urgency-first ordering) ──────────────
const VALUE_PROPS = [
  "⚠️ {80%} of quotes contain hidden errors. Find yours before you sign.",
  "⚖️ The only {unbiased}, non-commissioned review in the industry.",
  "🔒 100% {Private} — Your contractor will never know you scanned this.",
  "🧠 Our AI X-Ray decodes contractor jargon into plain English {red flags}.",
  "💪 Shift the power dynamic. Negotiate with {facts}, not feelings.",
  "⏱️ Faster (and more accurate) than getting a {second opinion}.",
  "🧐 See exactly what your contractor is hoping you {won't notice}.",
];

export { VALUE_PROPS };

export function renderHighlighted(text: string): ReactNode[] {
  return text.split(/\{(.*?)\}/g).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-primary font-semibold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// ─── Shared Rotating Value Prop ───────────────────────────────────────────────

interface RotatingValuePropProps {
  active: boolean;
  /** 'light' for /ai-scanner (light bg), 'dark' for /audit (dark bg) */
  variant?: "light" | "dark";
  /** Show progress dot indicators below text */
  showDots?: boolean;
}

export function RotatingValueProp({
  active,
  variant = "light",
  showDots = false,
}: RotatingValuePropProps) {
  const [index, setIndex] = useState(0);
  const [animClass, setAnimClass] = useState<"in" | "out" | "none">("in");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const isDark = variant === "dark";

  return (
    <AnimateOnScroll delay={200} duration={500} threshold={0.2}>
      <div
        className={cn(
          "text-center my-6 flex flex-col items-center justify-center",
          active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        style={{ transition: "opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s" }}
      >
        {/* Chip-style value prop */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full border min-h-[44px]",
            isDark
              ? "bg-slate-800/60 border-slate-700/50"
              : "bg-muted/60 border-border/50"
          )}
        >
          <p
            className={cn(
              "text-sm leading-relaxed m-0",
              isDark ? "text-slate-300" : "text-muted-foreground"
            )}
            style={{
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

        {/* Progress dots */}
        {showDots && (
          <div className="flex justify-center gap-1.5 mt-3">
            {VALUE_PROPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors duration-300",
                  i === index
                    ? "bg-primary"
                    : isDark
                      ? "bg-slate-700"
                      : "bg-border"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </AnimateOnScroll>
  );
}
