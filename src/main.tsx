import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./styles/impact-window.css";
import { initializeAttribution } from "./lib/attribution";

// Defer attribution capture to idle time for better TBT
// Safe because initializeAttribution reads from window.location which is always available
const scheduleAttribution = () => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => initializeAttribution(), { timeout: 2000 });
  } else {
    setTimeout(initializeAttribution, 1);
  }
};
scheduleAttribution();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <App />
  </ThemeProvider>
);
