# Dot Grid Visibility Debug Prompt

## Problem
The dot grid background pattern appears briefly during edits but then disappears after rendering completes. It works in dark mode but not in light mode on the student dashboard.

## Investigation Checklist

1. **Check DOM Structure & Z-Index Stacking**
   - Verify the dot grid div is actually in the DOM
   - Check z-index values: background (z-0), dot grid (z-[1]), content (z-[2])
   - Ensure no parent elements have `overflow: hidden` cutting off the pattern
   - Verify the dot grid is inside the correct container (GradientShell)

2. **Check CSS Specificity & Overrides**
   - Look for any global styles that might hide elements with `pointer-events-none`
   - Check if `dark:hidden` class is working correctly in light mode
   - Verify no conflicting opacity or visibility styles
   - Check if Tailwind's opacity classes are being overridden

3. **Check Background Color Coverage**
   - Verify `bg-background` is on GradientShell, not main
   - Check if background color is opaque and covering the dots
   - Ensure dot grid has higher z-index than background
   - Verify the SVG fill color contrasts with background

4. **Check Rendering & Browser Issues**
   - Verify the inline SVG data URL is valid
   - Check if browser is caching old styles
   - Verify the pattern opacity isn't too low to see
   - Check if there's a timing issue with React rendering

5. **Compare with Dark Mode Implementation**
   - Why does dark mode work but light mode doesn't?
   - Check the difference in opacity values
   - Verify both use similar structure

6. **Check for JavaScript Interference**
   - Any client-side code that might hide/show elements?
   - Check if hydration mismatches are causing issues
   - Verify no theme switching code interfering

## Expected Structure
```
main (no bg-background)
  └─ GradientShell (has bg-background, relative)
      ├─ Radial gradient (z-0, absolute)
      ├─ Dot grid light (z-[1], absolute, dark:hidden)
      ├─ Dot grid dark (z-0, absolute, opacity-0 dark:opacity-10)
      └─ Content wrapper (z-[2], relative)
          └─ {children}
```

## Test Steps
1. Inspect element in browser dev tools
2. Check computed styles for the dot grid div
3. Verify z-index is actually applied
4. Check if element is visible in DOM but hidden by CSS
5. Test with forced opacity/visibility to confirm structure works
