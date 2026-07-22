// Sprint 07B — In-repo inventory of synthetic control manifests (Phase 30).
// Only synthetic controls live here. Real de-identified binaries and their
// manifests must NOT be committed to source control; they enter via the
// external asset resolver during Sprint 07C.
import type { CorpusInventory, GoldenDocumentManifest } from "./manifest-types.ts";
import gq001 from "./documents/GQ-001.json" with { type: "json" };
import gq002 from "./documents/GQ-002.json" with { type: "json" };

export const SYNTHETIC_CONTROL_MANIFESTS: GoldenDocumentManifest[] = [
  gq001 as GoldenDocumentManifest,
  gq002 as GoldenDocumentManifest,
];

export const CORPUS_V1_PRE_INVENTORY: CorpusInventory = {
  corpus_version: "gq-v1-pre",
  documents: SYNTHETIC_CONTROL_MANIFESTS,
};
