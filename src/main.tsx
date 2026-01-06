import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeAttribution } from "./lib/attribution";

// Capture attribution data on app load (persists to localStorage)
initializeAttribution();

createRoot(document.getElementById("root")!).render(<App />);
