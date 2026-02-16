

# Brighten Subtitle Text Across /audit Page

## What You Asked For

Change all muted gray body/subtitle text (currently `text-slate-400`, `text-slate-300`, `text-gray-400`, `text-slate-500` used for descriptive copy) to a near-white `text-[#efefef]` so the text is actually readable against the dark backgrounds.

## Scope

Only descriptive/subtitle text -- NOT headings (already white), NOT colored accents (orange/cyan/emerald), NOT intentionally dim metadata (timestamps, "2,847 users this week"), and NOT icon colors.

## Every Line Being Changed (Top to Bottom)

### 1. `ScannerHeroWindow.tsx` (Hero)
| Line | Current | Text |
|------|---------|------|
| 187 | `text-slate-300/90` | "Contractors hide fees in the fine print." |
| 263 | `text-slate-400` | Trust line ("Private. No spam. Instant results.") |
| 287 | `text-slate-500` | Bottom trust signals ("5,000+ Quotes Scanned", etc.) |

### 2. `ScannerIntelligenceBar.tsx` (4-badge bar)
| Line | Current | Text |
|------|---------|------|
| 42 | `text-slate-400` | Badge descriptions (e.g., "Verifying Florida High-Velocity Hurricane Zone ratings") |

### 3. `ProblemAgitationSection.tsx` (Minefield section)
| Line | Current | Text |
|------|---------|------|
| 90 | `text-slate-400` | "Contractors rely on your confusion to inflate their margins." |
| 108 | `text-slate-400` | Each agitation bullet description (e.g., "Are you paying for 'miscellaneous' materials...") |

### 4. `UploadZoneXRay.tsx` (Before/After scanner grid)
| Line | Current | Text |
|------|---------|------|
| 176 | `text-slate-400` | "Enter your details to unlock analysis" |
| 283 | `text-slate-400` | "Complete the form to reveal your AI analysis" |
| 284 | `text-slate-500` | "Waiting for your details..." |
| 447 | `text-slate-400` | "Stop guessing. Our AI-assisted quote scanner reads the fine print..." |

### 5. `HowItWorksXRay.tsx` (X-Ray Vision section)
| Line | Current | Text |
|------|---------|------|
| 98 | `text-slate-400` | "Most homeowners overpay by 30% because they don't speak 'Contractor.'..." |
| 149 | `text-slate-400` | Each step description (e.g., "Snap a photo, drag a PDF, or paste text...") |
| 165 | `text-gray-400` | "Stop Guessing. Start Auditing..." |

### 6. `BeatOrValidateSection.tsx` (Validator/Negotiator)
| Line | Current | Text |
|------|---------|------|
| 39 | `text-slate-400` | "Every scan ends with you winning. Period." |
| 79 | `text-slate-400` | Validator bullet items ("Independent verification...", etc.) |
| 128 | `text-slate-400` | Negotiator bullet items ("AI-generated negotiation scripts...", etc.) |
| 160 | `text-slate-400` | "Cost to you: $0.00" |

### 7. `RedFlagGallery.tsx` (Red flag carousel)
| Line | Current | Text |
|------|---------|------|
| 143 | `text-slate-400` | "Here's what our AI finds hiding in quotes every single day." |
| 202 | `text-slate-400` | Card excerpt text (italic quote snippets) |
| 253 | `text-slate-500` | "Your quote might look fine on the surface." |

### 8. `NoQuoteEscapeHatch.tsx` (No Quote section)
| Line | Current | Text |
|------|---------|------|
| 92 | `text-slate-400` | "You're smart to do research first..." |
| 133 | `text-slate-400` | Each alternative card description |
| 176 | `text-slate-500` | "Come back anytime with your quote..." |

### 9. `VaultSection.tsx` (Vault section)
| Line | Current | Text |
|------|---------|------|
| 85 | `text-slate-300` | "This isn't a dashboard. It's your Digital Fortress..." |
| 89 | `text-slate-400` | "The average window replacement sales cycle is 1-3 months..." |
| 94-104 | `text-slate-400` | Trust indicators ("256-bit Encryption", "SOC 2 Compliant", "Your Data Never Shared") |
| 169 | `text-slate-400` | Vault loot item descriptions |
| 183 | `text-slate-400` | "Free forever. No credit card." |
| 195 | `text-slate-400` | "Already scanned a quote? Your results are waiting..." |

## What Is NOT Changing

- White headings (`text-white`) -- already bright
- Colored accent text (`text-orange-400`, `text-cyan-400`, `text-emerald-400`, `text-red-400`)
- Icon colors (`text-slate-400` on icons like Lock, Shield -- these stay dim intentionally)
- Tiny metadata (`text-xs text-slate-500` for "2,847 users this week", step number indicators)
- Button text colors
- Badge text colors
- The blurred preview teaser content inside UploadZoneXRay (behind blur, color irrelevant)

## Technical Details

- **Replacement class**: `text-[#efefef]` (Tailwind arbitrary value)
- **Files changed**: 9 component files
- **Zero layout impact**: Only color classes swapped, no structural changes
- All instances of `text-gray-400` also changed to `text-[#efefef]` (line 165 in HowItWorksXRay)

