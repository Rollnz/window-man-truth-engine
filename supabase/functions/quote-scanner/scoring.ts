// ═══════════════════════════════════════════════════════════════════════════
// DETERMINISTIC SCORING ENGINE
// Hybrid Rubric: Hard caps, curving, and weighted scoring
// ═══════════════════════════════════════════════════════════════════════════

import type { ExtractionSignals, AnalysisData } from "./schema.ts";

// ═══════════════════════════════════════════════════════════════════════════
// HARD CAP TYPES (Safeguard 2: Explicit pass to forensic.ts)
// ═══════════════════════════════════════════════════════════════════════════

export interface HardCapResult {
  applied: boolean;
  ceiling: number;
  reason: string | null;
  statute: string | null;
}

export interface ScoredResult extends AnalysisData {
  hardCap: HardCapResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// HARD CAPS (Florida Statute Alignment)
// ═══════════════════════════════════════════════════════════════════════════

function applyHardCaps(signals: ExtractionSignals, warnings: string[]): HardCapResult {
  let ceiling = 100;
  let reason: string | null = null;
  let statute: string | null = null;

  // CAP 1: Missing License = Max 25 (F.S. 489.119)
  if (!signals.licenseNumberPresent) {
    ceiling = 25;
    reason = "No contractor license number visible";
    statute = "F.S. 489.119";
    warnings.push("CRITICAL: No license # found. Per F.S. 489.119, all Florida contractors must display their license number.");
  }

  // CAP 2: Owner-Builder Language = Max 25 (F.S. 489.103)
  if (signals.hasOwnerBuilderLanguage && ceiling > 25) {
    ceiling = 25;
    reason = "Owner-Builder language transfers all liability to homeowner";
    statute = "F.S. 489.103";
    warnings.push("CRITICAL: 'Owner-Builder' language transfers ALL liability to you.");
  }

  // CAP 3: Deposit > 50% = Max 55 (F.S. 501.137)
  if (signals.depositPercentage !== null && signals.depositPercentage > 50 && ceiling > 55) {
    ceiling = 55;
    reason = `Deposit of ${signals.depositPercentage}% exceeds 50%`;
    statute = "F.S. 501.137";
    warnings.push(`HIGH RISK: ${signals.depositPercentage}% deposit exceeds safe threshold.`);
  }

  // CAP 4: Tempered-Only (no impact language) = Max 30
  if (signals.hasTemperedOnlyRisk && !signals.hasLaminatedMention && ceiling > 30) {
    ceiling = 30;
    reason = "Tempered glass without impact/laminated specification";
    statute = null;
    warnings.push("CRITICAL: Quote mentions 'tempered' glass but NO impact/laminated language.");
  }

  // CAP 5: Payment Before Completion = Max 40 (F.S. 489.126)
  if (signals.hasPaymentBeforeCompletion && ceiling > 40) {
    ceiling = 40;
    reason = "Full payment required before work completion";
    statute = "F.S. 489.126";
    warnings.push("HIGH RISK: Contract requires full payment before work is complete. Per F.S. 489.126, final payment should be tied to satisfactory completion.");
  }

  return {
    applied: ceiling < 100,
    ceiling,
    reason,
    statute,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE CURVING (Makes 90+ Rare)
// Exponential compression for scores above 70
// ═══════════════════════════════════════════════════════════════════════════

function applyCurve(score: number): number {
  if (score <= 70) return score;
  const excess = score - 70;
  return Math.round(70 + (30 * Math.pow(excess / 30, 1.8)));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export function scoreFromSignals(signals: ExtractionSignals, openingCountHint: number | null): ScoredResult {
  const warnings: string[] = [];
  const missingItems: string[] = [];

  // PHASE 0: Document Validity Gate
  if (!signals.isValidQuote) {
    return {
      overallScore: 0,
      safetyScore: 0,
      scopeScore: 0,
      priceScore: 0,
      finePrintScore: 0,
      warrantyScore: 0,
      pricePerOpening: "N/A",
      warnings: ["Not a window/door quote. Upload a contractor proposal/estimate for windows/doors."],
      missingItems: [],
      summary: "No grading performed because this is not a window/door quote.",
      hardCap: { applied: false, ceiling: 100, reason: null, statute: null },
    };
  }

  // PHASE 1: Compute Price Per Opening
  let pricePerOpening = "N/A";
  let pricePerOpeningValue: number | null = null;
  
  const effectiveOpeningCount = signals.openingCountEstimate ?? openingCountHint;
  
  if (signals.totalPriceFound && signals.totalPriceValue && effectiveOpeningCount && effectiveOpeningCount > 0) {
    const rawPPO = signals.totalPriceValue / effectiveOpeningCount;
    pricePerOpeningValue = Math.round(rawPPO / 50) * 50;
    pricePerOpening = `$${pricePerOpeningValue.toLocaleString()}`;
  }

  // PHASE 2: Safety Score (0-100) [Weight 30%]
  let safetyScore = 0;

  if (signals.hasComplianceKeyword) {
    safetyScore += 25;
  }
  if (signals.hasComplianceIdentifier) {
    safetyScore += 25;
  }
  if (signals.hasLaminatedMention) {
    safetyScore += 25;
  }
  if (signals.hasGlassBuildDetail) {
    safetyScore += 10;
  }

  if (signals.hasTemperedOnlyRisk) {
    safetyScore = Math.min(safetyScore, 30);
    warnings.push("Tempered alone isn't impact glass—verify laminated impact rating.");
  }

  if (signals.hasNonImpactLanguage) {
    safetyScore = Math.min(safetyScore, 25);
    warnings.push("Non-impact or glass-only language found—high hurricane compliance risk.");
  }

  if (!signals.hasComplianceKeyword && !signals.hasComplianceIdentifier && !signals.hasLaminatedMention) {
    safetyScore = Math.min(safetyScore, 40);
    missingItems.push("No proof of impact compliance (NOA/FL#, DP, HVHZ, or laminated impact glass).");
  }

  safetyScore = Math.max(0, Math.min(100, safetyScore));

  // PHASE 3: Scope Score (0-100) [Weight 25%]
  let scopeScore = 0;

  if (signals.hasPermitMention) {
    scopeScore += 20;
  }
  if (signals.hasDemoInstallDetail) {
    scopeScore += 15;
  }
  if (signals.hasSpecificMaterials) {
    scopeScore += 10;
  }
  if (signals.hasWallRepairMention) {
    scopeScore += 15;
  }
  if (signals.hasFinishDetail) {
    scopeScore += 10;
  }
  if (signals.hasCleanupMention) {
    scopeScore += 15;
  }
  if (signals.hasBrandClarity) {
    scopeScore += 15;
  }

  if (signals.hasSubjectToChange) {
    scopeScore = Math.max(scopeScore - 30, 0);
    warnings.push("RED FLAG: 'Subject to remeasure/change' allows price hikes after signing.");
  }

  if (signals.hasRepairsExcluded || !signals.hasWallRepairMention) {
    missingItems.push("Wall repair scope unclear (stucco/drywall/paint after install).");
  }

  // PENALTY: "Standard Installation" = -10 to Scope (reduced from -15 per user approval)
  if (signals.hasStandardInstallation) {
    scopeScore = Math.max(0, scopeScore - 10);
    warnings.push("Vague: 'Standard installation' can mean anything. Get specifics in writing.");
  }

  scopeScore = Math.max(0, Math.min(100, scopeScore));

  // PHASE 4: Fine Print Score (0-100) [Weight 15%]
  let finePrintScore = 60;

  if (signals.depositPercentage !== null) {
    if (signals.depositPercentage > 40) {
      finePrintScore = 0;
      warnings.push("High risk: deposit exceeds 40%.");
    } else if (signals.depositPercentage >= 10) {
      finePrintScore = Math.min(finePrintScore + 20, 80);
    } else {
      finePrintScore = Math.min(finePrintScore + 40, 100);
    }
  } else {
    missingItems.push("Payment schedule/deposit terms not clearly stated.");
  }

  if (signals.hasFinalPaymentTrap) {
    finePrintScore = Math.min(finePrintScore, 25);
    warnings.push("Risky: final payment due before inspection/permit close.");
  } else if (signals.hasSafePaymentTerms) {
    finePrintScore = Math.min(finePrintScore + 10, 100);
  }

  if (signals.hasContractTraps && signals.contractTrapsList.length > 0) {
    const deduction = Math.min(signals.contractTrapsList.length * 10, 30);
    finePrintScore = Math.max(finePrintScore - deduction, 0);
    if (signals.contractTrapsList.length > 0) {
      warnings.push(`Contract contains: ${signals.contractTrapsList.slice(0, 3).join(", ")}.`);
    }
  }

  // PENALTY: "Manager Discount" = -15 to Price (softened warning per user approval)
  if (signals.hasManagerDiscount) {
    finePrintScore = Math.max(0, finePrintScore - 15);
    warnings.push("Caution: Time-pressure language like 'manager discount' or 'today only' is often a sales tactic. Good deals don't expire overnight.");
  }

  finePrintScore = Math.max(0, Math.min(100, finePrintScore));

  // PHASE 5: Warranty Score (0-100) [Weight 10%]
  let warrantyScore = 0;

  if (signals.hasWarrantyMention) {
    warrantyScore += 30;
  }
  if (signals.hasLaborWarranty) {
    warrantyScore += 40;
  }
  if (signals.warrantyDurationYears !== null && signals.warrantyDurationYears > 1) {
    warrantyScore += 15;
  }
  if (signals.hasLifetimeWarranty) {
    warrantyScore += 15;
  }
  if (signals.hasTransferableWarranty) {
    warrantyScore += 10;
  }

  if (!signals.hasWarrantyMention) {
    missingItems.push("No warranty terms stated (labor/workmanship + manufacturer coverage).");
  }

  warrantyScore = Math.max(0, Math.min(100, warrantyScore));

  // PHASE 6: Price Score (0-100) [Weight 20%]
  let priceScore = 40;

  if (pricePerOpeningValue !== null) {
    if (pricePerOpeningValue < 1000) {
      priceScore = 40;
    } else if (pricePerOpeningValue < 1200) {
      priceScore = 65;
    } else if (pricePerOpeningValue <= 1800) {
      priceScore = 95;
    } else if (pricePerOpeningValue <= 2500) {
      priceScore = 75;
    } else {
      priceScore = 55;
      if (signals.hasPremiumIndicators) {
        priceScore = Math.min(priceScore + 10, 75);
      }
    }
  } else {
    missingItems.push("Could not compute price per opening (missing total price or opening count).");
  }

  priceScore = Math.max(0, Math.min(100, priceScore));

  // PHASE 7: Apply Hard Caps (Florida Statute Alignment)
  const hardCap = applyHardCaps(signals, warnings);

  // PHASE 8: Overall Score + Curving
  let rawOverallScore = Math.round(
    safetyScore * 0.30 +
    scopeScore * 0.25 +
    priceScore * 0.20 +
    finePrintScore * 0.15 +
    warrantyScore * 0.10
  );

  // Apply curve to make 90+ rare
  let overallScore = applyCurve(rawOverallScore);

  // Apply hard cap ceiling
  if (hardCap.applied) {
    overallScore = Math.min(overallScore, hardCap.ceiling);
  }

  // PHASE 9: Generate Summary
  let summary = "";
  const lowestScore = Math.min(safetyScore, scopeScore, priceScore, finePrintScore, warrantyScore);
  
  if (hardCap.applied) {
    summary = `Score capped at ${hardCap.ceiling} due to: ${hardCap.reason}${hardCap.statute ? ` (${hardCap.statute})` : ''}.`;
  } else if (safetyScore === lowestScore && safetyScore < 50) {
    summary = "Quote lacks impact compliance proof—verify NOA/FL approval and laminated glass before signing.";
  } else if (finePrintScore === lowestScore && finePrintScore < 50) {
    summary = "Risky payment terms or contract traps detected—review deposit and final payment conditions.";
  } else if (scopeScore === lowestScore && scopeScore < 50) {
    summary = "Scope is vague—get written clarification on permits, installation details, and wall repairs.";
  } else if (warrantyScore === lowestScore && warrantyScore < 50) {
    summary = "Warranty terms unclear or missing—request written labor and manufacturer warranty details.";
  } else if (priceScore === lowestScore && priceScore < 60) {
    summary = "Price may be outside typical market range—compare with other quotes and verify scope.";
  } else if (overallScore >= 80) {
    summary = "Quote appears comprehensive with good compliance documentation and fair terms.";
  } else if (overallScore >= 60) {
    summary = "Quote is acceptable but has some gaps—review warnings and missing items before signing.";
  } else {
    summary = "Quote has significant concerns—address warnings and missing items before proceeding.";
  }

  return {
    overallScore,
    safetyScore,
    scopeScore,
    priceScore,
    finePrintScore,
    warrantyScore,
    pricePerOpening,
    warnings: warnings.slice(0, 6),
    missingItems: missingItems.slice(0, 6),
    summary,
    hardCap,
  };
}
