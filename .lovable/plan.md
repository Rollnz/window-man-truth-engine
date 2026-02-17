

# Remove "Listen to a Real Call" from /proof Page

## What Gets Removed

The "Listen to a Real Call" button lives at the bottom of the `VoiceOfReasonSection` component (lines 239-249). It's the CTA that navigates to `/expert`. This button and its handler will be deleted.

## Exact Changes

### File 1: `src/components/proof/VoiceAgent/VoiceOfReasonSection.tsx`

**Delete the CTA block at lines 239-249:**
```
{/* CTA */}
<div className="wm-reveal wm-stagger-4 text-center">
  <Button 
    size="lg" 
    onClick={onListenToCall}
    className="gap-2 wm-btn-press"
  >
    <Phone className="w-5 h-5" />
    Listen to a Real Call
  </Button>
</div>
```

**Remove `onListenToCall` from the interface and destructured props** (lines 11, 22):
- Remove `onListenToCall: () => void;` from the interface
- Remove `onListenToCall,` from the destructured props

**Remove the `Phone` icon import** (line 2) since it is only used by this CTA.

### File 2: `src/pages/Proof.tsx`

**Remove the `handleListenToCall` callback** (lines 60-68):
```
const handleListenToCall = useCallback(() => { ... }, [navigate]);
```

**Remove the prop from the JSX** (line 181):
```
onListenToCall={handleListenToCall}
```

### File 3: `src/components/proof/EvidenceHero/ProofHero.tsx`

**No changes.** The hero has a separate "Watch the AI Voice Agent Expose a Quote" button that scrolls to the section. That button is unrelated and stays.

## What Does NOT Change

- The entire VoiceOfReasonSection (guardian block, transcript gallery, filters) stays -- only the bottom CTA button is removed
- ProofHero -- untouched
- TruthAuditSection, EconomicProofSection, CaseStudyVaultSection, GoldenThreadNextSteps -- untouched
- Transcript open/filter handlers and their tracking -- untouched
- The `proofData.ts` data file -- untouched
- The `index.ts` barrel export -- untouched
- No other pages or components affected

## Files Modified

| File | Change |
|------|--------|
| `src/components/proof/VoiceAgent/VoiceOfReasonSection.tsx` | Remove CTA block, `onListenToCall` prop, `Phone` import |
| `src/pages/Proof.tsx` | Remove `handleListenToCall` callback and its prop pass-through |

