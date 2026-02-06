// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED DEPENDENCY MANAGEMENT
// Standard Deno practice: All external deps pinned here, imported by modules
// Change versions HERE to update all modules simultaneously
// ═══════════════════════════════════════════════════════════════════════════

// Supabase client
export { createClient } from "npm:@supabase/supabase-js@2.39.7";
export type { SupabaseClient } from "npm:@supabase/supabase-js@2.39.7";

// Zod validation
export { z } from "npm:zod@3.22.4";
export type { ZodSchema, ZodError } from "npm:zod@3.22.4";
