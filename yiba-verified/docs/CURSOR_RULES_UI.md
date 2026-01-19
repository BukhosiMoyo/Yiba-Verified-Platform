# Cursor UI Rules (Non-Negotiable)

## Styling
- Use Tailwind classes ONLY.
- Do not create new CSS files.
- Do not use inline styles: no style={{}}.
- Do not use random class names without Tailwind utilities.

## Components
- Use shadcn/ui for all basic components (Button, Input, Dialog, Sheet, Tabs, Table, etc.).
- Create reusable blocks in /src/components/shared.
- Never duplicate UI patterns per screen.

## Layout
- Every page must use AppShell from /src/components/layout/AppShell.tsx.
- Respect Layout-Grid-Guidelines.md (8px spacing, max width 1200px).

## Accessibility
- Use labels for inputs.
- Ensure focus states remain visible.
- Buttons must have clear text or aria-label.

## Output expectation
- Produce clean, consistent UI with minimal custom styling.
- If unsure, ask by reading docs rather than inventing new UI patterns.
