import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listQuoteAnalysesTool from "./tools/list-quote-analyses";
import getQuoteAnalysisTool from "./tools/get-quote-analysis";

// Construct the direct Supabase issuer from the project ref. Never derive from
// SUPABASE_URL (which is a .lovable.cloud proxy on Lovable Cloud) — mcp-js
// verifies the issuer against the discovery document exactly.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "window-man-mcp",
  title: "Window Man MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Window Man Truth Engine. Use `whoami` to verify connectivity, `list_my_quote_analyses` to list a user's window-quote analyses, and `get_quote_analysis` to fetch one by id.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listQuoteAnalysesTool, getQuoteAnalysisTool],
});
