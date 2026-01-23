# Phase 5C: Idempotency Guard for save-lead

## Overview
This patch adds an idempotency guard to the save-lead edge function to prevent duplicate `lead_submission_success` events from being written to wm_event_log.

## Changes Required

### File: `supabase/functions/save-lead/index.ts`

### Location: Lines 884-962 (CANONICAL LEDGER section)

### Current Code (lines 884-962):
```typescript
    // ═══════════════════════════════════════════════════════════════════════════
    // CANONICAL LEDGER: Write lead_captured to wm_event_log (attribution views source)
    // This is the server-side source of truth for attribution analytics
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      // Extract client_id from session_data if available
      const clientId = (sessionData as Record<string, unknown>)?.clientId as string 
        || (sessionData as Record<string, unknown>)?.client_id as string 
        || `lead-${leadId}`;

      // Pre-compute hashes once using E.164 for phones
      const hashedEmail = await hashEmail(normalizedEmail);
      const hashedPhone = phone ? await hashPhoneE164(phone) : null;

      const eventLogPayload = {
        event_id: crypto.randomUUID(),
        event_name: 'lead_captured',
        // ... rest of payload
      };

      const { error: eventLogError } = await supabase
        .from('wm_event_log')
        .insert(eventLogPayload);

      if (eventLogError) {
        console.error('[wm_event_log] Failed to write lead_captured:', eventLogError);
      } else {
        console.log('[wm_event_log] lead_captured written for lead:', leadId);
      }
    } catch (eventLogErr) {
      console.error('[wm_event_log] Exception during write (non-blocking):', eventLogErr);
    }
```

### New Code (with idempotency guard):
```typescript
    // ═══════════════════════════════════════════════════════════════════════════
    // CANONICAL LEDGER: Write lead_submission_success to wm_event_log
    // This is the server-side source of truth for attribution analytics
    // PHASE 5C: Idempotency guard - check if conversion already exists for this lead
    // ═══════════════════════════════════════════════════════════════════════════
    try {
      // IDEMPOTENCY CHECK: Skip if lead_submission_success already exists for this lead_id
      const { data: existingConversion, error: checkError } = await supabase
        .from('wm_event_log')
        .select('event_id')
        .eq('lead_id', leadId)
        .eq('event_name', 'lead_submission_success')
        .maybeSingle();

      if (checkError) {
        console.warn('[wm_event_log] Idempotency check failed (proceeding with insert):', checkError.message);
      }

      if (existingConversion) {
        // Conversion already exists - idempotent success (no duplicate write)
        console.log('[wm_event_log] IDEMPOTENT: lead_submission_success already exists for lead:', leadId, 'event_id:', existingConversion.event_id);
        // Skip the insert - this is a retry or duplicate request
      } else {
        // No existing conversion - proceed with insert
        // Extract client_id from session_data if available
        const clientId = (sessionData as Record<string, unknown>)?.clientId as string 
          || (sessionData as Record<string, unknown>)?.client_id as string 
          || `lead-${leadId}`;

        // Pre-compute hashes once using E.164 for phones
        const hashedEmail = await hashEmail(normalizedEmail);
        const hashedPhone = phone ? await hashPhoneE164(phone) : null;

        const eventLogPayload = {
          event_id: crypto.randomUUID(),
          event_name: 'lead_submission_success',  // CHANGED from 'lead_captured'
          event_type: 'conversion',
          event_time: new Date().toISOString(),
          lead_id: leadId,
          session_id: sessionId || null,
          client_id: clientId,
          
          // ═══ DEDICATED COLUMNS (queryable) ═══
          external_id: leadId,
          email_sha256: hashedEmail,
          phone_sha256: hashedPhone,
          
          source_tool: sourceTool,
          source_system: 'save-lead',
          ingested_by: 'save-lead',
          page_path: aiContext?.source_form || referer || '/unknown',
          funnel_stage: 'converted',  // CHANGED from 'captured'
          
          // Attribution fields at event time
          traffic_source: attribution?.utm_source || lastNonDirect?.utm_source || null,
          traffic_medium: attribution?.utm_medium || lastNonDirect?.utm_medium || null,
          campaign_id: attribution?.utm_campaign || null,
          gclid: attribution?.gclid || lastNonDirect?.gclid || null,
          fbclid: lastNonDirect?.fbclid || null,
          fbp: attribution?.fbp || null,
          fbc: attribution?.fbc || null,
          
          metadata: {
            email_domain: normalizedEmail.split('@')[1],
            has_phone: !!phone,
            has_name: !!name,
            has_consultation: !!consultationId,
            has_quote_file: !!quoteFileId,
            last_non_direct_channel: lastNonDirect?.channel || null,
            landing_page: lastNonDirect?.landing_page || null,
          },
          
          // ═══ JSONB ALIASES (backward compat for Meta CAPI + Google EC) ═══
          user_data: {
            em: hashedEmail,
            ph: hashedPhone,
            external_id: leadId,
            sha256_email_address: hashedEmail,
            sha256_phone_number: hashedPhone,
          },
        };

        const { error: eventLogError } = await supabase
          .from('wm_event_log')
          .insert(eventLogPayload);

        if (eventLogError) {
          // Check for unique constraint violation (belt-and-suspenders with DB constraint)
          if (eventLogError.code === '23505') {
            console.log('[wm_event_log] IDEMPOTENT (DB constraint): Duplicate blocked for lead:', leadId);
          } else {
            console.error('[wm_event_log] Failed to write lead_submission_success:', eventLogError);
          }
        } else {
          console.log('[wm_event_log] lead_submission_success written for lead:', leadId);
        }
      }
    } catch (eventLogErr) {
      // Non-blocking - attribution logging should never fail the lead save
      console.error('[wm_event_log] Exception during write (non-blocking):', eventLogErr);
    }
    // ═══════════════════════════════════════════════════════════════════════════
```

## Key Changes Summary

| Change | Before | After |
|--------|--------|-------|
| Event name | `lead_captured` | `lead_submission_success` |
| Funnel stage | `captured` | `converted` |
| Idempotency check | None | Check for existing conversion before insert |
| Duplicate handling | Error logged | Silent success (idempotent) |
| DB constraint handling | None | Catches 23505 error as idempotent success |

## Guarantees

After this change:
- Retries cannot duplicate conversions
- Network failures cannot duplicate conversions
- Client resubmits cannot duplicate conversions
- Database constraint provides belt-and-suspenders protection
