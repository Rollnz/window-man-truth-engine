import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_my_quote_analyses",
  title: "List my quote analyses",
  description:
    "List window-quote analyses that belong to the signed-in user's account. Returns id, created_at, overall_score, price_per_opening, and warning counts.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    const { data: account, error: accountError } = await client
      .from("accounts")
      .select("id")
      .eq("supabase_user_id", ctx.getUserId())
      .maybeSingle();
    if (accountError) {
      return { content: [{ type: "text", text: accountError.message }], isError: true };
    }
    if (!account) {
      return {
        content: [{ type: "text", text: "No account found for this user." }],
        structuredContent: { rows: [] },
      };
    }
    const { data, error } = await client
      .from("quote_analyses")
      .select(
        "id, created_at, overall_score, safety_score, price_score, warranty_score, price_per_opening, warnings_count, missing_items_count",
      )
      .eq("account_id", account.id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
