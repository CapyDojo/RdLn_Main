# OCR Modal Animation Guide

## Overview
The OCR progress modal in `src/components/TextInputPanel.tsx` uses custom animation with bounce effects for user feedback. This guide explains how to adjust the animation parameters.

## Location
**File:** `src/components/TextInputPanel.tsx`  
**Lines:** ~913 (in the modal style object)

```typescript
transition: isZoomUpdate ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)'
```

## Animation Behavior
- **Initial Spawn**: Bouncy animation from textarea center to final position
- **Scroll Updates**: Same bouncy animation when repositioning
- **Zoom Updates**: Instant repositioning (no animation)

## Cubic-Bezier Parameters

### Format: `cubic-bezier(x1, y1, x2, y2)`

| Parameter | Current Value | Purpose |
|-----------|---------------|---------|
| **x1** | 0.34 | Controls when acceleration starts (timing) |
| **y1** | 1.2 | Controls bounce intensity (overshoot amount) |
| **x2** | 0.64 | Controls when deceleration starts (timing) |
| **y2** | 1.0 | Final velocity (should stay at 1.0) |

### Key Points:
- **x1, x2**: Values between 0-1 control timing curve shape
- **y1**: Values > 1 create overshoot (bounce), < 1 create undershoot
- **y2**: Keep at 1.0 for normal ending

## Common Adjustments

### Bounce Intensity (y1 parameter)
```css
/* More bouncy */
cubic-bezier(0.34, 1.6, 0.64, 1)

/* Current (moderate bounce) */
cubic-bezier(0.34, 1.2, 0.64, 1)

/* Subtle bounce */
cubic-bezier(0.34, 1.1, 0.64, 1)

/* No bounce (smooth) */
cubic-bezier(0.34, 1.0, 0.64, 1)
```

### Speed (duration)
```css
/* Faster */
all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)

/* Current */
all 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)

/* Slower */
all 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)
```

## Animation States
The modal has three animation states controlled by different conditions:

1. **Initial Spawn** (`modalAnimated: false → true`)
   - Starts from textarea center
   - Scales from 0 to 1
   - Uses bouncy transition

2. **Scroll Repositioning** (`isZoomUpdate: false`)
   - Updates position smoothly
   - Uses bouncy transition

3. **Zoom Repositioning** (`isZoomUpdate: true`)
   - Updates position instantly
   - Uses `transition: 'none'`

## Testing Changes
1. Drop an image file in a text panel to trigger OCR
2. Observe the spawn animation
3. Scroll or zoom to test repositioning
4. Adjust parameters as needed

## Z-Index Layering
Modal uses `zIndex: 9000` to stay under:
- RdLnMemorySidePanel (z-index 9999)
- ThemeSelector (z-index 10000)

## Related Files
- **Animation logic**: `src/components/TextInputPanel.tsx` (lines ~550-620)
- **Position tracking**: Uses same scroll/zoom detection as `src/components/CustomTooltip.tsx`