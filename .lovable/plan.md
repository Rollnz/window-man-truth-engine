

# Add "Excludes Labor" Card to Exit Intent Modal Left Pane

## What Changes
Replace the current generic image in the left pane's center visual area with the uploaded "Excludes Labor Warning" card image. The image will be placed in the vertically-centered area between the Forensic Ally logo and the step tracker -- exactly where the current `ai_decoded_b_1_1.webp` image sits.

## Technical Details

### 1. Copy the uploaded image into the project
- Copy `user-uploads://exlcudes_labor_warning_high_fidelity_card_image.webp` to `src/assets/excludes-labor-warning.webp`

### 2. Update `src/components/authority/ExitIntentModal.tsx`
- Import the new image: `import excludesLaborImg from '@/assets/excludes-labor-warning.webp'`
- Replace the existing image source (`/lovable-uploads/ai_decoded_b_1_1.webp`) with the imported asset in the left pane's visual area (~line 1193)
- Update the `alt` text to match the card content ("The Lifetime Warranty Loophole - Excludes Labor Warning")
- Keep the existing cyan ambient glow, border, and shadow styling

