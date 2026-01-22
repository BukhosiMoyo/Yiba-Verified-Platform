# Progress Bar Alignment Fix Prompt

## Issue
The progress bar on mobile and tablet devices has misaligned elements:
- The connector lines between step indicators are not properly aligned
- The step indicator boxes and lines are not vertically/horizontally centered
- The visual flow between steps is broken

## Requirements

1. **Fix Horizontal Alignment (Mobile/Tablet Top Bar):**
   - Step indicator boxes should be perfectly centered within their flex containers
   - Connector lines should be horizontally centered between boxes
   - All step indicators should align to the same vertical center line
   - Connector lines should start and end at the exact center of each step box

2. **Visual Consistency:**
   - Ensure equal spacing between all step indicators
   - Make sure connector lines are the same thickness and properly positioned
   - Fix any overflow or clipping issues

3. **Technical Considerations:**
   - Use proper flexbox alignment (items-center, justify-center)
   - Ensure connector lines are positioned correctly relative to step boxes
   - Fix any width/height inconsistencies
   - Check that the gap between elements is consistent

4. **Current Structure:**
   - Mobile/Tablet: Horizontal top bar with step indicators connected by horizontal lines
   - Each step has a numbered box (w-7 h-7 rounded) 
   - Lines connect between boxes (h-0.5 flex-1)
   - Need to ensure perfect center alignment

## Expected Outcome
- All step indicator boxes aligned on the same horizontal line
- Connector lines perfectly centered and connected between boxes
- Clean, professional appearance with proper visual flow
- No misalignment or visual inconsistencies
