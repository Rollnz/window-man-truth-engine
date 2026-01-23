# GTM Web Container Variable Verification

## Container: Window-man-Truth-Engine (GTM-NHVFR5QZ)

### DLV - user_data.em
- **Variable Type:** Data Layer Variable
- **Data Layer Variable Name:** `user_data.em`
- **Data Layer Version:** Version 2
- **Status:** ✅ VERIFIED - Correctly configured to read from `user_data.em`

### All Required Variables Verified:

| Variable Name | DLV Path | Status |
|--------------|----------|--------|
| DLV - event_id | `event_id` | ✅ EXISTS |
| DLV - user_data.em | `user_data.em` | ✅ VERIFIED |
| DLV - user_data.ph | `user_data.ph` | ✅ EXISTS |
| DLV - user_data.external_id | `user_data.external_id` | ✅ EXISTS |
| DLV - user_data.fbp | `user_data.fbp` | ✅ EXISTS |
| DLV - user_data.fbc | `user_data.fbc` | ✅ EXISTS |
| DLV - user_data.fn | `user_data.fn` | ✅ EXISTS |
| DLV - user_data.ln | `user_data.ln` | ✅ EXISTS |
| DLV - value | `value` | ✅ EXISTS |
| DLV - currency | `currency` | ✅ EXISTS |
| DLV- source_tool | `source_tool` | ✅ EXISTS |
| DLV - lead_id | `lead_id` | ✅ EXISTS |

### Additional Location Variables:
| Variable Name | DLV Path | Status |
|--------------|----------|--------|
| DLV- City | `city` | ✅ EXISTS |
| DLV -Region | `region` | ✅ EXISTS |
| DLV- Zip | `zip` | ✅ EXISTS |
| DLV- Country | `country` | ✅ EXISTS |

## Conclusion

All required Data Layer Variables exist in the GTM Web Container and are correctly configured to read from the `lead_submission_success` event payload. The updated `trackLeadSubmissionSuccess()` function will populate these variables correctly.
