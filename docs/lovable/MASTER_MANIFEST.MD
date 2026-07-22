````markdown
# WindowMan Quote-First Acquisition Experience
## MASTER MANIFEST

---

# 00. DOCUMENT CONTROL

| Field | Value |
|---|---|
| Manifest ID | `WM-QF-MANIFEST-001` |
| Document Title | WindowMan Quote-First Acquisition Experience — Master Manifest |
| Version | `1.0.0` |
| Status | `APPROVED SPECIFICATION — READY FOR SPRINT DERIVATION` |
| Canonical Repository Path | `/docs/lovable/MASTER_MANIFEST.md` |
| Product Owner | WindowMan |
| Specification Owner | WindowMan Product / CRO Architecture |
| Last Updated | `IMPLEMENTATION DECISION TO VALIDATE: Populate repository-controlled date at commit time` |
| Applies To | Quote-First paid-acquisition landing experience through Truth Report and inbound-call conversion |
| Supersedes | Ad hoc conversational specifications for this funnel where they conflict with this manifest |

## 00.1 Source-of-Truth Statement

This document is the canonical, version-controlled specification for the WindowMan Quote-First acquisition experience.

It defines:

- required final product behavior,
- conversion architecture,
- approved UX sequence,
- locked conversion copy,
- state transitions,
- qualification logic,
- report personalization,
- inbound-call conversion behavior,
- event requirements,
- responsive and accessibility requirements,
- prohibited regressions,
- and the implementation sprint dependency structure.

Future sprint contracts MAY implement subsets of this specification.

Future sprint contracts MUST NOT:

- silently contradict this manifest,
- redefine the canonical funnel,
- add unapproved conversion gates,
- rewrite LOCKED COPY,
- introduce competing top-of-funnel journeys,
- or reinterpret mandatory requirements without an explicit manifest revision.

## 00.2 Authority Precedence

When implementation artifacts conflict, use this hierarchy:

1. Root repository execution instructions such as `AGENTS.md`, where present.
2. This canonical `MASTER_MANIFEST.md`.
3. Approved sprint contract for the active sprint.
4. Approved `.lovable/plan.md` for the active sprint.
5. Existing implementation details.

A lower-ranked source MUST NOT silently override a higher-ranked source.

## 00.3 Change-Control Rule

Material changes to:

- funnel sequence,
- locked copy,
- required states,
- conversion gates,
- qualification structure,
- data lifecycle,
- routing rules,
- report hierarchy,
- or prohibited regressions

MUST be made through an explicit revision to this manifest.

Implementation convenience alone is not sufficient justification to alter the specification.

## 00.4 Normative Terminology

- **MUST** — mandatory requirement.
- **MUST NOT** — prohibited.
- **SHOULD** — preferred unless a documented implementation constraint prevents it.
- **SHOULD NOT** — discouraged unless a documented implementation constraint requires it.
- **MAY** — optional.
- **LOCKED COPY** — conversion-critical wording that MUST NOT be paraphrased without explicit approval.
- **SUPPORTING COPY** — wording whose meaning MUST remain intact but MAY receive minor formatting or grammar adjustments that do not alter intent.
- **IMPLEMENTATION DECISION TO VALIDATE** — a material implementation choice not yet explicitly approved and therefore not canonical until validated.

---

# 01. PRODUCT MISSION

## 01.1 Product Role

WindowMan is a consumer quote-intelligence and decision-support experience designed to help homeowners understand contractor estimates before or after making a major home-improvement purchasing decision.

The Quote-First experience centers on one simple behavior:

> The homeowner uploads the estimate they already possess, and WindowMan turns that document into structured decision intelligence.

WindowMan MUST present itself as a consumer-facing analysis tool.

It MUST NOT present itself as:

- a licensed contractor unless separately and truthfully authorized,
- a law firm,
- a governmental authority,
- a guaranteed pricing authority,
- or an infallible substitute for professional legal, financial, engineering, permitting, or contracting advice.

## 01.2 Consumer Promise

The experience SHOULD help the homeowner understand:

- what they are being quoted,
- what products and scope appear in the estimate,
- how payment terms are structured,
- what specifications are present,
- what information may be vague or missing,
- what deserves clarification,
- and what questions or next steps may help them make a more informed decision.

## 01.3 Primary User Objective

For a quote-ready homeowner:

> Upload the estimate with effectively zero upfront administrative friction and receive useful, personalized quote intelligence.

## 01.4 Primary Commercial Objective

The funnel MUST identify and prioritize homeowners who represent meaningful commercial intent, especially homeowners who:

- possess a real contractor estimate,
- have not finalized their decision,
- express an unresolved objection or concern,
- consume the resulting Truth Report,
- and choose to initiate an inbound conversation.

The system MUST distinguish this high-intent state from generic form completion.

## 01.5 Core Strategic Principle

The fundamental acquisition asset is not merely a contact record.

It is a structured commercial situation containing, where available:

- actual quote data,
- homeowner identity,
- contractor identity,
- price,
- project characteristics,
- transaction state,
- decision concern,
- report engagement,
- acquisition attribution,
- and downstream action.

---

# 02. FUNNEL PRINCIPLES

## 02.1 Zero Upfront Friction

### UX Rule

The primary quote-ready path MUST allow the visitor to begin by uploading an estimate without first providing:

- name,
- email,
- phone,
- ZIP,
- account credentials,
- OTP,
- questionnaire responses,
- or JourneyStage selection.

### Psychological Principle

**Friction reduction / reactance reduction.**

The user is allowed to perform the action promised by the advertisement before being asked to disclose personal information.

### Expected Behavioral Effect

Reduce resistance created by traditional lead forms and maximize progression from paid-ad click to meaningful quote-upload behavior.

---

## 02.2 The Upload Is the Intake Form

### UX Rule

The uploaded estimate MUST become the beginning of the customer-data lifecycle.

WindowMan SHOULD extract useful identity and project data from the document rather than requiring the homeowner to manually re-enter information already contained within it.

### Psychological Principle

**Effort minimization and behavioral congruence.**

The system uses information already voluntarily supplied as part of the core task.

### Expected Behavioral Effect

Reduce redundant typing and make the experience feel like a functional tool rather than a disguised lead form.

---

## 02.3 Demonstrate Value Before Requesting Effort

### UX Rule

The homeowner MUST receive visible evidence that WindowMan understood the uploaded estimate before the system asks them to verify identity.

### Psychological Principle

**Reciprocity and competence signaling.**

WindowMan gives meaningful evidence of value before asking for additional participation.

### Expected Behavioral Effect

Increase trust in the analysis and reduce resistance to the next verification step.

---

## 02.4 Progressive Disclosure

### UX Rule

Only information needed for the current decision SHOULD be shown at each state.

The system MUST NOT expose the entire future funnel simultaneously.

### Psychological Principle

**Cognitive-load reduction.**

Complexity is broken into manageable steps.

### Expected Behavioral Effect

Reduce overwhelm and maintain focus on the immediate next action.

---

## 02.5 Progressive Profiling

### UX Rule

The system SHOULD collect information only when it becomes contextually relevant.

Canonical progression:

1. File
2. Extracted quote intelligence
3. Identity verification
4. Transaction state
5. Decision reason
6. Downstream human action

### Psychological Principle

**Commitment sequencing.**

Small actions precede larger actions.

### Expected Behavioral Effect

Create a natural progression rather than an upfront interrogation.

---

## 02.6 One Dominant Action Per State

### UX Rule

Every major state MUST have one visually dominant primary action.

Secondary actions MAY exist only where necessary for recovery or accessibility and MUST NOT compete visually with the primary action.

### Psychological Principle

**Choice architecture and decision simplification.**

### Expected Behavioral Effect

Reduce indecision and make the next step immediately obvious.

---

## 02.7 Ask at Maximum Contextual Relevance

### UX Rule

Questions MUST appear at the moment the answer is most relevant to what the user is doing.

Examples:

- File availability is addressed at upload.
- Identity is verified after document understanding is demonstrated.
- Purchase status is requested immediately before personalized report reveal.
- Inbound-call action appears after report value.

### Psychological Principle

**Context-dependent compliance and relevance.**

### Expected Behavioral Effect

Questions feel necessary to the experience rather than arbitrary lead collection.

---

## 02.8 Reciprocity Before Qualification

### UX Rule

The system MUST display genuine personalized quote information before requesting transaction qualification.

### Psychological Principle

**Reciprocity.**

### Expected Behavioral Effect

The user has already received something useful before answering classification questions.

---

## 02.9 Peak-Curiosity Micro-Qualification

### UX Rule

The two-step qualification intercept MUST occur after:

- successful upload,
- document processing,
- partial reveal,
- and identity verification,

but immediately before full report reveal.

### Psychological Principle

**Information-gap theory / curiosity tension.**

### Expected Behavioral Effect

The user is motivated to complete two low-effort questions because the desired report is immediately available afterward.

---

## 02.10 Immediate Payoff After Qualification

### UX Rule

After the second qualification response, the full Truth Report MUST become available without another surprise gate.

### Psychological Principle

**Expectation consistency.**

### Expected Behavioral Effect

Preserve trust and avoid bait-and-switch perception.

---

## 02.11 Human Escalation Only After Meaningful Digital Value

### UX Rule

A prominent contextual inbound-call CTA MUST NOT replace the promised report or appear as a premature hard sell.

The homeowner MUST first receive meaningful report value.

### Psychological Principle

**Reactance reduction and commitment consistency.**

### Expected Behavioral Effect

The phone call feels like a logical continuation of the analysis rather than the hidden purpose of the funnel.

---

## 02.12 Mobile-First Thumb Interaction

### UX Rule

The funnel MUST be designed first for mobile paid traffic.

Primary actions and qualification choices MUST be:

- large,
- legible,
- tap-friendly,
- vertically scannable,
- and usable with one thumb.

### Psychological Principle

**Motor-effort reduction and interaction fluency.**

### Expected Behavioral Effect

Reduce accidental taps, hesitation, and mobile abandonment.

---

# 03. USER JOURNEYS

## 03.1 Journey A — Quote Available Now

### Definition

The homeowner possesses an accessible contractor estimate.

### Canonical Path

`LANDING`
→ `UPLOAD_INTENT`
→ `FILE_SELECTED`
→ `UPLOAD_PROCESSING`
→ `OCR_ANALYSIS`
→ `PARTIAL_REVEAL`
→ `IDENTITY_VERIFICATION`
→ `QUALIFICATION_Q1`
→ `QUALIFICATION_Q2`
→ `FULL_REPORT`
→ `CALL_CONVERSION`

### Objective

Reach a meaningful quote upload with no pre-upload contact gate.

---

## 03.2 Journey B — Upload Intent but Quote Unavailable

### Definition

The visitor demonstrates intent to upload but cannot currently provide a usable document.

Possible reasons:

- quote on another device,
- quote cannot be found,
- paper-only document,
- spouse or another person has it,
- quote has not yet arrived,
- file chooser opened but no document was selected,
- unsupported or unusable file.

### Allowed Recovery Path

`LANDING`
→ `UPLOAD_INTENT`
→ `UPLOAD_LATER`
→ minimum recovery capture
→ private scan-link delivery
→ later return
→ re-entry at upload

### Objective

Preserve demonstrated intent without turning the escape hatch into a competing primary funnel.

---

## 03.3 Journey C — Quote Uploaded + Still Deciding

### Definition

The homeowner has a real estimate and has not completed the purchase decision.

### Commercial Priority

This SHOULD be treated as the highest-priority active commercial cohort unless downstream data proves otherwise.

### Required Classification Data

- `quote_status = still_deciding`
- `decision_reason = selected concern`

### Report Behavior

The report hierarchy MUST prioritize the concern selected by the homeowner.

### Human Conversion

The inbound-call CTA SHOULD address the unresolved concern directly.

---

## 03.4 Journey D — Quote Uploaded + Passed on Quote

### Definition

The homeowner did not move forward with this specific offer.

### Possible Commercial States

- still shopping,
- seeking alternatives,
- rejected contractor,
- price objection,
- financing objection,
- timing issue,
- already chose another company.

### Required Classification

`quote_status = passed`

with a specific `decision_reason`.

### Routing Principle

The system MUST distinguish:

- passed but still shopping,
- passed because another company was selected.

These states MUST NOT be treated identically where downstream routing differs.

---

## 03.5 Journey E — Quote Uploaded + Already Signed

### Definition

The homeowner has already signed or purchased the project represented by the quote.

### Purpose

Potential uses include:

- post-purchase understanding,
- contract clarification,
- market intelligence,
- pricing intelligence,
- contractor intelligence,
- consumer education,
- referral opportunities.

### Routing Rule

This cohort MUST NOT automatically be treated as an open unsold sales opportunity.

---

# 04. MASTER STATE MACHINE

## 04.1 Canonical State Table

| State | Entry Condition | User Sees | Primary Action | Secondary Action | Data Created / Updated | Event | Exit Condition | Next Valid State |
|---|---|---|---|---|---|---|---|---|
| `LANDING` | Visitor enters Quote-First experience | Minimal header, hero, trust message, upload zone, value support | Upload estimate | Escape hatch | Session context / attribution capture | `quote_scan_landing_view` | User initiates upload or escape hatch | `UPLOAD_INTENT`, `UPLOAD_LATER` |
| `UPLOAD_INTENT` | User taps/selects upload control | Native file-selection or drag/drop interaction | Select file | “Don't Have Your File Handy?” | Intent timestamp | `upload_intent` | File selected or user exits without file | `FILE_SELECTED`, `UPLOAD_LATER` |
| `FILE_SELECTED` | Supported file selected | File confirmation / immediate upload transition | Continue automatically | Replace/cancel only where necessary | File metadata, document candidate ID | `upload_started` | Upload begins | `UPLOAD_PROCESSING` |
| `UPLOAD_PROCESSING` | Upload transmission begins | Upload/progress feedback | Automatic progression | Retry on recoverable failure | Anonymous quote session, document ID, attribution binding | `scannerupload` when successful | File stored/accepted or failure | `OCR_ANALYSIS`, `UPLOAD_FAILURE` |
| `OCR_ANALYSIS` | Document accepted | Forensic progress checklist, progressive high-confidence proof | Wait / automatic progression | Recovery only on failure | OCR fields, confidence, entity classes, quote intelligence | `ocr_completed` when complete | Minimum viable analysis available | `PARTIAL_REVEAL`, `UNREADABLE_FILE` |
| `PARTIAL_REVEAL` | Minimum viable analysis exists | Contractor, total, item/opening count, date where available, findings preview | Continue to verify identity | Correct/retry document only if necessary | Partial reveal timestamp | `partial_report_viewed` | User proceeds | `IDENTITY_VERIFICATION` |
| `IDENTITY_VERIFICATION` | Partial reveal delivered | OCR-prefilled identity candidates and missing fields | Confirm/correct identity | Edit fields | Verified identity / lead merge candidate | `identity_verified` | Required identity fields verified | `QUALIFICATION_Q1` |
| `QUALIFICATION_Q1` | Identity verified | “Where Are You With This Quote?” + three options | Tap one status | None | Quote status | `quote_status_selected` | One answer selected | `QUALIFICATION_Q2` |
| `QUALIFICATION_Q2` | Quote status selected | Dynamic reason question | Tap one reason | Optional “Something else” text | Decision reason | `decision_reason_selected` | One answer selected | `FULL_REPORT` |
| `FULL_REPORT` | Qualification complete | Personalized Truth Report | Read / interact with recommendations | Contextual secondary navigation inside report | Report engagement | `full_report_revealed` | Meaningful report value delivered | `CALL_CONVERSION` |
| `CALL_CONVERSION` | Relevant report value delivered | Dynamic contextual inbound-call CTA | Initiate phone call | Continue reading report | CTA exposure/click context | `phone_cta_viewed`, `phone_cta_clicked` | Call action or continued report use | External phone action / remain in `FULL_REPORT` |
| `UPLOAD_LATER` | User lacks accessible file or abandons selection | Recovery panel | Submit email for private scan link | Return to upload | Recovery lead/session | `upload_later_captured` after valid capture | Recovery capture complete | Confirmation / future re-entry |
| `UNSUPPORTED_FILE` | Unsupported type selected | Clear file-type error | Choose another file | Escape hatch | Error state | implementation event MAY be added | Valid replacement selected | `FILE_SELECTED`, `UPLOAD_LATER` |
| `UNREADABLE_FILE` | Document cannot be read sufficiently | Plain-language unreadable-document message | Upload clearer/replacement file | Escape hatch | Error metadata | implementation event MAY be added | Replacement selected or recovery chosen | `FILE_SELECTED`, `UPLOAD_LATER` |
| `UPLOAD_FAILURE` | Network/storage/upload fails | Recoverable failure message | Retry | Choose another file / escape hatch | Failure state preserved | implementation event MAY be added | Retry succeeds or alternate path chosen | `UPLOAD_PROCESSING`, `FILE_SELECTED`, `UPLOAD_LATER` |

## 04.2 Transition Rule

No state MAY introduce an unapproved required gate between two canonical states.

## 04.3 No Dead Ends

Every error or recovery state MUST provide at least one actionable exit.

---

# 05. ROUTING ARCHITECTURE

## 05.1 Required Product Behavior

The Quote-First experience MUST operate as a Single-Page Application conversion journey.

The user SHOULD experience the primary journey as one continuous application state progression.

There MUST NOT be top-of-funnel query-parameter tracking redirect chains used to bounce the user through tracking URLs before reaching the experience.

## 05.2 Attribution

Attribution data SHOULD be captured and retained internally.

Relevant acquisition context MAY include:

- source,
- medium,
- campaign,
- ad/creative identifier,
- click identifier where technically and legally appropriate,
- landing experience/version.

Attribution MUST remain associated with the anonymous quote session and later verified identity where technically possible.

## 05.3 Primary Route Philosophy

The Quote-First paid-acquisition route MUST be focused on the quote-ready action.

It MUST NOT recreate the unrelated JourneyStage multi-path questionnaire before upload.

`IMPLEMENTATION DECISION TO VALIDATE:` Final production pathname for the dedicated Quote-First entry route.

Possible examples MAY include:

- `/scan`
- `/quote-check`
- another approved clean route.

This manifest does not canonically select the pathname.

## 05.4 Internal State

Major funnel transitions SHOULD occur through application state rather than navigation to unrelated pages.

## 05.5 Refresh / Recovery

Where technically feasible, a page refresh SHOULD preserve enough non-sensitive session context to avoid unnecessary restart.

Sensitive document or identity state MUST be handled according to approved privacy/security architecture.

## 05.6 Anonymous-to-Verified Relationship

The system MUST support the conceptual relationship:

`anonymous session`
→ `document`
→ `OCR candidates`
→ `verified identity`
→ `canonical lead/customer`

without losing original acquisition attribution.

## 05.7 Non-Binding Implementation Guidance

The implementation MAY use:

- route-level orchestration,
- state machine logic,
- persisted session identifiers,
- backend session storage,
- or equivalent mechanisms.

Specific framework implementation is not mandated by this manifest.

---

# 06. DESIGN SYSTEM

## 06.1 Required Aesthetic

The experience MUST use:

# Dark Forensic Dossier + Clean Corporate SaaS

The intended impression is:

- credible,
- analytical,
- premium,
- restrained,
- clear,
- technically capable,
- consumer-protective without sensationalism.

## 06.2 Background Surfaces

Primary background:

- deep black or near-black charcoal.

Secondary surfaces:

- subtly elevated dark panels,
- clearly differentiated through restrained border/tonal contrast.

The page MUST NOT depend on bright gradients for hierarchy.

## 06.3 Borders

Borders SHOULD be:

- thin,
- subtle,
- neutral,
- functional.

Avoid over-outlining every element.

## 06.4 Color Roles

### Primary Text

Pure white or near-white where appropriate.

### Active Interactive Card Primary Text

MUST use:

`#ffffff`

unless an accessibility requirement explicitly requires an exception.

This applies to:

- qualification cards,
- selectable options,
- active decision surfaces,
- other primary interactive card content.

### Secondary Text

Muted neutral gray MAY be used where sufficient contrast is preserved.

### Accent Colors

Accent use SHOULD be restrained.

Possible semantic roles:

- primary action,
- success,
- warning,
- active selection,
- analysis status.

## 06.5 Typography

System fonts only.

Conceptual stack:

`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

No:

- Google Fonts,
- external font imports,
- custom hosted display fonts.

Hierarchy MUST be created through:

- size,
- weight,
- spacing,
- layout,
- contrast.

## 06.6 Spacing

The interface SHOULD use generous but controlled spacing.

Avoid:

- giant dead zones,
- compressed mobile layouts,
- unnecessarily tall sections.

## 06.7 Radius Philosophy

Use restrained professional radii.

Cards SHOULD generally use subtle rounding rather than exaggerated pill styling.

Pills SHOULD be reserved for:

- statuses,
- badges,
- compact metadata,

not entire interface architecture.

## 06.8 Button Hierarchy

Each state MUST provide one dominant primary CTA.

Primary buttons:

- high contrast,
- obvious,
- thumb-friendly,
- not excessively decorative.

Secondary actions:

- visually subordinate,
- text-link or quieter button treatment where appropriate.

## 06.9 Icon Philosophy

Icons MAY reinforce meaning.

Icons MUST NOT:

- replace essential text,
- become decorative clutter,
- create a game-like aesthetic.

## 06.10 Forensic Visual Language

Restrained cues MAY include:

- subtle grid,
- document-analysis markers,
- status lines,
- structured dossier panels,
- restrained scanning motion.

Avoid:

- sci-fi theatrics,
- excessive HUD overlays,
- neon overload,
- superhero-comic treatment,
- fake diagnostic complexity.

## 06.11 Motion

Motion MUST serve:

- progress,
- state change,
- feedback,
- hierarchy.

Motion MUST NOT exist solely as decoration.

Reduced-motion preferences MUST be respected.

---

# 07. EXACT APPROVED COPY

## 07.1 Copy Governance

### LOCKED COPY

LOCKED COPY MUST NOT be paraphrased by downstream Lovable agents without explicit approval.

### SUPPORTING COPY

SUPPORTING COPY MAY receive minor formatting changes that preserve meaning.

---

## 07.2 Header / Brand

### LOCKED COPY

Brand:

**WindowMan**

No traditional navigation is required on the Quote-First paid-acquisition page.

---

## 07.3 Hero

### LOCKED COPY

Eyebrow:

**INSTANT CONTRACTOR QUOTE AUDIT**

Headline:

**Drop Your Estimate Here. Get an Independent Truth Report in 30 Seconds.**

Trust line:

**100% Free • No Sales Calls • Keeps Your Quote Private**

### SUPPORTING COPY

**Upload the estimate you already received. WindowMan helps organize the pricing, products, payment terms, specifications, and details worth reviewing before you make a decision.**

### Primary CTA

**Upload My Estimate**

---

## 07.4 Uploader

### LOCKED COPY

Heading:

**Upload Your Estimate**

Supporting:

**PDF, photo, screenshot, or scanned estimate**

Primary control:

**Choose My Estimate**

Microcopy:

**No account required to start**

Escape-hatch link:

**Don't Have Your File Handy?**

---

## 07.5 Value Proposition Cards

### LOCKED COPY

#### Card 1

**Know What You're Paying For**

**See pricing and scope in one place.**

#### Card 2

**Spot What Deserves Attention**

**Find vague, missing, or unusual details worth reviewing.**

#### Card 3

**Understand Before You Sign**

**Turn a complicated estimate into a clearer decision.**

---

## 07.6 Privacy

### LOCKED COPY

**Your quote stays private. No contractor receives it unless you choose to share it.**

This statement MUST only remain if technically and operationally accurate.

---

## 07.7 Escape Hatch

### LOCKED COPY

Headline:

**Can't Find Your Estimate Right Now?**

Body:

**No problem. Send yourself a private scan link and pick up where you left off when you have the quote in front of you.**

Field label:

**Email**

Optional field:

**First Name**

CTA:

**Send My Scan Link**

Supporting value:

**We'll also send you a sample Truth Report so you can see what WindowMan looks for.**

Confirmation headline:

**You're Set.**

Confirmation body:

**Check your inbox when you're ready. Your WindowMan scanner will be waiting.**

---

## 07.8 Processing State

### LOCKED COPY

Headline:

**Estimate Received.**

Supporting:

**WindowMan is reading your quote now.**

Checklist:

- **Document received**
- **Reading contractor and project details**
- **Identifying pricing and scope**
- **Reviewing products and specifications**
- **Checking payment structure**

Final processing line:

**Building your Truth Report…**

---

## 07.9 Partial Reveal

### LOCKED COPY

Headline:

**Your Quote Is Scanned.**

Example labels:

**TOTAL QUOTED PRICE**

**OPENINGS / ITEMS DETECTED**

**PAYMENT MILESTONES FOUND**

**QUOTE DATE**

Findings preview examples:

- **Contractor and project details identified**
- **Product/specification information detected**
- **Payment structure analyzed**
- **3 areas deserve a closer look**

Transition:

**Your Complete Truth Report Is Ready.**

Supporting:

**First, let's make sure we read your quote correctly.**

Dynamic values MUST come from the analyzed quote and MUST NOT be fabricated.

---

## 07.10 Identity Verification

### LOCKED COPY

Headline:

**Is This You?**

Supporting:

**We found this information on your estimate. Check anything that needs correcting so we can personalize and save your Truth Report.**

Primary CTA when unchanged:

**Yes — That's Me**

Primary CTA when edited:

**Confirm My Information**

Missing-value copy:

**We couldn't confidently find this on your estimate.**

Email-specific helper:

**Where should we save your Truth Report?**

---

## 07.11 Qualification Introduction

### LOCKED COPY

**Two quick taps so we can put your results in the right context.**

Progress:

**1 of 2**

---

## 07.12 Question 1

### LOCKED COPY

# Where Are You With This Quote?

Responses:

**I ALREADY SIGNED**

**I'M STILL DECIDING**

**I PASSED ON IT**

---

## 07.13 Question 2 — Already Signed

### LOCKED COPY

Progress:

**2 of 2**

Question:

# What Ultimately Won You Over?

Options:

- **THE PRICE MADE SENSE**
- **I TRUSTED THE COMPANY / SALESPERSON**
- **THE PRODUCT / BRAND FELT RIGHT**
- **THE FINANCING OR PAYMENTS WORKED**
- **THE REVIEWS / REPUTATION WERE STRONG**
- **I WAS READY TO GET IT DONE**
- **SOMETHING ELSE**

Report CTA where needed:

**Show My Truth Report**

---

## 07.14 Question 2 — Still Deciding

### LOCKED COPY

Progress:

**2 of 2**

Question:

# What's The Biggest Thing You're Unsure About?

Options:

- **THE PRICE**
- **I'M COMPARING OTHER QUOTES**
- **I'M NOT SURE WHAT'S ACTUALLY INCLUDED**
- **THE PRODUCTS / SPECIFICATIONS**
- **THE PAYMENT TERMS / FINANCING**
- **I'M NOT SURE I TRUST THE COMPANY**
- **THE TIMING**
- **SOMETHING ELSE**

Report CTA where needed:

**Show Me What WindowMan Found**

---

## 07.15 Question 2 — Passed

### LOCKED COPY

Progress:

**2 of 2**

Question:

# What Made You Walk Away?

Options:

- **THE PRICE WAS TOO HIGH**
- **I WANTED MORE QUOTES**
- **THE QUOTE WAS CONFUSING / VAGUE**
- **I DIDN'T TRUST THE COMPANY**
- **I DIDN'T LIKE THE PRODUCTS / SPECS**
- **THE PAYMENT TERMS / FINANCING**
- **I CHOSE ANOTHER COMPANY**
- **THE TIMING WASN'T RIGHT**
- **SOMETHING ELSE**

Report CTA where needed:

**Show My Truth Report**

---

## 07.16 Truth Report Transition

### LOCKED COPY

Primary report heading:

**YOUR TRUTH REPORT**

Supporting heading:

**Here's What WindowMan Found.**

Dynamic personalization example structure:

**[First Name], you're still deciding because [selected concern].**

**Let's start there.**

Dynamic wording MUST reflect actual selected state/reason and MUST NOT invent an unselected concern.

---

## 07.17 Dynamic Inbound Call Copy

### Still Deciding — Default

Headline:

**Don't Make The Decision Alone.**

Supporting:

**Have your estimate open and talk through what WindowMan found before you make your final decision.**

CTA:

**Call WindowMan — Review My Quote**

---

### Price Concern

Headline:

**Still Not Sure About The Price?**

Supporting:

**Let's walk through what you're paying for and the questions worth asking before you sign.**

CTA:

**Talk Through My Price**

---

### Comparing Quotes

Headline:

**Comparing Another Estimate?**

Supporting:

**Have both quotes ready. We'll help you identify what needs to match before you compare the totals.**

CTA:

**Compare My Quotes**

---

### Payment Concern

Headline:

**Concerned About The Payment Schedule?**

Supporting:

**Let's walk through what the quote says before you commit.**

CTA:

**Review My Payment Terms**

---

### Trust Concern

Headline:

**Something Still Doesn't Feel Right?**

Supporting:

**Have the estimate open and talk through the areas WindowMan flagged.**

CTA:

**Get A Second Opinion**

---

### Passed on Quote

Headline:

**Still Shopping?**

Supporting:

**Your previous quote already taught us something important: what you didn't want.**

CTA:

**Plan My Next Move**

---

### Already Signed

Headline:

**Already Signed?**

Supporting:

**Your Truth Report can still help you understand the agreement, products, payment schedule, and questions worth clarifying.**

CTA:

**Help Me Understand My Contract**

---

## 07.18 Minimal Footer

### LOCKED COPY

**© WindowMan**

**Privacy Policy**

`IMPLEMENTATION DECISION TO VALIDATE:` Exact legal entity/copyright-year formatting.

---

## 07.19 SUPERSEDED COPY

The following previously discussed variants are superseded by the latest approved canonical wording above and MUST NOT be silently blended back into implementation:

### Superseded Hero Variants

- **Already Have an Estimate?**
- **Upload it. WindowMan will help you understand what you're actually being asked to sign.**
- **FREE WINDOW QUOTE X-RAY**

These MAY be reconsidered only through explicit CRO testing approval.

### Superseded Question 1 Wording

- **Have you already signed a contract or purchased the project shown in this estimate?**
- **Yes — I Already Bought / Signed**
- **No — I Haven't Moved Forward**

Canonical wording is the three-state:

- **I ALREADY SIGNED**
- **I'M STILL DECIDING**
- **I PASSED ON IT**

### Superseded Binary Transaction Logic

Binary `yes/no` purchased logic is prohibited because it incorrectly groups active undecided homeowners with definitively rejected offers.

---

# 08. COMPONENT ARCHITECTURE

## 08.1 Required Architectural Principle

Implementation SHOULD use clear production components with defined responsibilities.

It MUST NOT create gratuitous duplicate `V2`, `V3`, sandbox, demo, or preview-only component families when reusable production architecture can safely support the required behavior.

## 08.2 Conceptual Components

| Component | Responsibility | Primary Inputs | Outputs / Events | Role |
|---|---|---|---|---|
| `MinimalHeader` | Brand legitimacy without navigation distraction | Brand asset/config | None | Reusable |
| `QuoteHero` | Present core promise and direct user toward upload | Locked copy, uploader integration | Upload intent | Route-specific composition |
| `EstimateDropzone` | File selection / drag/drop | Accepted file rules, upload callbacks | `upload_intent`, selected file | Reusable |
| `UploadEscapeHatch` | Recover user without available quote | Session context | Recovery capture | Reusable |
| `UploadRecoveryState` | Handle file/network/document failures | Error type | Retry, replace, escape | Reusable |
| `ProcessingScanner` | Show real processing progress | Processing state, extracted high-confidence values | Progress visibility | Reusable |
| `QuoteSnapshot` | Present top-line extracted quote facts | Quote analysis data | None | Reusable |
| `PartialReveal` | Demonstrate analysis value before identity verification | Quote snapshot, preliminary findings | `partial_report_viewed` | Route-specific composition |
| `IdentityVerification` | Confirm OCR-derived homeowner identity | Candidate identity + confidence | Verified identity | Reusable |
| `QualificationQuestion` | Present one thumb-friendly qualification step | Question definition, answer options | Status/reason selection | Reusable |
| `TruthReport` | Present personalized decision-support dossier | Analysis + qualification context | Report engagement | Reusable/core |
| `ContextualCallCTA` | Convert report insight into relevant inbound call | Status, concern, call routing | Call CTA interaction | Reusable |
| `MinimalFooter` | Legal/privacy footer | Legal links | External privacy navigation | Reusable |

## 08.3 Production-Purpose Rule

Every new component MUST have a clear production responsibility.

Visual experimentation SHOULD occur without leaving permanent sandbox artifacts in production architecture.

---

# 09. UPLOAD ARCHITECTURE

## 09.1 Primary Requirement

A quote-ready user MUST be able to initiate upload without first providing personal contact information.

## 09.2 Conceptual Supported Inputs

The UI SHOULD support the concept of:

- PDF,
- image/photo,
- screenshot,
- scanned document.

`IMPLEMENTATION DECISION TO VALIDATE:` Exact MIME types, file-size limits, image counts, and backend processing limits.

## 09.3 Desktop Behavior

Desktop SHOULD support:

- drag and drop,
- click-to-select.

## 09.4 Mobile Behavior

Mobile MUST support:

- tap-to-select,
- device-supported document/photo selection.

Mobile MUST NOT depend on drag-and-drop.

## 09.5 Selected File State

After selection, the system SHOULD display enough confirmation to reassure the user that the intended file was chosen.

Possible metadata:

- filename,
- type,
- size where useful.

The user SHOULD NOT encounter an unnecessary extra confirmation screen unless technically required.

## 09.6 Upload Session Creation

As soon as the upload becomes a meaningful session, the system SHOULD establish:

- anonymous session ID,
- document ID,
- timestamp,
- attribution context.

## 09.7 Attribution Preservation

The document/upload session MUST remain connected to original acquisition context where technically possible.

## 09.8 Multi-Page Extensibility

Architecture SHOULD support multi-page estimates without requiring a future UX rewrite.

## 09.9 Multiple-Image Extensibility

Architecture SHOULD be extensible to multiple images representing one estimate.

## 09.10 Privacy

Uploaded documents MUST be handled according to approved privacy/security policies.

The user-facing system MUST NOT make unsupported privacy or security claims.

## 09.11 Transition

Successful upload proceeds directly to document analysis.

No lead form MAY be inserted between file selection and processing.

---

# 10. ESCAPE-HATCH ARCHITECTURE

## 10.1 Purpose

Recover high-intent visitors who intended to upload but cannot currently provide the estimate.

## 10.2 Trigger Conditions

The escape hatch MAY be offered when:

- user explicitly clicks **Don't Have Your File Handy?**
- file picker closes without selection,
- user abandons selection,
- quote is inaccessible,
- selected file is unusable and replacement is not immediately available.

## 10.3 Visual Priority

The escape hatch MUST remain subordinate to the main upload action.

It MUST NOT appear as an equal-weight competing hero CTA.

## 10.4 Minimum Information

Required initial field SHOULD be:

- email.

Optional:

- first name.

Phone MUST NOT be required by default for the upload-later recovery path.

## 10.5 Psychological Framing

The interaction MUST be framed as:

> helping the user finish an action they already attempted.

It MUST NOT feel like a generic newsletter or sales lead form.

## 10.6 Recovery Deliverable

The system SHOULD send:

- resumable/private scan link,
- sample Truth Report or equivalent immediate useful preview.

## 10.7 Nurture Objective

Primary recovery objective:

> Get the estimate uploaded.

Follow-up SHOULD remain centered on completing the scan.

## 10.8 Re-Entry

Returning users SHOULD re-enter the primary quote-upload journey with attribution/recovery context preserved where technically possible.

---

# 11. PROCESSING STATE

## 11.1 Purpose

Use real processing time to:

- confirm progress,
- demonstrate competence,
- build anticipation.

## 11.2 Required Visible Sequence

The interface MUST support progression through:

1. **Document received**
2. **Reading contractor and project details**
3. **Identifying pricing and scope**
4. **Reviewing products and specifications**
5. **Checking payment structure**
6. **Building your Truth Report…**

## 11.3 Truthfulness Rule

Progress indicators MUST correspond reasonably to actual system state.

The system MUST NOT create fake long delays solely to dramatize scanning.

## 11.4 Progressive Personalization

Where high-confidence data becomes available during processing, the UI MAY progressively surface:

- contractor,
- quote total,
- opening/item count.

Example:

**ABC Impact Windows detected**

then:

**$47,826 quote total detected**

then:

**14 openings identified**

Dynamic values MUST be real extracted values.

## 11.5 Motion

Use restrained:

- checklist progression,
- subtle transitions,
- state confirmation.

Avoid decorative effects that imply unsupported technical capabilities.

## 11.6 Reduced Motion

The processing experience MUST remain understandable with reduced motion enabled.

---

# 12. OCR / PARTIAL REVEAL

## 12.1 Extraction Targets

### Customer Identity Candidates

Where confidently identifiable:

- name,
- email,
- phone,
- property/service address,
- ZIP.

### Quote Intelligence

Where available:

- contractor/company,
- salesperson,
- quote date,
- expiration date,
- total quoted price,
- deposit,
- payment schedule,
- financing information,
- openings/items,
- products,
- manufacturer,
- scope,
- warranty information,
- specifications,
- exclusions,
- other report-relevant data.

## 12.2 Identity Candidate Data Model

Every extracted identity candidate SHOULD conceptually contain:

- `value`
- `source`
- `confidence`
- `entity_classification`

## 12.3 Entity Classification

The system MUST NOT blindly assume the first detected:

- phone,
- email,
- name,
- address

belongs to the homeowner.

Possible entities include:

- homeowner/customer,
- co-owner,
- salesperson,
- contractor office,
- finance provider,
- manufacturer,
- other party.

## 12.4 Confidence Behavior

### High Confidence

MAY be prefilled as likely correct.

### Medium Confidence

MAY be prefilled but MUST invite explicit confirmation/correction.

### Low Confidence

MUST NOT be confidently represented as verified homeowner data.

Prefer blank/manual field with:

**We couldn't confidently find this on your estimate.**

## 12.5 Partial Reveal Purpose

The partial reveal MUST prove the scan performed useful work before identity verification.

## 12.6 Top-Line Information

Where available and reliable, partial reveal MAY show:

- contractor/company,
- total quoted price,
- opening/item count,
- payment milestone count,
- quote date,
- high-level categories analyzed,
- count of areas deserving attention.

## 12.7 Genuine Value Rule

The partial reveal MUST provide real information.

It MUST NOT be a fully obscured fake preview whose only function is to force lead capture.

## 12.8 No Unsupported Findings

A warning such as:

**3 areas deserve a closer look**

MUST correspond to actual analysis output.

---

# 13. IDENTITY VERIFICATION

## 13.1 Timing

Identity verification MUST occur after partial value has been demonstrated.

## 13.2 Purpose

Convert OCR-derived identity candidates into verified user-controlled information with minimal manual effort.

## 13.3 Prefill Behavior

High/medium-confidence candidate values MAY be prefilled according to Section 12.

Users MUST be able to correct them.

## 13.4 Missing Fields

Missing or low-confidence fields SHOULD use plain-language helper copy.

Do not display internal terminology such as:

- OCR failure,
- extraction error codes,
- parser confidence scores.

## 13.5 CTA

Default:

**Yes — That's Me**

If corrections occur:

**Confirm My Information**

## 13.6 Lead Lifecycle

Verified identity SHOULD be associated with the existing anonymous quote session rather than creating a disconnected duplicate record.

## 13.7 Identity Is Not Consent

The system MUST distinguish:

1. Extracted identity
2. User-verified identity
3. Communication permission
4. Legally required marketing / SMS / automated-contact consent

A phone number appearing on a quote MUST NOT automatically be treated as consent to marketing communications.

No dark-pattern consent is permitted.

---

# 14. MICRO-QUALIFICATION

## 14.1 Structure

Qualification MUST consist of exactly two lightweight question stages before full report reveal.

The user MUST see:

**1 of 2**

then:

**2 of 2**

No additional mandatory survey question MAY be inserted without manifest revision.

---

## 14.2 Question 1 — Transaction State

### LOCKED COPY

# Where Are You With This Quote?

Responses:

- **I ALREADY SIGNED**
- **I'M STILL DECIDING**
- **I PASSED ON IT**

## 14.3 Why Three States Are Required

Binary purchased/not-purchased logic is insufficient.

A person who:

- received the quote yesterday,
- is actively comparing,
- and has not decided

is commercially different from a person who:

- rejected the quote,
- abandoned the project,
- or chose another company.

The canonical states MUST preserve this distinction.

---

## 14.4 Question 2 — Already Signed

### LOCKED COPY

# What Ultimately Won You Over?

Options:

- **THE PRICE MADE SENSE**
- **I TRUSTED THE COMPANY / SALESPERSON**
- **THE PRODUCT / BRAND FELT RIGHT**
- **THE FINANCING OR PAYMENTS WORKED**
- **THE REVIEWS / REPUTATION WERE STRONG**
- **I WAS READY TO GET IT DONE**
- **SOMETHING ELSE**

### Purpose

Capture positive purchase-driver intelligence.

This cohort SHOULD be classified as post-purchase unless other data indicates an open opportunity.

---

## 14.5 Question 2 — Still Deciding

### LOCKED COPY

# What's The Biggest Thing You're Unsure About?

Options:

- **THE PRICE**
- **I'M COMPARING OTHER QUOTES**
- **I'M NOT SURE WHAT'S ACTUALLY INCLUDED**
- **THE PRODUCTS / SPECIFICATIONS**
- **THE PAYMENT TERMS / FINANCING**
- **I'M NOT SURE I TRUST THE COMPANY**
- **THE TIMING**
- **SOMETHING ELSE**

### Purpose

Identify the unresolved buying objection.

This cohort SHOULD be treated as the highest-priority active commercial segment unless downstream economics establish otherwise.

---

## 14.6 Question 2 — Passed

### LOCKED COPY

# What Made You Walk Away?

Options:

- **THE PRICE WAS TOO HIGH**
- **I WANTED MORE QUOTES**
- **THE QUOTE WAS CONFUSING / VAGUE**
- **I DIDN'T TRUST THE COMPANY**
- **I DIDN'T LIKE THE PRODUCTS / SPECS**
- **THE PAYMENT TERMS / FINANCING**
- **I CHOSE ANOTHER COMPANY**
- **THE TIMING WASN'T RIGHT**
- **SOMETHING ELSE**

### Purpose

Capture:

- lost-offer intelligence,
- remaining purchase intent,
- contractor/offer objections,
- alternate-provider selection.

**I CHOSE ANOTHER COMPANY** MUST remain distinguishable from still-shopping reasons.

---

## 14.7 Interaction Rules

The qualification UI MUST:

- show one question per screen,
- use large tap targets,
- avoid dropdowns,
- not require typed explanations,
- allow optional text only after **Something Else** where useful,
- progress immediately or near-immediately after selection,
- use pure white `#ffffff` primary text inside active/selectable cards.

---

# 15. TRUTH REPORT

## 15.1 Product Role

The Truth Report is a consumer decision-support dossier.

It MUST NOT be merely a decorative summary.

## 15.2 Required Hierarchy

### Layer 1 — Answer / Executive Truth Summary

Answer:

> What is the overall story of this quote?

The homeowner SHOULD be able to understand the primary takeaway quickly.

### Layer 2 — Quote Snapshot

Present core detected facts such as:

- contractor,
- total,
- quote date,
- project/opening count,
- relevant project facts.

### Layer 3 — Findings

Organize meaningful findings into appropriate categories.

Potential categories include:

- pricing,
- scope,
- products/specifications,
- payment terms,
- warranties,
- missing/unclear information,
- comparison issues,
- items requiring clarification.

### Layer 4 — Evidence

Each important finding SHOULD explain:

- what was observed,
- where relevant,
- why it matters.

### Layer 5 — Recommended Next Move

Each meaningful finding SHOULD provide an actionable next step where supportable.

Examples:

- ask the contractor this question,
- confirm this specification,
- compare this item,
- get this term clarified in writing,
- verify this payment condition.

## 15.3 Required Finding Logic

Every major finding SHOULD attempt to answer:

1. What did we observe?
2. Why does it matter?
3. What should the homeowner consider doing next?

## 15.4 Claims Standard

The report MUST avoid unsupported absolute conclusions.

It SHOULD distinguish:

- observed fact,
- inferred concern,
- missing information,
- recommendation.

---

# 16. REPORT PERSONALIZATION

## 16.1 Qualification Must Affect Presentation

Qualification responses MUST influence report hierarchy and messaging.

They MUST NOT exist solely as CRM metadata.

---

## 16.2 Price Concern

If the homeowner selects price as the primary concern, prioritize:

- quote total,
- relevant unit/effective pricing where analytically supportable,
- price concentrations,
- scope ambiguity affecting comparison,
- missing information affecting value judgment.

Suggested dynamic transition:

**[First Name], you're still deciding because the price feels high. Let's start there.**

---

## 16.3 Comparing Quotes

Prioritize:

- product/specification normalization,
- quantities,
- opening count,
- scope,
- exclusions,
- warranties,
- payment structure,
- missing data necessary for apples-to-apples comparison.

---

## 16.4 Payment / Financing Concern

Prioritize:

- deposit,
- milestones,
- payment timing,
- financing mechanics,
- unusual or unclear terms,
- missing payment details.

---

## 16.5 Trust Concern

Prioritize where supportable:

- contractor identity,
- contractual/document clarity,
- inconsistencies,
- missing information,
- licensing/reputation information only where legally and technically supported.

The system MUST NOT fabricate reputation or licensing conclusions.

---

## 16.6 Products / Specifications Concern

Prioritize:

- manufacturer/product references,
- specification completeness,
- product-code or rating information where actually available,
- missing model/detail information,
- inconsistencies.

---

## 16.7 Already Signed

Frame the report around:

- understanding what was signed,
- clarifying scope,
- understanding payment milestones,
- product/specification review,
- questions worth confirming before or during fulfillment.

Do not automatically frame this cohort as an unsold opportunity.

---

## 16.8 Passed on Quote

Where the homeowner remains in-market, the report SHOULD help convert prior objections into decision criteria for the next quote.

Where **I CHOSE ANOTHER COMPANY** is selected, the experience SHOULD avoid assuming the original quote remains commercially actionable.

---

# 17. INBOUND CALL CONVERSION

## 17.1 Core Rule

The contextual inbound-call CTA MUST appear only after meaningful report value has been delivered.

A generic hard-sell:

`CALL NOW`

MUST NOT replace the promised analysis.

## 17.2 Psychological Purpose

The call should feel like:

> the natural continuation of a personalized analysis.

Not:

> the hidden sales objective revealed after data capture.

---

## 17.3 Still Deciding — Default

Headline:

**Don't Make The Decision Alone.**

Supporting:

**Have your estimate open and talk through what WindowMan found before you make your final decision.**

CTA:

**Call WindowMan — Review My Quote**

### Routing Context

Pass where technically possible:

- quote/session ID,
- quote total,
- contractor,
- selected concern,
- acquisition source.

---

## 17.4 Price Concern

Headline:

**Still Not Sure About The Price?**

Supporting:

**Let's walk through what you're paying for and the questions worth asking before you sign.**

CTA:

**Talk Through My Price**

### Psychological Purpose

Continue the exact unresolved concern rather than switching to generic sales language.

---

## 17.5 Comparing Quotes

Headline:

**Comparing Another Estimate?**

Supporting:

**Have both quotes ready. We'll help you identify what needs to match before you compare the totals.**

CTA:

**Compare My Quotes**

---

## 17.6 Payment Concern

Headline:

**Concerned About The Payment Schedule?**

Supporting:

**Let's walk through what the quote says before you commit.**

CTA:

**Review My Payment Terms**

---

## 17.7 Trust Concern

Headline:

**Something Still Doesn't Feel Right?**

Supporting:

**Have the estimate open and talk through the areas WindowMan flagged.**

CTA:

**Get A Second Opinion**

---

## 17.8 Passed on Quote

Headline:

**Still Shopping?**

Supporting:

**Your previous quote already taught us something important: what you didn't want.**

CTA:

**Plan My Next Move**

### Routing Note

If the homeowner selected **I CHOSE ANOTHER COMPANY**, messaging MAY need a more post-decision framing.

`IMPLEMENTATION DECISION TO VALIDATE:` Whether this specific reason receives its own call variant in Sprint 13.

---

## 17.9 Already Signed

Headline:

**Already Signed?**

Supporting:

**Your Truth Report can still help you understand the agreement, products, payment schedule, and questions worth clarifying.**

CTA:

**Help Me Understand My Contract**

---

## 17.10 Sticky Mobile CTA

A restrained sticky mobile call CTA MAY appear only after the user has consumed meaningful report content.

It MUST NOT cover essential content.

It MUST NOT appear immediately upon report load if that would undermine the promised-value-first sequence.

`IMPLEMENTATION DECISION TO VALIDATE:` Exact behavioral threshold for activation.

---

# 18. EVENT / ATTRIBUTION ARCHITECTURE

## 18.1 Canonical Event Ladder

The system MUST conceptually support:

`quote_scan_landing_view`

→

`upload_intent`

→

`upload_started`

→

`scannerupload`

or

`upload_abandoned`

→

`ocr_completed`

→

`partial_report_viewed`

→

`identity_verified`

→

`quote_status_selected`

→

`decision_reason_selected`

→

`full_report_revealed`

→

`phone_cta_viewed`

→

`phone_cta_clicked`

→

`inbound_call_connected`

Downstream where available:

`qualified_call`

→

`scheduled`

→

`sold`

## 18.2 Recovery Event

Escape-hatch conversion:

`upload_later_captured`

## 18.3 Event Context

Relevant events SHOULD include, where available and permitted:

- session ID,
- document/quote ID,
- source,
- medium,
- campaign,
- ad/creative identifiers,
- click identifier,
- quote status,
- decision reason,
- report context.

## 18.4 Vendor Independence

This manifest defines conceptual product events.

It MUST NOT unnecessarily bind the product architecture to a single analytics or advertising vendor.

## 18.5 No Credentials

No production credentials, tokens, secrets, or API keys belong in this manifest.

## 18.6 Downstream Optimization Principle

Long-term advertising optimization SHOULD move toward economically meaningful downstream behavior when sufficient reliable event volume exists.

The conceptual hierarchy is:

click

→ upload

→ active quote

→ still deciding / meaningful opportunity

→ qualified interaction

→ revenue

The product MUST NOT assume raw form CPL is the ultimate success metric.

---

# 19. DATA & IDENTITY LIFECYCLE

## 19.1 Canonical Lifecycle

`Anonymous Visitor`

→

`Anonymous Quote Session`

→

`Uploaded Document`

→

`OCR-Derived Identity Candidates`

→

`User-Verified Identity`

→

`Canonical Lead / Customer Record`

## 19.2 Anonymous Visitor

May have:

- acquisition attribution,
- session identifier,
- page engagement.

No verified identity is required.

## 19.3 Anonymous Quote Session

Created when the visitor meaningfully begins the quote-scan journey.

Should bind:

- session,
- upload,
- attribution.

## 19.4 Uploaded Document

Associated with:

- document ID,
- session ID,
- processing state,
- extraction output.

## 19.5 OCR-Derived Identity Candidates

Candidate fields MUST remain distinguishable from verified identity.

Low-confidence extracted data MUST NOT overwrite verified user data.

## 19.6 User-Verified Identity

Once confirmed/corrected, verified fields become the authoritative user-provided identity for this funnel interaction.

## 19.7 Canonical Lead / Customer Record

The system SHOULD merge the verified identity into the canonical data model without losing:

- anonymous-session attribution,
- quote/document relationship,
- qualification data.

## 19.8 Merge Principle

Verified data SHOULD take precedence over conflicting low-confidence OCR-derived candidates.

Existing canonical records SHOULD be reconciled according to approved backend identity/lead architecture.

This manifest does not redefine existing database merge logic outside the Quote-First requirements.

## 19.9 Attribution Continuity

Attribution SHOULD persist from:

paid click

through:

upload

through:

identity

through:

report

through:

inbound call/downstream lifecycle

where technically possible.

---

# 20. RESPONSIVE RULES

## 20.1 Mobile-First

The funnel MUST be designed for mobile-first paid acquisition.

## 20.2 Required Width Review

Implementation MUST be validated at minimum around:

- `320px`
- `375px`
- `390px`
- `430px`
- tablet
- laptop
- large desktop

## 20.3 Touch Targets

Primary buttons and selectable cards MUST provide sufficiently large touch targets.

Tiny inline targets MUST NOT be used for primary conversion actions.

## 20.4 Uploader

### Mobile

Tap-first interaction.

### Desktop

Drag/drop and click selection SHOULD both be available.

## 20.5 Card Stacking

Interactive cards MUST stack or reflow without:

- horizontal overflow,
- unreadably small text,
- compressed tap areas.

## 20.6 Text Width

Long-form report text SHOULD maintain readable line lengths.

Desktop layouts MUST NOT create excessively wide prose.

## 20.7 Report Readability

The report SHOULD prioritize:

- hierarchy,
- collapsible/detail organization where helpful,
- scannable findings,
- clear next actions.

## 20.8 Sticky CTA

Sticky mobile call CTA behavior MUST follow Section 17.

## 20.9 No Horizontal Overflow

No required state MAY create horizontal page scrolling at supported widths.

## 20.10 No Hover Dependency

Essential information and actions MUST NOT depend exclusively on hover.

---

# 21. ACCESSIBILITY

## 21.1 Keyboard Access

Interactive controls MUST be keyboard accessible where platform conventions support it.

## 21.2 Focus Visibility

Focusable controls MUST display visible focus states.

## 21.3 Semantic Labels

Fields, buttons, file controls, status elements, and interactive answer cards MUST use meaningful semantic labels.

## 21.4 File Input

File-upload functionality MUST remain accessible to users who cannot use drag/drop.

## 21.5 Screen Readers

Critical state changes SHOULD be communicated appropriately.

Examples:

- upload success,
- processing completion,
- error messages,
- question progression,
- report readiness.

## 21.6 Reduced Motion

Animations MUST respect reduced-motion preferences.

Meaning MUST NOT depend on animation.

## 21.7 Contrast

The dark forensic aesthetic MUST maintain accessible text/control contrast.

The `#ffffff` active-card primary-text requirement supports this but does not replace complete contrast verification.

## 21.8 Errors

Errors MUST:

- identify the problem,
- explain the recovery action,
- be programmatically associated with relevant controls where applicable.

## 21.9 Touch Accessibility

Tap targets MUST not be excessively small or tightly packed.

---

# 22. ERROR & RECOVERY STATES

## 22.1 Governing Rule

Every error state MUST answer:

1. What happened?
2. What can the user do now?
3. How can we avoid forcing unnecessary restart?

No dead ends.

---

## 22.2 Unsupported File

### Message

Plain-language explanation that the selected file type cannot be processed.

### Primary Action

**Choose Another File**

### Secondary

Escape hatch where appropriate.

### Preservation

Session/attribution MUST remain intact.

---

## 22.3 Oversized File

### Requirement

Explain that the file exceeds supported limits without exposing unnecessary technical jargon.

### Primary Action

Choose another/smaller file.

`IMPLEMENTATION DECISION TO VALIDATE:` Exact file-size limit and compression guidance.

---

## 22.4 Unreadable / Corrupt Document

### Message Concept

**We couldn't confidently read this document.**

### Actions

- upload another file,
- upload clearer images,
- use escape hatch if document unavailable.

The system MUST NOT pretend a reliable analysis succeeded.

---

## 22.5 Low OCR Confidence

Low confidence MUST trigger:

- verification,
- blank fields,
- or explicit uncertainty.

It MUST NOT produce falsely confident identity/data.

---

## 22.6 Upload / Network Failure

The system SHOULD:

- preserve selected-file context where technically possible,
- offer retry,
- avoid forcing complete funnel restart.

---

## 22.7 Processing Failure

If analysis cannot complete:

- explain failure plainly,
- offer retry/reupload where useful,
- preserve session and attribution,
- offer recovery path where appropriate.

The system MUST NOT fabricate a report.

---

## 22.8 Partial Extraction

A report MAY proceed with partial data only where the system can clearly distinguish:

- successfully extracted information,
- unavailable/missing information,
- uncertain fields.

## 22.9 Missing Identity Information

Missing fields MAY be requested manually during identity verification.

The system SHOULD ask only for fields necessary to complete the approved experience.

## 22.10 Session Recovery

Where appropriate and secure, returning users SHOULD resume rather than restart.

`IMPLEMENTATION DECISION TO VALIDATE:` Exact persistence duration and secure-resume mechanism.

---

# 23. NON-GOALS & FORBIDDEN REGRESSIONS

The following are explicitly prohibited unless this manifest is revised.

## WM-FORBID-001 — Pre-Upload Lead Gate

MUST NOT require:

- name,
- email,
- phone,
- ZIP

before a quote-ready user can start upload.

## WM-FORBID-002 — Pre-Scan Account Creation

MUST NOT require account registration before scan start.

## WM-FORBID-003 — Pre-Scan OTP

MUST NOT require OTP before scan start.

## WM-FORBID-004 — JourneyStage Questionnaire on Quote-Ready Path

MUST NOT insert the multi-step JourneyStage questionnaire before quote upload on this dedicated Quote-First acquisition experience.

## WM-FORBID-005 — Traditional Navigation Distraction

MUST NOT add broad:

- About,
- Blog,
- Pricing,
- Products,
- Services

navigation competing with the primary conversion action.

## WM-FORBID-006 — Tracking Redirect Chains

MUST NOT create query-parameter-based top-of-funnel tracking redirect chains.

## WM-FORBID-007 — Generic Lead Form Replacing Upload

MUST NOT transform the primary experience back into a standard name/email/phone lead form.

## WM-FORBID-008 — Visual Sandbox Components

MUST NOT create permanent production-path:

- visual sandbox components,
- throwaway design demo pages,
- preview-only duplicate components.

## WM-FORBID-009 — Gratuitous V2/V3 Architecture

MUST NOT create arbitrary:

- `ComponentV2`,
- `ComponentV3`,
- duplicate funnel stacks

when reusable architecture can safely support the requirement.

## WM-FORBID-010 — Jargon Translation UI

MUST NOT add:

- “simplify this term” buttons,
- glossary modes,
- technical-jargon translation features.

## WM-FORBID-011 — Unapproved Chatbot / Assistant Drawer

MUST NOT introduce unrelated AI chat, assistant drawer, or support widget into the Quote-First conversion journey.

## WM-FORBID-012 — Competing Secondary Funnel

MUST NOT create a second equal-weight top-of-funnel path competing with upload.

The escape hatch is recovery, not a second primary funnel.

## WM-FORBID-013 — Premature Call CTA

MUST NOT make a generic call CTA the dominant action before the user receives meaningful report value.

## WM-FORBID-014 — Locked Copy Rewriting

MUST NOT silently paraphrase LOCKED COPY.

## WM-FORBID-015 — Unsupported Claims

MUST NOT make unsupported:

- contractor accusations,
- legal conclusions,
- security claims,
- licensing conclusions,
- guaranteed savings claims,
- absolute pricing claims.

## WM-FORBID-016 — Fake Urgency

MUST NOT use fabricated countdowns, scarcity, or false deadlines.

## WM-FORBID-017 — Fake Scan Delay

MUST NOT deliberately slow processing solely to dramatize the experience.

## WM-FORBID-018 — Dark-Pattern Consent

MUST NOT disguise marketing consent as:

- identity verification,
- required report access,
- OCR confirmation.

## WM-FORBID-019 — Future-Sprint Scope Creep

An active implementation sprint MUST NOT begin implementing later sprint scope unless explicitly authorized.

## WM-FORBID-020 — Childish / Gaming Visual Drift

MUST NOT transform the approved forensic corporate SaaS experience into:

- superhero comic UI,
- arcade/game UI,
- neon sci-fi dashboard,
- gimmicky AI interface.

---

# 24. SPRINT DEPENDENCY MAP

## SPRINT 01 — Project Initialization & Design System

### Objective

Establish the foundational design tokens, global visual rules, typography, spacing, responsive primitives, and reusable UI conventions.

### Dependency

None.

### Manifest Sections Consumed

- 00
- 05
- 06
- 20
- 21
- 23

### Expected Deliverable

Stable dark forensic corporate SaaS foundation with system fonts and reusable styling conventions.

### Stop Boundary

Do not build full hero, uploader, report, or future conversion states.

---

## SPRINT 02 — Minimal Header & Page Frame

### Objective

Build focused application frame and distraction-free header/footer structure.

### Dependency

Sprint 01.

### Manifest Sections Consumed

- 05
- 06
- 07
- 20
- 21
- 23

### Expected Deliverable

Minimal WindowMan page shell with no traditional navigation distraction.

### Stop Boundary

Do not implement hero conversion mechanics or uploader behavior.

---

## SPRINT 03 — Hero & Message Hierarchy

### Objective

Build the above-the-fold messaging hierarchy using approved LOCKED COPY.

### Dependency

Sprints 01–02.

### Manifest Sections Consumed

- 01
- 02
- 06
- 07
- 20
- 21
- 23

### Expected Deliverable

Responsive quote-first hero with correct hierarchy and reserved upload action zone.

### Stop Boundary

Do not implement complete file-upload state logic beyond what is needed to compose the hero.

---

## SPRINT 04 — Primary File Dropzone

### Objective

Implement the zero-friction file-selection conversion mechanism.

### Dependency

Sprints 01–03.

### Manifest Sections Consumed

- 02
- 04
- 07
- 08
- 09
- 20
- 21
- 23

### Expected Deliverable

Production-purpose upload UI with default, drag, selection, and upload-start behavior.

### Stop Boundary

Do not implement escape-hatch recovery, OCR, or report logic.

---

## SPRINT 05 — Value Proposition & Trust Support

### Objective

Add concise supporting value and privacy/trust context beneath the primary upload action.

### Dependency

Sprints 01–04.

### Manifest Sections Consumed

- 01
- 02
- 06
- 07
- 20
- 21

### Expected Deliverable

Three approved value cards, privacy support, and appropriately repeated upload CTA.

### Stop Boundary

Do not add unrelated long-form marketing sections or new navigation.

---

## SPRINT 06 — Escape-Hatch Experience

### Objective

Recover high-intent users who cannot currently upload their quote.

### Dependency

Sprints 01–05.

### Manifest Sections Consumed

- 03
- 04
- 07
- 08
- 10
- 18
- 19
- 20
- 21
- 23

### Expected Deliverable

Subordinate upload-later recovery experience with minimal email capture and confirmation state.

### Stop Boundary

Do not implement full nurture automation unless separately authorized.

---

## SPRINT 07 — Upload Validation & Recovery

### Objective

Implement robust error/retry/recovery states around file handling.

### Dependency

Sprint 04 and preferably Sprint 06.

### Manifest Sections Consumed

- 04
- 09
- 10
- 18
- 22
- 23

### Expected Deliverable

No-dead-end handling for unsupported, oversized, unreadable, network-failed, and recoverable upload states.

### Stop Boundary

Do not implement OCR partial reveal or qualification.

---

## SPRINT 08 — Processing & Scanning State

### Objective

Create truthful forensic processing feedback with progressive competence signaling.

### Dependency

Sprints 04 and 07.

### Manifest Sections Consumed

- 04
- 06
- 07
- 11
- 12
- 20
- 21
- 22

### Expected Deliverable

Responsive processing state with real progress mapping and reduced-motion support.

### Stop Boundary

Do not reveal the full Truth Report or qualification flow.

---

## SPRINT 09 — OCR Partial Reveal

### Objective

Present genuine high-confidence quote information before identity verification.

### Dependency

Sprint 08 and functioning analysis data contract.

### Manifest Sections Consumed

- 04
- 07
- 08
- 12
- 18
- 19
- 20
- 21
- 22

### Expected Deliverable

Quote snapshot + preliminary findings proof state driven by real analysis data.

### Stop Boundary

Do not implement full report or call conversion.

---

## SPRINT 10 — OCR-Prefilled Identity Verification

### Objective

Convert extracted identity candidates into user-verified information with minimal typing.

### Dependency

Sprint 09.

### Manifest Sections Consumed

- 04
- 07
- 08
- 12
- 13
- 19
- 20
- 21
- 22
- 23

### Expected Deliverable

Confidence-aware identity verification and correction flow.

### Stop Boundary

Do not add unapproved consent or qualification beyond the specified next transition.

---

## SPRINT 11 — Two-Tap Micro-Qualification

### Objective

Capture transaction state and one dynamic decision reason at peak curiosity.

### Dependency

Sprint 10.

### Manifest Sections Consumed

- 02
- 03
- 04
- 06
- 07
- 14
- 18
- 20
- 21
- 23

### Expected Deliverable

Exactly two thumb-friendly qualification stages with canonical three-state branching.

### Stop Boundary

Do not add additional mandatory survey questions.

---

## SPRINT 12 — Full Truth Report Dossier

### Objective

Build the complete decision-support report structure and personalization hierarchy.

### Dependency

Sprints 09–11 and required report data contracts.

### Manifest Sections Consumed

- 01
- 02
- 07
- 08
- 15
- 16
- 18
- 20
- 21
- 22
- 23

### Expected Deliverable

Personalized Truth Report with:

- executive answer,
- quote snapshot,
- findings,
- evidence,
- recommended next moves.

### Stop Boundary

Do not let call conversion displace or precede meaningful report value.

---

## SPRINT 13 — Dynamic Inbound Call Conversion

### Objective

Convert qualified report engagement into context-specific inbound phone action.

### Dependency

Sprint 12.

### Manifest Sections Consumed

- 03
- 07
- 16
- 17
- 18
- 19
- 20
- 21
- 23

### Expected Deliverable

Dynamic CTA variants aligned to:

- transaction state,
- primary decision concern,
- appropriate routing context.

### Stop Boundary

Do not redesign report architecture or create generic premature call prompts.

---

## SPRINT 14 — Analytics, Attribution, Responsive QA & Final CRO Polish

### Objective

Validate the complete funnel as a measurable, resilient, accessible, mobile-first production experience.

### Dependency

Sprints 01–13.

### Manifest Sections Consumed

All sections, with particular focus on:

- 04
- 05
- 06
- 18
- 19
- 20
- 21
- 22
- 23

### Expected Deliverable

Final verified funnel covering:

- canonical event hooks,
- attribution persistence,
- responsive QA,
- accessibility,
- error recovery,
- CRO hierarchy,
- prohibited-regression review.

### Stop Boundary

Do not introduce new funnel concepts during QA.

Any material new idea requires a manifest revision before implementation.

---

# APPENDIX A — MASTER ACCEPTANCE MATRIX

| Requirement ID | Requirement | Manifest Section | Verification Type |
|---|---|---|---|
| `WM-DOC-001` | Sections 00–24 MUST exist in canonical order. | 00 | Architecture |
| `WM-DOC-002` | Sprint files MUST NOT silently contradict the manifest. | 00 | Architecture |
| `WM-FUN-001` | A quote-ready user MUST be able to begin the experience with upload rather than contact capture. | 02, 03 | Functional |
| `WM-FUN-002` | Name, email, phone, ZIP, account creation, password, OTP, and JourneyStage questionnaire MUST NOT be required before upload on the primary path. | 02, 23 | Functional |
| `WM-FUN-003` | The primary canonical sequence MUST remain Upload → Processing/OCR → Partial Reveal → Identity Verification → Q1 → Q2 → Full Report → contextual call conversion. | 03, 04 | Architecture |
| `WM-FUN-004` | Only one visually dominant primary action SHOULD exist per major state. | 02 | Visual |
| `WM-FUN-005` | The escape hatch MUST remain subordinate to upload. | 03, 10 | Visual |
| `WM-DS-001` | The experience MUST use a dark forensic dossier + clean corporate SaaS visual system. | 06 | Visual |
| `WM-DS-002` | Only native system fonts MAY be used. | 06 | Architecture |
| `WM-DS-003` | Primary text inside active/selectable interactive cards MUST use `#ffffff` unless accessibility requires an explicit exception. | 06 | Visual |
| `WM-DS-004` | Excessive gradients, glow, rounded pills, gaming aesthetics, and childish superhero styling MUST NOT dominate the interface. | 06, 23 | Visual |
| `WM-ROUTE-001` | The funnel MUST function as a single-page application journey. | 05 | Architecture |
| `WM-ROUTE-002` | Top-of-funnel query-parameter tracking redirect chains MUST NOT be introduced. | 05, 23 | Architecture |
| `WM-ROUTE-003` | Attribution SHOULD remain associated with the anonymous session and verified identity where technically possible. | 05, 18, 19 | Analytics |
| `WM-COPY-001` | LOCKED COPY MUST NOT be silently paraphrased. | 07 | Copy |
| `WM-COPY-002` | Hero eyebrow MUST be `INSTANT CONTRACTOR QUOTE AUDIT`. | 07 | Copy |
| `WM-COPY-003` | Hero headline MUST be `Drop Your Estimate Here. Get an Independent Truth Report in 30 Seconds.` unless manifest revision approves a new locked variant. | 07 | Copy |
| `WM-UPL-001` | A user MUST be able to initiate file selection without first providing personal contact information. | 09 | Functional |
| `WM-UPL-002` | Desktop SHOULD support drag/drop and click-to-select. | 09 | Functional |
| `WM-UPL-003` | Mobile MUST support tap-based file selection without drag dependency. | 09 | Responsive |
| `WM-UPL-004` | Successful upload MUST transition to processing without inserting a lead form. | 09 | Functional |
| `WM-UPL-005` | Upload session SHOULD preserve acquisition context. | 09, 18, 19 | Analytics |
| `WM-ESC-001` | The escape hatch MUST be available for users who cannot currently provide a usable quote. | 10 | Functional |
| `WM-ESC-002` | Email SHOULD be the minimum default recovery field. | 10 | Functional |
| `WM-ESC-003` | Phone MUST NOT be required by default in the upload-later recovery path. | 10 | Functional |
| `WM-ESC-004` | Recovery framing MUST communicate continuation of the attempted scan rather than generic lead capture. | 10 | Copy |
| `WM-PROC-001` | Processing UI MUST show truthful progress rather than an undifferentiated spinner where state information is available. | 11 | Functional |
| `WM-PROC-002` | Fake intentional scan delays MUST NOT be added solely for theatrics. | 11, 23 | Functional |
| `WM-PROC-003` | Reduced-motion users MUST retain understandable processing feedback. | 11, 21 | Accessibility |
| `WM-OCR-001` | OCR-derived identity candidates MUST conceptually retain value, source, confidence, and entity classification. | 12 | Architecture |
| `WM-OCR-002` | Contractor/salesperson contact information MUST NOT be blindly classified as homeowner information. | 12 | Functional |
| `WM-OCR-003` | Low-confidence personal data MUST NOT be confidently presented as verified identity. | 12 | Functional |
| `WM-PR-001` | Partial reveal MUST show genuine extracted/derived value before identity verification. | 12 | Functional |
| `WM-PR-002` | Dynamic quote values MUST come from real analysis data and MUST NOT be fabricated. | 12 | Functional |
| `WM-ID-001` | Identity verification MUST occur after partial reveal. | 13 | Functional |
| `WM-ID-002` | Users MUST be able to correct OCR-prefilled identity information. | 13 | Functional |
| `WM-ID-003` | Identity verification MUST NOT be treated as marketing consent. | 13 | Functional |
| `WM-ID-004` | Verified identity SHOULD merge with the anonymous quote session rather than create an unlinked funnel record. | 13, 19 | Architecture |
| `WM-QUAL-001` | Qualification MUST contain exactly two mandatory lightweight question stages before full report reveal. | 14 | Functional |
| `WM-QUAL-002` | Question 1 MUST distinguish `I ALREADY SIGNED`, `I'M STILL DECIDING`, and `I PASSED ON IT`. | 14 | Copy |
| `WM-QUAL-003` | Question 2 MUST dynamically depend on Question 1. | 14 | Functional |
| `WM-QUAL-004` | `I CHOSE ANOTHER COMPANY` MUST be distinguishable within the passed-quote branch. | 14 | Functional |
| `WM-QUAL-005` | Qualification options MUST use large mobile-friendly tap targets. | 14, 20 | Responsive |
| `WM-QUAL-006` | Primary text in active qualification cards MUST be `#ffffff`. | 06, 14 | Visual |
| `WM-QUAL-007` | No mandatory third survey question MAY be inserted without manifest revision. | 14 | Functional |
| `WM-RPT-001` | Full Truth Report MUST become available immediately after completion of Question 2 without another surprise lead gate. | 15 | Functional |
| `WM-RPT-002` | Truth Report MUST contain executive answer, quote snapshot, findings, evidence, and recommended next move layers. | 15 | Functional |
| `WM-RPT-003` | Important findings SHOULD distinguish observation, significance, and recommended action. | 15 | Content |
| `WM-RPT-004` | Unsupported absolute legal, pricing, contractor, or security conclusions MUST NOT be presented. | 15, 23 | Content |
| `WM-PERS-001` | Transaction state and decision reason MUST influence report presentation hierarchy. | 16 | Functional |
| `WM-PERS-002` | Price concern SHOULD prioritize relevant pricing/economic analysis. | 16 | Functional |
| `WM-PERS-003` | Comparing-quotes concern SHOULD prioritize normalization and comparison criteria. | 16 | Functional |
| `WM-PERS-004` | Payment concern SHOULD prioritize payment structure. | 16 | Functional |
| `WM-PERS-005` | Already-signed users MUST NOT automatically receive an unsold-lead framing. | 16 | Functional |
| `WM-CALL-001` | A dominant contextual inbound-call CTA MUST NOT precede meaningful report value. | 17 | Functional |
| `WM-CALL-002` | Call CTA copy SHOULD dynamically match the user's selected concern/state. | 17 | Functional |
| `WM-CALL-003` | Price concern CTA MUST use the approved price-context treatment unless explicitly revised. | 17 | Copy |
| `WM-CALL-004` | Comparing-quotes CTA MUST use the approved comparison-context treatment unless explicitly revised. | 17 | Copy |
| `WM-CALL-005` | A sticky mobile CTA MAY appear only after meaningful report engagement and MUST NOT block critical content. | 17, 20 | Responsive |
| `WM-EVT-001` | The event architecture MUST support `quote_scan_landing_view`. | 18 | Analytics |
| `WM-EVT-002` | The event architecture MUST support `upload_intent`, `upload_started`, and `scannerupload`. | 18 | Analytics |
| `WM-EVT-003` | The event architecture MUST support `ocr_completed`, `partial_report_viewed`, and `identity_verified`. | 18 | Analytics |
| `WM-EVT-004` | The event architecture MUST support `quote_status_selected` and `decision_reason_selected`. | 18 | Analytics |
| `WM-EVT-005` | The event architecture MUST support `full_report_revealed`, `phone_cta_viewed`, and `phone_cta_clicked`. | 18 | Analytics |
| `WM-EVT-006` | Downstream architecture SHOULD support `inbound_call_connected`, `qualified_call`, `scheduled`, and `sold` where integrations permit. | 18 | Analytics |
| `WM-DATA-001` | Anonymous attribution SHOULD persist through verified identity where technically possible. | 19 | Architecture |
| `WM-DATA-002` | Low-confidence OCR values MUST NOT overwrite verified identity blindly. | 19 | Functional |
| `WM-RESP-001` | The funnel MUST be reviewed at approximately 320, 375, 390, and 430px mobile widths. | 20 | Responsive |
| `WM-RESP-002` | The funnel MUST be reviewed on tablet, laptop, and large desktop layouts. | 20 | Responsive |
| `WM-RESP-003` | No required state MAY create horizontal page overflow at supported widths. | 20 | Responsive |
| `WM-RESP-004` | Essential interactions MUST NOT depend exclusively on hover. | 20 | Accessibility |
| `WM-A11Y-001` | File upload MUST be operable without drag-and-drop. | 21 | Accessibility |
| `WM-A11Y-002` | Interactive controls MUST have visible focus treatment. | 21 | Accessibility |
| `WM-A11Y-003` | Reduced-motion preferences MUST be respected. | 21 | Accessibility |
| `WM-A11Y-004` | Dark-mode contrast MUST meet applicable accessibility requirements. | 21 | Accessibility |
| `WM-ERR-001` | Unsupported-file state MUST offer a clear next action. | 22 | Functional |
| `WM-ERR-002` | Upload/network failure SHOULD preserve user progress where technically possible. | 22 | Functional |
| `WM-ERR-003` | Processing failure MUST NOT fabricate a successful analysis. | 22 | Functional |
| `WM-ERR-004` | No error state MAY terminate in a dead end without a recovery action. | 22 | Functional |
| `WM-HYG-001` | Production implementation MUST NOT create visual sandbox component files. | 23 | Architecture |
| `WM-HYG-002` | Gratuitous V2/V3 duplicate architecture MUST NOT be introduced where safe reuse is available. | 23 | Architecture |
| `WM-HYG-003` | Technical-jargon translation UI MUST NOT be added. | 23 | Architecture |
| `WM-HYG-004` | Unapproved chatbots or assistant drawers MUST NOT be introduced into the funnel. | 23 | Architecture |
| `WM-HYG-005` | Fake urgency and fake scan delays MUST NOT be introduced. | 23 | CRO |
| `WM-SPRINT-001` | The implementation roadmap MUST contain exactly the defined 14 sprint stages unless this manifest is revised. | 24 | Architecture |
| `WM-SPRINT-002` | Each sprint MUST stop at its defined scope boundary. | 24 | Architecture |
| `WM-SPRINT-003` | Final QA MUST include analytics, attribution, responsive, accessibility, error-recovery, and prohibited-regression review. | 24 | Architecture |

---

## FINAL CANONICAL FUNNEL SUMMARY

```text
PAID / META AD
        ↓
QUOTE-FIRST LANDING PAGE
        ↓
NO REGISTRATION
NO CONTACT GATE
NO OTP
        ↓
UPLOAD MY ESTIMATE
        ↓
ANONYMOUS QUOTE SESSION
+ ATTRIBUTION
+ DOCUMENT
        ↓
PROCESSING / OCR / ANALYSIS
        ↓
GENUINE PARTIAL REVEAL
        ↓
OCR-PREFILLED IDENTITY VERIFICATION
        ↓
QUESTION 1 OF 2
WHERE ARE YOU WITH THIS QUOTE?
        ↓
ALREADY SIGNED
OR
STILL DECIDING
OR
PASSED ON IT
        ↓
QUESTION 2 OF 2
DYNAMIC DECISION REASON
        ↓
FULL PERSONALIZED TRUTH REPORT
        ↓
ANSWER
+ QUOTE SNAPSHOT
+ FINDINGS
+ EVIDENCE
+ RECOMMENDED NEXT MOVE
        ↓
CONTEXTUAL INBOUND CALL CTA
        ↓
INBOUND HUMAN CONVERSATION
        ↓
DOWNSTREAM QUALIFICATION
        ↓
SCHEDULED / ROUTED / SOLD
````

### Controlled Recovery Path

```text
UPLOAD INTENT
        ↓
NO ACCESSIBLE QUOTE
        ↓
ESCAPE HATCH
        ↓
MINIMUM RECOVERY CAPTURE
        ↓
PRIVATE SCAN LINK
+ SAMPLE VALUE
        ↓
FOLLOW-UP
        ↓
QUOTE UPLOAD
        ↓
REJOIN PRIMARY QUOTE-FIRST FUNNEL
```

# CANONICAL PRODUCT LAW

> **THE UPLOAD IS THE INTAKE FORM.**

The Quote-First experience MUST minimize friction before the homeowner demonstrates meaningful intent, progressively earn the right to request information, classify the homeowner at peak curiosity, deliver genuine personalized decision-support value, and only then escalate the highest-value users toward an appropriate inbound human conversation.

```
```
