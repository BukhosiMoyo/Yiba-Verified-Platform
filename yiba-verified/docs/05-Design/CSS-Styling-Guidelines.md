# CSS & Styling Guidelines

**Project:** Yiba Verified  
**Version:** 1.0  
**Last Updated:** 2026-01-14

## Table of Contents

1. [Tailwind CSS Rules](#tailwind-css-rules)
2. [Spacing System](#spacing-system)
3. [Typography](#typography)
4. [Colors & Theming](#colors--theming)
5. [Responsive Breakpoints](#responsive-breakpoints)
6. [Component Styling](#component-styling)
7. [Layout Patterns](#layout-patterns)
8. [Form Styling](#form-styling)
9. [State & Interaction](#state--interaction)
10. [Best Practices](#best-practices)

---

## Tailwind CSS Rules

### ✅ DO

- **Use Tailwind utility classes ONLY**
- Use the `cn()` utility from `@/lib/utils` for conditional classes
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Use Tailwind's spacing scale (4px increments)
- Leverage shadcn/ui components which are pre-styled with Tailwind

### ❌ DON'T

- **Do NOT create new CSS files** (`.css`, `.scss`, `.module.css`)
- **Do NOT use inline styles** (`style={{}}`)
- **Do NOT use random class names** without Tailwind utilities
- Do NOT override Tailwind's spacing system with arbitrary values
- Do NOT use `!important` (use Tailwind's `!` prefix if absolutely necessary)

### Example: Good ✅

```tsx
<div className="flex items-center gap-4 p-6 md:p-8">
  <h1 className="text-2xl md:text-3xl font-bold">Title</h1>
</div>
```

### Example: Bad ❌

```tsx
<div style={{ padding: "24px", display: "flex" }}>
  <h1 className="custom-title">Title</h1>
</div>
```

---

## Spacing System

Use the **8px spacing scale** consistently:

| Class | Value | Usage |
|-------|-------|-------|
| `p-1`, `gap-1` | 4px | Micro spacing |
| `p-2`, `gap-2` | 8px | Extra small spacing |
| `p-4`, `gap-4` | 16px | Small spacing (mobile) |
| `p-6`, `gap-6` | 24px | Medium spacing (desktop) |
| `p-8`, `gap-8` | 32px | Large spacing |
| `p-12`, `gap-12` | 48px | Extra large spacing |

### Responsive Spacing Pattern

```tsx
// Mobile-first: smaller on mobile, larger on desktop
<div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
```

### Common Patterns

- **Page container**: `p-4 md:p-8`
- **Card padding**: `p-4 md:p-6` (CardHeader, CardContent)
- **Gap between items**: `gap-4 md:gap-6`
- **Section spacing**: `space-y-4 md:space-y-8`

---

## Typography

### Font Sizes (Responsive)

| Element | Mobile | Desktop | Class |
|---------|--------|---------|-------|
| H1 | 24px | 30px | `text-2xl md:text-3xl` |
| H2 | 20px | 24px | `text-xl md:text-2xl` |
| H3 | 18px | 20px | `text-lg md:text-xl` |
| Body | 14px | 16px | `text-sm md:text-base` |
| Small | 12px | 14px | `text-xs md:text-sm` |

### Font Weights

- **Bold headings**: `font-bold` (700)
- **Semibold subheadings**: `font-semibold` (600)
- **Medium labels**: `font-medium` (500)
- **Regular body**: Default (400)

### Line Heights

- Headings: Default (`leading-none` or `leading-tight`)
- Body: Default
- Compact: `leading-tight`

### Text Colors

- **Primary text**: Default (or `text-foreground`)
- **Secondary text**: `text-muted-foreground`
- **Labels**: `text-muted-foreground`
- **Links**: `text-primary hover:underline`

### Example

```tsx
<h1 className="text-2xl md:text-3xl font-bold">
  Page Title
</h1>
<p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
  Description text
</p>
```

---

## Colors & Theming

### Color System

The project uses **shadcn/ui color system** with CSS variables:

- **Primary**: `text-primary`, `bg-primary` (brand color)
- **Secondary**: `text-secondary`, `bg-secondary`
- **Muted**: `text-muted-foreground`, `bg-muted`
- **Destructive**: `text-destructive`, `bg-destructive` (errors, delete actions)
- **Success**: Custom classes for success states
- **Background**: `bg-background`
- **Foreground**: `text-foreground`

### Status Colors

| Status | Background | Text | Usage |
|--------|-----------|------|-------|
| Success | `bg-green-100` | `text-green-800` | Approved, completed |
| Warning | `bg-yellow-100` | `text-yellow-800` | Pending, attention needed |
| Error | `bg-red-100` | `text-red-800` | Rejected, errors |
| Info | `bg-blue-100` | `text-blue-800` | Under review, information |
| Neutral | `bg-gray-100` | `text-gray-800` | Draft, default |

### Example

```tsx
<Badge className="bg-green-100 text-green-800">
  Approved
</Badge>
```

---

## Responsive Breakpoints

### Tailwind Breakpoints

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

### Our Breakpoint Strategy

- **Mobile-first**: Default styles for mobile (< 768px)
- **Tablet**: `md:` prefix (≥ 768px)
- **Desktop**: `lg:` prefix (≥ 1024px)

### Common Responsive Patterns

```tsx
// Text size
className="text-base md:text-lg"

// Spacing
className="p-4 md:p-6 lg:p-8"

// Grid columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Flex direction
className="flex-col md:flex-row"

// Visibility
className="hidden md:flex"  // Hidden on mobile, visible on desktop
className="flex md:hidden"  // Visible on mobile, hidden on desktop
```

---

## Component Styling

### Buttons

```tsx
// Primary action
<Button variant="default">Submit</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// Full-width on mobile
<Button className="w-full sm:w-auto">Action</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

### Cards

```tsx
<Card>
  <CardHeader className="p-4 md:p-6">
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent className="p-4 md:p-6 pt-0">
    Content
  </CardContent>
</Card>
```

### Tables

Use `ResponsiveTable` wrapper for mobile scrolling:

```tsx
<ResponsiveTable>
  <Table>
    {/* table content */}
  </Table>
</ResponsiveTable>
```

### Forms

```tsx
<form className="space-y-4 md:space-y-6">
  <div className="grid gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="field">Label</Label>
      <Input id="field" />
    </div>
  </div>
</form>
```

---

## Layout Patterns

### Page Container

```tsx
<div className="space-y-4 md:space-y-8 p-4 md:p-8">
  {/* Page content */}
</div>
```

### Page Header

```tsx
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold">Title</h1>
    <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
      Description
    </p>
  </div>
  <Button className="w-full sm:w-auto">Action</Button>
</div>
```

### Grid Layouts

```tsx
// 1 col mobile, 2 cols tablet, 3 cols desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

### Flex Layouts

```tsx
// Stack on mobile, horizontal on desktop
<div className="flex flex-col gap-4 md:flex-row md:items-center">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Form Styling

### Input Fields

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label *</Label>
  <Input
    id="field"
    type="text"
    className="w-full"  // Always full width
    required
  />
  <p className="text-xs text-muted-foreground">
    Optional help text
  </p>
</div>
```

### Form Groups

```tsx
// Two-column on desktop, single on mobile
<div className="grid gap-4 md:grid-cols-2">
  <div className="space-y-2">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Field 2</Label>
    <Input />
  </div>
</div>
```

### Form Actions

```tsx
<div className="flex flex-col sm:flex-row gap-2 md:gap-4">
  <Button type="submit" className="w-full sm:w-auto">
    Submit
  </Button>
  <Button type="button" variant="outline" className="w-full sm:w-auto">
    Cancel
  </Button>
</div>
```

---

## State & Interaction

### Hover States

```tsx
// Links
<Link className="text-primary hover:underline">

// Buttons (handled by Button component)
<Button>Hover me</Button>

// Cards
<div className="hover:bg-muted/50 transition-colors">
```

### Focus States

Focus states are handled by shadcn/ui components. Ensure focus remains visible:

```tsx
<Input className="focus-visible:ring-2 focus-visible:ring-ring" />
```

### Loading States

```tsx
// Button with spinner
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>

// Skeleton loader
<Skeleton className="h-4 w-full" />
```

### Disabled States

```tsx
<Button disabled={isDisabled} className="disabled:opacity-50">
  Action
</Button>
```

---

## Best Practices

### 1. Mobile-First Approach

Always style for mobile first, then enhance for larger screens:

```tsx
// ✅ Good: Mobile-first
className="p-4 md:p-6 lg:p-8"

// ❌ Bad: Desktop-first
className="p-8 md:p-6 lg:p-4"
```

### 2. Consistent Spacing

Use the spacing scale consistently:

```tsx
// ✅ Good: Uses scale
className="gap-4 md:gap-6"

// ❌ Bad: Arbitrary values
className="gap-[18px] md:gap-[22px]"
```

### 3. Responsive Typography

Scale text sizes appropriately:

```tsx
// ✅ Good: Responsive
className="text-2xl md:text-3xl"

// ❌ Bad: Fixed size
className="text-3xl"  // Too large on mobile
```

### 4. Touch-Friendly Targets

Ensure interactive elements are at least 44px on mobile:

```tsx
// ✅ Good: Minimum touch target
<Button className="min-h-[44px] min-w-[44px]">

// Or use Button component which handles this
```

### 5. Accessibility

- Use semantic HTML
- Ensure sufficient color contrast
- Provide focus indicators
- Use proper heading hierarchy (h1 → h2 → h3)

### 6. Class Organization

Order classes logically:

```tsx
// Layout → Spacing → Typography → Colors → Interactions
className="flex items-center gap-4 p-6 text-lg font-semibold text-primary hover:underline"
```

---

## Common Patterns Reference

### Empty State

```tsx
<EmptyState
  title="No items found"
  description="Description text"
  action={{ label: "Create Item", href: "/create" }}
/>
```

### Status Badge

```tsx
<Badge className="bg-green-100 text-green-800">
  Status
</Badge>
```

### Loading State

```tsx
<LoadingTable rows={5} />
```

### Error Message

```tsx
<ErrorMessage message="Error message here" />
```

---

## Component Library

Use these pre-built components:

- **shadcn/ui**: Button, Input, Card, Table, Dialog, Sheet, etc.
- **Custom shared**: ResponsiveTable, EmptyState, LoadingTable, etc.
- **Custom forms**: DocumentUploadForm, ReadinessEditForm, etc.

See `src/components/ui/` and `src/components/shared/` for available components.

---

## Quick Reference Card

### Spacing Classes

- `p-4` / `p-6` / `p-8` - Padding
- `gap-4` / `gap-6` / `gap-8` - Gap
- `space-y-4` / `space-y-6` / `space-y-8` - Vertical spacing

### Typography Classes

- `text-2xl md:text-3xl` - H1
- `text-xl md:text-2xl` - H2
- `text-sm md:text-base` - Body
- `text-muted-foreground` - Secondary text

### Layout Classes

- `flex flex-col md:flex-row` - Stack → Horizontal
- `grid grid-cols-1 md:grid-cols-2` - Responsive grid
- `w-full sm:w-auto` - Full width → Auto width

### Responsive Prefixes

- `md:` - Tablet and up (≥ 768px)
- `lg:` - Desktop and up (≥ 1024px)

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- Layout Guidelines: `docs/05-Design/Layout-Grid-Guidelines.md`
- Component List: `docs/05-Design/UI-Components-List.md`

---

**Remember:** When in doubt, check existing components for patterns and follow the Tailwind + shadcn/ui approach!
