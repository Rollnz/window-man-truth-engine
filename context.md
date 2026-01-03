## Project Context

Paste your project plan or notes here. This file is intentionally simple so you can drop in updates without worrying about formatting.

🏗️ Phase 1: The Big Picture & Sitemap
🎯 Core Purpose & Target Audience
Project Summary
Its Window Man is a lead generation and education platform designed to convert homeowners into qualified sales leads for impact window installation services through a "value-first" approach.
Core Purpose
To provide FREE AI-powered tools and education that help homeowners:

Understand their hurricane/window vulnerabilities
Calculate the financial impact of inaction
Navigate the complex window replacement decision
Prepare for insurance claims
Negotiate better deals with contractors

Monetization Strategy: Lead capture → Sales consultation → Window installation services
Target Audience
Primary Audience: Florida Homeowners
Geographic: Hurricane-prone regions (Florida, Gulf Coast, Southeast)
Property Status: Own single-family homes (1,500-5,000 sq ft typical)
Age: 35-65 years old
Financial Status: Middle to upper-middle class ($75k-$250k household income)
Pain Points:
High energy bills due to old/inefficient windows
Hurricane vulnerability and insurance concerns
Overwhelmed by window replacement options and pricing
Fear of contractor manipulation
Post-storm insurance claim complications
User Segments by Journey Stage
1. Problem Unaware (20%)

Don't realize windows are causing issues
Target Tools: Reality Check, Vulnerability Quiz
Goal: Create awareness of problem

2. Problem Aware (30%)

Know they have issues but haven't quantified impact
Target Tools: Risk Diagnostic, Cost Calculator
Goal: Quantify urgency and cost

3. Solution Aware (25%)

Researching window options and contractors
Target Tools: Intel Hub, Evidence Vault, Comparison Tool
Goal: Education and trust building

4. Decision Ready (15%)

Have quotes, ready to negotiate/buy
Target Tools: Quote Scanner, Expert Chat
Goal: Capture high-intent leads

5. Emergency (10%)

Hurricane imminent or just passed
Target Tools: Claim Survival Kit (Emergency Mode)
Goal: Immediate assistance, long-term relationship

## Phase 0 Verification (wm-api end-to-end)
Use your Supabase project ref and anon key in the curl commands below. Replace placeholders like `<project-ref>`, `<SESSION_ID>`, `<FILE_ID>`, and `<FILE_PATH>` as needed.

1) Create a session
```bash
curl -X POST https://<project-ref>.functions.supabase.co/wm-api/session \
  -H "Content-Type: application/json" \
  -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
  -d '{"entry_point":"/test","device_type":"desktop","user_agent":"manual-curl"}'
```
Expected: `{"session_id":"..."}`. Save the session_id.

2) Get a signed upload URL
```bash
curl -X POST https://<project-ref>.functions.supabase.co/wm-api/upload-url \
  -H "Content-Type: application/json" \
  -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
  -d '{"session_id":"<SESSION_ID>","file_name":"quote.pdf","mime_type":"application/pdf","size_bytes":12345,"kind":"quote_upload"}'
```
Expected: returns `quote_id`, `file_id`, `upload_url`, `storage_path`.

3) Upload the file to the signed URL
```bash
curl -X PUT "<upload_url from step 2>" \
  -H "Content-Type: application/pdf" \
  --data-binary @<FILE_PATH>
```
Expected: 200 from the signed URL. After this, you should see `wm_files` and `wm_quotes` rows (quote will be status `open`).

4) Mark upload complete
```bash
curl -X POST https://<project-ref>.functions.supabase.co/wm-api/upload-complete \
  -H "Content-Type: application/json" \
  -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
  -d '{"session_id":"<SESSION_ID>","file_id":"<FILE_ID>","sha256":"optional-hash"}'
```
Expected: `{ "ok": true }` and an event `wm_quote_upload_success` recorded.

5) Log an event
```bash
curl -X POST https://<project-ref>.functions.supabase.co/wm-api/event \
  -H "Content-Type: application/json" \
  -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
  -d '{"session_id":"<SESSION_ID>","event_name":"phase0_manual_test","page_path":"/test"}'
```
Expected: `{ "ok": true }` and a new `wm_events` row.
