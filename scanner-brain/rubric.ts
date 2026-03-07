// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION RUBRIC & PROMPTS
// Large string constants for AI extraction and grading
// ═══════════════════════════════════════════════════════════════════════════

import { sanitizeForPrompt } from "./schema.ts";

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION RUBRIC (AI Extracts Signals Only)
// ═══════════════════════════════════════════════════════════════════════════

export const EXTRACTION_RUBRIC = `
You are **WINDOW QUOTE SIGNAL EXTRACTOR**, an evidence-based reader for Florida impact-window/door quotes.

Your ONLY job is to EXTRACT what you see in the document. You do NOT score or judge.

Return ONLY a JSON object with boolean flags and extracted values based on what you observe.

==================================================
PHASE 0 — DOCUMENT VALIDITY CHECK
==================================================

Determine if this is a real window/door quote/proposal/contract.

VALID if you see ANY TWO OR MORE:
- Terms: window, door, slider, glazing, impact, hurricane, laminated, vinyl, aluminum, frame
- Line items with qty/dimensions/opening descriptions
- A total price / estimate amount
- Contractor company info / license / address
- "proposal", "estimate", "contract", "quote", "scope of work"

Set isValidQuote = true/false based on this check.
If not valid, set validityReason explaining why (e.g., "This appears to be a receipt, not a quote").

==================================================
PHASE 1 — EXTRACT PRICE & OPENINGS
==================================================

A) TOTAL PRICE:
- Look for "Total", "Grand Total", "Contract Price", "Total Due", "$"
- Set totalPriceFound = true if you find a clear total
- Set totalPriceValue = the numeric value (no currency symbols)

B) OPENING COUNT:
- Count line items for windows/doors/openings
- Set openingCountEstimate = your best estimate (integer)
- If unclear, set to null

==================================================
PHASE 2 — SAFETY SIGNALS
==================================================

Set boolean flags based on what you SEE:

A) COMPLIANCE KEYWORDS (hasComplianceKeyword = true if ANY):
- NOA, Notice of Acceptance, Miami-Dade, Miami Dade, MDCA
- FL#, FL #, Florida Product Approval, Product Approval
- HVHZ, High Velocity Hurricane Zone, High Velocity
- TAS 201/202/203, ASTM E1886/E1996
- DP, Design Pressure, +/-, ±

B) COMPLIANCE IDENTIFIERS (hasComplianceIdentifier = true if ANY):
- A number after NOA/FL (ex: "NOA 20-1234", "FL 16824")
- DP value or +/- value (ex: "DP50", "+55/-65")

C) NOA NUMBER:
- hasNOANumber = true if you see a specific NOA number (e.g., "NOA 20-1234")
- noaNumberValue = the actual number if found, else null

D) LAMINATED GLASS (hasLaminatedMention = true if ANY):
- laminated, laminated glass, impact laminated, hurricane laminated
- PVB, interlayer, SGP, SentryGlas, ionoplast

E) GLASS BUILD DETAIL (hasGlassBuildDetail = true if ANY):
- thickness (5/16, 7/16, 9/16)
- "laminated insulated", "IGU", "insulated laminated", "argon", "Low-E"
- "heat strengthened" (only if paired with laminated/impact context)

F) NEGATIVE TRIGGERS:
- hasTemperedOnlyRisk = true if "tempered" appears AND NO "laminated/impact" language
- hasNonImpactLanguage = true if "non-impact", "not impact", "annealed", or "glass-only replacement"

==================================================
PHASE 2.5 — CONTRACTOR IDENTITY SIGNALS (CRITICAL)
==================================================

A) LICENSE NUMBER:
- licenseNumberPresent = true if you see ANY: license, lic, lic#, CGC, CBC, CCC, #CGC, contractor license, followed by a number
- licenseNumberValue = the actual number if found (e.g., "CGC1507438"), else null

B) OWNER-BUILDER RED FLAG:
- hasOwnerBuilderLanguage = true if ANY: "owner-builder", "homeowner to pull permits", "customer responsible for permits", "you will be the contractor of record", "owner builder", "owner/builder"

C) CONTRACTOR IDENTITY:
- contractorNameExtracted = company name if clearly visible, else null

==================================================
PHASE 3 — SCOPE SIGNALS
==================================================

A) PERMITS (hasPermitMention = true if ANY):
- permit, permitting, pulled by contractor
- engineering, engineer letter, drawings
- notice of commencement, NOC, inspections

B) DEMO/INSTALL (hasDemoInstallDetail = true if ANY):
- remove existing, demo, dispose old windows
- install new, set, anchor, fasten, bucking
- shimming, waterproofing, flashing

C) SPECIFIC MATERIALS (hasSpecificMaterials = true if ANY):
- sealant, caulk, silicone, polyurethane, Sika, Dow 795
- flashing tape, peel & stick, sill pan
- tapcons, ultracons, stainless fasteners

D) WALL REPAIR (hasWallRepairMention = true if ANY):
- stucco, drywall, plaster, patch, texture
- paint, repaint, ready for paint, match existing

E) FINISH DETAIL (hasFinishDetail = true if ANY):
- trim, casing, wrap, interior trim, exterior trim

F) CLEANUP (hasCleanupMention = true if ANY):
- debris, haul away, dumpster, trash, cleanup
- floor protection, drop cloth, ram board, dust barrier

G) BRAND CLARITY (hasBrandClarity = true if ANY):
- Brand names (PGT, CGI, ES, WinDoor, Andersen, Marvin, Euro-Wall, etc.)
- Window types: SH/DH/casement/awning/fixed/slider/French door

H) DETAILED SCOPE:
- hasDetailedScope = true if quote includes at least 4 of the above scope items

I) RED FLAGS:
- hasSubjectToChange = true if "subject to remeasure", "subject to change", or "price may change"
- hasRepairsExcluded = true if "stucco by owner", "drywall not included", or repairs explicitly excluded
- hasStandardInstallation = true if "standard installation" appears without detailed scope breakdown

==================================================
PHASE 4 — FINE PRINT SIGNALS
==================================================

A) DEPOSIT:
- depositPercentage = numeric value if you can determine it (e.g., 50 for 50%), else null
- If you see a deposit amount but not percentage, try to calculate from total

B) PAYMENT TRAPS:
- hasFinalPaymentTrap = true if final payment due BEFORE inspection/permit close/completion
- hasSafePaymentTerms = true if final payment due AFTER inspection/permit close/walkthrough
- hasPaymentBeforeCompletion = true if ANY: "payment due before installation", "full payment required before", "balance due prior to", "100% due before work begins", "payment in full before"

C) CONTRACT TRAPS:
- hasContractTraps = true if ANY: cancellation fee, restocking, "non-refundable", arbitration, venue, attorney fees
- contractTrapsList = array of specific traps found (strings)

D) PRESSURE TACTICS:
- hasManagerDiscount = true if ANY: "manager discount", "manager special", "today only", "one day only", "expires today", "special pricing today"

==================================================
PHASE 5 — WARRANTY SIGNALS
==================================================

- hasWarrantyMention = true if ANY: warranty, guaranteed, workmanship, labor, installation, manufacturer warranty
- hasLaborWarranty = true if labor/workmanship explicitly mentioned
- warrantyDurationYears = numeric value if stated (e.g., 2 for "2-year warranty"), else null
- hasLifetimeWarranty = true if "lifetime" appears in warranty context
- hasTransferableWarranty = true if "transferable" mentioned

==================================================
PHASE 6 — PREMIUM INDICATORS
==================================================

- hasPremiumIndicators = true if ANY: Euro-Wall, Marvin, large sliders, custom colors, SGP, very high DP (>50), coastal stainless package

==================================================
OUTPUT
==================================================

Return ONLY the JSON object with all the boolean flags and extracted values. Do NOT include scores or judgments.
`;

// ═══════════════════════════════════════════════════════════════════════════
// GRADING RUBRIC (for question mode context)
// ═══════════════════════════════════════════════════════════════════════════

export const GRADING_RUBRIC = `
You are **WINDOW QUOTE AUDITOR AI**, a strict evidence-based compliance and risk auditor for Florida impact-window/door quotes.
You help homeowners understand their quotes and answer questions about window replacement projects.
Be helpful, specific, and focus on Florida building codes and impact window requirements.
`;

// ═══════════════════════════════════════════════════════════════════════════
// USER PROMPT TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════

export function USER_PROMPT_TEMPLATE(
  openingCount: number | null,
  areaName: string | null,
  notesFromCalculator: string | null
): string {
  let prompt = `Extract evidence signals from the following window/door quote image.

If the image is not a window/door quote, set isValidQuote to false and explain why in validityReason.

---
`;

  if (openingCount) {
    prompt += `\nHINT: The homeowner says there are approximately ${openingCount} openings.`;
  }

  if (areaName) {
    prompt += `\nHINT: The project is in ${sanitizeForPrompt(areaName)}, Florida.`;
  }

  if (notesFromCalculator) {
    prompt += `\nHINT: Additional context from the homeowner's calculator: ${sanitizeForPrompt(notesFromCalculator)}`;
  }

  prompt += `\n\nExtract all evidence signals from the quote according to the extraction rubric and return your findings as a JSON object.`;

  return prompt;
}
