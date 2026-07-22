// ═══════════════════════════════════════════════════════════════════════════
// SCANNER-BRAIN vNEXT — PROVIDER PROBE HARNESS (Sprint 05B, reproducible)
//
// Bounded, secret-safe live-transport probe for canonical schema projections.
// Runs under Deno with `--allow-net --allow-env`.
//
// USAGE
//   LOVABLE_API_KEY=... deno run --allow-net --allow-env \
//     supabase/functions/_shared/scanner-brain/vnext/provider-probe.ts \
//     <partition-name>
//
//   <partition-name> must be one of:
//     classificationEntitiesMeta | quoteFull | quoteCore | quoteDetail
//     | twoPassA | twoPassB
//     | canonical            (full unpartitioned control — DO NOT waste calls)
//
// GUARANTEES
//   • Never logs the API key, Authorization header, or response body content.
//     Only structural metrics + HTTP status + first 240 chars of any error
//     reason are printed (sanitized).
//   • Uses synthetic deterministic instructions ONLY. NO customer data.
//   • Not imported by any runtime module. Not called from an edge function.
//   • No database writes. No storage. No secrets committed.
// ═══════════════════════════════════════════════════════════════════════════

import { CanonicalExtractionV1JsonSchema } from "./schema.ts";
import {
  buildProjection,
  cloneCanonicalSchema,
  stableStringify,
  type PartitionName,
} from "./schema-projections.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = Deno.env.get("AI_MODEL_VERSION") ?? "google/gemini-3-flash-preview";
const MAX_ERROR_CHARS = 240;

type ProbeName = PartitionName | "canonical";

interface ProbeMetrics {
  probe: ProbeName;
  model: string;
  bytes: number;
  approxDepth: number;
  topLevelKept: string[] | "canonical";
  http_status: number | "network_error";
  latency_ms: number;
  finish_reason: string | null;
  content_returned: boolean;
  json_parsed: boolean;
  error_snippet: string | null;
  timestamp: string;
}

function sanitize(s: string): string {
  if (s.length <= MAX_ERROR_CHARS) return s;
  return s.slice(0, MAX_ERROR_CHARS) + "…";
}

async function runProbe(name: ProbeName): Promise<ProbeMetrics> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    throw new Error("LOVABLE_API_KEY missing — probe BLOCKED (no live call issued)");
  }

  let schema: Record<string, unknown>;
  let bytes: number;
  let approxDepth: number;
  let topLevelKept: string[] | "canonical";

  if (name === "canonical") {
    schema = cloneCanonicalSchema();
    const serialized = stableStringify(schema);
    bytes = new TextEncoder().encode(serialized).length;
    approxDepth = 16; // documented in Sprint 05
    topLevelKept = "canonical";
  } else {
    const p = buildProjection(name);
    schema = p.schema;
    bytes = p.bytes;
    approxDepth = p.approxDepth;
    topLevelKept = p.topLevelKept;
  }

  const body = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a transport-probe echoer. Return one JSON object that literally satisfies the provided JSON schema. Use null for optional fields, empty arrays for arrays. Do not invent facts. This is a schema-transport test, not a data-extraction task.",
      },
      {
        role: "user",
        content:
          "Return a minimally valid instance of the schema. All strings may be 'test'. All numbers may be 0. All booleans false. Confidence values 0. Evidence arrays empty. contract_version must equal 'canonical-extraction-v1-dev'.",
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "canonical_projection",
        strict: true,
        schema,
      },
    },
  };

  const started = performance.now();
  let http_status: number | "network_error" = "network_error";
  let finish_reason: string | null = null;
  let content_returned = false;
  let json_parsed = false;
  let error_snippet: string | null = null;

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "X-Lovable-AIG-SDK": "sprint-05b-probe",
      },
      body: JSON.stringify(body),
    });
    http_status = res.status;
    const text = await res.text();
    if (!res.ok) {
      error_snippet = sanitize(text.replace(/\s+/g, " "));
    } else {
      try {
        const parsed = JSON.parse(text);
        finish_reason = parsed?.choices?.[0]?.finish_reason ?? null;
        const c = parsed?.choices?.[0]?.message?.content;
        if (typeof c === "string" && c.length > 0) {
          content_returned = true;
          try {
            JSON.parse(c);
            json_parsed = true;
          } catch {
            json_parsed = false;
          }
        }
      } catch (parseErr) {
        error_snippet = sanitize(`gateway response was not JSON: ${(parseErr as Error).message}`);
      }
    }
  } catch (e) {
    error_snippet = sanitize(`network: ${(e as Error).message}`);
  }
  const latency_ms = Math.round(performance.now() - started);

  return {
    probe: name,
    model: MODEL,
    bytes,
    approxDepth,
    topLevelKept,
    http_status,
    latency_ms,
    finish_reason,
    content_returned,
    json_parsed,
    error_snippet,
    timestamp: new Date().toISOString(),
  };
}

if (import.meta.main) {
  const arg = Deno.args[0] as ProbeName | undefined;
  const valid: ProbeName[] = [
    "classificationEntitiesMeta",
    "quoteFull",
    "quoteCore",
    "quoteDetail",
    "twoPassA",
    "twoPassB",
    "threePassB",
    "threePassC",
    "canonical",
  ];
  if (!arg || !valid.includes(arg)) {
    console.error(`usage: provider-probe.ts <${valid.join("|")}>`);
    Deno.exit(2);
  }
  runProbe(arg).then((m) => {
    console.log(JSON.stringify(m, null, 2));
  }).catch((e) => {
    console.error(String(e));
    Deno.exit(1);
  });
}

export { runProbe, GATEWAY_URL, MODEL };
export type { ProbeMetrics, ProbeName };
// Re-export so consumers can inspect the canonical schema shape used by
// the "canonical" control probe without a separate import.
export const CANONICAL_SCHEMA_REF = CanonicalExtractionV1JsonSchema;
