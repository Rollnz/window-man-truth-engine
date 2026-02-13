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
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Database-driven admin check via user_roles table
async function hasAdminRole(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error("[admin-update-call-agent] Error checking admin role:", error.message);
    return false;
  }
  return !!data;
}

// Valid source tools for call agents
const VALID_SOURCE_TOOLS = new Set([
  "quote-scanner",
  "beat-your-quote",
  "consultation-booking",
  "fair-price-quiz",
  "manual_dispatch",
  // PreQuoteLeadModalV2 source tools (seeded in 20260213100000 migration)
  "prequote-v2:sample-report",
  "prequote-v2:audit",
  "prequote-v2:ai-scanner-sample",
]);

interface UpdateAgentRequest {
  source_tool: string;
  new_agent_id: string;
}

interface ListAgentsResponse {
  agents: Array<{
    source_tool: string;
    agent_id: string;
    agent_name: string;
    enabled: boolean;
    first_message_template: string;
    updated_at: string;
    last_dispatch_at: string | null;
    last_error: { message: string; triggered_at: string } | null;
    calls_24h: number;
    errors_24h: number;
  }>;
  summary: {
    total_calls_24h: number;
    errors_24h: number;
    active_agents: number;
    success_rate: number | null;
  };
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

  // Check admin role in database
  const isAdmin = await hasAdminRole(supabaseAdmin, user.id);
  if (!isAdmin) {
    console.warn("[admin-update-call-agent] Non-admin access attempt:", email);
    return json(403, { error: "Access denied" });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET: List all call agents (for admin UI) with dispatch enrichment
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method === "GET") {
    const { data: agents, error: agentsErr } = await supabaseAdmin
      .from("call_agents")
      .select("source_tool, agent_id, agent_name, enabled, first_message_template, updated_at")
      .order("source_tool");

    if (agentsErr) {
      console.error("[admin-update-call-agent] Error fetching agents:", agentsErr.message);
      return json(500, { error: "Failed to fetch agents" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Enrich with dispatch data from pending_calls (last 30 days)
    // ═══════════════════════════════════════════════════════════════════════
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Query A: Last dispatch per agent
    const { data: recentCalls } = await supabaseAdmin
      .from("pending_calls")
      .select("source_tool, triggered_at")
      .gte("triggered_at", thirtyDaysAgo)
      .order("triggered_at", { ascending: false })
      .limit(200);

    // Build lastDispatchMap - first hit per source_tool is most recent
    const lastDispatchMap: Record<string, string> = {};
    for (const call of recentCalls || []) {
      if (call.source_tool && call.triggered_at && !lastDispatchMap[call.source_tool]) {
        lastDispatchMap[call.source_tool] = call.triggered_at;
      }
    }

    // Query B: Last dead letter error per agent
    const { data: deadLetters } = await supabaseAdmin
      .from("pending_calls")
      .select("source_tool, triggered_at, last_error")
      .eq("status", "dead_letter")
      .gte("triggered_at", thirtyDaysAgo)
      .order("triggered_at", { ascending: false })
      .limit(50);

    // Build lastErrorMap - first hit per source_tool is most recent
    const lastErrorMap: Record<string, { message: string; triggered_at: string }> = {};
    for (const call of deadLetters || []) {
      if (call.source_tool && call.triggered_at && !lastErrorMap[call.source_tool]) {
        lastErrorMap[call.source_tool] = {
          message: call.last_error || "Unknown error",
          triggered_at: call.triggered_at,
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Query C: 24-hour stats for summary cards
    // ═══════════════════════════════════════════════════════════════════════
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: calls24h } = await supabaseAdmin
      .from("pending_calls")
      .select("source_tool, status")
      .gte("triggered_at", twentyFourHoursAgo);

    // Aggregate 24h stats per agent
    const agentStats24h: Record<string, { total: number; errors: number }> = {};
    const safeCall24h = calls24h || [];
    for (const call of safeCall24h) {
      if (!agentStats24h[call.source_tool]) {
        agentStats24h[call.source_tool] = { total: 0, errors: 0 };
      }
      agentStats24h[call.source_tool].total++;
      if (call.status === "dead_letter") {
        agentStats24h[call.source_tool].errors++;
      }
    }

    const totalCalls24h = safeCall24h.length;
    const totalErrors24h = safeCall24h.filter(c => c.status === "dead_letter").length;

    // Merge enrichment data into agents
    const enrichedAgents = (agents || []).map(agent => ({
      ...agent,
      last_dispatch_at: lastDispatchMap[agent.source_tool] || null,
      last_error: lastErrorMap[agent.source_tool] || null,
      calls_24h: agentStats24h[agent.source_tool]?.total || 0,
      errors_24h: agentStats24h[agent.source_tool]?.errors || 0,
    }));

    const response: ListAgentsResponse = {
      agents: enrichedAgents,
      summary: {
        total_calls_24h: totalCalls24h,
        errors_24h: totalErrors24h,
        active_agents: (agents || []).filter(a => a.enabled).length,
        success_rate: totalCalls24h > 0
          ? Math.round(((totalCalls24h - totalErrors24h) / totalCalls24h) * 100)
          : null,
      },
    };
    return json(200, response);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH: Toggle enabled state OR Kill Switch
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method === "PATCH") {
    let patchPayload: { source_tool?: string; enabled?: boolean; kill_switch?: boolean };
    try {
      patchPayload = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Kill Switch Path - checked FIRST, before toggle logic
    // ═══════════════════════════════════════════════════════════════════════
    if (patchPayload.kill_switch === true) {
      try {
        const { data, error: updateErr } = await supabaseAdmin
          .from("call_agents")
          .update({
            enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq("enabled", true)
          .select("source_tool");

        if (updateErr) {
          return json(500, { error: updateErr.message });
        }

        console.log("[admin-update-call-agent] Kill switch activated", {
          disabled_count: data?.length || 0,
          requested_by: email,
        });

        return json(200, {
          success: true,
          kill_switch: true,
          disabled_count: data?.length || 0,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return json(500, { error: msg });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Standard Toggle Path - existing logic unchanged
    // ═══════════════════════════════════════════════════════════════════════
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
  // PUT: Update agent_name and/or first_message_template for an agent
  // ═══════════════════════════════════════════════════════════════════════════
  if (req.method === "PUT") {
    let putPayload: { source_tool?: string; first_message_template?: string; agent_name?: string };
    try {
      putPayload = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    const { source_tool, first_message_template, agent_name } = putPayload;

    // Validation: source_tool is always required
    if (!source_tool || typeof source_tool !== "string" || source_tool.trim() === "") {
      return json(400, { error: "source_tool is required and must be a non-empty string" });
    }

    // Check that at least one optional field is present
    const hasTemplate = first_message_template !== undefined;
    const hasAgentName = agent_name !== undefined;
    
    if (!hasTemplate && !hasAgentName) {
      return json(400, { error: "Nothing to update" });
    }

    // Validate first_message_template if present
    if (hasTemplate) {
      if (typeof first_message_template !== "string") {
        return json(400, { error: "first_message_template must be a string" });
      }
      if (first_message_template.length > 500) {
        return json(400, { error: "Template must be 500 characters or fewer" });
      }
    }

    // Validate agent_name if present
    if (hasAgentName) {
      if (typeof agent_name !== "string") {
        return json(400, { error: "agent_name must be a string" });
      }
      if (agent_name.length > 100) {
        return json(400, { error: "Agent name must be 100 characters or fewer" });
      }
    }

    console.log("[admin-update-call-agent] PUT request", {
      source_tool,
      has_template: hasTemplate,
      template_length: hasTemplate ? first_message_template!.length : null,
      has_agent_name: hasAgentName,
      agent_name_length: hasAgentName ? agent_name!.length : null,
      requested_by: email,
    });

    try {
      // Build dynamic update object
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (hasTemplate) {
        updateData.first_message_template = first_message_template;
      }
      if (hasAgentName) {
        updateData.agent_name = agent_name;
      }

      const { error: updateErr } = await supabaseAdmin
        .from("call_agents")
        .update(updateData)
        .eq("source_tool", source_tool);

      if (updateErr) {
        console.error("[admin-update-call-agent] PUT failed:", updateErr.message);
        return json(500, { error: updateErr.message });
      }

      console.log("[admin-update-call-agent] PUT update success", { 
        source_tool,
        updated_fields: Object.keys(updateData).filter(k => k !== "updated_at"),
      });
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
