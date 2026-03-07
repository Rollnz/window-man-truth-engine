// ═══════════════════════════════════════════════════════════════════════════
// REQUEST VALIDATION SCHEMAS
// Zod schemas for validating incoming HTTP requests to the quote-scanner
// Edge-function-specific — NOT part of scanner-brain (which is zero-dependency)
// ═══════════════════════════════════════════════════════════════════════════

import { z } from "./deps.ts";

export const AnalysisContextSchema = z.object({
  overallScore: z.number().int().min(0).max(100).optional(),
  finalGrade: z.string().optional(),
  safetyScore: z.number().int().min(0).max(100).optional(),
  scopeScore: z.number().int().min(0).max(100).optional(),
  priceScore: z.number().int().min(0).max(100).optional(),
  finePrintScore: z.number().int().min(0).max(100).optional(),
  warrantyScore: z.number().int().min(0).max(100).optional(),
  pricePerOpening: z.string().max(50).optional(),
  warnings: z.array(z.string().max(500)).max(10).optional(),
  missingItems: z.array(z.string().max(500)).max(10).optional(),
  summary: z.string().max(1000).optional(),
}).passthrough();

export const QuoteScannerRequestSchema = z.object({
  mode: z.enum(["analyze", "email", "question", "phoneScript"]),
  imageBase64: z.string().max(6_600_000).optional(),
  mimeType: z.string().max(100).optional(),
  openingCount: z.number().int().min(1).max(200).optional(),
  areaName: z.string().max(100).optional(),
  notesFromCalculator: z.string().max(2000).optional(),
  question: z.string().max(2000).optional(),
  analysisContext: AnalysisContextSchema.optional(),
  // Golden Thread: Attribution tracking
  sessionId: z.string().uuid('Invalid session ID format').optional(),
  leadId: z.string().uuid('Invalid lead ID format').optional(),
  clientId: z.string().max(100).optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "analyze") {
    if (!data.imageBase64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "imageBase64 is required for analyze mode",
        path: ["imageBase64"],
      });
    }
    if (!data.mimeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mimeType is required for analyze mode",
        path: ["mimeType"],
      });
    }
    if (data.mimeType && !(data.mimeType.startsWith("image/") || data.mimeType === "application/pdf")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mimeType must be an image or PDF type",
        path: ["mimeType"],
      });
    }
  }
  
  if ((data.mode === "email" || data.mode === "phoneScript") && !data.analysisContext) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "analysisContext is required for email and phoneScript modes",
      path: ["analysisContext"],
    });
  }
  
  if (data.mode === "question" && !data.question) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "question is required for question mode",
      path: ["question"],
    });
  }
});
