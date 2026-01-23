# Phase 3 - Meta Events Manager Findings

## Lead Event Overview (as of Jan 23, 2026)

| Metric | Value |
|--------|-------|
| **Status** | Active ✅ |
| **Integration** | **Multiple** (Browser + Server CAPI) ✅ |
| **EMQ Score** | 6.1/10 (Update recommended) |
| **Total Events** | 102 |
| **Last Received** | 37 minutes ago |

## Advanced Matching Activity (Browser Pixel)

- **Setup Mode:** Automatic
- **Coverage:** 42% of Lead events receiving hashed customer information
- **Parameters Being Passed:** City, Email, First name, Last name, Phone, ZIP code ✅

## Event Activity Chart (Jan 23, 2026)

| Source | Events on Jan 23 |
|--------|------------------|
| serverProcessedCount | 10 |
| browserProcessedCount | 9 |

Both Browser and Server are receiving Lead events on the same day.

## Parameters Present

- value ✅
- currency ✅
- 2 others

## Key Observations

1. **Integration: Multiple** - Confirms both Browser Pixel and Server CAPI are sending Lead events
2. **Both sources active on Jan 23** - Fresh traffic shows both channels working
3. **EMQ 6.1/10** - In "OK" tier, needs improvement to reach "Great/Excellent"
4. **42% Advanced Matching coverage** - Indicates identity data is being passed

## Next Steps

1. Click "View details" to see deduplication status
2. Check Diagnostics tab for event_id coverage
3. Verify deduplication is no longer "Not meeting best practices"


## Data Freshness (as of Jan 23, 2026)

**Average Frequency of Events Received Through Conversions API:**
- **Real Time** ✅ (green bar)
- **Hourly** ✅ (green bar)
- **Daily** 🟡 (yellow indicator - current status)
- **Weekly** 🔴 (red bar)

**Last Updated:** Today at 7:20 AM

**Status:** Events are being received with "Daily" frequency, which is acceptable but could be improved to "Real Time" for better attribution.



## Event Deduplication Status (as of Jan 23, 2026)

**CRITICAL ISSUE: Browser Event ID Coverage = 0%**

| Dedupe Key | Browser Events | Server Events | Event Coverage Rate |
|------------|----------------|---------------|---------------------|
| **Event ID** (Recommended) | **0 (0%)** ❌ | **24 (96.77%)** ✅ | **0%** 🔴 |
| **External ID** | 0 (0%) | 0 (0%) | 0% |
| **FBP** | 33 (100%) | 25 (100%) | **8.51%** |

**Total Event Coverage Rate: 8.51%** (Meta recommends at least 75%)

**Warning Message:**
> "Improve event ID coverage by fixing deduplication key issues"

**Analysis:**
- Server CAPI is correctly sending event_id (96.77% coverage)
- Browser Pixel is NOT sending event_id (0% coverage)
- This data is from the last 7 days, which includes historical data BEFORE code changes

**Next Steps:**
1. Verify the code changes have been deployed to production
2. Submit a new test lead and verify event_id is present in browser events
3. Wait for fresh data to update the deduplication metrics



## Diagnostics (as of Jan 23, 2026)

**Active Errors: 2**

### 1. Improve your rate of Meta Pixel events covered by Conversions API
- **Type:** Meta Pixel
- **Issue:** "Your server is sending 18 fewer events than pixel in the last 7 days."
- **Recommendations:**
  - Sending more events through Conversions API
  - Improving deduplication keys for your pixel and Conversions API events
- **Detected:** Jan 21, 2026

### 2. Confirm domains that belong to you
- **Issue:** New domains detected sending events
- **Domains:**
  - `faf9d037-b00e-4588-a259-0baf63925ffd.lovableproject.com`
  - `window-man-truth-engine.pages.dev`
- **Detected:** Jan 19, 2026

