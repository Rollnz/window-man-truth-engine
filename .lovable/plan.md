

# State Dropdown Implementation Plan

## Summary

Add a state dropdown field to the location step of `KitchenTableGuideModal`, `SalesTacticsGuideModal`, and `SpecChecklistGuideModal` to complete EMQ 9.5+ address data collection. Florida will be the default selection with other southeastern US states available.

---

## Files to Create

### 1. `src/constants/states.ts`
**Purpose:** Centralized source of truth for state options

```typescript
export const SOUTHEAST_STATES = [
  { value: 'FL', label: 'Florida' },      // Default - Primary market
  { value: 'GA', label: 'Georgia' },
  { value: 'AL', label: 'Alabama' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'TX', label: 'Texas' },        // Major hurricane market
  { value: 'PR', label: 'Puerto Rico' },  // High hurricane demand
];

export const DEFAULT_STATE = 'FL';
```

---

## Files to Modify

### 2. `src/components/conversion/KitchenTableGuideModal.tsx`

**Changes Required:**

1. **Add Import:**
   ```typescript
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   import { SOUTHEAST_STATES, DEFAULT_STATE } from '@/constants/states';
   ```

2. **Update locationDetails state (line ~67-71):**
   ```typescript
   const [locationDetails, setLocationDetails] = useState({
     city: '',
     state: DEFAULT_STATE, // NEW: Florida default
     zipCode: '',
     remark: '',
   });
   ```

3. **Update renderLocationStep() (~line 534-598):**
   - Restructure grid to 3-column layout: City (full row mobile), State + Zip (split row)
   - Add Select component for state dropdown

4. **Update handleLocationSubmit() (~line 210-260):**
   - Add `state: locationDetails.state` to aiContext payload
   - Update `updateFields()` call to include state

### 3. `src/components/conversion/SalesTacticsGuideModal.tsx`

**Identical changes as KitchenTableGuideModal**

### 4. `src/components/conversion/SpecChecklistGuideModal.tsx`

**Identical changes as KitchenTableGuideModal**

---

## Implementation Details

### Responsive Layout Strategy

**Mobile (< 640px):**
```
┌──────────────────────────────────┐
│  City (full width)               │
├────────────────┬─────────────────┤
│  State (50%)   │  Zip Code (50%) │
└────────────────┴─────────────────┘
```

**Desktop (≥ 640px):**
```
┌───────────────────────────────────────────────────────┐
│  City (full width)                                    │
├────────────────────────────┬──────────────────────────┤
│  State (50%)               │  Zip Code (50%)          │
└────────────────────────────┴──────────────────────────┘
```

### State Dropdown Code Snippet

```tsx
<div>
  <Label htmlFor="state" className="text-sm font-medium text-slate-700 mb-1 block">
    State
  </Label>
  <Select
    value={locationDetails.state}
    onValueChange={(value) => setLocationDetails(prev => ({ ...prev, state: value }))}
  >
    <SelectTrigger 
      id="state"
      className="bg-white border border-black focus:ring-2 focus:ring-primary/25"
      aria-label="Select state"
    >
      <SelectValue placeholder="Select state" />
    </SelectTrigger>
    <SelectContent className="bg-white border border-slate-200 shadow-lg z-50">
      {SOUTHEAST_STATES.map(({ value, label }) => (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### Updated aiContext Payload

```typescript
aiContext: {
  // ...existing fields
  city: locationDetails.city,
  state: locationDetails.state,  // NEW: 2-letter code (e.g., 'FL')
  zip_code: locationDetails.zipCode,
}
```

### Updated Session Persistence

```typescript
updateFields({
  city: locationDetails.city,
  state: locationDetails.state,  // NEW
  zipCode: locationDetails.zipCode,
  notes: locationDetails.remark,
});
```

---

## Analytics Events

No new analytics events required. The existing `consultation_booked` event will automatically include the new `state` field in the aiContext payload, which flows through to the `save-lead` edge function and Stape GTM.

---

## Build Order

1. Create `src/constants/states.ts` (shared dependency)
2. Update `KitchenTableGuideModal.tsx`
3. Update `SalesTacticsGuideModal.tsx`
4. Update `SpecChecklistGuideModal.tsx`
5. Test each modal's location step

---

## Technical Notes

- The `useSessionData` hook already supports `state?: string` (line 29), so no hook modifications needed
- The `save-lead` edge function already handles `aiContext.state` mapping (verified in previous implementation)
- Select component uses `z-50` to ensure dropdown visibility over modal content
- Using `bg-white` explicitly on SelectContent to prevent transparency issues per project guidelines

---

## Verification Checklist

After implementation:
- [ ] State defaults to "Florida" when modal opens
- [ ] Dropdown shows all 10 southeastern states
- [ ] State persists to session via `updateFields()`
- [ ] State is included in `aiContext.state` payload
- [ ] Mobile layout shows City full-width, State/Zip split
- [ ] Dropdown has solid white background (not transparent)

