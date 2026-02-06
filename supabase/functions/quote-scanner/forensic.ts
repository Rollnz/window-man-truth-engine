// ═══════════════════════════════════════════════════════════════════════════
// FORENSIC SUMMARY GENERATOR
// Authority-building output: Statute citations, questions to ask, positive findings
// Safeguard 2: Consumes hardCapReason explicitly from scoring.ts
// ═══════════════════════════════════════════════════════════════════════════

import type { ExtractionSignals } from "./schema.ts";
import type { ScoredResult, HardCapResult } from "./scoring.ts";

// ═══════════════════════════════════════════════════════════════════════════
// FORENSIC SUMMARY TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ForensicSummary {
  headline: string;
  riskLevel: 'critical' | 'high' | 'moderate' | 'acceptable';
  statuteCitations: string[];
  questionsToAsk: string[];
  positiveFindings: string[];
  hardCapApplied: boolean;
  hardCapReason: string | null;
  hardCapStatute: string | null;
}

export interface ExtractedIdentity {
  contractorName: string | null;
  licenseNumber: string | null;
  noaNumbers: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// FORENSIC SUMMARY GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateForensicSummary(
  signals: ExtractionSignals,
  scored: ScoredResult
): ForensicSummary {
  const { hardCap } = scored;  // SAFEGUARD 2: Explicit pass from scoring
  
  const citations: string[] = [];
  const questions: string[] = [];
  const positives: string[] = [];

  // Build statute citations from hard cap
  if (hardCap.applied && hardCap.statute && hardCap.reason) {
    citations.push(`${hardCap.statute} - ${hardCap.reason}`);
  }

  // Add additional citations based on signals
  if (!signals.licenseNumberPresent) {
    citations.push("F.S. 489.119 - All contractors must display license number");
    questions.push("What is your contractor license number?");
  }
  
  if (signals.hasOwnerBuilderLanguage) {
    citations.push("F.S. 489.103 - Owner-builder exemption transfers liability");
    questions.push("Why does this quote use owner-builder language?");
  }
  
  if (signals.depositPercentage && signals.depositPercentage > 40) {
    citations.push("F.S. 501.137 - Advance payment regulations");
    questions.push("Can we restructure the payment schedule to reduce the deposit?");
  }
  
  if (signals.hasPaymentBeforeCompletion) {
    citations.push("F.S. 489.126 - Final payment tied to completion");
    questions.push("Can final payment be tied to inspection approval?");
  }
  
  if (!signals.hasComplianceIdentifier && !signals.hasNOANumber) {
    citations.push("FL Building Code Section 1626 - NOA documentation required");
    questions.push("What are the NOA or Florida Product Approval numbers for the windows?");
  }

  // Additional questions based on issues
  if (signals.hasTemperedOnlyRisk && !signals.hasLaminatedMention) {
    questions.push("Are these impact-rated laminated windows or just tempered glass?");
  }
  
  if (!signals.hasPermitMention) {
    questions.push("Who is responsible for pulling permits and scheduling inspections?");
  }
  
  if (!signals.hasWallRepairMention) {
    questions.push("What wall repair is included (stucco, drywall, paint)?");
  }
  
  if (!signals.hasLaborWarranty) {
    questions.push("What is the labor/workmanship warranty period?");
  }
  
  if (signals.hasSubjectToChange) {
    questions.push("What specifically could cause the price to change after signing?");
  }

  // Positive findings for good quotes (B+ and above, score >= 75)
  if (scored.overallScore >= 75) {
    if (signals.licenseNumberPresent) {
      positives.push("License number visible and verifiable");
    }
    if (signals.hasNOANumber || signals.hasComplianceIdentifier) {
      positives.push("Product approval numbers included");
    }
    if (signals.hasDetailedScope) {
      positives.push("Installation scope is well-documented");
    }
    if (signals.hasLaborWarranty) {
      positives.push("Labor warranty specified");
    }
    if (signals.hasLaminatedMention && signals.hasGlassBuildDetail) {
      positives.push("Impact glass specifications clearly stated");
    }
    if (signals.hasPermitMention) {
      positives.push("Permit responsibilities addressed");
    }
    if (signals.hasSafePaymentTerms) {
      positives.push("Payment tied to completion/inspection");
    }
    if (signals.hasBrandClarity) {
      positives.push("Window brand and type clearly identified");
    }
  }

  // Moderate scores (60-74) get fewer positives
  if (scored.overallScore >= 60 && scored.overallScore < 75) {
    if (signals.licenseNumberPresent) {
      positives.push("License number visible");
    }
    if (signals.hasBrandClarity) {
      positives.push("Window brand identified");
    }
    if (signals.hasPermitMention) {
      positives.push("Permit responsibilities mentioned");
    }
  }

  // Determine risk level
  let riskLevel: ForensicSummary['riskLevel'];
  if (scored.overallScore <= 30) riskLevel = 'critical';
  else if (scored.overallScore <= 50) riskLevel = 'high';
  else if (scored.overallScore <= 70) riskLevel = 'moderate';
  else riskLevel = 'acceptable';

  // Generate headline
  let headline = "";
  if (hardCap.applied) {
    headline = `Score capped at ${hardCap.ceiling} due to: ${hardCap.reason}`;
  } else if (riskLevel === 'critical') {
    headline = "This quote has serious red flags. Do NOT sign without major revisions.";
  } else if (riskLevel === 'high') {
    headline = "This quote needs significant clarification before signing.";
  } else if (riskLevel === 'moderate') {
    headline = "This quote is acceptable but has gaps to address.";
  } else {
    headline = "This quote appears comprehensive. Verify license and NOA numbers before signing.";
  }

  return {
    headline,
    riskLevel,
    statuteCitations: citations.slice(0, 4),
    questionsToAsk: questions.slice(0, 5),
    positiveFindings: positives.slice(0, 5),
    hardCapApplied: hardCap.applied,
    hardCapReason: hardCap.reason,
    hardCapStatute: hardCap.statute,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTED IDENTITY BUILDER
// ═══════════════════════════════════════════════════════════════════════════

export function extractIdentity(signals: ExtractionSignals): ExtractedIdentity {
  const noaNumbers: string[] = [];
  
  if (signals.noaNumberValue) {
    noaNumbers.push(signals.noaNumberValue);
  }
  
  return {
    contractorName: signals.contractorNameExtracted || null,
    licenseNumber: signals.licenseNumberValue || null,
    noaNumbers,
  };
}
