

# Fix: Asset Import Paths

## Problem
Two image filenames have spaces that the import paths don't include, causing the build to fail with `ENOENT`.

**Actual filenames on disk (from `src/assets/`):**
- `step1_upload_your_quote.webp` -- correct in code
- `step2_ ai_analyzes_5_pillars.webp` -- has a **space** after `step2_`
- `step3_get_your_instant_gradecard.webp` -- correct in code
- `step4 _connect_with_contractors.webp` -- has a **space** before `_connect`

## Fix
Update lines 6 and 8 in `src/components/signup3/HowItWorksSteps.tsx`:

```
import step2 from "@/assets/step2_ ai_analyzes_5_pillars.webp";
import step4 from "@/assets/step4 _connect_with_contractors.webp";
```

One file, two lines changed. No other modifications needed.

