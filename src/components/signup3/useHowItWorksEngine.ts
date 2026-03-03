import { useEffect, useRef } from "react";

export type CardHandle = {
  root: HTMLDivElement;
  borderBeam?: HTMLDivElement | null;
  // Optional: hook can fire callbacks; DOM-driven roulette/leverage can be built on top.
  // gradeEl?: HTMLSpanElement | null;
  // priceEl?: HTMLSpanElement | null;
};

export type HowItWorksRegistry = {
  section: HTMLElement | null;
  track: HTMLElement | null; // the horizontal "lane" the pulse moves along
  pulse: HTMLElement | null;
  cards: Array<CardHandle | null>; // length 4 (or dynamic)
  thresholds: number[]; // normalized [0..1], length == cards length
  centers: number[]; // normalized [0..1], computed from DOM (card centers along track)
};

export type HowItWorksOptions = {
  cycleMs?: number; // default 3500
  thresholds?: number[]; // default [0, 0.3, 0.6, 0.85]
  rootMargin?: string; // IO, default "200px 0px"
  ioThreshold?: number; // IO, default 0.05
  enterTol?: number; // default 0.05
  exitTol?: number; // default 0.08
  reducedMotion?: boolean;

  // Visual easing for pulse only (engine time remains linear)
  pulseEasing?: (p: number) => number;

  // Rare events only (threshold crossings). Keep these imperative.
  onStep3?: () => void;
  onStep4?: () => void;

  // Class contract names (override if you want)
  classBurst?: string; // default "stepCard--burst"
  classShadowPulse?: string; // default "stepCard--shadowPulse"
};

type EngineState = {
  running: boolean;
  destroyed: boolean;
  rafId: number | null;

  startTime: number;
  prevP: number; // previous normalized progress
  cycleMs: number;
  cycleIndex: number;

  // latches
  crossedLatch: boolean[]; // per threshold per cycle
  shadowLatch: boolean[]; // per card with hysteresis

  // housekeeping
  timeouts: Set<number>;
  io?: IntersectionObserver;
  ro?: ResizeObserver;
};

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Wraparound-safe threshold crossing:
 * - Non-wrap: prevP < t && p >= t
 * - Wrap: p < prevP => crossed if prevP < t || p >= t
 */
function crossed(prevP: number, p: number, t: number) {
  if (p >= prevP) return prevP < t && p >= t;
  return prevP < t || p >= t;
}

/** Circular distance on [0..1] */
function dist01(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

/**
 * Retriggerable burst:
 * - toggles the burst class on the card root
 * - removes it on animation end of `.borderBeam` when available
 * - falls back to timeout
 */
function triggerBurst(
  card: CardHandle,
  classBurst: string,
  timeouts: Set<number>,
  fallbackMs = 650
) {
  const el = card.root;
  if (!el) return;

  // Ensure we can retrigger even if class already present
  el.classList.remove(classBurst);
  // Minimal reflow to restart CSS animation when class re-added
  // (safe because burst is infrequent, not per-frame)
  void el.offsetWidth;
  el.classList.add(classBurst);

  const beam =
    card.borderBeam ?? (el.querySelector(".borderBeam") as HTMLDivElement | null);
  card.borderBeam = beam;

  // Prefer animationend if we have a specific animated element
  if (beam) {
    const onEnd = (ev: AnimationEvent) => {
      // Guard: only react to the border burst animation finishing
      // If you have multiple animations, optionally check ev.animationName.
      el.classList.remove(classBurst);
      beam.removeEventListener("animationend", onEnd);
    };
    beam.addEventListener("animationend", onEnd, { once: true });
    return;
  }

  // Fallback: timeout removal
  const id = window.setTimeout(() => el.classList.remove(classBurst), fallbackMs);
  timeouts.add(id);
}

function setPulseTransform(pulse: HTMLElement, pVisual: number) {
  // You can tune this: translate by percent of track width
  pulse.style.transform = `translateX(${pVisual * 100}%)`;
}

/**
 * Compute normalized centers for each card along the track.
 * Measures once per resize/relayout event (NOT per frame).
 */
function computeCenters(reg: HowItWorksRegistry) {
  const track = reg.track;
  if (!track) return;

  const trackRect = track.getBoundingClientRect();
  const left = trackRect.left;
  const width = trackRect.width || 1;

  const nextCenters: number[] = [];
  for (let i = 0; i < reg.cards.length; i++) {
    const card = reg.cards[i];
    if (!card?.root) {
      nextCenters[i] = reg.centers[i] ?? 0;
      continue;
    }
    const r = card.root.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const t = clamp01((cx - left) / width);
    nextCenters[i] = t;
  }
  reg.centers = nextCenters;
}

/**
 * useHowItWorksEngine
 * - Gates rAF with IntersectionObserver
 * - Recomputes card centers with ResizeObserver
 * - Drives pulse transform + class toggles imperatively
 */
export function useHowItWorksEngine(
  registryRef: React.RefObject<HowItWorksRegistry>,
  opts: HowItWorksOptions = {}
) {
  const engineRef = useRef<EngineState | null>(null);

  useEffect(() => {
    const reg = registryRef.current;
    if (!reg) return;

    const reducedMotion = !!opts.reducedMotion;
    if (reducedMotion) {
      // If reduced motion, ensure everything is visible and stop here.
      // (You can also add "entered" classes externally.)
      return;
    }

    const cycleMs = opts.cycleMs ?? 3500;
    const thresholds = opts.thresholds ?? reg.thresholds ?? [0, 0.3, 0.6, 0.85];
    reg.thresholds = thresholds;

    const classBurst = opts.classBurst ?? "stepCard--burst";
    const classShadow = opts.classShadowPulse ?? "stepCard--shadowPulse";

    const enterTol = opts.enterTol ?? 0.05;
    const exitTol = opts.exitTol ?? 0.08;

    const pulseEasing =
      opts.pulseEasing ??
      ((p: number) => {
        // Default: mild ease-in-out; keeps “thinking time” feel without distorting engine logic
        // This maps [0..1] -> [0..1]
        return 0.5 - 0.5 * Math.cos(Math.PI * p);
      });

    const engine: EngineState = {
      running: false,
      destroyed: false,
      rafId: null,
      startTime: 0,
      prevP: 0,
      cycleMs,
      cycleIndex: 0,
      crossedLatch: new Array(thresholds.length).fill(false),
      shadowLatch: new Array(reg.cards.length).fill(false),
      timeouts: new Set<number>(),
    };

    engineRef.current = engine;

    function stop() {
      engine.running = false;
      if (engine.rafId != null) cancelAnimationFrame(engine.rafId);
      engine.rafId = null;
    }

    function start() {
      if (engine.destroyed || engine.running) return;
      // Ensure we have necessary nodes
      const r = registryRef.current;
      if (!r?.section || !r.track || !r.pulse) return;

      // Initialize time anchor only on first start
      const now = performance.now();
      if (!engine.startTime) engine.startTime = now;
      engine.running = true;
      engine.rafId = requestAnimationFrame(tick);
    }

    function tick(now: number) {
      if (engine.destroyed || !engine.running) return;

      const r = registryRef.current;
      if (!r?.pulse) return;

      const elapsed = now - engine.startTime;
      const p = (elapsed % engine.cycleMs) / engine.cycleMs; // 0..1
      const wrapped = p < engine.prevP;

      if (wrapped) {
        engine.cycleIndex++;
        engine.crossedLatch.fill(false);
        // shadowLatch persists (hysteresis will resolve naturally)
      }

      // Pulse visual easing (DO NOT use this for triggers; triggers use linear p)
      const pVisual = clamp01(pulseEasing(p));
      setPulseTransform(r.pulse, pVisual);

      // Threshold triggers -> bursts + rare callbacks
      for (let i = 0; i < thresholds.length; i++) {
        if (engine.crossedLatch[i]) continue;

        const t = thresholds[i];
        if (crossed(engine.prevP, p, t)) {
          engine.crossedLatch[i] = true;

          const card = r.cards[i];
          if (card?.root) {
            triggerBurst(card, classBurst, engine.timeouts);

            // Rare hooks: only on Step 3/4 thresholds (if defined)
            if (i === 2 && opts.onStep3) opts.onStep3();
            if (i === 3 && opts.onStep4) opts.onStep4();
          }
        }
      }

      // Proximity triggers -> shadow pulse (hysteresis)
      const centers = r.centers;
      for (let i = 0; i < r.cards.length; i++) {
        const card = r.cards[i];
        if (!card?.root) continue;

        const c = centers[i] ?? thresholds[i] ?? 0;
        const d = dist01(p, c);
        const latched = engine.shadowLatch[i];

        if (!latched && d < enterTol) {
          engine.shadowLatch[i] = true;
          card.root.classList.add(classShadow);
        } else if (latched && d > exitTol) {
          engine.shadowLatch[i] = false;
          card.root.classList.remove(classShadow);
        }
      }

      engine.prevP = p;
      engine.rafId = requestAnimationFrame(tick);
    }

    // IntersectionObserver: gate rAF
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        const inView = !!e?.isIntersecting;
        if (inView) start();
        else stop();
      },
      {
        threshold: opts.ioThreshold ?? 0.05,
        rootMargin: opts.rootMargin ?? "200px 0px",
      }
    );
    engine.io = io;

    if (reg.section) io.observe(reg.section);

    // ResizeObserver: recompute centers (no per-frame reads)
    const ro = new ResizeObserver(() => {
      const rr = registryRef.current;
      if (!rr) return;
      // Schedule measurement on next animation frame to avoid layout thrash
      requestAnimationFrame(() => computeCenters(rr));
    });
    engine.ro = ro;

    if (reg.track) ro.observe(reg.track);
    // Also observe card roots if you want robust layout updates
    for (const c of reg.cards) if (c?.root) ro.observe(c.root);

    // Initial measurement (once mounted)
    requestAnimationFrame(() => computeCenters(reg));

    // Cleanup
    return () => {
      engine.destroyed = true;
      stop();

      if (engine.io) engine.io.disconnect();
      if (engine.ro) engine.ro.disconnect();

      // Clear timeouts
      engine.timeouts.forEach((id) => clearTimeout(id));
      engine.timeouts.clear();

      // Remove transient classes (optional but keeps DOM clean)
      const rr = registryRef.current;
      if (rr) {
        for (const c of rr.cards) {
          c?.root?.classList.remove(classBurst);
          c?.root?.classList.remove(classShadow);
        }
      }

      engineRef.current = null;
    };
    // Intentionally not depending on registryRef.current (it mutates by design)
    // Re-run only when reducedMotion toggles or options that change engine semantics change.
  }, [
    registryRef,
    opts.cycleMs,
    opts.reducedMotion,
    opts.ioThreshold,
    opts.rootMargin,
    opts.enterTol,
    opts.exitTol,
    opts.classBurst,
    opts.classShadowPulse,
    opts.onStep3,
    opts.onStep4,
    opts.pulseEasing,
  ]);
}