import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./styles/impact-window.css";
import { initializeAttribution } from "./lib/attribution";
import { pushBotSignalToDataLayer } from "./lib/botDetection";
import { installTruthEngine } from "./lib/gtm";
import { reconcileIdentities } from "./lib/identityReconciliation";
import { scheduleWhenIdle } from "./lib/deferredInit";

// ══════════════════════════════════════════════════════════════════════════════
// DEFERRED INITIALIZATION (Performance Optimization)
// ══════════════════════════════════════════════════════════════════════════════
// All non-critical tracking is deferred to idle time to improve TBT/INP.
// The page renders immediately; tracking initializes ~3 seconds later.

// Defer bot detection - bots don't care about UX, and we need the signal
// before conversions, not before first paint
scheduleWhenIdle(() => {
  pushBotSignalToDataLayer();
  console.log('[Bot Detection] Initialized (deferred)');
}, { minDelay: 3000, timeout: 5000 });

// Install TruthEngine on window for debugging and cross-module access
// This is lightweight and can run synchronously
installTruthEngine();

// Defer identity reconciliation - the identity system has lazy getters
// so early tracking calls still work correctly
scheduleWhenIdle(() => {
  const goldenThreadFID = reconcileIdentities();
  console.log(`[Golden Thread] Active FID: ${goldenThreadFID} (deferred)`);
}, { minDelay: 1000, timeout: 3000 });

// Defer attribution capture to idle time for better TBT
scheduleWhenIdle(() => {
  initializeAttribution();
}, { minDelay: 500, timeout: 2000 });

// ══════════════════════════════════════════════════════════════════════════════
// RENDER (Immediate - No Blocking)
// ══════════════════════════════════════════════════════════════════════════════
createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);
