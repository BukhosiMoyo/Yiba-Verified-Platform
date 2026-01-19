# Layout & Grid Guidelines (V1)
Project: Yiba Wise – Compliance & QCTO Oversight App
Document: Layout-Grid-Guidelines.md
Version: v1.0
Date: 2026-01-14
Location: 05-Design/

---

## Purpose
Defines layout and grid standards to ensure consistent spacing, alignment, and responsiveness across all screens.

These guidelines support rapid design in Figma and predictable frontend implementation.

---

## Breakpoints
- Desktop: ≥ 1280px
- Laptop: 1024px – 1279px
- Tablet: 768px – 1023px
- Mobile: ≤ 767px

---

## Grid System
- Base Grid: 12-column grid
- Column Gap: 24px (desktop), 16px (tablet), 12px (mobile)
- Max Content Width: 1200px
- Page Padding: 24px (desktop), 16px (tablet), 12px (mobile)

---

## Layout Structure

### App Shell
- Fixed left sidebar (collapsed/expanded)
- Sticky top navigation bar
- Scrollable main content area

### Sidebar
- Width: 260px (expanded)
- Width: 80px (collapsed)
- Role-based menu visibility

---

## Spacing System
Use an 8px spacing scale:
- 4px (micro)
- 8px (xs)
- 16px (sm)
- 24px (md)
- 32px (lg)
- 48px (xl)

No arbitrary spacing allowed.

---

## Typography Layout
- Headings align to grid columns
- Body text max line length: 70–80 characters
- Avoid full-width paragraphs on desktop

---

## Forms Layout
- Labels above inputs
- One primary action per screen
- Group related fields using cards or sections
- Inline validation preferred

---

## Tables Layout
- Sticky table headers
- Row height: minimum 48px
- Action columns aligned right
- Horizontal scrolling allowed on mobile

---

## Modals & Drawers
- Modals centered, max width 640px
- Drawers slide from right
- Only one modal or drawer visible at a time

---

## Responsive Rules
- Tables convert to cards on mobile
- Sidebar collapses automatically on tablet/mobile
- Critical actions remain visible above the fold

---

## Accessibility & Usability
- Touch targets ≥ 44px
- Clear focus states
- Consistent alignment reduces cognitive load

---

## Usage Rules
- Do not override grid rules per screen
- Exceptions must be documented
- Figma frames must follow these constraints

---

End of Document
