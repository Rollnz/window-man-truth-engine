// ═══════════════════════════════════════════════════════════════════════════
// ADMIN-UPDATE-CALL-AGENT - Update Agent IDs with Audit Trail (Phase 2)
// Allows admins to update call_agents.agent_id with full audit logging
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Admin whitelist (case-insensitive) - keep in sync with other admin functions
const ADMIN_EMAILS = new Set(
  ["vansiclenp@gmail.com", "mongoloyd@protonmail.com"].map((s) => s.toLowerCase())
);

function isAdminEmail(email: string | null | undefined): boolean {
  const e = (email || "").toLowerCase();
  return e ? ADMIN_EMAILS.has(e) : false;
}

// Valid source tools for call agents
const VALID_SOURCE_TOOLS = new Set([
  "quote-scanner",
  "beat-your-quote",
  "consultation-booking",
  "fair-price-quiz",
  "manual_dispatch",
]);

interface UpdateAgentRequest {
  source_tool: string;
  new_agent_id: string;
}

interface ListAgentsResponse {
  agents: Array<{
    source_tool: string;
    agent_id: string;
    enabled: boolean;
    first_message_template: string;
    updated_at: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[admin-update-call-agent] Missing Supabase credentials");
    return json(500, { error: "Server configuration error" });
  }

  // Extract bearer token
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return json(401, { error: "Missing bearer token" });
  }

  // Dual-client pattern: auth client for JWT validation, admin for DB
  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Validate JWT and get user
  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);
  const user = userRes?.user;

  if (userErr || !user) {
    console.error("[admin-update-call-agent] Auth error:", userErr?.message);
    return json(401, { error: "Unauthorized" });
  }

  // Check admin whitelist
  const email = (user.email || "").toLowerCase();
  if (!isAdminEmail(email)) {
    console.warn("[admin-update-call-agent] Non-admin access attempt:", email);
    return json(403, { error: "Access denied" });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET: List all call agents (for admin UI)
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method === "GET") {
    const { data: agents, error: agentsErr } = await supabaseAdmin
      .from("call_agents")
      .select("source_tool, agent_id, enabled, first_message_template, updated_at")
      .order("source_tool");

    if (agentsErr) {
      console.error("[admin-update-call-agent] Error fetching agents:", agentsErr.message);
      return json(500, { error: "Failed to fetch agents" });
    }

    const response: ListAgentsResponse = { agents: agents || [] };
    return json(200, response);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH: Toggle enabled state for an agent
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method === "PATCH") {
    let patchPayload: { source_tool?: string; enabled?: boolean };
    try {
      patchPayload = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const { source_tool, enabled } = patchPayload;

    // Validation
    if (!source_tool || typeof source_tool !== "string" || source_tool.trim() === "") {
      return json(400, { error: "source_tool is required and must be a non-empty string" });
    }

    if (typeof enabled !== "boolean") {
      return json(400, { error: "enabled must be a boolean (true or false)" });
    }

    console.log("[admin-update-call-agent] PATCH toggle request", {
      source_tool,
      enabled,
      requested_by: email,
    });

    try {
      const { error: updateErr } = await supabaseAdmin
        .from("call_agents")
        .update({
          enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("source_tool", source_tool);

      if (updateErr) {
        console.error("[admin-update-call-agent] PATCH failed:", updateErr.message);
        return json(500, { error: updateErr.message });
      }

      console.log("[admin-update-call-agent] Toggle success", { source_tool, enabled });
      return json(200, { success: true, source_tool, enabled });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[admin-update-call-agent] PATCH exception:", errorMessage);
      return json(500, { error: errorMessage });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUT: Update first_message_template for an agent
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method === "PUT") {
    let putPayload: { source_tool?: string; first_message_template?: string };
    try {
      putPayload = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const { source_tool, first_message_template } = putPayload;

    // Validation
    if (!source_tool || typeof source_tool !== "string" || source_tool.trim() === "") {
      return json(400, { error: "source_tool is required and must be a non-empty string" });
    }

    if (typeof first_message_template !== "string") {
      return json(400, { error: "first_message_template must be a string" });
    }

    if (first_message_template.length > 500) {
      return json(400, { error: "Template must be 500 characters or fewer" });
    }

    console.log("[admin-update-call-agent] PUT template request", {
      source_tool,
      template_length: first_message_template.length,
      requested_by: email,
    });

    try {
      const { error: updateErr } = await supabaseAdmin
        .from("call_agents")
        .update({
          first_message_template,
          updated_at: new Date().toISOString(),
        })
        .eq("source_tool", source_tool);

      if (updateErr) {
        console.error("[admin-update-call-agent] PUT failed:", updateErr.message);
        return json(500, { error: updateErr.message });
      }

      console.log("[admin-update-call-agent] Template update success", { source_tool });
      return json(200, { success: true, source_tool });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[admin-update-call-agent] PUT exception:", errorMessage);
      return json(500, { error: errorMessage });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST: Update agent_id for a source_tool
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload: UpdateAgentRequest;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { source_tool, new_agent_id } = payload;

  // Validation
  if (!source_tool || typeof source_tool !== "string") {
    return json(400, { error: "source_tool is required" });
  }

  if (!new_agent_id || typeof new_agent_id !== "string") {
    return json(400, { error: "new_agent_id is required" });
  }

  const trimmedAgentId = new_agent_id.trim();
  if (trimmedAgentId.length === 0) {
    return json(400, { error: "new_agent_id cannot be empty" });
  }

  if (trimmedAgentId === "PLACEHOLDER_AGENT_ID") {
    return json(400, { error: "Cannot set agent_id to PLACEHOLDER_AGENT_ID" });
  }

  if (!VALID_SOURCE_TOOLS.has(source_tool)) {
    return json(400, { 
      error: `Invalid source_tool. Valid options: ${Array.from(VALID_SOURCE_TOOLS).join(", ")}` 
    });
  }

  console.log("[admin-update-call-agent] Update request", {
    source_tool,
    new_agent_id: trimmedAgentId,
    requested_by: email,
  });

  // Fetch current agent record
  const { data: existingAgent, error: fetchErr } = await supabaseAdmin
    .from("call_agents")
    .select("id, agent_id, source_tool, first_message_template")
    .eq("source_tool", source_tool)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin-update-call-agent] Error fetching agent:", fetchErr.message);
    return json(500, { error: "Database error", details: fetchErr.message });
  }

  if (!existingAgent) {
    return json(404, { error: `No agent found for source_tool: ${source_tool}` });
  }

  const oldAgentId = existingAgent.agent_id;

  // Skip if no change
  if (oldAgentId === trimmedAgentId) {
    return json(200, { 
      updated: false, 
      message: "Agent ID unchanged",
      agent: existingAgent 
    });
  }

  // Update the agent_id
  const { data: updatedAgent, error: updateErr } = await supabaseAdmin
    .from("call_agents")
    .update({ 
      agent_id: trimmedAgentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingAgent.id)
    .select("id, source_tool, agent_id, enabled, first_message_template, updated_at")
    .single();

  if (updateErr || !updatedAgent) {
    console.error("[admin-update-call-agent] Update failed:", updateErr?.message);
    return json(500, { error: "Failed to update agent", details: updateErr?.message });
  }

  console.log("[admin-update-call-agent] Agent updated successfully", {
    source_tool,
    old_agent_id: oldAgentId,
    new_agent_id: trimmedAgentId,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT TRAIL: Write to dedicated audit table (if exists) or lead_notes
  // We'll use a system-level note pattern for call_agent changes
  // ═══════════════════════════════════════════════════════════════════════════

  const auditContent = JSON.stringify({
    action: "call_agent_updated",
    source_tool,
    old_agent_id: oldAgentId,
    new_agent_id: trimmedAgentId,
    changed_by: email,
    changed_at: new Date().toISOString(),
    is_placeholder_removal: oldAgentId === "PLACEHOLDER_AGENT_ID",
  });

  // Write audit event to wm_events (system session pattern)
  // Use a null-safe approach: create a system session ID if needed
  const systemSessionId = "00000000-0000-0000-0000-000000000000"; // Reserved for system events
  
  try {
    // Check if system session exists, create if not
    const { data: existingSession } = await supabaseAdmin
      .from("wm_sessions")
      .select("id")
      .eq("id", systemSessionId)
      .maybeSingle();

    if (!existingSession) {
      await supabaseAdmin.from("wm_sessions").insert({
        id: systemSessionId,
        anonymous_id: "system",
        landing_page: "/system/admin",
      });
    }

    await supabaseAdmin.from("wm_events").insert({
      session_id: systemSessionId,
      event_name: "call_agent_updated",
      event_category: "admin_audit",
      page_path: "/admin/call-agents",
      event_data: {
        source_tool,
        old_agent_id: oldAgentId,
        new_agent_id: trimmedAgentId,
        changed_by: email,
        is_placeholder_removal: oldAgentId === "PLACEHOLDER_AGENT_ID",
      },
    });

    console.log("[admin-update-call-agent] Audit event recorded");
  } catch (auditErr) {
    // Log but don't fail the request for audit errors
    console.warn("[admin-update-call-agent] Audit write failed (non-fatal):", auditErr);
  }

  return json(200, {
    updated: true,
    agent: updatedAgent,
    audit: {
      old_agent_id: oldAgentId,
      new_agent_id: trimmedAgentId,
      changed_by: email,
      changed_at: updatedAgent.updated_at,
    },
  });
});
