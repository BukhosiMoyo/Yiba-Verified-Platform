# Onboarding Progress Bar Redesign Prompt

## Requirements

Create a modern, elegant onboarding progress bar component that:

1. **Responsive Layout:**
   - **Desktop/Large screens (≥1024px):** Display as a vertical sidebar on the left side
   - **Tablet/Mobile (<1024px):** Display as a horizontal top bar
   - Smooth transitions between layouts

2. **Visual Design:**
   - Clean, minimal aesthetic
   - Dot grid pattern as background (subtle, not overwhelming)
   - Modern color scheme using violet/purple theme (matching existing design system)
   - Clear visual hierarchy

3. **Progress Indication:**
   - Show all steps (9 total steps)
   - Clearly indicate:
     - Completed steps (with checkmark icon)
     - Current/active step (highlighted)
     - Pending steps (muted)
   - Step numbers or labels
   - Smooth transitions between states

4. **Features:**
   - Accessible (proper ARIA labels)
   - Smooth animations
   - Lightweight and performant
   - Matches existing design system colors (violet-600, etc.)

5. **Implementation Details:**
   - Component: `OnboardingProgressBar.tsx`
   - Props: `currentStep: number`, `totalSteps: number` (currently 9)
   - Should integrate seamlessly with existing `StudentOnboardingWizard` component
   - Use Tailwind CSS for styling
   - Use Lucide React icons (Check icon for completed steps)

## Design Inspiration

- Vertical sidebar for desktop: Similar to the reference image showing steps listed vertically on the left
- Horizontal top bar for mobile: Compact, space-efficient layout
- Dot grid background: Subtle pattern using CSS or SVG
- Modern, clean aesthetic with good spacing and typography

## Technical Considerations

- Use CSS Grid or Flexbox for responsive layout
- Use Tailwind's responsive breakpoints (lg: for desktop)
- Ensure the component doesn't break existing functionality
- Maintain accessibility standards
- Consider using CSS custom properties for theming
